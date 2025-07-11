import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { downloadOblioInvoice } from "@/lib/oblio";
import { auth } from "@clerk/nextjs/server";
import { isAdmin } from "@/lib/auth";

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    console.log("=== ÎNCEPERE API DESCĂRCARE FACTURĂ ===");
    const { orderId } = params;
    console.log("Order ID:", orderId);
    
    const { userId } = await auth();
    const adminStatus = await isAdmin();
    
    console.log("User ID:", userId);
    console.log("Admin status:", adminStatus);

    if (!userId) {
      console.log("Utilizator neautentificat");
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

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

    console.log("Comanda găsită:", order ? "Da" : "Nu");

    if (!order) {
      console.log("Comanda nu a fost găsită");
      return NextResponse.json(
        { error: "Order not found" },
        { status: 404 }
      );
    }

    console.log("OblioInvoiceId:", order.oblioInvoiceId);
    console.log("Order userId:", order.userId);

    // Verificăm dacă utilizatorul are dreptul să acceseze această comandă
    // Administratorii pot accesa toate facturile, utilizatorii doar comenzile lor
    if (!adminStatus && order.userId && order.userId !== userId) {
      console.log("Acces interzis - utilizator nu este admin și nu este proprietarul comenzii");
      return NextResponse.json(
        { error: "Unauthorized - You can only download invoices for your own orders" },
        { status: 403 }
      );
    }

    // Verificăm dacă factura a fost generată
    if (!order.oblioInvoiceId) {
      console.log("Factura nu a fost generată pentru această comandă");
      return NextResponse.json(
        { error: "Invoice not generated for this order" },
        { status: 400 }
      );
    }

    // Încercăm să descărcăm direct din URL-ul salvat în baza de date
    if (order.oblioInvoiceUrl) {
      console.log("Încercăm să descărcăm din URL-ul salvat:", order.oblioInvoiceUrl);
      try {
        const pdfResponse = await fetch(order.oblioInvoiceUrl);
        console.log("Răspuns URL salvat:", pdfResponse.status, pdfResponse.statusText);
        if (pdfResponse.ok) {
          const pdfBlob = await pdfResponse.blob();
          console.log("Blob descărcat din URL salvat:", pdfBlob.size, "bytes");
          
          // Returnăm PDF-ul direct către client
          return new NextResponse(pdfBlob, {
            headers: {
              "Content-Type": "application/pdf",
              "Content-Disposition": `attachment; filename="factura-${order.oblioInvoiceNumber || order.orderNumber}.pdf"`,
            },
          });
        }
      } catch (error) {
        console.error("Error downloading from saved URL:", error);
      }
    }

    console.log("Încercăm să obținem din Oblio API...");
    // Dacă nu funcționează URL-ul salvat, încercăm să obținem din Oblio API
    const oblioResult = await downloadOblioInvoice(order.oblioInvoiceId);

    console.log("Rezultat Oblio API:", oblioResult);

    if (oblioResult.success) {
      console.log("Descărcăm PDF-ul din Oblio:", oblioResult.pdfUrl);
      // Descărcăm PDF-ul din Oblio
      const pdfResponse = await fetch(oblioResult.pdfUrl);
      console.log("Răspuns PDF Oblio:", pdfResponse.status, pdfResponse.statusText);
      if (!pdfResponse.ok) {
        throw new Error("Failed to download PDF from Oblio");
      }

      const pdfBlob = await pdfResponse.blob();
      console.log("Blob descărcat din Oblio:", pdfBlob.size, "bytes");
      
      // Returnăm PDF-ul direct către client
      return new NextResponse(pdfBlob, {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `attachment; filename="factura-${order.oblioInvoiceNumber || order.orderNumber}.pdf"`,
        },
      });
    } else {
      throw new Error("Failed to get invoice from Oblio");
    }

  } catch (error) {
    console.error("=== EROARE LA DESCĂRCAREA FACTURII ===");
    console.error("Error downloading invoice:", error);
    console.error("=== SFÂRȘIT EROARE ===");
    return NextResponse.json(
      { 
        error: "Failed to download invoice",
        details: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
} 