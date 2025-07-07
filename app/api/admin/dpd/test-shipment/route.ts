import { NextResponse } from 'next/server';
import { dpdClient } from '@/lib/dpd';

export async function GET() {
  try {
    // Test pentru a găsi ID-urile pentru o adresă
    const countryId = await dpdClient.findCountry('ROMANIA');
    console.log('Country ID:', countryId);

    if (!countryId) {
      throw new Error('Nu am putut găsi ID-ul pentru România');
    }

    const siteId = await dpdClient.findSite(countryId, 'BUCURESTI');
    console.log('Site ID pentru București:', siteId);

    if (!siteId) {
      throw new Error('Nu am putut găsi ID-ul pentru București');
    }

    const streetId = await dpdClient.findStreet(siteId, 'VICTORIEI');
    console.log('Street ID pentru Victoriei:', streetId);

    // Creăm o expediere de test
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
          number: '0712345678',
        },
        clientName: 'Test Client',
        email: 'test@example.com',
        privatePerson: true,
        address: {
          countryId,
          siteId,
          streetId,
          streetNo: '1',
        },
      },
      service: {
        serviceId: 2505, // CLASSIC service
        additionalServices: {
          cod: {
            amount: 100,
            processingType: 'CASH' as const,
          },
        },
        autoAdjustPickupDate: true,
      },
      content: {
        parcelsCount: 1,
        totalWeight: 1,
        contents: 'Test Product',
        package: 'BOX',
      },
      payment: {
        courierServicePayer: 'SENDER' as const,
      },
      ref1: 'TEST ORDER',
    };

    // Încercăm să creăm expedierea
    const response = await dpdClient.createShipment(shipmentData);
    console.log('DPD Response:', response);

    return NextResponse.json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error testing DPD shipment:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test DPD shipment',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 