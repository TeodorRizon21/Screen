import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const discountCodes = await prisma.discountCode.findMany()
    return NextResponse.json(discountCodes)
  } catch (error) {
    console.error('Error fetching discount codes:', error)
    return NextResponse.json({ error: 'Failed to fetch discount codes' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { code, type, value, usesLeft, expirationDate, canCumulate } = body

    const discountCode = await prisma.discountCode.create({
      data: {
        code,
        type,
        value,
        usesLeft,
        expirationDate,
        canCumulate,
      },
    })

    return NextResponse.json(discountCode)
  } catch (error) {
    console.error('Error creating discount code:', error)
    return NextResponse.json({ error: 'Failed to create discount code' }, { status: 500 })
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json()
    const { id, code, type, value, usesLeft, expirationDate, canCumulate } = body

    const updatedDiscountCode = await prisma.discountCode.update({
      where: { id },
      data: {
        code,
        type,
        value,
        usesLeft,
        expirationDate,
        canCumulate,
      },
    })

    return NextResponse.json(updatedDiscountCode)
  } catch (error) {
    console.error('Error updating discount code:', error)
    return NextResponse.json({ error: 'Failed to update discount code' }, { status: 500 })
  }
}

