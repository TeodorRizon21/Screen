import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params
    const body = await request.json()
    const { status } = body

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        orderStatus: status,
        paymentStatus: status === 'Comanda finalizata!' && status === 'Refund' ? 'COMPLETED' : undefined
      }
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
  }
}

