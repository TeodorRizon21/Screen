import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

interface SizeVariant {
  size: string;
  price: number;
  oldPrice?: number | null;
  stock: number;
  lowStockThreshold?: number | null;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const search = searchParams.get('search') || '';

    const products = await prisma.product.findMany({
      where: {
        OR: [
          {
            name: {
              contains: search,
              mode: 'insensitive',
            },
          },
          {
            description: {
              contains: search,
              mode: 'insensitive',
            },
          },
        ],
      },
      include: {
        sizeVariants: true,
      },
    });
    return NextResponse.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { 
      name, 
      description, 
      images, 
      allowOutOfStock,
      showStockLevel,
      make,
      model,
      generation,
      sizeVariants
    } = body

    if (!name || !description || images.length === 0 || sizeVariants.length === 0 || !make || !model || !generation) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verificăm dacă există deja un produs cu aceleași specificații de mașină
    const existingProduct = await prisma.product.findFirst({
      where: {
        make: make,
        model: model,
        generation: generation
      },
    })

    if (existingProduct) {
      return NextResponse.json({ error: 'A product with these car specifications already exists' }, { status: 400 })
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        images,
        allowOutOfStock,
        showStockLevel,
        make,
        model,
        generation,
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
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error creating product:', error)
    return NextResponse.json({ error: 'Failed to create product' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { 
      id,
      name, 
      description, 
      images, 
      allowOutOfStock,
      showStockLevel,
      make,
      model,
      generation,
      sizeVariants
    } = body

    if (!id || !name || !description || images.length === 0 || sizeVariants.length === 0 || !make || !model || !generation) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Verificăm dacă există deja un produs cu aceleași specificații de mașină (excluzând produsul curent)
    const existingProduct = await prisma.product.findFirst({
      where: {
        make: make,
        model: model,
        generation: generation,
        NOT: {
          id: id
        }
      },
    })

    if (existingProduct) {
      return NextResponse.json({ error: 'A product with these car specifications already exists' }, { status: 400 })
    }

    const product = await prisma.product.update({
      where: { id: id },
      data: {
        name,
        description,
        images,
        allowOutOfStock,
        showStockLevel,
        make,
        model,
        generation,
        price: sizeVariants[0].price,
        oldPrice: sizeVariants[0].oldPrice,
        sizes: sizeVariants.map((v: { size: string }) => v.size),
        stock: sizeVariants.reduce((total: number, v: { stock: number }) => total + v.stock, 0),
        lowStockThreshold: Math.min(...sizeVariants.map((v: { lowStockThreshold: number | null }) => v.lowStockThreshold || Infinity)),
        sizeVariants: {
          deleteMany: {},
          create: sizeVariants.map((v: SizeVariant) => ({
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
    })

    return NextResponse.json(product)
  } catch (error) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 })
  }
}

