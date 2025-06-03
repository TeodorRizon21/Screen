import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { stripe } from '@/lib/stripe';

interface OrderItem {
  productId: string;
  quantity: number;
  size: string;
  price: number;
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
      const { userId, detailsId, items } = session.metadata as { userId: string; detailsId: string; items: string };
      const parsedItems = JSON.parse(items) as OrderItem[];

      const order = await prisma.order.create({
        data: {
          userId,
          total: session.amount_total! / 100, // Convert from cents to dollars
          paymentStatus: 'COMPLETED',
          orderStatus: 'Stock Updated', // Mark as stock already updated
          paymentType: 'card',
          details: { connect: { id: detailsId } },
          items: {
            create: parsedItems.map((item: OrderItem) => ({
              productId: item.productId,
              quantity: item.quantity,
              size: item.size,
              price: item.price
            }))
          }
        },
        include: {
          items: true,
          details: true,
        },
      });

      console.log('Order created successfully:', order);
    } catch (error) {
      console.error('Error creating order:', error);
      return NextResponse.json({ error: 'Error creating order' }, { status: 500 });
    }
  }

  return NextResponse.json({ received: true });
}

