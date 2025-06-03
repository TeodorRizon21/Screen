import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    console.log('API: Fetching car makes from database...');
    const makes = await prisma.product.findMany({
      select: {
        make: true,
      },
      distinct: ['make'],
      orderBy: {
        make: 'asc',
      },
    });

    console.log('API: Raw makes data:', makes);
    const uniqueMakes = makes.map(item => item.make).filter(Boolean);
    console.log('API: Processed unique makes:', uniqueMakes);

    return NextResponse.json(uniqueMakes);
  } catch (error) {
    console.error('API: Error fetching car makes:', error);
    return NextResponse.json({ error: 'Error fetching car makes' }, { status: 500 });
  }
} 