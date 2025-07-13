import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { downloadOblioInvoice } from "@/lib/oblio";

export async function POST(request: NextRequest) {
  try {
    const { orderId } = await request.json();

    if (!orderId) {
      return NextResponse.json(
        { error: "Order ID is required" },
        { status: 400 }
      );
    }

    // Obținem comanda din baza de date
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    // Verificăm dacă factura a fost generată
    if (!order.oblioInvoiceId) {
      return NextResponse.json(
        { error: "Invoice not generated for this order" },
        { status: 400 }
      );
    }

    // Descărcăm factura din Oblio
    const oblioResult = await downloadOblioInvoice(order.oblioInvoiceId);

    if (oblioResult.success) {
      return NextResponse.json({
        success: true,
        pdfUrl: oblioResult.pdfUrl,
        xmlUrl: oblioResult.xmlUrl,
        invoiceNumber: order.oblioInvoiceNumber,
      });
    } else {
      throw new Error("Failed to download invoice from Oblio");
    }

  } catch (error) {
    console.error("Error downloading Oblio invoice:", error);
    return NextResponse.json(
      { 
        error: "Failed to download invoice",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 