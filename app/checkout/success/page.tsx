import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import SuccessContent from "@/components/SuccessContent";
import { sendAdminNotification, sendOrderConfirmation } from "@/lib/email";
import { Prisma, Order, OrderItem } from "@prisma/client";
import { createDPDShipmentForOrder } from "@/lib/dpd";
import { generateOrderNumber } from "@/lib/orderNumber";

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

interface OrderWithItems extends Omit<Order, "orderNumber" | "paymentType"> {
  orderNumber: NonNullable<Order["orderNumber"]>;
  paymentType: NonNullable<Order["paymentType"]>;
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
        if (!order.paymentType) {
          throw new Error("Order payment type is missing");
        }
        return (
          <SuccessContent orderId={order.id} paymentType={order.paymentType} />
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

          // Send emails only after confirming the order exists
          try {
            // Skip sending emails for "ramburs" orders as they are already sent in create-order
            if (
              existingOrder.orderNumber &&
              existingOrder.paymentType &&
              existingOrder.paymentType !== "ramburs"
            ) {
              // Verificăm că avem toate câmpurile necesare înainte de a trimite emailurile
              if (
                existingOrder.items?.every((item) => item.product) &&
                existingOrder.details
              ) {
                const orderWithItems = {
                  ...existingOrder,
                  orderNumber: existingOrder.orderNumber,
                  paymentType: existingOrder.paymentType,
                  items: existingOrder.items.map((item) => ({
                    ...item,
                    product: {
                      id: item.product.id,
                      name: item.product.name,
                      price: item.product.price,
                      images: item.product.images,
                      weight: item.product.weight,
                    },
                  })),
                  details: existingOrder.details,
                  discountCodes: existingOrder.discountCodes || [],
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

          return existingOrder;
        }
      );
    }

    if (!order) {
      throw new Error("Failed to create or find order");
    }

    if (!order.paymentType) {
      throw new Error("Order payment type is missing");
    }

    return (
      <SuccessContent orderId={order.id} paymentType={order.paymentType} />
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
