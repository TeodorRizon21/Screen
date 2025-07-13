import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
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
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Găsim și dezactivăm abonatul în baza de date
    const subscriber = await prisma.newsletterSubscriber.update({
      where: { email },
      data: { isActive: false },
    });

    if (!subscriber) {
      return NextResponse.json(
        { error: "Subscriber not found" },
        { status: 404 }
      );
    }

    // Dezabonăm contactul din Resend
    try {
      await resend.contacts.update({
        email,
        unsubscribed: true,
        audienceId: AUDIENCE_ID,
      });
    } catch (resendError) {
      console.error('Error updating contact in Resend:', resendError);
      // Nu returnăm eroare către client dacă Resend eșuează,
      // deoarece dezabonarea din baza noastră de date a reușit
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error processing unsubscribe:", error);
    return NextResponse.json(
      { error: "Failed to process unsubscribe" },
      { status: 500 }
    );
  }
} 