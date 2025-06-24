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

    // Test pentru a găsi un oraș (de exemplu, București)
    const siteId = await dpdClient.findSite(countryId, 'BUCURESTI');
    console.log('Site ID pentru București:', siteId);

    if (!siteId) {
      throw new Error('Nu am putut găsi ID-ul pentru București');
    }

    // Test pentru a găsi o stradă
    const streetId = await dpdClient.findStreet(siteId, 'VICTORIEI');
    console.log('Street ID pentru Victoriei:', streetId);

    return NextResponse.json({
      success: true,
      data: {
        countryId,
        siteId,
        streetId,
      }
    });
  } catch (error) {
    console.error('Error testing DPD integration:', error);
    return NextResponse.json(
      { 
        error: 'Failed to test DPD integration',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 