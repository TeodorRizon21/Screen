import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
 request: Request,
 { params }: { params: { orderId: string } }
) {
 try {
   const { orderId } = params

   const currentOrder = await prisma.order.findUnique({
     where: { id: orderId },
     include: { items: true }
   })

   if (!currentOrder) {
     return NextResponse.json({ error: 'Order not found' }, { status: 404 })
   }

   const newStatus = currentOrder.orderStatus === 'Comanda finalizata!' 
     ? 'Comanda se indreapta catre tine!' 
     : 'Comanda finalizata!'

   await prisma.$transaction(async (prisma) => {
     // Update order status
     const updatedOrder = await prisma.order.update({
       where: { id: orderId },
       data: { 
         orderStatus: newStatus,
         paymentStatus: newStatus === 'Comanda finalizata!' ? 'COMPLETED' : currentOrder.paymentStatus
       }
     })

     // If the order is being fulfilled, reduce stock
     if (newStatus === 'Comanda finalizata!') {
       for (const item of currentOrder.items) {
         await prisma.sizeVariant.updateMany({
           where: {
             productId: item.productId,
             size: item.size
           },
           data: {
             stock: {
               decrement: item.quantity
             }
           }
         })
       }
     }

     return updatedOrder
   })

   return NextResponse.json({ success: true, message: 'Order status updated and stock adjusted' })
 } catch (error) {
   console.error('Error fulfilling order:', error)
   return NextResponse.json({ error: 'Failed to fulfill order' }, { status: 500 })
 }
}

