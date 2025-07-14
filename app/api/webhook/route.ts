import { NextResponse } from 'next/server';
import { headers } from 'next/headers';
import Stripe from 'stripe';
import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { stripe } from '@/lib/stripe';
import { createDPDShipmentForOrder } from '@/lib/dpd';
import { sendAdminNotification, sendOrderConfirmation } from '@/lib/email';
import { generateOblioInvoice } from '@/lib/oblio';
import { generateOrderNumber } from '@/lib/orderNumber';

interface OrderItem {
  productId: string;
  quantity: number;
  size: string;
  price: number;
}

interface OrderDetails {
  fullName: string;
  email: string;
  phoneNumber: string;
  street: string;
  streetNumber?: string;
  block?: string | null;
  floor?: string | null;
  apartment?: string | null;
  city: string;
  county: string;
  postalCode: string;
  country: string;
  locationType?: string | null;
  commune?: string | null;
  isCompany: boolean;
  companyName?: string | null;
  cui?: string | null;
  regCom?: string | null;
  companyStreet?: string | null;
  companyCity?: string | null;
  companyCounty?: string | null;
}

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET!;

export async function POST(req: Request) {
  const body = await req.text();
  const sig = headers().get('stripe-signature') as string;

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
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
      } catch (dpdError: any) {
        console.error('Eroare la crearea expedierii DPD:', dpdError);
        // Nu aruncăm eroarea mai departe, doar o logăm
        // Comanda a fost creată cu succes, vom încerca să creăm expedierea manual
      }

      // Generăm automat factura Oblio pentru toate comenzile
      try {
        console.log('=== ÎNCEPERE GENERARE FACTURĂ OBLIO ===');
        console.log('Comanda ID:', order.id);
        console.log('Order Number:', order.orderNumber);
        console.log('Total:', order.total);
        
        // Transformăm datele comenzii în formatul necesar pentru Oblio
        const oblioInvoiceData = {
          cif: order.details.cif || 'RO00000000', // CIF-ul clientului sau unul default
          nume: order.details.fullName,
          email: order.details.email,
          telefon: order.details.phoneNumber,
          adresa: order.details.street + (order.details.streetNumber ? ` ${order.details.streetNumber}` : ''),
          oras: order.details.city,
          judet: order.details.county || 'București',
          codPostal: order.details.postalCode || '000000',
          tara: 'România',
          items: order.items.map(item => ({
            nume: item.product.name,
            pret: item.price,
            cantitate: item.quantity,
            um: 'buc'
          })),
          total: order.total,
          orderNumber: order.orderNumber,
          orderDate: new Date().toISOString().split('T')[0]
        };
        
        console.log('Datele pentru Oblio:', JSON.stringify(oblioInvoiceData, null, 2));
        
        const invoiceResult = await generateOblioInvoice(oblioInvoiceData);
        
        console.log('Rezultatul generării facturii:', invoiceResult);
        
        // Actualizăm comanda cu ID-ul facturii Oblio
        await prisma.order.update({
          where: { id: order.id },
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
        if (order.orderNumber) {
          // Cast to the expected type for email functions
          const orderForEmail = {
            ...order,
            orderNumber: order.orderNumber,
            paymentType: order.paymentType || 'card'
          } as any
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

