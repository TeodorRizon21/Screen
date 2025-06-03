import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const timeRange = searchParams.get('timeRange') || '24h'
    const completedOnly = searchParams.get('completedOnly') === 'true'

    let startDate = new Date()
    switch (timeRange) {
      case '24h':
        startDate.setHours(startDate.getHours() - 24)
        break
      case '7d':
        startDate.setDate(startDate.getDate() - 7)
        break
      case '60d':
        startDate.setDate(startDate.getDate() - 60)
        break
      case '1y':
        startDate.setFullYear(startDate.getFullYear() - 1)
        break
      case 'all':
        startDate = new Date(0) // Beginning of time
        break
      default:
        startDate.setHours(startDate.getHours() - 24)
    }

    // Get all orders in the time range
    const orders = await prisma.order.findMany({
      where: {
        createdAt: {
          gte: startDate
        },
        ...(completedOnly && { paymentStatus: 'COMPLETED' })
      },
      include: {
        items: {
          include: {
            product: true
          }
        }
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    // Calculate timeline data
    const timeline = orders.map(order => ({
      timestamp: order.createdAt.toISOString(),
      sales: order.items.reduce((acc, item) => acc + item.quantity, 0),
      revenue: order.total
    }))

    // Calculate product performance
    const productMap = new Map<string, { name: string, totalSales: number, totalRevenue: number }>()
    
    orders.forEach(order => {
      order.items.forEach(item => {
        const existing = productMap.get(item.productId) || {
          name: item.product.name,
          totalSales: 0,
          totalRevenue: 0
        }
        existing.totalSales += item.quantity
        existing.totalRevenue += item.price * item.quantity
        productMap.set(item.productId, existing)
      })
    })

    const products = Array.from(productMap.entries()).map(([id, data]) => ({
      id,
      ...data
    }))

    // Calculate totals
    const totalSales = orders.reduce((acc, order) => 
      acc + order.items.reduce((itemAcc, item) => itemAcc + item.quantity, 0), 0
    )
    const totalRevenue = orders.reduce((acc, order) => acc + order.total, 0)

    return NextResponse.json({
      timeline,
      products,
      totalSales,
      totalRevenue
    })
  } catch (error) {
    console.error('Error fetching statistics:', error)
    return NextResponse.json({ error: 'Failed to fetch statistics' }, { status: 500 })
  }
}

