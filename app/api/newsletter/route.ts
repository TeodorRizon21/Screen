import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { Resend } from 'resend';

if (!process.env.RESEND_API_KEY) {
  throw new Error('RESEND_API_KEY is not configured');
}

if (!process.env.RESEND_AUDIENCE_ID) {
  throw new Error('RESEND_AUDIENCE_ID is not configured');
}

const resend = new Resend(process.env.RESEND_API_KEY);
const AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

export async function POST(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Verificăm dacă emailul există deja
    const existingSubscriber = await prisma.newsletterSubscriber.findUnique({
      where: { email },
    });

    if (existingSubscriber) {
      if (existingSubscriber.isActive) {
        return NextResponse.json(
          { error: 'Email already subscribed' },
          { status: 400 }
        );
      } else {
        // Reactivăm abonamentul dacă era dezactivat
        await prisma.newsletterSubscriber.update({
          where: { email },
          data: { isActive: true },
        });
      }
    } else {
      // Creăm un nou abonat
      await prisma.newsletterSubscriber.create({
        data: { email },
      });
    }

    // Adăugăm emailul în audiența Resend
    try {
      await resend.contacts.create({
        email,
        unsubscribed: false,
        audienceId: AUDIENCE_ID,
      });
    } catch (error) {
      console.error('Error adding contact to Resend:', error);
      // Continuăm execuția chiar dacă adăugarea în Resend eșuează
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error subscribing to newsletter:', error);
    return NextResponse.json(
      { error: 'Failed to subscribe to newsletter' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Dezactivăm abonamentul în loc să-l ștergem
    await prisma.newsletterSubscriber.update({
      where: { email },
      data: { isActive: false },
    });

    // Dezabonăm contactul din Resend
    try {
      await resend.contacts.update({
        email,
        unsubscribed: true,
        audienceId: AUDIENCE_ID,
      });
    } catch (error) {
      console.error('Error updating contact in Resend:', error);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error unsubscribing from newsletter:', error);
    return NextResponse.json(
      { error: 'Failed to unsubscribe from newsletter' },
      { status: 500 }
    );
  }
} 