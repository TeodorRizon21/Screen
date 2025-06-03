import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const orders = await prisma.order.findMany({
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
      orderBy: { createdAt: 'desc' }
    })

    const formattedOrders = orders.map(order => ({
      id: order.id,
      createdAt: order.createdAt.toISOString(),
      total: order.total,
      paymentStatus: order.paymentStatus,
      orderStatus: order.orderStatus,
      items: order.items.map(item => ({
        id: item.id,
        productId: item.product.id,
        productName: item.product.name,
        quantity: item.quantity,
        size: item.size,
        price: item.price,
        image: item.product.images[0] || '/placeholder.svg',
        carMake: item.product.make || null
      })),
      details: {
        fullName: order.details.fullName,
        email: order.details.email,
        phoneNumber: order.details.phoneNumber,
        street: order.details.street,
        city: order.details.city,
        county: order.details.county,
        postalCode: order.details.postalCode,
        country: order.details.country,
        notes: order.details.notes
      },
      paymentType: order.paymentType,
      courier: order.courier,
      awb: order.awb,
      discountCodes: order.discountCodes.map(dc => ({
        code: dc.discountCode.code,
        type: dc.discountCode.type,
        value: dc.discountCode.value
      }))
    }))

    return NextResponse.json(formattedOrders)
  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Failed to fetch orders' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId, total, items, details, paymentType, discountCodes } = body

    const order = await prisma.order.create({
      data: {
        userId,
        total,
        paymentStatus: paymentType === 'card' ? 'COMPLETED' : 'PENDING',
        orderStatus: 'Comanda este in curs de procesare',
        paymentType,
        details: { connect: { id: details.id } },
        items: {
          create: items.map((item: any) => ({
            productId: item.productId,
            quantity: item.quantity,
            size: item.size,
            price: item.price
          }))
        },
        discountCodes: {
          create: (discountCodes || []).map((discount: any) => ({
            discountCode: { connect: { code: discount.code } }
          }))
        }
      },
      include: {
        items: true,
        details: true,
        discountCodes: {
          include: {
            discountCode: true
          }
        }
      },
    })

    return NextResponse.json(order)
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, status, courier, awb } = body

    const updatedOrder = await prisma.order.update({
      where: { id },
      data: {
        orderStatus: status,
        courier,
        awb,
        paymentStatus: status === 'Comanda finalizata!' ? 'COMPLETED' : undefined
      },
      include: {
        items: true,
        details: true,
        discountCodes: {
          include: {
            discountCode: true
          }
        }
      }
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}

