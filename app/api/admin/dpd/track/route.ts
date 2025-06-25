import { NextResponse } from 'next/server';
import { dpdClient } from '@/lib/dpd';
import { prisma } from '@/lib/prisma';

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

    // Actualizăm statusul comenzii pentru fiecare AWB
    for (const parcel of response.parcels) {
      if (parcel?.operations?.length > 0) {
        // Luăm ultima operațiune (cea mai recentă)
        const lastOperation = parcel.operations[parcel.operations.length - 1];
        
        // Verificăm dacă avem un status valid
        if (lastOperation?.status) {
          // Găsim comanda după AWB și o actualizăm
          const order = await prisma.order.findFirst({
            where: { awb: parcel.id }
          });

          if (order) {
            await prisma.order.update({
              where: { id: order.id },
              data: { 
                orderStatus: lastOperation.operationCode === '-14' ? 'FINALIZATA' : lastOperation.status,
                dpdOperationCode: lastOperation.operationCode
              }
            });
            console.log(
              `✅ Status actualizat pentru comanda ${order.id}: ${
                lastOperation.operationCode === '-14' ? 'FINALIZATA' : lastOperation.status
              } (${lastOperation.operationCode})`
            );
          }
        } else {
          console.log(`⚠️ Nu am găsit status valid pentru AWB ${parcel.id}`);
        }
      } else {
        console.log(`⚠️ Nu am găsit operațiuni pentru AWB ${parcel.id}`);
      }
    }
    
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