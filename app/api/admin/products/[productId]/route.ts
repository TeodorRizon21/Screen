import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params
    const body = await request.json()
    const { 
      name, 
      description, 
      images, 
      collections,
      allowOutOfStock,
      showStockLevel,
      sizeVariants
    } = body

    // Use a transaction to ensure all operations succeed or fail together
    const updatedProduct = await prisma.$transaction(async (prisma) => {
      // First, delete all existing size variants for this product
      await prisma.sizeVariant.deleteMany({
        where: { productId }
      });

      // Then update the product and create new size variants
      return await prisma.product.update({
        where: { id: productId },
        data: {
          name,
          description,
          images,
          collections,
          allowOutOfStock,
          showStockLevel,
          price: sizeVariants[0].price,
          oldPrice: sizeVariants[0].oldPrice,
          sizes: sizeVariants.map((v: { size: string }) => v.size),
          stock: sizeVariants.reduce((total: number, v: { stock: number }) => total + v.stock, 0),
          lowStockThreshold: Math.min(...sizeVariants.map((v: { lowStockThreshold: number | null }) => v.lowStockThreshold || Infinity)),
          sizeVariants: {
            create: sizeVariants.map((v: any) => ({
              size: v.size,
              price: v.price,
              oldPrice: v.oldPrice,
              stock: v.stock,
              lowStockThreshold: v.lowStockThreshold,
            }))
          }
        },
        include: {
          sizeVariants: true
        }
      });
    });

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params

    // Check if the product is associated with any order items
    const orderItems = await prisma.orderItem.findMany({
      where: { productId: productId },
    })

    if (orderItems.length > 0) {
      return NextResponse.json({ 
        error: 'Cannot delete product. It is associated with existing orders.' 
      }, { status: 400 })
    }

    // Delete associated SizeVariants first
    await prisma.sizeVariant.deleteMany({
      where: { productId: productId },
    })

    // Then delete the Product
    await prisma.product.delete({
      where: { id: productId },
    })

    return NextResponse.json({ success: true, message: 'Product and associated size variants deleted successfully' })
  } catch (error) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })
  }
}

