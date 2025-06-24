import { NextResponse } from 'next/server';
import { dpdClient } from '@/lib/dpd';

export async function POST(request: Request) {
  try {
    console.log('🔍 Finding DPD site - Starting request processing');
    const { city, county } = await request.json();
    console.log('📝 Received request data:', { city, county });

    if (!city || !county) {
      console.error('❌ Missing required fields');
      return NextResponse.json(
        { error: 'City and county are required' },
        { status: 400 }
      );
    }

    // Găsim ID-ul țării (România)
    console.log('🌍 Finding country ID for Romania');
    const countryId = await dpdClient.findCountry('Romania');
    console.log('Found country ID:', countryId);

    if (!countryId) {
      console.error('❌ Could not find country ID for Romania');
      throw new Error('Could not find country ID for Romania');
    }

    // Găsim ID-ul localității
    console.log(`🏙️ Finding site ID for city: ${city}`);
    const siteId = await dpdClient.findSite(countryId, city);
    console.log('Found site ID:', siteId);

    if (!siteId) {
      console.error(`❌ Could not find site ID for city: ${city}`);
      throw new Error(`Could not find site ID for city: ${city}`);
    }

    console.log('✅ Successfully found site ID:', { city, county, siteId });
    return NextResponse.json({ siteId });
  } catch (error: any) {
    console.error('❌ Error finding DPD site:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 