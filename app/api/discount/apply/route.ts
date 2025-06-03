import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json({ error: 'Discount code is required' }, { status: 400 })
  }

  try {
    const discountCode = await prisma.discountCode.findUnique({
      where: { code },
    })

    if (!discountCode) {
      return NextResponse.json({ error: 'This discount code is not available' }, { status: 400 })
    }

    if (discountCode.expirationDate && new Date() > discountCode.expirationDate) {
      return NextResponse.json({ error: 'This discount code has expired' }, { status: 400 })
    }

    if (discountCode.usesLeft !== null && discountCode.usesLeft <= 0) {
      return NextResponse.json({ error: 'This discount code has reached its usage limit' }, { status: 400 })
    }

    return NextResponse.json({
      code: discountCode.code,
      type: discountCode.type,
      value: discountCode.value,
      canCumulate: discountCode.canCumulate,
    })
  } catch (error) {
    console.error('Error applying discount code:', error)
    return NextResponse.json({ error: 'Failed to apply discount code' }, { status: 500 })
  }
}

