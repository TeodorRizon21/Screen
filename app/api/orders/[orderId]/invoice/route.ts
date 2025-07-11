import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { downloadOblioInvoice } from "@/lib/oblio";

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const { orderId } = params;

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
      // Descărcăm PDF-ul din Oblio
      const pdfResponse = await fetch(oblioResult.pdfUrl);
      if (!pdfResponse.ok) {
        throw new Error("Failed to download PDF from Oblio");
      }

      const pdfBlob = await pdfResponse.blob();
      
      // Returnăm PDF-ul direct către client
      return new NextResponse(pdfBlob, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="factura-${order.oblioInvoiceNumber}.pdf"`,
        },
      });
    } else {
      throw new Error("Failed to get invoice from Oblio");
    }

  } catch (error) {
    console.error("Error downloading invoice:", error);
    return NextResponse.json(
      { 
        error: "Failed to download invoice",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 