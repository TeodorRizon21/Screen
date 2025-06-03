import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { name, price, description, sizes, images } = body

    const product = await prisma.product.create({
      data: {
        name,
        price,
        description,
        sizes,
        images,
        stock: 0,
        allowOutOfStock: false,
        showStockLevel: false,
      },
    })
    
    return NextResponse.json({ success: true, product })
  } catch (error) {
    console.error('Failed to create product:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    )
  }
}

export async function GET() {
  try {
    const products = await prisma.product.findMany({
      include: {
        sizeVariants: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error("Failed to fetch products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

