import { Resend } from "resend";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { ReactElement, createElement } from "react";
import { Order, OrderItem, Product } from "@prisma/client";
import { format } from "date-fns";

interface EmailAttachment {
  filename: string;
  content: Buffer;
}

interface EmailResponse {
  success: boolean;
  error?: string;
  data?: unknown;
  results?: PromiseSettledResult<EmailResponse>[];
}

interface ResendError {
  statusCode: number;
  message: string;
}

interface ErrorResponse {
  error: string;
  message?: string;
}

interface OrderDetails {
  fullName: string;
  email: string;
  phoneNumber: string;
  street: string;
  streetNumber?: string | null;
  block?: string | null;
  floor?: string | null;
  apartment?: string | null;
  city: string;
  county: string;
  postalCode: string;
  country: string;
  notes?: string | null;
  isCompany: boolean;
  companyName?: string | null;
  cui?: string | null;
  regCom?: string | null;
  companyStreet?: string | null;
  companyCity?: string | null;
  companyCounty?: string | null;
}

interface OrderProduct {
  id: string;
  name: string;
  price: number;
  images: string[];
}

interface OrderWithItems {
  orderNumber: any;
  id: string;
  userId: string | null;
  total: number;
  paymentStatus: string;
  orderStatus: string;
  paymentType: string | null;
  courier: string | null;
  awb: string | null;
  createdAt: Date;
  updatedAt: Date;
  detailsId: string;
  checkoutSessionId: string | null;
  items: (OrderItem & {
    product: OrderProduct;
  })[];
  details: OrderDetails;
  oblioInvoiceId?: string | null;
  oblioInvoiceUrl?: string | null;
  oblioInvoiceNumber?: string | null;
}

// Tipuri pentru formularele noi
interface FoilRequestData {
  name: string;
  email: string;
  phone: string;
  carMake: string;
  carModel: string;
  carYear: string;
  carGeneration: string;
  additionalInfo: string;
  urgency: string;
}

interface ReturnRequestData {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  orderNumber: string;
  productName: string;
  returnReason: string;
  description: string;
  preferredSolution: string;
}

const resend = new Resend(process.env.RESEND_API_KEY);

const FROM_EMAIL = {
  email: process.env.RESEND_FROM_EMAIL || "onboarding@resend.dev",
  name: "ScreenShield",
};

const styles = StyleSheet.create({
  page: {
    padding: 30,
    fontSize: 12,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
  },
  section: {
    margin: 10,
    padding: 10,
  },
  row: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    borderBottomStyle: "solid",
    alignItems: "center",
    height: 24,
  },
  description: {
    width: "60%",
  },
  quantity: {
    width: "10%",
  },
  price: {
    width: "15%",
    textAlign: "right",
  },
  amount: {
    width: "15%",
    textAlign: "right",
  },
  totalContainer: {
    marginTop: 20,
    textAlign: "right",
  },
  total: {
    fontSize: 16,
  },
  bold: {
    fontWeight: "bold",
  },
  sectionTitle: {
    fontSize: 14,
    marginBottom: 5,
    fontWeight: "bold",
  },
});

export async function sendEmail(
  to: string,
  subject: string,
  html: string,
  attachments?: EmailAttachment[]
): Promise<EmailResponse> {
  if (!process.env.RESEND_API_KEY) {
    console.error("RESEND_API_KEY is not configured");
    return { success: false, error: "Email service not configured" };
  }

  try {
    const data = await resend.emails.send({
      from: `${FROM_EMAIL.name} <${FROM_EMAIL.email}>`,
      to,
      subject,
      html,
      attachments,
    });

    if ("error" in data && data.error) {
      console.error("Error sending email:", data.error);
      return { success: false, error: data.error.message || "Unknown error" };
    }

    console.log("Email sent successfully:", data);
    return { success: true, data };
  } catch (error: unknown) {
    console.error("Error sending email:", error);
    // Check for specific error types
    if (error && typeof error === "object" && "statusCode" in error) {
      const resendError = error as ResendError;
      if (resendError.statusCode === 403) {
        console.error(
          "Authentication error. Please verify your API key and sender email address."
        );
      }
      return {
        success: false,
        error: resendError.message,
      };
    }
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendAdminNotification(
  order: OrderWithItems
): Promise<EmailResponse> {
  try {
    // Fetch the complete order with product information
    const completeOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        details: true,
        discountCodes: {
          include: {
            discountCode: true,
          },
        },
      },
    });

    if (!completeOrder) {
      return { success: false, error: "Order not found" };
    }

    const adminEmails = await prisma.adminNotificationEmail.findMany();

    if (adminEmails.length === 0) {
      console.warn("No admin emails configured");
      return { success: false, error: "No admin emails configured" };
    }

    // Calculăm totalul cu reduceri
    const subtotal = completeOrder.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    const discountTotal = completeOrder.discountCodes.reduce((sum, dc) => {
      if (dc.discountCode.type === 'percentage') {
        return sum + (subtotal * dc.discountCode.value / 100);
      } else {
        return sum + dc.discountCode.value;
      }
    }, 0);
    const finalTotal = subtotal - discountTotal;

    const html = `
      <div style="max-width:700px;margin:0 auto;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
        <!-- HEADER -->
        <div style="background:linear-gradient(135deg,#dc3545 0%,#c82333 100%);padding:30px 20px;text-align:center;">
          <h1 style="color:#fff;font-size:28px;font-weight:700;margin:0;text-shadow:0 2px 4px rgba(0,0,0,0.2);">
            🛒 COMANDA NOUĂ PRIMITĂ
          </h1>
          <p style="color:#fff;font-size:16px;margin:10px 0 0 0;opacity:0.9;">
            O nouă comandă a fost plasată pe site-ul tău
          </p>
        </div>

        <!-- INFO RAPIDĂ -->
        <div style="padding:30px;background:#fff;">
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:30px;">
            <div style="background:#f8f9fa;border-radius:8px;padding:20px;text-align:center;">
              <h3 style="color:#dc3545;margin:0 0 10px 0;font-size:18px;">🔢 Număr Comandă</h3>
              <p style="font-size:24px;font-weight:700;color:#333;margin:0;">${completeOrder.orderNumber}</p>
            </div>
            <div style="background:#f8f9fa;border-radius:8px;padding:20px;text-align:center;">
              <h3 style="color:#dc3545;margin:0 0 10px 0;font-size:18px;">💰 Total Comandă</h3>
              <p style="font-size:24px;font-weight:700;color:#333;margin:0;">${finalTotal.toLocaleString('ro-RO')} RON</p>
            </div>
          </div>

          <!-- CLIENT -->
          <div style="background:#e8f5e8;border:1px solid #28a745;border-radius:8px;padding:20px;margin-bottom:25px;">
            <h3 style="color:#155724;margin:0 0 15px 0;font-size:18px;">👤 Informații Client</h3>
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:15px;">
              <div>
                <p style="margin:0 0 5px 0;color:#155724;"><strong>Nume:</strong> ${completeOrder.details.fullName}</p>
                <p style="margin:0 0 5px 0;color:#155724;"><strong>Email:</strong> ${completeOrder.details.email}</p>
                <p style="margin:0;color:#155724;"><strong>Telefon:</strong> ${completeOrder.details.phoneNumber}</p>
              </div>
              <div>
                <p style="margin:0 0 5px 0;color:#155724;"><strong>Metoda plată:</strong> ${completeOrder.paymentType === 'card' ? '💳 Card bancar' : '💵 Ramburs'}</p>
                <p style="margin:0 0 5px 0;color:#155724;"><strong>Status plată:</strong> ${completeOrder.paymentStatus === 'COMPLETED' ? '✅ Plătit' : '⏳ În așteptare'}</p>
                <p style="margin:0;color:#155724;"><strong>Data comandă:</strong> ${new Date(completeOrder.createdAt).toLocaleString('ro-RO')}</p>
              </div>
            </div>
          </div>

          <!-- ADRESĂ LIVRARE -->
          <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:20px;margin-bottom:25px;">
            <h3 style="color:#856404;margin:0 0 15px 0;font-size:18px;">📍 Adresa de Livrare</h3>
            <p style="margin:0 0 5px 0;color:#856404;">${completeOrder.details.street}${completeOrder.details.streetNumber ? ` ${completeOrder.details.streetNumber}` : ''}</p>
            <p style="margin:0 0 5px 0;color:#856404;">${completeOrder.details.city}, ${completeOrder.details.county}</p>
            <p style="margin:0 0 5px 0;color:#856404;">${completeOrder.details.postalCode || ''}</p>
            <p style="margin:0;color:#856404;">${completeOrder.details.country}</p>
          </div>

          <!-- PRODUSE -->
          <div style="background:#fff;border:1px solid #e9ecef;border-radius:8px;padding:20px;margin-bottom:25px;">
            <h3 style="color:#333;margin:0 0 15px 0;font-size:18px;">🛍️ Produse Comandate</h3>
            ${completeOrder.items
              .map(
                (item) => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #f1f3f4;">
                <div style="flex:1;">
                  <p style="font-weight:600;color:#333;margin:0 0 5px 0;font-size:15px;">${item.product.name}</p>
                  <p style="color:#666;margin:0;font-size:13px;">Mărime: ${item.size} | Cantitate: ${item.quantity}</p>
                </div>
                <div style="text-align:right;">
                  <p style="font-weight:600;color:#333;margin:0;font-size:15px;">${(item.price * item.quantity).toLocaleString('ro-RO')} RON</p>
                </div>
              </div>
            `
              )
              .join("")}
          </div>

          <!-- REDUCERI -->
          ${completeOrder.discountCodes.length > 0 ? `
          <div style="background:#d1ecf1;border:1px solid #bee5eb;border-radius:8px;padding:20px;margin-bottom:25px;">
            <h3 style="color:#0c5460;margin:0 0 15px 0;font-size:18px;">🎫 Coduri de Reducere Aplicate</h3>
            ${completeOrder.discountCodes
              .map(
                (dc) => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;">
                <span style="color:#0c5460;font-weight:600;">${dc.discountCode.code}</span>
                <span style="color:#0c5460;">-${dc.discountCode.value}${dc.discountCode.type === 'percentage' ? '%' : ' RON'}</span>
              </div>
            `
              )
              .join("")}
          </div>
          ` : ''}

          <!-- SUMAR FINANCIAR -->
          <div style="background:#f8f9fa;border-radius:8px;padding:20px;margin-bottom:25px;">
            <h3 style="color:#333;margin:0 0 15px 0;font-size:18px;">💰 Sumar Financiar</h3>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e9ecef;">
              <span style="color:#666;">Subtotal:</span>
              <span style="color:#333;font-weight:600;">${subtotal.toLocaleString('ro-RO')} RON</span>
            </div>
            ${discountTotal > 0 ? `
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid #e9ecef;">
              <span style="color:#666;">Reduceri:</span>
              <span style="color:#dc3545;font-weight:600;">-${discountTotal.toLocaleString('ro-RO')} RON</span>
            </div>
            ` : ''}
            <div style="display:flex;justify-content:space-between;padding:8px 0;">
              <span style="color:#333;font-weight:600;font-size:16px;">Total:</span>
              <span style="color:#dc3545;font-weight:700;font-size:18px;">${finalTotal.toLocaleString('ro-RO')} RON</span>
            </div>
          </div>

          <!-- ACȚIUNI -->
          <div style="text-align:center;padding:20px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/orders" style="display:inline-block;background:#dc3545;color:#fff;padding:15px 30px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;margin:0 10px;">
              👁️ Vezi Detalii Comandă
            </a>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/orders" style="display:inline-block;background:#28a745;color:#fff;padding:15px 30px;text-decoration:none;border-radius:8px;font-weight:600;font-size:16px;margin:0 10px;">
              ✅ Finalizează Comanda
            </a>
          </div>
        </div>

        <!-- FOOTER -->
        <div style="background:#333;color:#fff;text-align:center;padding:20px;">
          <p style="margin:0;font-size:14px;opacity:0.8;">
            Această notificare a fost trimisă automat de sistemul Screen Shield.
          </p>
        </div>
      </div>
    `;

    const results = await Promise.allSettled(
      adminEmails.map((admin) =>
        sendEmail(admin.email, `🛒 Comandă nouă #${completeOrder.orderNumber} - ${completeOrder.details.fullName}`, html)
      )
    );

    const allSuccessful = results.every(
      (result) => result.status === "fulfilled" && result.value.success
    );

    return {
      success: allSuccessful,
      results,
    };
  } catch (error) {
    console.error("Error sending admin notification:", error);
    return {
      success: false,
      error: "Failed to send admin notification",
    };
  }
}

export async function sendOrderConfirmation(
  order: OrderWithItems
): Promise<EmailResponse> {
  if (!order.details?.email) {
    console.error("No customer email provided");
    return { success: false, error: "No customer email provided" };
  }

  try {
    // Pregătim atașamentele
    const attachments: EmailAttachment[] = [];

    // Descărcăm și atașăm factura Oblio
    if (order.oblioInvoiceId) {
      try {
        console.log("Descărcăm factura Oblio pentru comanda:", order.id);
        
        // Încercăm să descărcăm din API-ul intern
        const apiUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/orders/${order.id}/invoice`;
        console.log("Apelăm API-ul:", apiUrl);
        
        const apiResponse = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (apiResponse.ok) {
          const pdfBuffer = await apiResponse.arrayBuffer();
          attachments.push({
            filename: `factura-${order.oblioInvoiceNumber || order.orderNumber}.pdf`,
            content: Buffer.from(pdfBuffer),
          });
          console.log("Factura Oblio atașată cu succes din API");
        } else {
          console.error("Eroare la descărcarea din API:", apiResponse.statusText);
          
          // Fallback la URL-ul direct
          if (order.oblioInvoiceUrl) {
            console.log("Încercăm fallback la URL-ul direct:", order.oblioInvoiceUrl);
            const oblioResponse = await fetch(order.oblioInvoiceUrl);
            if (oblioResponse.ok) {
              const oblioBuffer = await oblioResponse.arrayBuffer();
              attachments.push({
                filename: `factura-${order.oblioInvoiceNumber || order.orderNumber}.pdf`,
                content: Buffer.from(oblioBuffer),
              });
              console.log("Factura Oblio atașată cu succes din URL direct");
            } else {
              console.error("Eroare și la URL-ul direct:", oblioResponse.statusText);
            }
          }
        }
      } catch (error) {
        console.error("Eroare la descărcarea facturii Oblio:", error);
      }
    } else {
      console.log("Nu există ID pentru factura Oblio");
    }

    const html = `
      <div style="max-width:600px;margin:0 auto;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;background:#fff;border-radius:15px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.1);">
        <!-- HEADER CU LOGO -->
        <div style="background:linear-gradient(135deg,#ff7f2a 0%,#ff6b35 100%);padding:40px 20px;text-align:center;">
          <img src="https://screenshield.ro/logoscreenshield.png" alt="Screen Shield" style="height:70px;margin-bottom:20px;">
          <h1 style="color:#fff;font-size:28px;font-weight:700;margin:0;text-shadow:0 2px 4px rgba(0,0,0,0.1);">
            ✅ COMANDA PLASATĂ CU SUCCES
          </h1>
          <p style="color:#fff;font-size:16px;margin:10px 0 0 0;opacity:0.9;">
            Mulțumim pentru încrederea acordată!
          </p>
        </div>

        <!-- MESAJ PRINCIPAL -->
        <div style="padding:40px 30px 20px 30px;background:#fff;">
          <div style="background:#f8f9fa;border-left:4px solid #ff7f2a;padding:20px;border-radius:8px;margin-bottom:30px;">
            <p style="font-size:16px;color:#333;line-height:1.6;margin:0;">
              <strong>Salut ${order.details.fullName.split(' ')[0]}!</strong><br>
              Comanda ta a fost procesată cu succes și este în curs de pregătire. 
              Odată ce coletul este predat la curier, vei primi un email cu numărul de urmărire.
            </p>
          </div>

          <!-- FACTURA -->
          ${
            order.oblioInvoiceUrl
              ? `<div style="background:#e8f5e8;border:1px solid #28a745;border-radius:8px;padding:20px;margin-bottom:30px;">
                  <h3 style="color:#155724;margin:0 0 10px 0;font-size:18px;">📄 Factura Fiscală</h3>
                  <p style="color:#155724;margin:0 0 15px 0;font-size:14px;">
                    ${attachments.length > 0
                      ? "Factura este atașată acestui email."
                      : "Poți descărca factura din link-ul de mai jos."}
                  </p>
                  ${
                    attachments.length === 0
                      ? `<a href="${order.oblioInvoiceUrl}" style="display:inline-block;background:#28a745;color:#fff;padding:12px 24px;text-decoration:none;border-radius:6px;font-weight:600;font-size:14px;">
                         📥 Descarcă Factura
                       </a>`
                      : ""
                  }
                </div>`
              : ""
          }

          <!-- CONTACT -->
          <div style="background:#fff3cd;border:1px solid #ffc107;border-radius:8px;padding:20px;margin-bottom:30px;">
            <h3 style="color:#856404;margin:0 0 10px 0;font-size:18px;">📞 Ai întrebări?</h3>
            <p style="color:#856404;margin:0;font-size:14px;line-height:1.5;">
              Ne poți contacta la:<br>
              <strong>📧 Email:</strong> contact@screenshield.ro<br>
              <strong>📱 WhatsApp:</strong> +40 123 456 789
            </p>
          </div>
        </div>

        <!-- DETALII COMANDĂ -->
        <div style="background:#f8f9fa;padding:30px;">
          <h2 style="color:#333;font-size:22px;margin:0 0 25px 0;text-align:center;font-weight:600;">
            📋 DETALII COMANDĂ
          </h2>
          
          <!-- NUMĂR COMANDĂ -->
          <div style="background:#fff;border-radius:8px;padding:20px;margin-bottom:20px;border:1px solid #e9ecef;">
            <h3 style="color:#ff7f2a;margin:0 0 15px 0;font-size:18px;">🔢 Număr Comandă</h3>
            <p style="font-size:24px;font-weight:700;color:#333;margin:0;text-align:center;">${order.orderNumber}</p>
          </div>

          <!-- PRODUSE -->
          <div style="background:#fff;border-radius:8px;padding:20px;margin-bottom:20px;border:1px solid #e9ecef;">
            <h3 style="color:#ff7f2a;margin:0 0 15px 0;font-size:18px;">🛍️ Produse Comandate</h3>
            ${order.items
              .map(
                (item) => `
              <div style="display:flex;justify-content:space-between;align-items:center;padding:12px 0;border-bottom:1px solid #f1f3f4;">
                <div style="flex:1;">
                  <p style="font-weight:600;color:#333;margin:0 0 5px 0;font-size:15px;">${item.product.name}</p>
                  <p style="color:#666;margin:0;font-size:13px;">Mărime: ${item.size} | Cantitate: ${item.quantity}</p>
                </div>
                <div style="text-align:right;">
                  <p style="font-weight:600;color:#333;margin:0;font-size:15px;">${item.price.toLocaleString('ro-RO')} RON</p>
                </div>
              </div>
            `
              )
              .join("")}
          </div>

          <!-- TOTAL -->
          <div style="background:#ff7f2a;color:#fff;border-radius:8px;padding:20px;margin-bottom:20px;text-align:center;">
            <h3 style="margin:0 0 10px 0;font-size:18px;">💰 Total Comandă</h3>
            <p style="font-size:28px;font-weight:700;margin:0;">${order.total.toLocaleString('ro-RO')} RON</p>
            <p style="margin:10px 0 0 0;font-size:14px;opacity:0.9;">
              Metoda de plată: ${order.paymentType === "card" ? "💳 Card bancar" : "💵 Ramburs"}
            </p>
          </div>

          <!-- ADRESĂ LIVRARE -->
          <div style="background:#fff;border-radius:8px;padding:20px;border:1px solid #e9ecef;">
            <h3 style="color:#ff7f2a;margin:0 0 15px 0;font-size:18px;">📍 Adresa de Livrare</h3>
            <div style="background:#f8f9fa;border-radius:6px;padding:15px;">
              <p style="font-weight:600;color:#333;margin:0 0 8px 0;font-size:15px;">${order.details.fullName}</p>
              <p style="color:#666;margin:0 0 5px 0;font-size:14px;">${order.details.street}${order.details.streetNumber ? ` ${order.details.streetNumber}` : ''}</p>
              <p style="color:#666;margin:0 0 5px 0;font-size:14px;">${order.details.city}, ${order.details.county}</p>
              <p style="color:#666;margin:0 0 5px 0;font-size:14px;">${order.details.postalCode || ''}</p>
              <p style="color:#666;margin:0;font-size:14px;">📞 ${order.details.phoneNumber}</p>
            </div>
          </div>
        </div>

        <!-- FOOTER -->
        <div style="background:#333;color:#fff;text-align:center;padding:30px 20px;">
          <p style="margin:0 0 10px 0;font-size:16px;font-weight:600;">Screen Shield</p>
          <p style="margin:0 0 15px 0;font-size:14px;opacity:0.8;">Protejăm mașinile tale cu pasiune</p>
          <div style="border-top:1px solid #555;padding-top:15px;">
            <p style="margin:0;font-size:12px;opacity:0.6;">
              © 2024 Screen Shield. Toate drepturile rezervate.
            </p>
          </div>
        </div>
      </div>
    `;

    const emailData = {
      from: "Screen Shield <no-reply@screenshield.ro>",
      to: order.details.email,
      subject: `Confirmare comandă #${order.orderNumber} - Screen Shield`,
      html,
      text: `✅ Confirmare comandă #${order.orderNumber} - Screen Shield

Salut ${order.details.fullName.split(' ')[0]}!

Mulțumim pentru comanda ta! Comanda a fost procesată cu succes și este în curs de pregătire.

${order.oblioInvoiceUrl ? `📄 Factura fiscală: ${order.oblioInvoiceUrl}` : ""}

📋 DETALII COMANDĂ:
🔢 Număr comandă: ${order.orderNumber}
💰 Total: ${order.total.toLocaleString('ro-RO')} RON
💳 Metoda de plată: ${order.paymentType === "card" ? "Card bancar" : "Ramburs"}

📍 Adresa de livrare:
${order.details.fullName}
${order.details.street}${order.details.streetNumber ? ` ${order.details.streetNumber}` : ''}
${order.details.city}, ${order.details.county}
${order.details.postalCode || ""}
📞 ${order.details.phoneNumber}

📞 Pentru întrebări:
📧 Email: contact@screenshield.ro
📱 WhatsApp: +40 123 456 789

Odată ce coletul este predat la curier, vei primi un email cu numărul de urmărire.

Cu drag,
Echipa Screen Shield`,
      attachments,
    };

    const response = await resend.emails.send(emailData);

    return {
      success: true,
      data: response,
    };
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
    return {
      success: false,
      error: "Failed to send order confirmation email",
    };
  }
}

export async function sendOrderConfirmationEmail(
  order: Order & { items: OrderItem[] },
  pdfBuffer: Buffer
): Promise<void | ErrorResponse> {
  try {
    // ... existing code ...
  } catch (error) {
    console.error("Error sending order confirmation email:", error);
    return {
      error: "Failed to send order confirmation email",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

export async function sendNewsletterEmail(
  email: string,
  subject: string,
  content: string
): Promise<void | ErrorResponse> {
  try {
    // ... existing code ...
  } catch (error) {
    console.error("Error sending newsletter email:", error);
    return {
      error: "Failed to send newsletter email",
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Funcție pentru trimiterea cererii de folie personalizată
export async function sendFoilRequestNotification(
  requestData: FoilRequestData
): Promise<EmailResponse> {
  if (!process.env.RESEND_API_KEY) {
    return { success: false, error: "Email service not configured" };
  }

  const urgencyText =
    {
      low: "Scăzută - până în 2 săptămâni",
      normal: "Normală - până în 1 săptămână",
      high: "Ridicată - în 2-3 zile",
      urgent: "Urgentă - în 24 ore",
    }[requestData.urgency] || requestData.urgency;

  const adminEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
        🚗 Cerere Nouă pentru Folie Personalizată
      </h2>
      
      <h3 style="color: #555; margin-top: 20px;">Informații Client:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">Nume:</td><td style="padding: 8px; border: 1px solid #ddd;">${
          requestData.name
        }</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">Email:</td><td style="padding: 8px; border: 1px solid #ddd;">${
          requestData.email
        }</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">Telefon:</td><td style="padding: 8px; border: 1px solid #ddd;">${
          requestData.phone
        }</td></tr>
      </table>

      <h3 style="color: #555; margin-top: 20px;">Detalii Mașină:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">Marca:</td><td style="padding: 8px; border: 1px solid #ddd;">${
          requestData.carMake
        }</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">Model:</td><td style="padding: 8px; border: 1px solid #ddd;">${
          requestData.carModel
        }</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">An fabricație:</td><td style="padding: 8px; border: 1px solid #ddd;">${
          requestData.carYear
        }</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">Generație:</td><td style="padding: 8px; border: 1px solid #ddd;">${
          requestData.carGeneration || "Nu a fost specificată"
        }</td></tr>
      </table>

      <h3 style="color: #555; margin-top: 20px;">Detalii Cerere:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">Urgență:</td><td style="padding: 8px; border: 1px solid #ddd; color: ${
          requestData.urgency === "urgent"
            ? "#dc3545"
            : requestData.urgency === "high"
            ? "#fd7e14"
            : "#28a745"
        };">${urgencyText}</td></tr>
      </table>

      ${
        requestData.additionalInfo
          ? `
        <h3 style="color: #555; margin-top: 20px;">Informații Suplimentare:</h3>
        <div style="padding: 15px; background: #f8f9fa; border-left: 4px solid #007bff; margin: 10px 0;">
          ${requestData.additionalInfo.replace(/\n/g, "<br>")}
        </div>
      `
          : ""
      }

      <div style="margin-top: 30px; padding: 15px; background: #e9ecef; border-radius: 5px;">
        <p style="margin: 0; color: #666;">
          <strong>Notă:</strong> Te rog să contactezi clientul în cel mai scurt timp pentru a confirma disponibilitatea foliei.
        </p>
      </div>
    </div>
  `;

  const clientEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">
        ✅ Cererea ta a fost primită cu succes!
      </h2>
      
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Salut <strong>${requestData.name}</strong>,
      </p>
      
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Îți mulțumim pentru cererea de folie personalizată pentru <strong>${requestData.carMake} ${requestData.carModel} (${requestData.carYear})</strong>!
      </p>

      <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">Ce urmează?</h3>
        <ul style="color: #555; line-height: 1.8;">
          <li>Echipa noastră va analiza cererea ta în funcție de urgența specificată: <strong>${urgencyText}</strong></li>
          <li>Vom verifica disponibilitatea foliei pentru modelul tău de mașină</li>
          <li>Te vom contacta la <strong>${requestData.email}</strong> sau <strong>${requestData.phone}</strong> cu detaliile</li>
          <li>Îți vom furniza un devis personalizat și timpul de livrare</li>
        </ul>
      </div>

      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Dacă ai întrebări urgente, ne poți contacta direct la:
      </p>
      
      <div style="background: #e9ecef; padding: 15px; border-radius: 5px;">
        <p style="margin: 5px 0; color: #333;"><strong>📧 Email:</strong> contact@screenshield.ro</p>
        <p style="margin: 5px 0; color: #333;"><strong>📞 Telefon:</strong> +40 123 456 789</p>
      </div>

      <p style="color: #555; font-size: 14px; margin-top: 30px; text-align: center;">
        Cu respect,<br>
        <strong>Echipa ScreenShield</strong>
      </p>
    </div>
  `;

  try {
    // Trimitem email către administratori
    const adminEmails = await prisma.adminNotificationEmail.findMany();

    const adminResults = await Promise.allSettled(
      adminEmails.map((admin) =>
        sendEmail(
          admin.email,
          `🚗 Cerere Nouă Folie - ${requestData.carMake} ${requestData.carModel}`,
          adminEmailHtml
        )
      )
    );

    // Trimitem email de confirmare către client
    const clientResult = await sendEmail(
      requestData.email,
      "✅ Cererea ta pentru folie personalizată a fost primită",
      clientEmailHtml
    );

    const allSuccessful =
      adminResults.every(
        (result) => result.status === "fulfilled" && result.value.success
      ) && clientResult.success;

    return {
      success: allSuccessful,
      results: [
        ...adminResults,
        { status: "fulfilled" as const, value: clientResult },
      ],
    };
  } catch (error) {
    console.error("Error sending foil request emails:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

// Funcție pentru trimiterea cererii de retur
export async function sendReturnRequestNotification(
  returnData: ReturnRequestData
): Promise<EmailResponse> {
  if (!process.env.RESEND_API_KEY) {
    return { success: false, error: "Email service not configured" };
  }

  const reasonText =
    {
      defect: "Produs defect",
      "wrong-size": "Mărime greșită",
      "not-as-described": "Nu corespunde descrierii",
      "damaged-shipping": "Deteriorat la transport",
      "changed-mind": "Am schimbat părerea",
      other: "Altul",
    }[returnData.returnReason] || returnData.returnReason;

  const solutionText =
    {
      refund: "Rambursare",
      exchange: "Schimb cu produs similar",
      repair: "Reparare",
      "store-credit": "Credit magazin",
    }[returnData.preferredSolution] || returnData.preferredSolution;

  const adminEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #dc3545; padding-bottom: 10px;">
        📦 Cerere Nouă de Retur
      </h2>
      
      <h3 style="color: #555; margin-top: 20px;">Informații Client:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">Nume:</td><td style="padding: 8px; border: 1px solid #ddd;">${
          returnData.firstName
        } ${returnData.lastName}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">Email:</td><td style="padding: 8px; border: 1px solid #ddd;">${
          returnData.email
        }</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">Telefon:</td><td style="padding: 8px; border: 1px solid #ddd;">${
          returnData.phone || "Nu a fost furnizat"
        }</td></tr>
      </table>

      <h3 style="color: #555; margin-top: 20px;">Detalii Comandă:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">Număr comandă:</td><td style="padding: 8px; border: 1px solid #ddd;">${
          returnData.orderNumber
        }</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">Produs:</td><td style="padding: 8px; border: 1px solid #ddd;">${
          returnData.productName
        }</td></tr>
      </table>

      <h3 style="color: #555; margin-top: 20px;">Detalii Retur:</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">Motiv:</td><td style="padding: 8px; border: 1px solid #ddd;">${reasonText}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd; background: #f9f9f9; font-weight: bold;">Soluție preferată:</td><td style="padding: 8px; border: 1px solid #ddd;">${solutionText}</td></tr>
      </table>

      ${
        returnData.description
          ? `
        <h3 style="color: #555; margin-top: 20px;">Descrierea Problemei:</h3>
        <div style="padding: 15px; background: #f8f9fa; border-left: 4px solid #dc3545; margin: 10px 0;">
          ${returnData.description.replace(/\n/g, "<br>")}
        </div>
      `
          : ""
      }

      <div style="margin-top: 30px; padding: 15px; background: #fff3cd; border-radius: 5px; border-left: 4px solid #ffc107;">
        <p style="margin: 0; color: #856404;">
          <strong>ATENȚIE:</strong> Te rog să procesezi această cerere de retur în 2-3 zile lucrătoare conform politicii companiei.
        </p>
      </div>
    </div>
  `;

  const clientEmailHtml = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #333; border-bottom: 2px solid #28a745; padding-bottom: 10px;">
        ✅ Cererea ta de retur a fost primită!
      </h2>
      
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Salut <strong>${returnData.firstName}</strong>,
      </p>
      
      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Îți mulțumim pentru cererea de retur pentru comanda <strong>#${
          returnData.orderNumber
        }</strong>!
      </p>

      <div style="background: #f8f9fa; padding: 20px; border-radius: 5px; margin: 20px 0;">
        <h3 style="color: #333; margin-top: 0;">Detalii cerere:</h3>
        <table style="width: 100%; border-collapse: collapse;">
          <tr><td style="padding: 5px 0; color: #666; font-weight: bold;">Produs:</td><td style="padding: 5px 0; color: #333;">${
            returnData.productName
          }</td></tr>
          <tr><td style="padding: 5px 0; color: #666; font-weight: bold;">Motiv:</td><td style="padding: 5px 0; color: #333;">${reasonText}</td></tr>
          <tr><td style="padding: 5px 0; color: #666; font-weight: bold;">Soluție preferată:</td><td style="padding: 5px 0; color: #333;">${solutionText}</td></tr>
        </table>
      </div>

      <div style="background: #d4edda; padding: 20px; border-radius: 5px; margin: 20px 0; border-left: 4px solid #28a745;">
        <h3 style="color: #155724; margin-top: 0;">Ce urmează?</h3>
        <ul style="color: #155724; line-height: 1.8; margin: 0;">
          <li>Vom procesa cererea ta în 2-3 zile lucrătoare</li>
          <li>Te vom contacta la <strong>${
            returnData.email
          }</strong> cu instrucțiunile de retur</li>
          <li>Îți vom furniza eticheta de transport (dacă este cazul)</li>
          <li>După primirea produsului, îți vom procesa ${solutionText.toLowerCase()}</li>
        </ul>
      </div>

      <div style="background: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <p style="margin: 0; color: #856404; font-size: 14px;">
          <strong>Notă importantă:</strong> Te rugăm să păstrezi produsul în ambalajul original până primești instrucțiunile noastre.
        </p>
      </div>

      <p style="color: #555; font-size: 16px; line-height: 1.6;">
        Dacă ai întrebări despre procesul de retur, ne poți contacta:
      </p>
      
      <div style="background: #e9ecef; padding: 15px; border-radius: 5px;">
        <p style="margin: 5px 0; color: #333;"><strong>📧 Email:</strong> contact@screenshield.ro</p>
        <p style="margin: 5px 0; color: #333;"><strong>📞 Telefon:</strong> +40 123 456 789</p>
      </div>

      <p style="color: #555; font-size: 14px; margin-top: 30px; text-align: center;">
        Cu respect,<br>
        <strong>Echipa ScreenShield</strong>
      </p>
    </div>
  `;

  try {
    // Trimitem email către administratori
    const adminEmails = await prisma.adminNotificationEmail.findMany();

    const adminResults = await Promise.allSettled(
      adminEmails.map((admin) =>
        sendEmail(
          admin.email,
          `📦 Cerere Retur - Comanda #${returnData.orderNumber}`,
          adminEmailHtml
        )
      )
    );

    // Trimitem email de confirmare către client
    const clientResult = await sendEmail(
      returnData.email,
      "✅ Cererea ta de retur a fost primită - Comanda #" +
        returnData.orderNumber,
      clientEmailHtml
    );

    const allSuccessful =
      adminResults.every(
        (result) => result.status === "fulfilled" && result.value.success
      ) && clientResult.success;

    return {
      success: allSuccessful,
      results: [
        ...adminResults,
        { status: "fulfilled" as const, value: clientResult },
      ],
    };
  } catch (error) {
    console.error("Error sending return request emails:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
