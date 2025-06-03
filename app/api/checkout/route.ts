import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { items, userId, detailsId } = body;

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'No items in the cart' }, { status: 400 });
    }

    if (!detailsId) {
      return NextResponse.json({ error: 'Order details are required' }, { status: 400 });
    }

    // Create the order in the database
    const order = await prisma.order.create({
      data: {
        userId,
        total: items.reduce((acc: number, item: { product: { price: number; }; quantity: number; }) => acc + item.product.price * item.quantity, 0),
        paymentStatus: 'PENDING',
        orderStatus: 'Comanda este in curs de procesare',
        paymentType: 'card', 
        details: { connect: { id: detailsId } },
        items: {
          create: items.map((item: { product: { id: any; price: any; }; quantity: any; selectedSize: any; }) => ({
            productId: item.product.id,
            quantity: item.quantity,
            size: item.selectedSize,
            price: item.product.price
          }))
        }
      },
      include: {
        items: true,
        details: true,
      },
    });

    // Create Stripe checkout session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map((item: any) => ({
        price_data: {
          currency: 'usd',
          product_data: {
            name: item.product.name,
            description: `Size: ${item.selectedSize}`,
          },
          unit_amount: Math.round(item.product.price * 100), // Stripe expects amounts in cents
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
      metadata: {
        orderId: order.id,
      },
    });

    return NextResponse.json({ sessionId: session.id });
  } catch (err: any) {
    console.error('Error in checkout:', err);
    return NextResponse.json(
      { error: err.message || 'An error occurred during checkout' },
      { status: err.statusCode || 500 }
    );
  }
}

