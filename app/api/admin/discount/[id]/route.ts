import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    // Check if the discount code is used in any orders
    const discountCode = await prisma.discountCode.findUnique({
      where: { id },
      include: {
        orders: true
      }
    })

    if (!discountCode) {
      return NextResponse.json({ error: 'Discount code not found' }, { status: 404 })
    }

    if (discountCode.orders.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete discount code as it is used in orders',
        canDeactivate: true 
      }, { status: 400 })
    }

    await prisma.discountCode.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Discount code deleted successfully' })
  } catch (error) {
    console.error('Error deleting discount code:', error)
    return NextResponse.json({ error: 'Failed to delete discount code' }, { status: 500 })
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { isDeactivating, ...updateData } = body

    if (isDeactivating) {
      const updatedDiscountCode = await prisma.discountCode.update({
        where: { id },
        data: {
          usesLeft: 0
        },
      })
      return NextResponse.json(updatedDiscountCode)
    }

    const updatedDiscountCode = await prisma.discountCode.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json(updatedDiscountCode)
  } catch (error) {
    console.error('Error updating discount code:', error)
    return NextResponse.json({ error: 'Failed to update discount code' }, { status: 500 })
  }
}

