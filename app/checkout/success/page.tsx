import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import SuccessContent from "@/components/SuccessContent";
import { sendAdminNotification, sendOrderConfirmation } from "@/lib/email";
import { Prisma, Order, OrderItem } from "@prisma/client";
import { createDPDShipmentForOrder } from "@/lib/dpd";
import { generateOrderNumber } from "@/lib/orderNumber";
import { generateOblioInvoice } from "@/lib/oblio";

interface OrderProduct {
  id: string;
  name: string;
  price: number;
  images: string[];
  weight: number;
}

interface OrderDetails {
  fullName: string;
  email: string;
  phoneNumber: string;
  street: string;
  streetNumber?: string;
  block?: string | null;
  floor?: string | null;
  apartment?: string | null;
  city: string;
  county: string;
  postalCode: string;
  country: string;
  notes?: string | null;
  isCompany: boolean;
  companyName?: string | null;
  cui?: string | null;
  regCom?: string | null;
  companyStreet?: string | null;
  companyCity?: string | null;
  companyCounty?: string | null;
}

interface OrderWithItems extends Order {
  items: (OrderItem & {
    product: OrderProduct;
  })[];
  details: OrderDetails;
  discountCodes: Array<{
    discountCode: any;
  }>;
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string; order_id?: string };
}) {
  const sessionId = searchParams.session_id;
  const orderId = searchParams.order_id;

  if (!sessionId && !orderId) {
    redirect("/");
  }

  try {
    let order;

    if (sessionId) {
      order = await prisma.order.findFirst({
        where: { checkoutSessionId: sessionId },
        include: {
          items: { include: { product: true } },
          details: true,
          discountCodes: { include: { discountCode: true } },
        },
      });

      if (order) {
        // Dacă comanda există deja, o afișăm direct
        return (
          <SuccessContent orderId={order.id} paymentType={order.paymentType || 'unknown'} />
        );
      }

      const session = await stripe.checkout.sessions.retrieve(sessionId, {
        expand: ["line_items"],
      });

      if (session.payment_status !== "paid") {
        throw new Error("Payment not successful");
      }

      const {
        userId,
        detailsId,
        items: itemsJson,
        appliedDiscounts,
      } = session.metadata as {
        userId: string;
        detailsId: string;
        items: string;
        appliedDiscounts: string;
      };
      const parsedItems = JSON.parse(itemsJson);
      const parsedDiscounts = JSON.parse(appliedDiscounts || "[]");

      // Use a transaction to create order and update stock
      order = await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          // Generate order number
          const orderNumber = await generateOrderNumber();

          // Create the order first
          const newOrder = await tx.order.create({
            data: {
              orderNumber,
              userId,
              total: session.amount_total! / 100,
              paymentStatus: "COMPLETED",
              orderStatus: "Comanda este in curs de procesare",
              paymentType: "card",
              details: { connect: { id: detailsId } },
              items: {
                create: parsedItems.map((item: any) => ({
                  productId: item.productId,
                  quantity: item.quantity,
                  size: item.size,
                  price: item.price,
                })),
              },
              discountCodes: {
                create: parsedDiscounts.map((discount: any) => ({
                  discountCode: { connect: { code: discount.code } },
                })),
              },
              checkoutSessionId: sessionId,
            },
            include: {
              items: {
                include: {
                  product: true,
                },
              },
              details: true,
              discountCodes: { include: { discountCode: true } },
            },
          });

          // Update stock for each item
          for (const item of parsedItems) {
            await tx.sizeVariant.updateMany({
              where: {
                productId: item.productId,
                size: item.size,
              },
              data: {
                stock: {
                  decrement: item.quantity,
                },
              },
            });
          }

          return newOrder;
        }
      );

      // După ce comanda a fost creată cu succes și stocul a fost actualizat,
      // creăm imediat expedierea DPD pentru că știm că plata este confirmată
      try {
        console.log(
          "Creăm expedierea DPD pentru comanda cu plată card:",
          order.id
        );
        const orderWithDPD = await createDPDShipmentForOrder(
          order,
          order.details
        );
        if (orderWithDPD) {
          order = orderWithDPD;
          console.log(
            "✅ Expediere DPD creată cu succes pentru comanda cu card:",
            orderWithDPD.id
          );
        }
      } catch (dpdError) {
        console.error(
          "❌ Eroare la crearea expedierii DPD pentru comanda cu card:",
          dpdError
        );
        // Nu aruncăm eroarea mai departe pentru a nu întrerupe fluxul comenzii
      }

      // Generăm automat factura Oblio pentru toate comenzile
      try {
        console.log("=== ÎNCEPERE GENERARE FACTURĂ OBLIO ===");
        console.log("Comanda ID:", order.id);
        console.log("Order Number:", order.orderNumber);
        console.log("Total:", order.total);

        // Transformăm datele comenzii în formatul necesar pentru Oblio
        const oblioInvoiceData = {
          cif: order.details.cui || "RO00000000", // CUI-ul clientului sau unul default
          nume: order.details.fullName,
          email: order.details.email,
          telefon: order.details.phoneNumber,
          adresa: order.details.street,
          oras: order.details.city,
          judet: order.details.county || "București",
          codPostal: order.details.postalCode || "000000",
          tara: "România",
          items: order.items.map((item) => ({
            nume: item.product.name,
            pret: item.price,
            cantitate: item.quantity,
            um: "buc",
          })),
          total: order.total,
          orderNumber: order.orderNumber,
          orderDate: new Date().toISOString().split("T")[0],
        };

        console.log(
          "Datele pentru Oblio:",
          JSON.stringify(oblioInvoiceData, null, 2)
        );

        const invoiceResult = await generateOblioInvoice(oblioInvoiceData);

        console.log("Rezultatul generării facturii:", invoiceResult);

        // Actualizăm comanda cu ID-ul facturii Oblio
        await prisma.order.update({
          where: { id: order.id },
          data: {
            oblioInvoiceId: invoiceResult.invoiceId,
            oblioInvoiceNumber: invoiceResult.invoiceNumber,
            oblioInvoiceUrl: invoiceResult.pdfUrl,
          },
        });

        console.log("Comanda actualizată cu ID-ul facturii Oblio");
        console.log("=== FINALIZARE GENERARE FACTURĂ OBLIO ===");
      } catch (error) {
        console.error("=== EROARE LA GENERAREA FACTURII OBLIO ===");
        console.error("Eroare completă:", error);
        console.error(
          "Stack trace:",
          error instanceof Error ? error.stack : "No stack trace"
        );
        console.error("=== SFÂRȘIT EROARE ===");
        // Nu întrerupem procesul dacă factura nu se poate genera
      }

      // Pentru plățile cu cardul, emailurile se trimit din webhook-ul Stripe
      // Nu trimitem emailuri aici pentru a evita duplicarea
      console.log("Comanda cu card creată - emailurile se vor trimite din webhook-ul Stripe");
    } else if (orderId) {
      // For cash on delivery orders
      order = await prisma.$transaction(
        async (tx: Prisma.TransactionClient) => {
          const existingOrder = (await tx.order.findFirst({
            where: { id: orderId },
            include: {
              items: {
                include: {
                  product: {
                    select: {
                      id: true,
                      name: true,
                      price: true,
                      images: true,
                      weight: true,
                    },
                  },
                },
              },
              details: true,
              discountCodes: {
                include: {
                  discountCode: true,
                },
              },
            },
          })) as OrderWithItems | null;

          if (!existingOrder) {
            throw new Error("Order not found");
          }

          // Update stock for each item only if it hasn't been updated before
          if (existingOrder.orderStatus !== "Stock Updated") {
            for (const item of existingOrder.items) {
              await tx.sizeVariant.updateMany({
                where: {
                  productId: item.productId,
                  size: item.size,
                },
                data: {
                  stock: {
                    decrement: item.quantity,
                  },
                },
              });
            }

            // Actualizăm statusul comenzii și creăm expedierea DPD
            const updatedOrder = await tx.order.update({
              where: { id: existingOrder.id },
              data: {
                orderStatus: "În așteptare",
              },
            });

            // După ce am actualizat stocul, încercăm să creăm expedierea DPD
            try {
              const orderWithDPD = await createDPDShipmentForOrder(
                updatedOrder,
                existingOrder.details
              );
              if (orderWithDPD) {
                console.log(
                  "✅ Expediere DPD creată cu succes pentru comanda ramburs:",
                  orderWithDPD.id
                );
              }
            } catch (dpdError) {
              console.error(
                "❌ Eroare la crearea expedierii DPD pentru comanda ramburs:",
                dpdError
              );
            }
          }

          // Generăm automat factura Oblio pentru comenzile cu ramburs
          try {
            console.log("=== ÎNCEPERE GENERARE FACTURĂ OBLIO (RAMBURS) ===");
            console.log("Comanda ID:", existingOrder.id);
            console.log("Order Number:", existingOrder.orderNumber);
            console.log("Total:", existingOrder.total);

            // Transformăm datele comenzii în formatul necesar pentru Oblio
            const oblioInvoiceData = {
              cif: existingOrder.details.cui || "RO00000000",
              nume: existingOrder.details.fullName,
              email: existingOrder.details.email,
              telefon: existingOrder.details.phoneNumber,
              adresa: existingOrder.details.street,
              oras: existingOrder.details.city,
              judet: existingOrder.details.county || "București",
              codPostal: existingOrder.details.postalCode || "000000",
              tara: "România",
              items: existingOrder.items.map((item) => ({
                nume: item.product.name,
                pret: item.price,
                cantitate: item.quantity,
                um: "buc",
              })),
              total: existingOrder.total,
              orderNumber: existingOrder.orderNumber,
              orderDate: new Date().toISOString().split("T")[0],
            };

            console.log(
              "Datele pentru Oblio (ramburs):",
              JSON.stringify(oblioInvoiceData, null, 2)
            );

            const invoiceResult = await generateOblioInvoice(oblioInvoiceData);

            console.log(
              "Rezultatul generării facturii (ramburs):",
              invoiceResult
            );

            // Actualizăm comanda cu ID-ul facturii Oblio
            await tx.order.update({
              where: { id: existingOrder.id },
              data: {
                oblioInvoiceId: invoiceResult.invoiceId,
                oblioInvoiceNumber: invoiceResult.invoiceNumber,
                oblioInvoiceUrl: invoiceResult.pdfUrl,
              },
            });

            console.log(
              "Comanda actualizată cu ID-ul facturii Oblio (ramburs)"
            );
            console.log("=== FINALIZARE GENERARE FACTURĂ OBLIO (RAMBURS) ===");
          } catch (error) {
            console.error(
              "=== EROARE LA GENERAREA FACTURII OBLIO (RAMBURS) ==="
            );
            console.error("Eroare completă:", error);
            console.error(
              "Stack trace:",
              error instanceof Error ? error.stack : "No stack trace"
            );
            console.error("=== SFÂRȘIT EROARE ===");
            // Nu întrerupem procesul dacă factura nu se poate genera
          }

          // Send emails only after confirming the order exists
          try {
            // Trimitem notificare către admin
            await sendAdminNotification(existingOrder);
            // Trimitem confirmare către client
            await sendOrderConfirmation(existingOrder);
          } catch (emailError) {
            console.error("Error sending emails:", emailError);
            // Don't throw the error as the order was still created successfully
          }

          return existingOrder;
        }
      );
    }

    if (!order) {
      throw new Error("Failed to create or find order");
    }

    return (
      <SuccessContent orderId={order.id} paymentType={order.paymentType || 'unknown'} />
    );
  } catch (error) {
    console.error("Error processing order:", error);
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            A apărut o eroare la procesarea comenzii
          </h1>
          <p className="text-gray-600">
            Vă rugăm să contactați suportul pentru asistență.
          </p>
        </div>
      </div>
    );
  }
}
