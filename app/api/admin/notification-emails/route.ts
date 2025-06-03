import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const emails = await prisma.adminNotificationEmail.findMany()
    return NextResponse.json(emails)
  } catch (error) {
    console.error('Error fetching notification emails:', error)
    return NextResponse.json({ error: 'Failed to fetch notification emails' }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email } = body

    const newEmail = await prisma.adminNotificationEmail.create({
      data: { email },
    })

    return NextResponse.json(newEmail)
  } catch (error) {
    console.error('Error adding notification email:', error)
    return NextResponse.json({ error: 'Failed to add notification email' }, { status: 500 })
  }
}

