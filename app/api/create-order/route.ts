import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendAdminNotification, sendOrderConfirmation } from '@/lib/email'
import { auth } from '@clerk/nextjs/server'
import { dpdClient, createDPDShipmentForOrder } from '@/lib/dpd'
import { generateOrderNumber } from '@/lib/orderNumber'
import { generateOblioInvoice } from '@/lib/oblio'

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
        
        const dpdResult = await createDPDShipmentForOrder(completeOrder, completeOrder.details);
        
        if (dpdResult) {
          console.log('✅ Expediere DPD creată cu succes:', dpdResult.awb);
          completeOrder = dpdResult;
        } else {
          console.log('⚠️ Nu s-a putut crea expedierea DPD, dar comanda continuă.');
          // Actualizăm statusul comenzii pentru a indica că nu s-a putut crea expedierea
          const updatedOrder = await prisma.order.update({
            where: { id: completeOrder.id },
            data: {
              orderStatus: 'Comanda este în curs de procesare - expedierea va fi creată manual',
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
          completeOrder = updatedOrder;
        }
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

    // Generăm automat factura Oblio pentru toate comenzile
    try {
      console.log('=== ÎNCEPERE GENERARE FACTURĂ OBLIO ===');
      console.log('Comanda ID:', completeOrder.id);
      console.log('Order Number:', completeOrder.orderNumber);
      console.log('Total:', completeOrder.total);
      
      // Transformăm datele comenzii în formatul necesar pentru Oblio
      const oblioInvoiceData = {
        cif: completeOrder.details.cif || 'RO00000000', // CIF-ul clientului sau unul default
        nume: completeOrder.details.fullName,
        email: completeOrder.details.email,
        telefon: completeOrder.details.phoneNumber,
        adresa: completeOrder.details.street + (completeOrder.details.streetNumber ? ` ${completeOrder.details.streetNumber}` : ''),
        oras: completeOrder.details.city,
        judet: completeOrder.details.county || 'București',
        codPostal: completeOrder.details.postalCode || '000000',
        tara: 'România',
        items: completeOrder.items.map(item => ({
          nume: item.product.name,
          pret: item.price,
          cantitate: item.quantity,
          um: 'buc'
        })),
        total: completeOrder.total,
        orderNumber: completeOrder.orderNumber,
        orderDate: new Date().toISOString().split('T')[0]
      };
      
      console.log('Datele pentru Oblio:', JSON.stringify(oblioInvoiceData, null, 2));
      
      const invoiceResult = await generateOblioInvoice(oblioInvoiceData);
      
      console.log('Rezultatul generării facturii:', invoiceResult);
      
      // Actualizăm comanda cu ID-ul facturii Oblio
      await prisma.order.update({
        where: { id: completeOrder.id },
        data: {
          oblioInvoiceId: invoiceResult.invoiceId,
          oblioInvoiceNumber: invoiceResult.invoiceNumber,
          oblioInvoiceUrl: invoiceResult.pdfUrl,
        }
      });
      
      console.log('Comanda actualizată cu ID-ul facturii Oblio');
      console.log('=== FINALIZARE GENERARE FACTURĂ OBLIO ===');
    } catch (error) {
      console.error('=== EROARE LA GENERAREA FACTURII OBLIO ===');
      console.error('Eroare completă:', error);
      console.error('Stack trace:', error instanceof Error ? error.stack : 'No stack trace');
      console.error('=== SFÂRȘIT EROARE ===');
      // Nu întrerupem procesul dacă factura nu se poate genera
    }

    // Send notifications
    if (completeOrder.orderNumber) {
      // Cast to the expected type for email functions
      const orderForEmail = {
        ...completeOrder,
        orderNumber: completeOrder.orderNumber,
        paymentType: completeOrder.paymentType || 'unknown'
      } as any
      await sendAdminNotification(orderForEmail)
      await sendOrderConfirmation(orderForEmail)
    } else {
      console.error('Order number is null, skipping email notifications')
    }

    return NextResponse.json({ orderId: completeOrder.id })
  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

