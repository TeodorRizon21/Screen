import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { prisma } from '@/lib/prisma';
import { auth } from '@clerk/nextjs/server';

export async function POST(req: Request) {
  try {
    console.log('=== Starting checkout session creation ===');
    const body = await req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const { items, userId, detailsId, paymentType, appliedDiscounts } = body;

    // Validate required fields
    if (!items || items.length === 0) {
      console.log('Error: No items in cart');
      return NextResponse.json(
        { error: 'Nu există produse în coș' },
        { status: 400 }
      );
    }

    if (!detailsId) {
      console.log('Error: No detailsId provided');
      return NextResponse.json(
        { error: 'Detaliile comenzii sunt obligatorii' },
        { status: 400 }
      );
    }

    // If user is authenticated, verify the userId
    if (userId) {
      console.log('Verifying user authentication for userId:', userId);
      const session = await auth();
      if (!session?.userId || session.userId !== userId) {
        console.log('Error: User authentication failed');
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        );
      }
    } else {
      console.log('No userId provided - proceeding as guest checkout');
    }

    // Verify products and calculate total
    console.log('Verifying products and calculating total...');
    let subtotal = 0;
    for (const item of items) {
      console.log(`Processing item:`, {
        productId: item.product.id,
        name: item.product.name,
        size: item.selectedSize,
        quantity: item.quantity
      });
      
      const product = await prisma.product.findUnique({
        where: { id: item.product.id },
        include: {
          sizeVariants: {
            where: { size: item.selectedSize }
          }
        }
      });

      console.log('Found product:', {
        id: product?.id,
        name: product?.name,
        variants: product?.sizeVariants
      });

      if (!product) {
        console.log(`Error: Product not found - ${item.product.id}`);
        return NextResponse.json(
          { error: `Produsul ${item.product.name} nu mai este disponibil` },
          { status: 400 }
        );
      }

      const variant = product.sizeVariants[0];
      if (!variant) {
        console.log(`Error: Variant not found for size ${item.selectedSize}`);
        return NextResponse.json(
          { error: `Mărimea ${item.selectedSize} nu mai este disponibilă pentru ${product.name}` },
          { status: 400 }
        );
      }

      if (!product.allowOutOfStock && variant.stock < item.quantity) {
        console.log(`Error: Insufficient stock - ${variant.stock} < ${item.quantity}`);
        return NextResponse.json(
          { error: `Stoc insuficient pentru ${product.name} (${item.selectedSize})` },
          { status: 400 }
        );
      }

      subtotal += variant.price * item.quantity;
      console.log(`Item subtotal: ${variant.price * item.quantity}`);
    }

    console.log(`Total subtotal: ${subtotal}`);

    const shipping = 15; // Fixed shipping cost
    console.log(`Shipping cost: ${shipping}`);

    const discountAmount = (appliedDiscounts || []).reduce((acc: number, discount: any) => {
      if (discount.type === 'percentage') {
        return acc + (subtotal * discount.value / 100);
      } else if (discount.type === 'fixed') {
        return acc + discount.value;
      } else if (discount.type === 'free_shipping') {
        return acc + shipping;
      }
      return acc;
    }, 0);

    console.log(`Discount amount: ${discountAmount}`);

    const total = Math.max(0, subtotal + shipping - discountAmount);
    const totalInCents = Math.round(total * 100);

    console.log(`Final total: ${total} (${totalInCents} cents)`);

    // Create Stripe checkout session
    console.log('Creating Stripe checkout session...');
    console.log('Stripe configuration:', {
      currency: 'ron',
      totalInCents,
      successUrl: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${process.env.NEXT_PUBLIC_APP_URL}/cart`
    });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'ron',
            product_data: {
              name: 'Total comandă',
              description: `${items.length} produs${items.length > 1 ? 'e' : ''} cu transport${appliedDiscounts?.length > 0 ? ' și reduceri' : ''}`,
            },
            unit_amount: totalInCents,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/cart`,
      metadata: {
        userId: userId || null,
        detailsId,
        items: JSON.stringify(items.map((item: { product: { id: string }, quantity: number, selectedSize: string, variant: { price: number } }) => ({
          productId: item.product.id,
          quantity: item.quantity,
          size: item.selectedSize,
          price: item.variant.price
        }))),
        appliedDiscounts: JSON.stringify(appliedDiscounts || [])
      },
    });

    console.log('Stripe session created successfully:', session.id);
    return NextResponse.json({ sessionId: session.id });
  } catch (err: any) {
    console.error('=== Error in create-checkout-session ===');
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      code: err.code,
      type: err.type,
      raw: err.raw
    });
    
    return NextResponse.json(
      { 
        error: 'A apărut o eroare în timpul procesării comenzii',
        details: err.message,
        code: err.code
      },
      { status: err.statusCode || 500 }
    );
  }
}

