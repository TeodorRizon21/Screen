import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function updatePaymentTypes() {
  try {
    const updatedOrders = await prisma.order.updateMany({
      where: {
        paymentType: ''
      },
      data: {
        paymentType: 'Unknown'
      }
    })

    console.log(`Updated ${updatedOrders.count} orders with unknown payment type.`)
  } catch (error) {
    console.error('Error updating payment types:', error)
  } finally {
    await prisma.$disconnect()
  }
}

updatePaymentTypes()

