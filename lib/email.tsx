import { Order, OrderItem, Product } from "@prisma/client";
import { format } from "date-fns";
import { Resend } from "resend";
import { prisma } from "@/lib/prisma";

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
  orderNumber: string;
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

const pdfStyles = {
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
};

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
          `<tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${
              item.quantity
            }x ${item.product.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${
              item.size || "N/A"
            }</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${item.price.toFixed(
              2
            )} RON</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${(
              item.price * item.quantity
            ).toFixed(2)} RON</td>
           </tr>`
      )
      .join("");

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
            }
            .container {
              max-width: 800px;
              margin: 0 auto;
              background-color: white;
              padding: 30px;
              border-radius: 10px;
              box-shadow: 0 2px 5px rgba(0,0,0,0.1);
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #ff6b2b;
            }
            .logo {
              max-width: 200px;
              height: auto;
            }
            .section {
              margin: 20px 0;
              padding: 20px;
              background-color: #f9f9f9;
              border-radius: 5px;
            }
            .section-title {
              color: #ff6b2b;
              font-size: 18px;
              margin-bottom: 15px;
              font-weight: bold;
            }
            .info-grid {
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 15px;
              margin-bottom: 20px;
            }
            .info-item {
              padding: 10px;
              background-color: #fff;
              border-radius: 5px;
              box-shadow: 0 1px 3px rgba(0,0,0,0.1);
            }
            .info-label {
              font-weight: bold;
              color: #666;
              margin-bottom: 5px;
            }
            .info-value {
              color: #333;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 10px;
            }
            .items-table th {
              background-color: #ff6b2b;
              color: white;
              padding: 12px;
              text-align: left;
            }
            .total-row {
              background-color: #f0f0f0;
              font-weight: bold;
            }
            .action-button {
              display: inline-block;
              background-color: #ff6b2b;
              color: white;
              padding: 12px 25px;
              text-decoration: none;
              border-radius: 5px;
              margin-top: 20px;
              text-align: center;
            }
            .status-badge {
              display: inline-block;
              padding: 5px 10px;
              border-radius: 15px;
              font-size: 14px;
              font-weight: bold;
              background-color: #e8f5e9;
              color: #2e7d32;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://screenshield.ro/logoscreenshield.png" alt="Screen Shield Logo" class="logo">
              <h1 style="color: #333; margin-top: 20px;">Comandă Nouă Primită</h1>
              <div class="status-badge">Comandă Nouă</div>
            </div>

            <div class="section">
              <div class="section-title">Informații Comandă</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">ID Comandă</div>
                  <div class="info-value">${completeOrder.orderNumber}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Total</div>
                  <div class="info-value">${completeOrder.total.toFixed(
                    2
                  )} RON</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Tip Plată</div>
                  <div class="info-value">${completeOrder.paymentType}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Status Plată</div>
                  <div class="info-value">${completeOrder.paymentStatus}</div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Informații Client</div>
              <div class="info-grid">
                <div class="info-item">
                  <div class="info-label">Nume</div>
                  <div class="info-value">${
                    completeOrder.details.fullName
                  }</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Email</div>
                  <div class="info-value">${completeOrder.details.email}</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Telefon</div>
                  <div class="info-value">${
                    completeOrder.details.phoneNumber
                  }</div>
                </div>
                <div class="info-item">
                  <div class="info-label">Adresă</div>
                  <div class="info-value">
                    ${completeOrder.details.street}<br>
                    ${completeOrder.details.city}, ${
      completeOrder.details.county
    }<br>
                    ${completeOrder.details.postalCode}, ${
      completeOrder.details.country
    }
                  </div>
                </div>
              </div>
            </div>

            <div class="section">
              <div class="section-title">Produse Comandate</div>
              <table class="items-table">
                <thead>
                  <tr>
                    <th style="padding: 12px; text-align: left;">Produs</th>
                    <th style="padding: 12px; text-align: left;">Mărime</th>
                    <th style="padding: 12px; text-align: right;">Preț</th>
                    <th style="padding: 12px; text-align: right;">Total</th>
                  </tr>
                </thead>
                <tbody>
                  ${itemsList}
                  <tr class="total-row">
                    <td colspan="3" style="padding: 12px; text-align: right;">Total:</td>
                    <td style="padding: 12px; text-align: right;">${completeOrder.total.toFixed(
                      2
                    )} RON</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style="text-align: center;">
              <a href="${process.env.NEXT_PUBLIC_APP_URL}/admin/orders/${
      completeOrder.id
    }" class="action-button">
                Vezi Detalii Comandă
              </a>
            </div>
          </div>
        </body>
      </html>
    `;

    const results = await Promise.allSettled(
      adminEmails.map((admin) =>
        sendEmail(admin.email, "Comandă Nouă - ScreenShield", html)
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
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
              background-color: #f4f4f4;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: white;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 30px;
            }
            .logo {
              max-width: 200px;
              height: auto;
            }
            .success-button {
              background-color: #ff6b2b;
              color: white;
              padding: 15px 30px;
              text-align: center;
              border-radius: 5px;
              font-weight: bold;
              display: block;
              width: fit-content;
              margin: 20px auto;
              text-decoration: none;
            }
            .details-button {
              background-color: #ff6b2b;
              color: white;
              padding: 15px 30px;
              text-align: center;
              border-radius: 5px;
              font-weight: bold;
              display: block;
              width: fit-content;
              margin: 20px auto;
              text-decoration: none;
            }
            .order-details {
              margin: 20px 0;
              padding: 20px;
              background-color: #f9f9f9;
              border-radius: 5px;
            }
            .text-center {
              text-align: center;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <img src="https://screenshield.ro/logoscreenshield.png" alt="Screen Shield Logo" class="logo">
            </div>
            <div class="text-center">
              <div class="success-button">COMANDA PLASATA CU SUCCES</div>
            </div>
            <p>Vă mulțumim pentru comanda făcută. Odată ce coletul este predat la curier, vă vom trimite numărul de urmărire al comenzii. Puteți verifica statusul comenzii dumneavoastră prin conectare la contul personal</p>
            <p>Dacă aveți întrebări referitoare la comanda dumneavoastră, ne puteți trimite email la ........ sau pe whatsapp la numărul ........</p>
            <div class="text-center">
              <div class="details-button">DETALII COMANDA</div>
            </div>
            <div class="order-details">
              <p><strong>Număr de comandă:</strong> ${order.orderNumber}</p>
              <p><strong>Detalii Comandă:</strong> ${order.items
                .map((item) => `${item.quantity}x ${item.product.name}`)
                .join(", ")}</p>
              <p><strong>Suma:</strong> ${order.total.toFixed(2)} RON</p>
              <p><strong>Adresa de livrare:</strong> ${order.details.street}, ${
      order.details.city
    }, ${order.details.county}</p>
            </div>
          </div>
        </body>
      </html>
    `;

    return await sendEmail(
      order.details.email,
      `Confirmare comandă #${order.orderNumber}`,
      html,
      []
    );
  } catch (error) {
    console.error("Error sending order confirmation:", error);
    return { success: false, error: "Failed to send order confirmation" };
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
    const result = await sendEmail(email, subject, content);

    if (!result.success) {
      throw new Error(result.error || "Failed to send newsletter email");
    }
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
