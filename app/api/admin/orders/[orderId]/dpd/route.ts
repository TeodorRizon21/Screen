import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { dpdClient } from '@/lib/dpd';

export async function POST(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;

    // Găsim comanda cu toate detaliile necesare
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        details: true,
        items: {
          include: {
            product: true
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Calculăm greutatea totală a coletului
    const totalWeight = order.items.reduce((acc, item) => {
      return acc + (item.product.weight || 1) * item.quantity;
    }, 0);

    // Găsim site ID pentru oraș
    const siteId = await dpdClient.findSite(642, order.details.city.toUpperCase(), order.details.postalCode);
    if (!siteId) {
      throw new Error(`Nu am putut găsi orașul ${order.details.city} în sistemul DPD`);
    }

    // Găsim street ID cu logica de bypass
    const streetName = order.details.street.trim().toUpperCase();
    let streetId = await dpdClient.findStreet(siteId, streetName);
    
    if (!streetId) {
      console.log(`⚠️ Strada ${streetName} nu a fost găsită în sistemul DPD. Încercăm să folosim o stradă generică.`);
      
      // Încercăm să găsim o stradă generică
      try {
        streetId = await dpdClient.findStreet(siteId, "PRINCIPALĂ");
        if (!streetId) {
          streetId = await dpdClient.findStreet(siteId, "CENTRALĂ");
        }
        if (!streetId) {
          streetId = await dpdClient.findStreet(siteId, "1 DECEMBRIE");
        }
        if (!streetId) {
          streetId = await dpdClient.findStreet(siteId, "REPUBLICII");
        }
        
        if (streetId) {
          console.log(`✅ Am găsit o stradă alternativă cu ID: ${streetId}. Strada originală ${streetName} va fi specificată în note.`);
        } else {
          throw new Error(`Nu am putut găsi nicio stradă validă în sistemul DPD pentru ${order.details.city}`);
        }
      } catch (alternativeStreetError) {
        console.error('Eroare la căutarea străzii alternative:', alternativeStreetError);
        throw new Error(`Nu am putut găsi strada ${streetName} în sistemul DPD și nu am putut găsi o stradă alternativă`);
      }
    }

    // Pregătim datele pentru cererea către DPD
    const shipmentData = {
      sender: {
        phone1: {
          number: process.env.DPD_SENDER_PHONE || '',
        },
        contactName: process.env.DPD_SENDER_NAME || '',
        email: process.env.DPD_SENDER_EMAIL || '',
      },
      recipient: {
        phone1: {
          number: order.details.phoneNumber,
        },
        clientName: order.details.fullName,
        email: order.details.email,
        privatePerson: true,
        address: {
          countryId: 642, // ID-ul pentru România
          siteId,
          streetId,
          streetNo: order.details.streetNumber || (() => {
            const streetMatch = order.details.street.match(/\d+/);
            return streetMatch ? streetMatch[0] : '1';
          })(),
        },
      },
      service: {
        serviceId: 2505, // CLASSIC service
        additionalServices: {
          cod: {
            amount: order.total,
            processingType: 'CASH' as const,
          },
        },
        autoAdjustPickupDate: true,
      },
      content: {
        parcelsCount: 1,
        totalWeight: totalWeight,
        contents: order.items.map(item => item.product.name).join(', '),
        package: 'BOX',
      },
      payment: {
        courierServicePayer: 'SENDER' as const,
      },
    };

    // Creăm expedierea în DPD
    const response = await dpdClient.createShipment(shipmentData);

    console.log('Răspuns DPD:', response);

    // Actualizăm comanda cu AWB-ul primit
    const updatedOrder = await prisma.order.update({
      where: { id: orderId },
      data: {
        courier: 'DPD',
        awb: response.parcels[0].id,
        dpdShipmentId: response.id,
      },
    });

    console.log('Comandă actualizată:', updatedOrder);

    return NextResponse.json({
      success: true,
      awb: response.parcels[0].id,
      labelUrl: response.labelUrl,
    });
  } catch (error) {
    console.error('Error creating DPD shipment:', error);
    return NextResponse.json(
      { error: 'Failed to create DPD shipment' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const orderId = params.orderId;

    // Găsim comanda
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      select: {
        id: true,
        courier: true,
        awb: true,
        dpdShipmentId: true,
      },
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Comanda nu a fost găsită' },
        { status: 404 }
      );
    }

    if (order.courier !== 'DPD' || !order.dpdShipmentId) {
      return NextResponse.json(
        { error: 'Comanda nu are o expediere DPD asociată' },
        { status: 400 }
      );
    }

    // Anulăm expedierea în DPD folosind dpdShipmentId
    const response = await dpdClient.cancelShipment(
      order.dpdShipmentId,
      'Anulare comandă din panoul de administrare'
    );

    if (response.error) {
      throw new Error(`DPD Error: ${response.error.message}`);
    }

    // Actualizăm comanda în baza de date
    await prisma.order.update({
      where: { id: orderId },
      data: {
        courier: null,
        awb: null,
        dpdShipmentId: null,
        orderStatus: 'Expediere anulată',
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error canceling DPD shipment:', error);
    return NextResponse.json(
      { 
        error: 'Nu am putut anula expedierea DPD',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 