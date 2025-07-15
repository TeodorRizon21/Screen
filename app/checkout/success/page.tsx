import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import SuccessContent from "@/components/SuccessContent";
import { sendAdminNotification, sendOrderConfirmation } from "@/lib/email";
import { Prisma, Order, OrderItem } from "@prisma/client";
import { createDPDShipmentForOrder } from "@/lib/dpd";
import { generateOrderNumber } from "@/lib/orderNumber";
import Link from "next/link";
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
  streetNumber?: string | null;
  city: string;
  county: string;
  postalCode: string;
  country: string;
  locationType?: string | null;
  commune?: string | null;
  notes?: string | null;
  isCompany: boolean;
  companyName?: string | null;
  cui?: string | null;
  regCom?: string | null;
  companyStreet?: string | null;
  companyCity?: string | null;
  companyCounty?: string | null;
  cif?: string | null;
}

interface OrderWithItems extends Omit<Order, "orderNumber" | "paymentType"> {
  orderNumber: string | null;
  paymentType: string | null;
  items: (OrderItem & {
    product: OrderProduct;
  })[];
  details: OrderDetails;
  discountCodes: Array<{
    discountCode: {
      code: string;
      type: string;
      value: number;
    };
  }>;
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: { session_id?: string; order_id?: string };
}) {
  const { session_id: sessionId, order_id: orderId } = searchParams;

  if (!sessionId && !orderId) {
    redirect("/");
  }

  let order: OrderWithItems | null = null;

  if (sessionId) {
    // For card payment orders
    order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      if (!session) {
        throw new Error("Session not found");
      }

      if (session.payment_status !== "paid") {
        throw new Error("Payment not completed");
      }

      // Verificăm dacă există deja o comandă pentru această sesiune
      const existingOrder = await tx.order.findFirst({
        where: {
          checkoutSessionId: sessionId,
        },
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
      });

      if (existingOrder) {
        console.log("Comandă existentă găsită pentru sesiunea:", sessionId);
        // Verificăm și actualizăm statusul plății dacă este necesar
        if (existingOrder.paymentStatus !== "COMPLETED") {
          const updatedOrder = await tx.order.update({
            where: { id: existingOrder.id },
            data: {
              paymentStatus: "COMPLETED",
            },
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
          });
          return updatedOrder as OrderWithItems;
        }
        return existingOrder as OrderWithItems;
      }

      const parsedItems = JSON.parse(session.metadata?.items || "[]");
      if (!parsedItems.length) {
        throw new Error("No items found in session");
      }

      // Parse order details from metadata
      const orderDetails = session.metadata?.orderDetails
        ? JSON.parse(session.metadata.orderDetails)
        : {};

      const newOrder = await tx.order.create({
        data: {
          userId: session.metadata?.userId || "",
          items: {
            create: parsedItems.map((item: any) => ({
              productId: item.productId,
              size: item.size,
              quantity: item.quantity,
              price: item.price,
            })),
          },
          details: {
            create: {
              fullName: orderDetails.fullName || "",
              email: orderDetails.email || "",
              phoneNumber: orderDetails.phoneNumber || "",
              street: orderDetails.street || "",
              streetNumber: orderDetails.streetNumber || null,
              city: orderDetails.city || "",
              county: orderDetails.county || "",
              postalCode: orderDetails.postalCode || "",
              country: orderDetails.country || "",
              locationType: orderDetails.locationType || null,
              commune: orderDetails.commune || null,
              notes: orderDetails.notes || null,
              isCompany: orderDetails.isCompany || false,
              companyName: orderDetails.companyName || null,
              cui: orderDetails.cui || null,
              regCom: orderDetails.regCom || null,
              companyStreet: orderDetails.companyStreet || null,
              companyCity: orderDetails.companyCity || null,
              companyCounty: orderDetails.companyCounty || null,
              cif: orderDetails.cif || null,
            },
          },
          total: session.amount_total ? session.amount_total / 100 : 0,
          orderStatus: "Confirmată",
          paymentType: "card",
          paymentStatus: "COMPLETED",
          orderNumber: await generateOrderNumber(),
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

      return newOrder as OrderWithItems;
    });

    // După ce comanda a fost creată cu succes și stocul a fost actualizat,
    // creăm imediat expedierea DPD pentru că știm că plata este confirmată
    if (order) {
      try {
        // Verificăm dacă comanda are deja o expediere DPD
        if (!order.dpdShipmentId && !order.awb) {
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
          } else {
            console.log(
              "⚠️ Nu s-a putut crea expedierea DPD pentru comanda cu card, dar comanda continuă."
            );
          }
        } else {
          console.log(
            "ℹ️ Comanda are deja o expediere DPD creată, se sare peste crearea unei noi expedieri.",
            { dpdShipmentId: order.dpdShipmentId, awb: order.awb }
          );
        }
      } catch (dpdError: any) {
        console.error(
          "❌ Eroare la crearea expedierii DPD pentru comanda cu card:",
          dpdError
        );
        // Nu aruncăm eroarea mai departe pentru a nu întrerupe fluxul comenzii
      }

      // Generăm factura Oblio pentru comanda cu plată card
      try {
        console.log("=== ÎNCEPERE GENERARE FACTURĂ OBLIO ===");
        console.log("Comanda ID:", order.id);
        console.log("Order Number:", order.orderNumber);
        console.log("Total:", order.total);

        // Transformăm datele comenzii în formatul necesar pentru Oblio
        const oblioInvoiceData = {
          cif: order.details.cif || "RO00000000", // CIF-ul clientului sau unul default
          nume: order.details.fullName,
          email: order.details.email,
          telefon: order.details.phoneNumber,
          adresa:
            order.details.street +
            (order.details.streetNumber
              ? ` ${order.details.streetNumber}`
              : ""),
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

      // Send emails only after successful order creation
      try {
        await Promise.all([
          sendAdminNotification(order as OrderWithItems),
          sendOrderConfirmation(order as OrderWithItems),
        ]);
      } catch (emailError) {
        console.error("Error sending emails:", emailError);
        // Don't throw the error as the order was still created successfully
      }
    }
  } else if (orderId) {
    // For cash on delivery orders
    order = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
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

        // Actualizăm statusul comenzii
        const updatedOrder = await tx.order.update({
          where: { id: existingOrder.id },
          data: {
            orderStatus: "În așteptare",
          },
        });

        return { ...existingOrder, ...updatedOrder } as OrderWithItems;
      }

      return existingOrder as OrderWithItems;
    });

    // După ce comanda a fost actualizată cu succes, creăm expedierea DPD
    if (order) {
      try {
        // Verificăm dacă comanda are deja o expediere DPD
        if (!order.dpdShipmentId && !order.awb) {
          console.log(
            "Creăm expedierea DPD pentru comanda ramburs:",
            order?.id
          );
          const orderWithDPD = await createDPDShipmentForOrder(
            order!,
            order!.details
          );
          if (orderWithDPD) {
            order = orderWithDPD;
            console.log(
              "✅ Expediere DPD creată cu succes pentru comanda ramburs:",
              orderWithDPD.id
            );
          } else {
            console.log(
              "⚠️ Nu s-a putut crea expedierea DPD pentru comanda ramburs, dar comanda continuă."
            );
          }
        } else {
          console.log(
            "ℹ️ Comanda are deja o expediere DPD creată, se sare peste crearea unei noi expedieri.",
            { dpdShipmentId: order.dpdShipmentId, awb: order.awb }
          );
        }
      } catch (dpdError: any) {
        console.error(
          "❌ Eroare la crearea expedierii DPD pentru comanda ramburs:",
          dpdError
        );
      }

      // Send emails only after confirming the order exists
      try {
        // Skip sending emails for "ramburs" orders as they are already sent in create-order
        if (
          order?.orderNumber &&
          order?.paymentType &&
          order.paymentType !== "ramburs"
        ) {
          // Verificăm că avem toate câmpurile necesare înainte de a trimite emailurile
          if (order.items?.every((item) => item.product) && order.details) {
            const orderWithItems = {
              ...order,
              orderNumber: order.orderNumber,
              paymentType: order.paymentType,
              items: order.items.map((item) => ({
                ...item,
                product: {
                  id: item.product.id,
                  name: item.product.name,
                  price: item.product.price,
                  images: item.product.images,
                  weight: item.product.weight,
                },
              })),
              details: order.details,
              discountCodes: order.discountCodes || [],
            } satisfies OrderWithItems;

            await Promise.all([
              sendAdminNotification(orderWithItems),
              sendOrderConfirmation(orderWithItems),
            ]);
          }
        }
      } catch (emailError) {
        console.error("Error sending emails:", emailError);
        // Don't throw the error as the order was still created successfully
      }
    }
  }

  if (!order) {
    throw new Error("Failed to create or find order");
  }

  if (!order.paymentType) {
    throw new Error("Order payment type is missing");
  }

  if (!order.orderNumber) {
    throw new Error("Order number is missing");
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <SuccessContent orderId={order.id} paymentType={order.paymentType} />
      </div>
    </div>
  );
}
