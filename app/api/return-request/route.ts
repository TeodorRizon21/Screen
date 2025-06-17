import { NextResponse } from 'next/server';
import { sendReturnRequestNotification } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const formData = await request.json();

    // Validăm datele obligatorii
    const requiredFields = ['firstName', 'lastName', 'email', 'orderNumber', 'productName', 'returnReason', 'preferredSolution'];
    const missingFields = requiredFields.filter(field => !formData[field]);

    if (missingFields.length > 0) {
      return NextResponse.json(
        { 
          success: false, 
          error: `Câmpurile următoare sunt obligatorii: ${missingFields.join(', ')}` 
        },
        { status: 400 }
      );
    }

    // Validăm emailul
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      return NextResponse.json(
        { success: false, error: 'Adresa de email nu este validă' },
        { status: 400 }
      );
    }

    // Validăm motivul returului
    const validReasons = ['defect', 'wrong-size', 'not-as-described', 'damaged-shipping', 'changed-mind', 'other'];
    if (!validReasons.includes(formData.returnReason)) {
      return NextResponse.json(
        { success: false, error: 'Motivul returului nu este valid' },
        { status: 400 }
      );
    }

    // Validăm soluția preferată
    const validSolutions = ['refund', 'exchange', 'repair', 'store-credit'];
    if (!validSolutions.includes(formData.preferredSolution)) {
      return NextResponse.json(
        { success: false, error: 'Soluția preferată nu este validă' },
        { status: 400 }
      );
    }

    // Trimitem emailurile
    const emailResult = await sendReturnRequestNotification({
      firstName: formData.firstName.trim(),
      lastName: formData.lastName.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone?.trim() || '',
      orderNumber: formData.orderNumber.trim(),
      productName: formData.productName.trim(),
      returnReason: formData.returnReason,
      description: formData.description?.trim() || '',
      preferredSolution: formData.preferredSolution
    });

    if (!emailResult.success) {
      console.error('Error sending return request notification:', emailResult.error);
      return NextResponse.json(
        { success: false, error: 'Nu am putut trimite cererea de retur. Te rog să încerci din nou.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Cererea de retur a fost trimisă cu succes!' 
    });

  } catch (error) {
    console.error('Error processing return request:', error);
    return NextResponse.json(
      { success: false, error: 'A apărut o eroare neașteptată. Te rog să încerci din nou.' },
      { status: 500 }
    );
  }
} 