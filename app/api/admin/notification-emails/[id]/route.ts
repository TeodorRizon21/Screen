import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    await prisma.adminNotificationEmail.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Email deleted successfully' })
  } catch (error) {
    console.error('Error deleting notification email:', error)
    return NextResponse.json({ error: 'Failed to delete notification email' }, { status: 500 })
  }
}

