import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@clerk/nextjs/server'

export async function POST(req: Request) {
  try {
    console.log('=== Starting order details creation ===');
    const body = await req.json();
    console.log('Request body:', JSON.stringify(body, null, 2));
    
    const { 
      fullName, 
      email, 
      phoneNumber, 
      street,
      streetNumber,
      block,
      floor,
      apartment,
      city, 
      county, 
      postalCode, 
      country, 
      locationType,
      commune,
      notes,
      userId,
      isCompany,
      companyName,
      cui,
      regCom,
      companyStreet,
      companyCity,
      companyCounty,
      appliedDiscounts 
    } = body

    // Validate required fields with specific messages
    const missingFields = [];
    if (!fullName) missingFields.push('Numele complet');
    if (!email) missingFields.push('Email');
    if (!phoneNumber) missingFields.push('Numarul de telefon');
    if (!street) missingFields.push('Strada');
    // streetNumber is now optional
    if (!city) missingFields.push('Orasul/Satul');
    if (!county) missingFields.push('Judetul');
    if (!postalCode) missingFields.push('Codul postal');
    if (!country) missingFields.push('Tara');
    
    // Validate commune if locationType is village
    if (locationType === 'village' && !commune) {
      missingFields.push('Comuna');
    }

    // Validate company fields if isCompany is true
    if (isCompany) {
      if (!companyName) missingFields.push('Numele firmei');
      if (!cui) missingFields.push('Codul unic de inregistrare (CUI)');
      if (!regCom) missingFields.push('Numarul de inregistrare registrul comertului');
      if (!companyStreet) missingFields.push('Adresa sediului social');
      if (!companyCity) missingFields.push('Orasul sediului social');
      if (!companyCounty) missingFields.push('Judetul sediului social');
    }

    if (missingFields.length > 0) {
      console.log('Missing required fields:', missingFields);
      return NextResponse.json(
        { 
          error: 'Campuri obligatorii lipsa',
          missingFields: missingFields
        },
        { status: 400 }
      )
    }

    // If user is authenticated, verify the userId
    if (userId) {
      console.log('Verifying user authentication for userId:', userId);
      const session = await auth()
      if (!session?.userId || session.userId !== userId) {
        console.log('Error: User authentication failed');
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    } else {
      console.log('No userId provided - proceeding as guest checkout');
    }

    console.log('Creating order details...');
    // Create order details
    const orderDetails = await prisma.orderDetails.create({
      data: {
        userId: userId || null,
        fullName,
        email,
        phoneNumber,
        street,
        streetNumber: streetNumber || null,
        block: block || null,
        floor: floor || null,
        apartment: apartment || null,
        city,
        county,
        postalCode,
        country,
        locationType: locationType || 'city',
        commune: commune || null,
        notes: notes || '',
        isCompany,
        companyName: isCompany ? companyName : null,
        cui: isCompany ? cui : null,
        regCom: isCompany ? regCom : null,
        companyStreet: isCompany ? companyStreet : null,
        companyCity: isCompany ? companyCity : null,
        companyCounty: isCompany ? companyCounty : null,
      },
    })

    console.log('Order details created successfully:', orderDetails.id);
    return NextResponse.json(orderDetails)
  } catch (error: any) {
    console.error('=== Error in order details creation ===');
    console.error('Error details:', {
      message: error.message,
      stack: error.stack,
      code: error.code
    });
    
    return NextResponse.json(
      { 
        error: 'Nu am putut salva detaliile comenzii',
        details: error.message
      },
      { status: 500 }
    )
  }
}

