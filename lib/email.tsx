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
  streetNumber?: string;
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
  paymentType: string;
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

    const itemsList = completeOrder.items
      .map(
        (item) =>
          `<li>${item.quantity}x ${item.product.name} (${
            item.size
          }) - $${item.price.toFixed(2)}</li>`
      )
      .join("");

    const html = `
      <h1>New Order Received</h1>
      <p>Order ID: ${completeOrder.id}</p>
      <p>Total: $${completeOrder.total.toFixed(2)}</p>
      <p>Customer: ${completeOrder.details.fullName}</p>
      <p>Email: ${completeOrder.details.email}</p>
      <p>Phone: ${completeOrder.details.phoneNumber}</p>
      <h2>Items:</h2>
      <ul>
        ${itemsList}
      </ul>
      <h2>Shipping Address:</h2>
      <p>${completeOrder.details.street}</p>
      <p>${completeOrder.details.city}, ${completeOrder.details.county} ${
      completeOrder.details.postalCode
    }</p>
      <p>${completeOrder.details.country}</p>
      <p><a href="${
        process.env.NEXT_PUBLIC_APP_URL
      }/admin/orders">View Order Details</a></p>
    `;

    const results = await Promise.allSettled(
      adminEmails.map((admin) =>
        sendEmail(admin.email, "New Order Notification", html)
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
    console.error("Error sending admin notifications:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
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
    if (order.oblioInvoiceUrl) {
      try {
        console.log("Descărcăm factura Oblio de la:", order.oblioInvoiceUrl);
        const oblioResponse = await fetch(order.oblioInvoiceUrl);
        if (!oblioResponse.ok) {
          console.error(
            `Failed to download Oblio invoice: ${oblioResponse.statusText}`
          );
          // Nu aruncăm eroare aici, continuăm cu link-ul
        } else {
          const oblioBuffer = await oblioResponse.arrayBuffer();
          attachments.push({
            filename: `factura-${order.oblioInvoiceNumber || order.id}.pdf`,
            content: Buffer.from(oblioBuffer),
          });
          console.log("Factura Oblio atașată cu succes");
        }
      } catch (error) {
        console.error("Eroare la descărcarea facturii Oblio:", error);
      }
    } else {
      console.log("Nu există URL pentru factura Oblio");
    }

    const html = `
      <div style="max-width:600px;margin:0 auto;font-family:sans-serif;background:#fff;border-radius:10px;overflow:hidden;">
        <!-- LOGO -->
        <div style="text-align:center;padding:32px 0 16px 0;">
          <img src="https://screenshield.ro/logoscreenshield.png" alt="Screen Shield" style="height:60px;">
        </div>

        <!-- HEADER -->
        <div style="background:#ff7f2a;color:#fff;text-align:center;padding:16px 0;font-size:24px;font-weight:bold;border-radius:30px;margin:0 40px;">
          COMANDA PLASATĂ CU SUCCES
        </div>

        <!-- MESAJ -->
        <div style="padding:32px 32px 0 32px;font-size:16px;color:#222;">
          <p>Vă mulțumim pentru comanda făcută. Odată ce coletul este predat la curier, vă vom trimite numărul de urmărire al comenzii. Puteți verifica statusul comenzii dumneavoastră prin conectare la contul personal.</p>
          <p>Dacă aveți întrebări referitoare la comanda dumneavoastră, ne puteți trimite email la <b>contact@screenshield.ro</b> sau pe WhatsApp la <b>07xx xxx xxx</b>.</p>
          ${
            order.oblioInvoiceUrl
              ? `<p><strong>Factura fiscală:</strong> ${
                  attachments.length > 0
                    ? "Este atașată acestui email."
                    : `<a href="${order.oblioInvoiceUrl}" style="color:#ff7f2a;text-decoration:underline;">Click aici pentru a descărca factura</a>`
                }</p>`
              : ""
          }
        </div>

        <!-- DETALII COMANDĂ -->
        <div style="background:#ff7f2a;color:#fff;text-align:center;padding:12px 0;font-size:20px;font-weight:bold;border-radius:30px;margin:32px 40px 0 40px;">
          DETALII COMANDĂ
        </div>
        <div style="padding:24px 32px 32px 32px;font-size:16px;color:#222;">
          <p><b>Număr de comandă:</b> ${order.orderNumber}</p>
          <p><b>Detalii Comandă:</b></p>
          <ul style="padding-left:20px;">
            ${order.items
              .map(
                (item) => `
              <li>${item.product.name} x ${item.quantity} - ${item.price} RON</li>
            `
              )
              .join("")}
          </ul>
          <p><b>Total:</b> ${order.total} RON</p>
          <p><b>Metoda de plată:</b> ${
            order.paymentType === "card" ? "Card bancar" : "Ramburs"
          }</p>
          <p><b>Adresa de livrare:</b><br>
            ${order.details.fullName}<br>
            ${order.details.street}<br>
            ${order.details.city}, ${order.details.county}<br>
            ${order.details.postalCode || ""}<br>
            ${order.details.phoneNumber}
          </p>
        </div>
      </div>
    `;

    const emailData = {
      from: "Screen Shield <no-reply@screenshield.ro>",
      to: order.details.email,
      subject: `Confirmare comandă #${order.orderNumber} - Screen Shield`,
      html,
      text: `Confirmare comandă #${order.orderNumber}

Vă mulțumim pentru comanda făcută. Odată ce coletul este predat la curier, vă vom trimite numărul de urmărire al comenzii.

${order.oblioInvoiceUrl ? `Factura fiscală: ${order.oblioInvoiceUrl}` : ""}

DETALII COMANDĂ:
Număr comandă: ${order.orderNumber}
Total: ${order.total} RON
Metoda de plată: ${order.paymentType === "card" ? "Card bancar" : "Ramburs"}

Adresa de livrare:
${order.details.fullName}
${order.details.street}
${order.details.city}, ${order.details.county}
${order.details.postalCode || ""}
${order.details.phoneNumber}

Pentru orice întrebări, ne puteți contacta la contact@screenshield.ro sau pe WhatsApp.`,
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
