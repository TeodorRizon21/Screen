import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendAdminNotification, sendOrderConfirmation } from '@/lib/email'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { items, userId, detailsId, paymentType, appliedDiscounts } = body

    // Validate required fields
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Nu există produse în coș' },
        { status: 400 }
      )
    }

    if (!detailsId) {
      return NextResponse.json(
        { error: 'Detaliile comenzii sunt obligatorii' },
        { status: 400 }
      )
    }

    // If user is authenticated, verify the userId
    if (userId) {
      const session = await auth()
      if (!session?.userId || session.userId !== userId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    // Verify products and calculate total
    let subtotal = 0;
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.product.id },
        include: {
          sizeVariants: {
            where: { size: item.selectedSize }
          }
        }
      });

      if (!product) {
        return NextResponse.json(
          { error: `Produsul ${item.product.name} nu mai este disponibil` },
          { status: 400 }
        );
      }

      const variant = product.sizeVariants[0];
      if (!variant) {
        return NextResponse.json(
          { error: `Mărimea ${item.selectedSize} nu mai este disponibilă pentru ${product.name}` },
          { status: 400 }
        );
      }

      if (!product.allowOutOfStock && variant.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stoc insuficient pentru ${product.name} (${item.selectedSize})` },
          { status: 400 }
        );
      }

      subtotal += variant.price * item.quantity;
    }

    const shipping = 15 // Fixed shipping cost
    const discountAmount = (appliedDiscounts || []).reduce((acc: number, discount: any) => {
      if (discount.type === 'percentage') {
        return acc + (subtotal * discount.value / 100)
      } else if (discount.type === 'fixed') {
        return acc + discount.value
      } else if (discount.type === 'free_shipping') {
        return acc + shipping
      }
      return acc
    }, 0)

    const total = Math.max(0, subtotal + shipping - discountAmount)

    // Create the order in the database
    const order = await prisma.order.create({
      data: {
        userId: userId || null, // null pentru utilizatorii neautentificați
        total,
        paymentStatus: paymentType === 'card' ? 'COMPLETED' : 'PENDING',
        orderStatus: 'Comanda este in curs de procesare',
        paymentType,
        details: { connect: { id: detailsId } },
        items: {
          create: items.map((item: any) => ({
            productId: item.product.id,
            quantity: item.quantity,
            size: item.selectedSize,
            price: item.variant.price
          }))
        },
        discountCodes: appliedDiscounts?.length > 0 ? {
          create: appliedDiscounts.map((discount: any) => ({
            discountCode: { connect: { code: discount.code } }
          }))
        } : undefined
      },
      include: {
        items: {
          include: {
            product: true
          }
        },
        details: true,
        discountCodes: {
          include: {
            discountCode: true
          }
        }
      },
    })

    // Fetch complete order with all required information
    const completeOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true
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
      }
    })

    if (!completeOrder) {
      throw new Error('Order was created but could not be fetched')
    }

    // Send admin notification
    await sendAdminNotification(completeOrder)

    // Send order confirmation to customer
    await sendOrderConfirmation(completeOrder)

    // Update discount code usage only if there are applied discounts
    if (appliedDiscounts?.length > 0) {
      for (const discount of appliedDiscounts) {
        await prisma.discountCode.update({
          where: { code: discount.code },
          data: {
            totalUses: { increment: 1 },
            usesLeft: discount.usesLeft !== null ? { decrement: 1 } : undefined,
          },
        })
      }
    }

    return NextResponse.json({ orderId: order.id })
  } catch (error: any) {
    console.error('Error creating order:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    })
    return NextResponse.json(
      { 
        error: 'Nu am putut procesa comanda',
        details: error.message
      },
      { status: 500 }
    )
  }
}

