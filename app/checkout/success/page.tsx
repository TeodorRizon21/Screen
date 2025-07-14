import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import SuccessContent from "@/components/SuccessContent";
import { sendAdminNotification, sendOrderConfirmation } from "@/lib/email";
import { Prisma, Order, OrderItem } from "@prisma/client";
import { createDPDShipmentForOrder } from "@/lib/dpd";
import { generateOrderNumber } from "@/lib/orderNumber";
import Link from "next/link";

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
    order = await prisma.$transaction(
      async (tx: Prisma.TransactionClient) => {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (!session) {
          throw new Error("Session not found");
        }

        if (session.payment_status !== "paid") {
          throw new Error("Payment not completed");
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
              },
            },
            total: session.amount_total ? session.amount_total / 100 : 0,
            orderStatus: "Confirmată",
            paymentType: "card",
            orderNumber: `SSA${String(Date.now()).slice(-4)}`,
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
        }
      );

      // După ce comanda a fost creată cu succes și stocul a fost actualizat,
      // creăm imediat expedierea DPD pentru că știm că plata este confirmată
      if (order) {
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
        } else {
          console.log(
            "⚠️ Nu s-a putut crea expedierea DPD pentru comanda cu card, dar comanda continuă."
          );
        }
      } catch (dpdError: any) {
        console.error(
          "❌ Eroare la crearea expedierii DPD pentru comanda cu card:",
          dpdError
        );
        // Nu aruncăm eroarea mai departe pentru a nu întrerupe fluxul comenzii
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
      }
    );

    // După ce comanda a fost actualizată cu succes, creăm expedierea DPD
    if (order) {
      try {
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
          if (
            order.items?.every((item) => item.product) &&
            order.details
          ) {
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
        <div className="bg-white rounded-lg shadow-lg p-8">
          <div className="text-center mb-8">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <span className="text-2xl text-green-600">✓</span>
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Comandă confirmată!
            </h1>
            <p className="text-gray-600">
              Mulțumim pentru comandă! Vei primi un email de confirmare în curând.
            </p>
          </div>

          <div className="border-t border-gray-200 pt-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Detalii comandă
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Număr comandă
                </h3>
                <p className="text-lg font-semibold text-gray-900">
                  {order.orderNumber}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Status
                </h3>
                <p className="text-lg font-semibold text-gray-900">
                  {order.orderStatus}
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Total
                </h3>
                <p className="text-lg font-semibold text-gray-900">
                  {order.total.toFixed(2)} RON
                </p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-2">
                  Metodă de plată
                </h3>
                <p className="text-lg font-semibold text-gray-900">
                  {order.paymentType === "card" ? "Card bancar" : "Ramburs"}
                </p>
              </div>
            </div>
          </div>

          {order.items && order.items.length > 0 && (
            <div className="border-t border-gray-200 pt-8 mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Produse comandate
              </h2>
              <div className="space-y-4">
                {order.items.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-4 border-b border-gray-100 last:border-b-0"
                  >
                    <div className="flex items-center space-x-4">
                      {item.product.images && item.product.images.length > 0 && (
                        <img
                          src={item.product.images[0]}
                          alt={item.product.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                      )}
                      <div>
                        <h3 className="font-medium text-gray-900">
                          {item.product.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          Mărime: {item.size} | Cantitate: {item.quantity}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">
                        {(item.price * item.quantity).toFixed(2)} RON
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {order.details && (
            <div className="border-t border-gray-200 pt-8 mt-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Detalii livrare
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Nume complet
                  </h3>
                  <p className="text-gray-900">{order.details.fullName}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Email
                  </h3>
                  <p className="text-gray-900">{order.details.email}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Telefon
                  </h3>
                  <p className="text-gray-900">{order.details.phoneNumber}</p>
                </div>
                <div>
                  <h3 className="text-sm font-medium text-gray-500 mb-2">
                    Adresă
                  </h3>
                  <p className="text-gray-900">
                    {order.details.street}, {order.details.city}
                  </p>
                  <p className="text-gray-900">
                    {order.details.county}, {order.details.postalCode}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="border-t border-gray-200 pt-8 mt-8">
            <div className="flex flex-col sm:flex-row gap-4">
              <Link
                href="/orders"
                className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg text-center font-medium hover:bg-blue-700 transition-colors"
              >
                Vezi toate comenzile
              </Link>
              <Link
                href="/"
                className="flex-1 bg-gray-200 text-gray-900 px-6 py-3 rounded-lg text-center font-medium hover:bg-gray-300 transition-colors"
              >
                Continuă cumpărăturile
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
