import { NextResponse } from 'next/server';
import { dpdClient } from '@/lib/dpd';
import { auth as clerkAuth, currentUser } from "@clerk/nextjs/server";

export async function POST(request: Request) {
  try {
    // Verificăm autorizarea
    const authResult = await clerkAuth();
    if (!authResult?.userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verificăm dacă utilizatorul este admin
    const user = await currentUser();
    if (!user?.publicMetadata?.isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Exemplu de date de test pentru calculul prețului
    const testData = {
      recipient: {
        privatePerson: true,
        addressLocation: {
          siteId: 642140205 // Brașov
        }
      },
      service: {
        autoAdjustPickupDate: true,
        serviceIds: [2505], // Serviciu standard
        additionalServices: {
          cod: {
            amount: 100,
            processingType: 'CASH' as const
          },
          declaredValue: {
            amount: 100,
            fragile: true,
            ignoreIfNotApplicable: true
          }
        }
      },
      content: {
        parcelsCount: 1,
        totalWeight: 0.6
      },
      payment: {
        courierServicePayer: 'RECIPIENT' as const
      }
    };

    // Calculăm prețul folosind clientul DPD
    const calculationResult = await dpdClient.calculatePrice(testData);

    return NextResponse.json({
      testData,
      result: calculationResult
    });
  } catch (error: any) {
    console.error('Error testing DPD price calculation:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
} 