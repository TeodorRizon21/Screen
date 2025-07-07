import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { stripe } from '@/lib/stripe';
import { createDPDShipmentForOrder } from '@/lib/dpd';
import { sendAdminNotification, sendOrderConfirmation } from '@/lib/email';

interface OrderItem {
  productId: string;
  quantity: number;
  size: string;
  price: number;
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
  isCompany: boolean;
  companyName?: string | null;
  cui?: string | null;
  regCom?: string | null;
  companyStreet?: string | null;
  companyCity?: string | null;
  companyCounty?: string | null;
}

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const sig = headers().get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log('Checkout session completed:', session.id);

    try {
      const { userId, detailsId, items: itemsJson } = session.metadata as { 
        userId: string; 
        detailsId: string; 
        items: string;
      };
      const parsedItems = JSON.parse(itemsJson) as OrderItem[];

      const order = await prisma.order.create({
        data: {
          userId,
          total: session.amount_total! / 100,
          paymentStatus: 'COMPLETED',
          orderStatus: 'Comanda este in curs de procesare',
          paymentType: 'card',
          details: { connect: { id: detailsId } },
          items: {
            create: parsedItems.map((item: OrderItem) => ({
              productId: item.productId,
              quantity: item.quantity,
              size: item.size,
              price: item.price
            }))
          },
          checkoutSessionId: session.id
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
                  weight: true
                }
              }
            }
          },
          details: true,
          discountCodes: {
            include: {
              discountCode: true
            }
          }
        },
      });

      // Create DPD shipment
      try {
        console.log('Încercăm să creăm expedierea DPD pentru comanda:', order.id);
        const updatedOrder = await createDPDShipmentForOrder(order, order.details);
        console.log('Expediere DPD creată cu succes, AWB:', updatedOrder.awb);
      } catch (dpdError: any) {
        console.error('Eroare la crearea expedierii DPD:', dpdError);
        // Nu aruncăm eroarea mai departe, doar o logăm
        // Comanda a fost creată cu succes, vom încerca să creăm expedierea manual
      }

      // Send notifications
      try {
        await Promise.all([
          sendAdminNotification(order),
          sendOrderConfirmation(order)
        ]);
      } catch (emailError) {
        console.error('Error sending notifications:', emailError);
      }

      return NextResponse.json({ success: true });
    } catch (err) {
      console.error('Error processing webhook:', err);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}

