import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        orderNumber: true,
        total: true,
        paymentStatus: true,
        orderStatus: true,
        paymentType: true,
        courier: true,
        awb: true,
        createdAt: true,
        items: {
          include: {
            product: true,
          },
        },
        details: true,
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Comanda nu a fost găsită' }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error('Error fetching order details:', error);
    return NextResponse.json(
      { error: 'Nu am putut obține detaliile comenzii' },
      { status: 500 }
    );
  }
} 