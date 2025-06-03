import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdmin } from "@/lib/auth";
import { randomBytes } from "crypto";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Verify admin access
    const admin = await isAdmin();
    if (!admin) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id } = params;

    // Generate a random token
    const token = randomBytes(32).toString('hex');

    // Update the subscriber with the new token
    await prisma.newsletterSubscriber.update({
      where: { id },
      data: { 
        unsubscribeToken: token,
        tokenExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days from now
      },
    });

    return NextResponse.json({ token });
  } catch (error) {
    console.error("Error generating unsubscribe token:", error);
    return NextResponse.json(
      { error: "Failed to generate unsubscribe token" },
      { status: 500 }
    );
  }
} 