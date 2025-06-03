import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/auth'

// Definim structura pentru datele Hero Main
interface HeroMainData {
  imageUrl: string
  title?: string
  subtitle?: string
  linkUrl?: string
}

export async function POST(request: Request) {
  // Verificăm dacă utilizatorul este admin
  const adminStatus = await isAdmin()
  if (!adminStatus) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { heroData } = await request.json() as { heroData: HeroMainData }

    // Validăm datele primite
    if (!heroData || !heroData.imageUrl) {
      return NextResponse.json(
        { error: 'Invalid data. Image URL is required.' },
        { status: 400 }
      )
    }

    // Stocăm datele în modelul Settings
    const settings = await prisma.settings.upsert({
      where: { id: 'hero-main' },
      update: { 
        value: JSON.stringify(heroData)
      },
      create: {
        id: 'hero-main',
        value: JSON.stringify(heroData)
      }
    })

    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('Error updating hero main settings:', error)
    return NextResponse.json(
      { error: 'Failed to update hero settings' },
      { status: 500 }
    )
  }
} 