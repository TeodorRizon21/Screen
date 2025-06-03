import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const heroSettings = await prisma.heroSettings.findFirst();
    
    return NextResponse.json({
      slides: heroSettings?.slides || [],
    });
  } catch (error) {
    console.error('Error fetching hero settings:', error);
    return NextResponse.json(
      { error: 'Failed to load hero settings' },
      { status: 500 }
    );
  }
} 