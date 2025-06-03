import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { slides, interval } = body

    // Find existing hero settings
    const existingSettings = await prisma.heroSettings.findFirst()

    // Generate proper MongoDB-compatible ObjectIds for new slides
    const updatedSlides = slides.map((slide: { id?: string; imageUrl: string; collectionLink: string }) => ({
      // Generate a new MongoDB-compatible ObjectId if none exists
      id: slide.id || crypto.randomBytes(12).toString('hex'),
      imageUrl: slide.imageUrl,
      collectionLink: slide.collectionLink
    }))

    if (existingSettings) {
      // Update existing settings
      const updatedSettings = await prisma.heroSettings.update({
        where: { id: existingSettings.id },
        data: { 
          slides: updatedSlides,
          interval 
        },
      })
      return NextResponse.json(updatedSettings)
    } else {
      // Create new settings
      const newSettings = await prisma.heroSettings.create({
        data: { 
          slides: updatedSlides,
          interval 
        },
      })
      return NextResponse.json(newSettings)
    }
  } catch (error) {
    console.error('Error updating hero settings:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json({ error: 'Failed to update hero settings', details: errorMessage }, { status: 500 })
  }
}

