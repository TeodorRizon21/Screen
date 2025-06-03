import { redirect } from "next/navigation";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import SuccessContent from "@/components/SuccessContent";
import { sendAdminNotification, sendOrderConfirmation } from "@/lib/email";

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
      order = await prisma.$transaction(async (prisma) => {
        // Create the order first
        const newOrder = await prisma.order.create({
          data: {
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
          await prisma.sizeVariant.updateMany({
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
      });

      // Send emails only after successful order creation
      try {
        await Promise.all([
          sendAdminNotification(order),
          sendOrderConfirmation(order),
        ]);
      } catch (emailError) {
        console.error("Error sending emails:", emailError);
        // Don't throw the error as the order was still created successfully
      }
    } else if (orderId) {
      // For cash on delivery orders
      order = await prisma.$transaction(async (prisma) => {
        const existingOrder = await prisma.order.findUnique({
          where: { id: orderId },
          include: {
            items: {
              include: {
                product: true,
              },
            },
            details: true,
          },
        });

        if (!existingOrder) {
          throw new Error("Order not found");
        }

        // Update stock for each item only if it hasn't been updated before
        if (existingOrder.orderStatus !== "Stock Updated") {
          for (const item of existingOrder.items) {
            await prisma.sizeVariant.updateMany({
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

          // Update order status to indicate stock has been updated
          await prisma.order.update({
            where: { id: orderId },
            data: { orderStatus: "Stock Updated" },
          });
        }

        // Send emails only after confirming the order exists
        try {
          await Promise.all([
            sendAdminNotification(existingOrder),
            sendOrderConfirmation(existingOrder),
          ]);
        } catch (emailError) {
          console.error("Error sending emails:", emailError);
          // Don't throw the error as the order was still created successfully
        }

        return existingOrder;
      });
    }

    if (!order) {
      throw new Error("Failed to create or find order");
    }

    return (
      <SuccessContent orderId={order.id} paymentType={order.paymentType} />
    );
  } catch (error) {
    console.error("Error processing order:", error);
    return (
      <div>
        There was an error processing your order. Please contact support.
      </div>
    );
  }
}
