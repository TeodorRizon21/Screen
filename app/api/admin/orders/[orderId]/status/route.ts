import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cancelDPDShipment } from '@/lib/dpd'

export async function PUT(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params
    const body = await request.json()
    const { status } = body

    console.log('Status primit:', status);
    console.log('Status lowercase:', status.toLowerCase());
    console.log('Conține "anulat"?', status.toLowerCase().includes('anulat'));
    console.log('Conține "anulata"?', status.toLowerCase().includes('anulata'));

    // Găsim comanda curentă pentru a verifica dacă are expediere DPD
    const currentOrder = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        courier: true,
        awb: true,
        dpdShipmentId: true,
      },
    });

    console.log('Detalii comandă curentă:', {
      courier: currentOrder?.courier,
      awb: currentOrder?.awb,
      dpdShipmentId: currentOrder?.dpdShipmentId
    });

    // Dacă statusul este de anulare și comanda are expediere DPD, anulăm expedierea
    const shouldCancelDPD = (status.toLowerCase().includes('anulata') || status.toLowerCase().includes('anulat')) &&
                           currentOrder?.courier === 'DPD' && 
                           currentOrder?.dpdShipmentId;

    console.log('Ar trebui să anulăm DPD?', {
      shouldCancel: shouldCancelDPD,
      hasCourier: currentOrder?.courier === 'DPD',
      hasShipmentId: !!currentOrder?.dpdShipmentId
    });

    if (shouldCancelDPD) {
      console.log('Încercăm să anulăm expedierea DPD pentru comanda:', orderId);
      const result = await cancelDPDShipment(orderId);
      console.log('Rezultat anulare DPD:', result);
    }

    // Actualizăm statusul comenzii și ștergem informațiile DPD dacă este anulată
    const updateData = {
      orderStatus: status,
      paymentStatus: status === 'Comanda finalizata!' && status === 'Refund' ? 'COMPLETED' : undefined,
      ...(status.toLowerCase().includes('anulata') || status.toLowerCase().includes('anulat') ? {
        courier: null,
        awb: null,
        dpdShipmentId: null
      } : {})
    };

    console.log('Date actualizare comandă:', updateData);

    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: updateData
    });

    return NextResponse.json(updatedOrder)
  } catch (error) {
    console.error('Error updating order status:', error)
    return NextResponse.json({ error: 'Failed to update order status' }, { status: 500 })
  }
}

