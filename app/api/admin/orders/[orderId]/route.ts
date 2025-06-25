import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { Prisma } from '@prisma/client'
import { cancelDPDShipment } from '@/lib/dpd'

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

async function deleteOrderWithRetry(orderId: string, retryCount = 0): Promise<void> {
  try {
    await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 1. First, delete all reviews associated with the order
      await tx.review.deleteMany({
        where: { orderId: orderId },
      })

      // 2. Delete associated OrderDiscountCode entries
      await tx.orderDiscountCode.deleteMany({
        where: { orderId: orderId },
      })

      // 3. Delete the order items
      await tx.orderItem.deleteMany({
        where: { orderId: orderId },
      })

      // 4. Find the order to get the detailsId
      const order = await tx.order.findUnique({
        where: { id: orderId },
        select: { 
          detailsId: true,
          details: {
            select: {
              Order: {
                select: { id: true }
              }
            }
          }
        },
      })

      if (!order) {
        throw new Error('Order not found')
      }

      // 5. Delete the order
      await tx.order.delete({
        where: { id: orderId },
      })

      // 6. Check if this is the last order for these details
      const isLastOrder = order.details.Order.length === 1 && 
                         order.details.Order[0].id === orderId

      // 7. If this is the last order, delete the details
      if (isLastOrder) {
        await tx.orderDetails.delete({
          where: { id: order.detailsId },
        })
      }
    }, {
      maxWait: 10000, // 10 seconds maximum wait time
      timeout: 20000  // 20 seconds timeout
    })
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      // Retry on deadlock (P2034) or transaction timeout
      if (error.code === 'P2034' && retryCount < MAX_RETRIES) {
        console.log(`Retry attempt ${retryCount + 1} for order ${orderId}`)
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
        return deleteOrderWithRetry(orderId, retryCount + 1)
      }
    }
    throw error
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params

    // Anulăm expedierea DPD înainte de a șterge comanda
    await cancelDPDShipment(orderId)

    // Încercăm să ștergem comanda cu retry logic
    await deleteOrderWithRetry(orderId)

    return NextResponse.json({ success: true, message: 'Order deleted successfully' })
  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json({ 
      error: 'Failed to delete order',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params
    const body = await request.json()
    const { courier, awb, orderStatus } = body

    // Dacă se schimbă statusul în anulat, anulăm și expedierea DPD
    if (orderStatus?.toLowerCase().includes('anulat')) {
      await cancelDPDShipment(orderId);
    }

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: { 
        courier, 
        awb, 
        orderStatus,
        paymentStatus: orderStatus === 'Comanda finalizata!' ? 'COMPLETED' : undefined
      }
    })

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 })
  }
}

