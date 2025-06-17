import { NextResponse } from 'next/server';
import { sendFoilRequestNotification } from '@/lib/email';

export async function POST(request: Request) {
  try {
    const formData = await request.json();

    // Validăm datele obligatorii
    const requiredFields = ['name', 'email', 'phone', 'carMake', 'carModel', 'carYear'];
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

    // Validăm anul
    const currentYear = new Date().getFullYear();
    const year = parseInt(formData.carYear);
    if (isNaN(year) || year < 1990 || year > currentYear + 1) {
      return NextResponse.json(
        { success: false, error: 'Anul mașinii nu este valid' },
        { status: 400 }
      );
    }

    // Trimitem emailurile
    const emailResult = await sendFoilRequestNotification({
      name: formData.name.trim(),
      email: formData.email.trim().toLowerCase(),
      phone: formData.phone.trim(),
      carMake: formData.carMake.trim(),
      carModel: formData.carModel.trim(),
      carYear: formData.carYear.trim(),
      carGeneration: formData.carGeneration?.trim() || '',
      additionalInfo: formData.additionalInfo?.trim() || '',
      urgency: formData.urgency || 'normal'
    });

    if (!emailResult.success) {
      console.error('Error sending foil request notification:', emailResult.error);
      return NextResponse.json(
        { success: false, error: 'Nu am putut trimite cererea. Te rog să încerci din nou.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Cererea a fost trimisă cu succes!' 
    });

  } catch (error) {
    console.error('Error processing foil request:', error);
    return NextResponse.json(
      { success: false, error: 'A apărut o eroare neașteptată. Te rog să încerci din nou.' },
      { status: 500 }
    );
  }
} 