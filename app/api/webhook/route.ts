import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { stripe } from '@/lib/stripe';
import { createDPDShipmentForOrder } from '@/lib/dpd';
import { sendAdminNotification, sendOrderConfirmation } from '@/lib/email';
import { generateOblioInvoice } from '@/lib/oblio';
import { generateOrderNumber } from '@/lib/orderNumber';

// Import tipul OrderWithItems din lib/email
type OrderWithItems = Parameters<typeof sendAdminNotification>[0];

interface OrderItem {
  productId: string;
  quantity: number;
  size: string;
  price: number;
}

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const sig = headers().get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    console.error('Webhook signature verification failed:', errorMessage);
    return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object as Stripe.Checkout.Session;
    console.log('Checkout session completed:', session.id);

    try {
      const { userId, detailsId, items: itemsJson } = session.metadata as { 
        userId: string; 
        detailsId: string; 
        items: string;
      };
      const parsedItems = JSON.parse(itemsJson) as OrderItem[];

      // Generate order number
      const orderNumber = await generateOrderNumber();

      const order = await prisma.order.create({
        data: {
          orderNumber,
          userId,
          total: session.amount_total! / 100,
          paymentStatus: 'COMPLETED',
          orderStatus: 'Comanda este in curs de procesare',
          paymentType: 'card',
          details: { connect: { id: detailsId } },
          items: {
            create: parsedItems.map((item: OrderItem) => ({
              productId: item.productId,
              quantity: item.quantity,
              size: item.size,
              price: item.price
            }))
          },
          checkoutSessionId: session.id
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
      });

      // Create DPD shipment
      try {
        console.log('Încercăm să creăm expedierea DPD pentru comanda:', order.id);
        const updatedOrder = await createDPDShipmentForOrder(order, order.details);
        if (updatedOrder) {
          console.log('Expediere DPD creată cu succes, AWB:', updatedOrder.awb);
        } else {
          console.log('Nu s-a putut crea expedierea DPD, dar comanda continuă.');
        }
      } catch (dpdError: unknown) {
        console.error('Eroare la crearea expedierii DPD:', dpdError);
        // Nu aruncăm eroarea mai departe, doar o logăm
        // Comanda a fost creată cu succes, vom încerca să creăm expedierea manual
      }

      // Reîncărcăm comanda completă din baza de date pentru a ne asigura că avem toate datele actualizate
      const completeOrder = await prisma.order.findUnique({
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
      });

      if (!completeOrder) {
        throw new Error('Order was created but could not be fetched');
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
      try {
        if (completeOrder.orderNumber) {
          // Cast to the expected type for email functions
          const orderForEmail = {
            ...completeOrder,
            orderNumber: completeOrder.orderNumber,
            paymentType: completeOrder.paymentType || 'card'
          } as OrderWithItems
          // Trimitem notificare către admin
          await sendAdminNotification(orderForEmail);
          // Trimitem confirmare către client
          await sendOrderConfirmation(orderForEmail);
        } else {
          console.error('Order number is null, skipping email notifications');
        }
      } catch (emailError) {
        console.error('Error sending notifications:', emailError);
      }

      return NextResponse.json({ success: true });
    } catch (err) {
      console.error('Error processing webhook:', err);
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ received: true });
}

