import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { renderToBuffer } from "@react-pdf/renderer";
import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { format } from "date-fns";
import { createElement } from "react";

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

export async function GET(
  request: Request,
  { params }: { params: { orderId: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const order = await prisma.order.findUnique({
      where: {
        id: params.orderId,
      },
      include: {
        items: {
          include: {
            product: true,
          },
        },
        details: true,
      },
    });

    if (!order) {
      return new NextResponse("Order not found", { status: 404 });
    }

    if (order.userId !== userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const currentDate = format(new Date(), "dd/MM/yyyy");

    const pdfBuffer = await renderToBuffer(
      createElement(Document, {}, 
        createElement(Page, { size: "A4", style: styles.page },
          createElement(View, { style: styles.header },
            createElement(Text, { style: [styles.title, styles.bold] }, "Factura"),
            createElement(Text, {}, `Data: ${currentDate}`),
            createElement(Text, {}, `Numar comanda: ${order.orderNumber}`)
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

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="factura-${order.id}.pdf"`,
      },
    });
  } catch (error) {
    console.error("[INVOICE_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
}