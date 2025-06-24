import { NextResponse } from 'next/server';
import { dpdClient } from '@/lib/dpd';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { parcelIds, lastOperationOnly = false } = data;

    if (!Array.isArray(parcelIds) || parcelIds.length === 0) {
      return NextResponse.json(
        { error: 'Trebuie să furnizați cel puțin un ID de colet' },
        { status: 400 }
      );
    }

    // Verificăm dacă toate ID-urile sunt string-uri
    if (!parcelIds.every(id => typeof id === 'string')) {
      return NextResponse.json(
        { error: 'Toate ID-urile de colete trebuie să fie string-uri' },
        { status: 400 }
      );
    }

    console.log('🔍 Începem tracking-ul pentru coletele:', parcelIds);
    
    const response = await dpdClient.trackParcels(parcelIds, lastOperationOnly);
    
    console.log('✅ Răspuns tracking DPD:', response);
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('❌ Eroare la tracking-ul coletelor DPD:', error);
    return NextResponse.json(
      { 
        error: 'Nu am putut obține informațiile de tracking',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
} 