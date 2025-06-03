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

    if ('error' in data && data.error) {
      console.error("Error sending email:", data.error);
      return { success: false, error: data.error.message || 'Unknown error' };
    }

    console.log("Email sent successfully:", data);
    return { success: true, data };
  } catch (error: unknown) {
    console.error("Error sending email:", error);
    // Check for specific error types
    if (error && typeof error === 'object' && 'statusCode' in error) {
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
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

export async function sendAdminNotification(order: OrderWithItems): Promise<EmailResponse> {
  try {
    // Fetch the complete order with product information
    const completeOrder = await prisma.order.findUnique({
      where: { id: order.id },
      include: {
        items: {
          include: {
            product: true
          }
        },
        details: true
      }
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
      error: error instanceof Error ? error.message : "Unknown error" 
    };
  }
}

export async function sendOrderConfirmation(order: OrderWithItems): Promise<EmailResponse> {
  if (!order.details?.email) {
    console.error("No customer email provided");
    return { success: false, error: "No customer email provided" };
  }

  try {
    const currentDate = format(new Date(), "dd/MM/yyyy");

    const pdfBuffer = await renderToBuffer(
      createElement(Document, {}, 
        createElement(Page, { size: "A4", style: styles.page },
          createElement(View, { style: styles.header },
            createElement(Text, { style: [styles.title, styles.bold] }, "Factura"),
            createElement(Text, {}, `Data: ${currentDate}`),
            createElement(Text, {}, `Numar comanda: ${order.id}`)
          ),
          order.details.isCompany && [
            createElement(View, { style: styles.section },
              createElement(Text, { style: styles.sectionTitle }, "Date furnizor:"),
              createElement(Text, {}, "ScreenShield SRL"),
              createElement(Text, {}, "CUI: RO12345678"),
              createElement(Text, {}, "Reg. Com.: J40/123/2023"),
              createElement(Text, {}, "Adresa: Strada Exemplu, Nr. 123"),
              createElement(Text, {}, "Oras, Judet, Cod Postal")
            ),
            createElement(View, { style: styles.section },
              createElement(Text, { style: styles.sectionTitle }, "Date cumparator:"),
              createElement(Text, {}, order.details.companyName ?? "N/A"),
              createElement(Text, {}, `CUI: ${order.details.cui ?? "N/A"}`),
              createElement(Text, {}, `Reg. Com.: ${order.details.regCom ?? "N/A"}`),
              createElement(Text, {}, `Adresa sediului social: ${order.details.companyStreet ?? "N/A"}`),
              createElement(Text, {}, `${order.details.companyCity ?? "N/A"}, ${order.details.companyCounty ?? "N/A"}`)
            )
          ],
          createElement(View, { style: styles.section },
            createElement(Text, { style: styles.sectionTitle }, "Date livrare:"),
            ...(order.details.isCompany ? [
              createElement(Text, {}, `Adresa: ${order.details.street}`),
              createElement(Text, {}, `${order.details.city}, ${order.details.county} ${order.details.postalCode}`),
              createElement(Text, {}, order.details.country)
            ] : [
              createElement(Text, {}, order.details.fullName),
              createElement(Text, {}, order.details.email),
              createElement(Text, {}, order.details.phoneNumber),
              createElement(Text, {}, order.details.street),
              createElement(Text, {}, `${order.details.city}, ${order.details.county} ${order.details.postalCode}`),
              createElement(Text, {}, order.details.country)
            ])
          ),
          createElement(View, { style: styles.section },
            createElement(View, { style: styles.row },
              createElement(Text, { style: [styles.description, styles.bold] }, "Produs"),
              createElement(Text, { style: [styles.quantity, styles.bold] }, "Cant."),
              createElement(Text, { style: [styles.price, styles.bold] }, "Pret"),
              createElement(Text, { style: [styles.amount, styles.bold] }, "Total")
            ),
            ...order.items.map((item) =>
              createElement(View, { key: item.id, style: styles.row },
                createElement(Text, { style: styles.description }, `${item.product.name} (${item.size})`),
                createElement(Text, { style: styles.quantity }, item.quantity.toString()),
                createElement(Text, { style: styles.price }, `${item.price.toFixed(2)} RON`),
                createElement(Text, { style: styles.amount }, `${(item.price * item.quantity).toFixed(2)} RON`)
              )
            ),
            createElement(View, { style: styles.row },
              createElement(Text, { style: styles.description }, "Taxă de livrare"),
              createElement(Text, { style: styles.quantity }, "1"),
              createElement(Text, { style: styles.price }, "15.00 RON"),
              createElement(Text, { style: styles.amount }, "15.00 RON")
            )
          ),
          createElement(View, { style: styles.totalContainer },
            createElement(Text, { style: [styles.total, styles.bold] }, `Total: ${order.total.toFixed(2)} RON`)
          )
        )
      )
    );

    const html = `
      <h1>Thank you for your order!</h1>
      <p>Dear ${order.details.fullName},</p>
      <p>We're pleased to confirm your order has been received and is being processed.</p>
      <p><strong>Order ID:</strong> ${order.id}</p>
      <p><strong>Total:</strong> $${order.total.toFixed(2)}</p>
      <h2>Order Details:</h2>
      <ul>
        ${order.items.map(item => `<li>${item.quantity}x ${item.product.name} (${item.size}) - $${item.price.toFixed(2)}</li>`).join('')}
      </ul>
      <h2>Shipping Address:</h2>
      <p>${order.details.street}</p>
      <p>${order.details.city}, ${order.details.county} ${order.details.postalCode}</p>
      <p>${order.details.country}</p>
      <p>We'll notify you when your order has been shipped.</p>
      <p>If you have any questions, please don't hesitate to contact us.</p>
    `;

    return await sendEmail(order.details.email, "Order Confirmation", html, [
      {
        filename: `invoice-${order.id}.pdf`,
        content: pdfBuffer,
      },
    ]);
  } catch (error: unknown) {
    console.error("Error sending order confirmation:", error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : "Unknown error" 
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
      message: error instanceof Error ? error.message : "Unknown error"
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
      message: error instanceof Error ? error.message : "Unknown error"
    };
  }
}
