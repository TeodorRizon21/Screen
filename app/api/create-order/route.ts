import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendAdminNotification, sendOrderConfirmation } from '@/lib/email'
import { auth } from '@clerk/nextjs/server'
import { dpdClient } from '@/lib/dpd'
import { generateOrderNumber } from '@/lib/orderNumber'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { items, userId, detailsId, paymentType, appliedDiscounts } = body

    // Validate required fields
    if (!items || items.length === 0) {
      return NextResponse.json(
        { error: 'Nu există produse în coș' },
        { status: 400 }
      )
    }

    if (!detailsId) {
      return NextResponse.json(
        { error: 'Detaliile comenzii sunt obligatorii' },
        { status: 400 }
      )
    }

    // If user is authenticated, verify the userId
    if (userId) {
      const session = await auth()
      if (!session?.userId || session.userId !== userId) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 401 }
        )
      }
    }

    // Verify products and calculate total
    let subtotal = 0;
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.product.id },
        include: {
          sizeVariants: {
            where: { size: item.selectedSize }
          }
        }
      });

      if (!product) {
        return NextResponse.json(
          { error: `Produsul ${item.product.name} nu mai este disponibil` },
          { status: 400 }
        );
      }

      const variant = product.sizeVariants[0];
      if (!variant) {
        return NextResponse.json(
          { error: `Mărimea ${item.selectedSize} nu mai este disponibilă pentru ${product.name}` },
          { status: 400 }
        );
      }

      if (!product.allowOutOfStock && variant.stock < item.quantity) {
        return NextResponse.json(
          { error: `Stoc insuficient pentru ${product.name} (${item.selectedSize})` },
          { status: 400 }
        );
      }

      subtotal += variant.price * item.quantity;
    }

    const shipping = 15 // Fixed shipping cost
    const discountAmount = (appliedDiscounts || []).reduce((acc: number, discount: any) => {
      if (discount.type === 'percentage') {
        return acc + (subtotal * discount.value / 100)
      } else if (discount.type === 'fixed') {
        return acc + discount.value
      } else if (discount.type === 'free_shipping') {
        return acc + shipping
      }
      return acc
    }, 0)

    const total = Math.max(0, subtotal + shipping - discountAmount)

    // Generate order number
    const orderNumber = await generateOrderNumber()

    // Create the order in the database
    const order = await prisma.order.create({
      data: {
        orderNumber,
        userId: userId || null,
        total,
        paymentStatus: paymentType === 'card' ? 'COMPLETED' : 'PENDING',
        orderStatus: 'În așteptare',
        paymentType,
        details: { connect: { id: detailsId } },
        items: {
          create: items.map((item: any) => ({
            productId: item.product.id,
            quantity: item.quantity,
            size: item.selectedSize,
            price: item.variant.price
          }))
        },
        discountCodes: appliedDiscounts?.length > 0 ? {
          create: appliedDiscounts.map((discount: any) => ({
            discountCode: { connect: { code: discount.code } }
          }))
        } : undefined
      },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
                weight: true
              }
            }
          }
        },
        details: true,
        discountCodes: {
          include: {
            discountCode: true
          }
        }
      },
    })

    // Fetch complete order with all required information
    let completeOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                price: true,
                images: true,
                weight: true
              }
            }
          }
        },
        details: true,
        discountCodes: {
          include: {
            discountCode: true
          }
        }
      }
    })

    if (!completeOrder) {
      throw new Error('Order was created but could not be fetched')
    }

    // Trimitem comanda către DPD pentru toate comenzile, indiferent de metoda de plată
    try {
      console.log('Începem procesul de creare expediere DPD pentru comanda:', completeOrder.id);
      
      // Folosim ID-ul confirmat pentru România
      const countryId = 642; // ID-ul confirmat pentru România
      console.log('Căutăm ID-ul pentru orașul:', completeOrder.details.city);
      const siteId = await dpdClient.findSite(countryId, completeOrder.details.city.toUpperCase());
      
      if (!siteId) {
        throw new Error(`Nu am putut găsi orașul ${completeOrder.details.city} în sistemul DPD`);
      }
      
      // Extragem numele străzii fără număr
      const streetName = completeOrder.details.street.replace(/\d+.*$/, '').trim().toUpperCase();
      console.log('Căutăm ID-ul pentru strada:', streetName);
      const streetId = await dpdClient.findStreet(siteId, streetName);
      
      if (!streetId) {
        throw new Error(`Nu am putut găsi strada ${streetName} în sistemul DPD`);
      }

      // Extragem numărul străzii
      const streetNoMatch = completeOrder.details.street.match(/\d+/);
      const streetNo = streetNoMatch ? streetNoMatch[0] : '1';

      // Greutate fixă de 1kg pentru toate expedierile
      const totalWeight = 1;

      console.log('Pregătim datele pentru expedierea DPD:', {
        recipient: completeOrder.details.fullName,
        city: completeOrder.details.city,
        street: streetName,
        streetNo,
        totalWeight
      });

      // Pregătim datele pentru cererea către DPD
      const shipmentData = {
        sender: {
          phone1: {
            number: process.env.COMPANY_PHONE || '',
          },
          contactName: process.env.COMPANY_NAME || '',
          email: process.env.COMPANY_EMAIL || '',
        },
        recipient: {
          phone1: {
            number: completeOrder.details.phoneNumber.replace(/\s+/g, ''),
          },
          clientName: completeOrder.details.fullName,
          email: completeOrder.details.email,
          privatePerson: true,
          address: {
            countryId,
            siteId,
            streetId,
            streetNo,
          },
        },
        service: {
          serviceId: 2505, // CLASSIC service
          additionalServices: paymentType === 'ramburs' ? {
            cod: {
              amount: completeOrder.total,
              processingType: 'CASH' as const,
            },
          } : undefined,
          autoAdjustPickupDate: true,
        },
        content: {
          parcelsCount: 1,
          totalWeight: 1, // Greutate fixă de 1kg
          contents: completeOrder.items.map(item => item.product.name).join(', '),
          package: 'BOX',
        },
        payment: {
          courierServicePayer: 'SENDER' as const,
        },
        ref1: completeOrder.id,
        shipmentId: completeOrder.id,
      };

      console.log('Trimitem cererea către DPD...');
      const dpdResponse = await dpdClient.createShipment(shipmentData);

      if (dpdResponse.error) {
        throw new Error(`DPD Error: ${dpdResponse.error.message}`);
      }

      console.log('Expediere creată cu succes în DPD:', dpdResponse);

      // Actualizăm comanda cu AWB-ul primit
      const updatedOrder = await prisma.order.update({
        where: { id: completeOrder.id },
        data: {
          courier: 'DPD',
          awb: dpdResponse.parcels[0].id,
          dpdShipmentId: dpdResponse.id,
          orderStatus: 'Comanda a fost preluată de curier',
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  images: true,
                  weight: true
                }
              }
            }
          },
          details: true,
          discountCodes: {
            include: {
              discountCode: true
            }
          }
        }
      });

      console.log('Comanda actualizată cu AWB:', dpdResponse.parcels[0].id);
      
      // Folosim comanda actualizată pentru emailuri
      completeOrder = updatedOrder;
    } catch (error) {
      console.error('Error creating DPD shipment:', error);
      
      // Actualizăm statusul comenzii pentru a indica eroarea
      const updatedOrder = await prisma.order.update({
        where: { id: completeOrder.id },
        data: {
          orderStatus: 'Eroare la generarea AWB - va fi procesată manual',
        },
        include: {
          items: {
            include: {
              product: {
                select: {
                  id: true,
                  name: true,
                  price: true,
                  images: true,
                  weight: true
                }
              }
            }
          },
          details: true,
          discountCodes: {
            include: {
              discountCode: true
            }
          }
        }
      });
      
      // Folosim comanda actualizată pentru emailuri
      completeOrder = updatedOrder;
    }

    // Send notifications
    await sendOrderConfirmation(completeOrder)
    await sendAdminNotification(completeOrder)

    return NextResponse.json({ orderId: completeOrder.id })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

