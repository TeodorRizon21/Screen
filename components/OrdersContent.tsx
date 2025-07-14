"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Download } from "lucide-react";
import ReviewModal from "@/components/ReviewModal";
import DPDTrackingDialog from "./DPDTrackingDialog";

type OrderItem = {
  id: string;
  productName: string;
  productId: string;
  quantity: number;
  size: string;
  price: number;
  image: string;
};

type OrderDetails = {
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
  locationType?: string;
  commune?: string | null;
  notes?: string;
};

type Order = {
  id: string;
  orderNumber: string;
  createdAt: string;
  total: number;
  items: OrderItem[];
  paymentStatus: string;
  orderStatus: string;
  paymentType: string;
  courier: string | null;
  awb: string | null;
  details: OrderDetails;
  dpdStatus?: string;
  discountCodes: {
    code: string;
    type: string;
    value: number;
  }[];
  invoiceUrl: string | null;
};

function ProductCard({ item }: { item: OrderItem }) {
  return (
    <Link href={`/products/${item.productId}`}>
      <Card className="cursor-pointer hover:shadow-md transition-shadow">
        <CardContent className="p-4 flex items-center space-x-4">
          <div className="relative w-20 h-20">
            <Image
              src={item.image}
              alt={item.productName}
              layout="fill"
              objectFit="cover"
              className="rounded-md"
            />
          </div>
          <div>
            <h3 className="font-semibold">{item.productName}</h3>
            <p className="text-sm text-gray-600">Size: {item.size}</p>
            <p className="text-sm font-medium">
              {item.price.toLocaleString("ro-RO", {
                style: "currency",
                currency: "RON",
              })}{" "}
              x {item.quantity}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function OrdersContent({ userId }: { userId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<{
    productId: string;
    orderId: string;
    productName: string;
  } | null>(null);

  const fetchDPDStatus = async (awb: string) => {
    try {
      const response = await fetch("/api/admin/dpd/track", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          parcelIds: [awb],
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch tracking info");
      }

      const data = await response.json();
      if (data.parcels?.[0]?.operations?.length > 0) {
        const operations = data.parcels[0].operations;
        return operations[operations.length - 1].description;
      }
      return null;
    } catch (error) {
      console.error("Error fetching DPD status:", error);
      return null;
    }
  };

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await fetch(`/api/orders?userId=${userId}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();

        // Fetch DPD status for each order with DPD courier and AWB
        const ordersWithDPDStatus = await Promise.all(
          data.map(async (order: Order) => {
            if (order.courier === "DPD" && order.awb) {
              const dpdStatus = await fetchDPDStatus(order.awb);
              return { ...order, dpdStatus };
            }
            return order;
          })
        );

        setOrders(ordersWithDPDStatus);
      } catch (error) {
        console.error("Error fetching orders:", error);
        setError("Failed to fetch orders. Please try again later.");
        toast({
          title: "Error",
          description: "Failed to fetch orders. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchOrders();
  }, [userId]);

  const handleDownloadInvoice = async (
    orderId: string,
    invoiceUrl: string | null
  ) => {
    try {
      // Verificăm dacă există factură
      const order = orders.find(o => o.id === orderId);
      if (!order?.invoiceUrl) {
        toast({
          title: "Eroare",
          description: "Nu există factură pentru această comandă. Vă rugăm să contactați suportul.",
          variant: "destructive",
        });
        return;
      }

      // Descărcăm factura din Oblio
      const response = await fetch("/api/orders/" + orderId + "/invoice", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Nu am putut descărca factura");
      }

      // Descărcăm PDF-ul
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `factura-${order.orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading invoice:", error);
      toast({
        title: "Eroare",
        description:
          "Nu am putut descărca factura. Vă rugăm să încercați din nou.",
        variant: "destructive",
      });
    }
  };

  const getTrackingUrl = (courier: string | null, awb: string | null) => {
    if (!courier || !awb) return null;

    switch (courier) {
      case "DPD":
        return null;
      default:
        return null;
    }
  };

  const handleTrackingClick = (courier: string | null, awb: string | null) => {
    const url = getTrackingUrl(courier, awb);
    if (url) {
      window.open(url, "_blank");
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-12">Loading orders...</div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-6 py-12 text-center">
        <h1 className="text-3xl font-bold mb-4">Error</h1>
        <p className="mb-8">{error}</p>
        <Link href="/">
          <Button>Return to Home</Button>
        </Link>
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-6 py-12 text-center">
        <div className="text-left space-y-2 mb-12 font-poppins relative pb-6">
          <p className="text-sm uppercase tracking-wider text-black font-medium">
            YOUR SHOPPING HISTORY
          </p>
          <h2 className="text-3xl md:text-4xl font-bold">My Orders</h2>
          <div className="absolute -bottom-[0.2rem] left-0 w-40 h-1 bg-[#FFD66C]"></div>
        </div>
        <p className="mb-8">You have no placed orders.</p>
        <Link href="/">
          <Button>Shop Now</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="text-left space-y-2 mb-12 font-poppins relative pb-6">
        <p className="text-sm uppercase tracking-wider text-black font-medium">
          YOUR SHOPPING HISTORY
        </p>
        <h2 className="text-3xl md:text-4xl font-bold">My Orders</h2>
        <div className="absolute -bottom-[0.2rem] left-0 w-40 h-1 bg-[#FFD66C]"></div>
      </div>
      <div className="space-y-8">
        {orders.map((order) => (
          <Accordion type="single" collapsible key={order.id}>
            <AccordionItem value={order.id}>
              <AccordionTrigger className="hover:no-underline">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-2 sm:gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
                    <div className="flex flex-col">
                      <h2 className="text-lg font-semibold">
                        Comanda #{order.orderNumber}
                      </h2>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          order.paymentStatus === "COMPLETED"
                            ? "bg-green-100 text-green-800"
                            : "bg-yellow-100 text-yellow-800"
                        }`}
                      >
                        {order.paymentStatus === "COMPLETED"
                          ? "Plătit"
                          : "În așteptare"}
                      </span>
                      <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        Status comandă:{" "}
                        {order.courier === "DPD" && order.dpdStatus
                          ? order.dpdStatus
                          : order.orderStatus}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col sm:items-end">
                    <p className="text-lg font-semibold">
                      {order.total.toLocaleString("ro-RO", {
                        style: "currency",
                        currency: "RON",
                      })}
                    </p>
                    <p className="text-sm text-gray-600">
                      {order.items.length}{" "}
                      {order.items.length === 1 ? "produs" : "produse"}
                    </p>
                  </div>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-6 p-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">Status Comandă</h3>
                      <div className="space-y-1">
                        <p className="text-sm">
                          <span className="font-medium">Status Plată:</span>{" "}
                          {order.paymentStatus === "COMPLETED"
                            ? "Plătit"
                            : "În așteptare"}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Status Comandă:</span>{" "}
                          {order.dpdStatus}
                        </p>
                        <p className="text-sm">
                          <span className="font-medium">Metodă Plată:</span>{" "}
                          {order.paymentType === "card"
                            ? "Card"
                            : "Ramburs la curier"}
                        </p>
                        {order.courier && (
                          <p className="text-sm">
                            <span className="font-medium">Curier:</span>{" "}
                            {order.courier}
                          </p>
                        )}
                        {order.awb && (
                          <div className="mt-2">
                            {order.courier === "DPD" ? (
                              <DPDTrackingDialog awb={order.awb} />
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() =>
                                  handleTrackingClick(order.courier, order.awb)
                                }
                              >
                                Urmărește AWB
                              </Button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">Detalii Livrare</h3>
                      <div className="space-y-1">
                        <p className="text-sm">{order.details.fullName}</p>
                        <p className="text-sm">{order.details.email}</p>
                        <p className="text-sm">{order.details.phoneNumber}</p>
                        <p className="text-sm">
                          {order.details.street}{" "}
                          {order.details.streetNumber || ""}
                          {order.details.block &&
                            `, Bloc ${order.details.block}`}
                          {order.details.floor &&
                            `, Etaj ${order.details.floor}`}
                          {order.details.apartment &&
                            `, Ap ${order.details.apartment}`}
                        </p>
                        <p className="text-sm">
                          {order.details.locationType === 'village' && order.details.commune 
                            ? `${order.details.city}, ${order.details.commune}, ${order.details.county} ${order.details.postalCode}`
                            : `${order.details.city}, ${order.details.county} ${order.details.postalCode}`
                          }
                        </p>
                        <p className="text-sm">{order.details.country}</p>
                        {order.details.notes && (
                          <p className="text-sm">
                            <span className="font-medium">Note:</span>{" "}
                            {order.details.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>

                  {order.discountCodes && order.discountCodes.length > 0 && (
                    <div className="space-y-2">
                      <h3 className="font-semibold text-lg">
                        Reduceri Aplicate
                      </h3>
                      <div className="space-y-1">
                        {order.discountCodes.map((discount) => (
                          <p key={discount.code} className="text-sm">
                            {discount.code}:{" "}
                            {discount.type === "free_shipping"
                              ? "Transport Gratuit"
                              : discount.type === "percentage"
                              ? `${discount.value}% reducere`
                              : `${discount.value.toFixed(2)} RON reducere`}
                          </p>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="space-y-4">
                    <h3 className="font-semibold text-lg">Produse Comandate</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {order.items.map((item) => (
                        <div
                          key={item.id}
                          className="flex flex-col p-4 border rounded-lg"
                        >
                          <div className="flex items-start gap-4">
                            <Image
                              src={item.image}
                              alt={item.productName}
                              width={80}
                              height={80}
                              className="rounded-md object-cover"
                            />
                            <div className="flex-1">
                              <p className="font-medium">{item.productName}</p>
                              <p className="text-sm text-gray-600">
                                Mărime: {item.size}
                              </p>
                              <p className="text-sm text-gray-600">
                                {item.quantity} x{" "}
                                {item.price.toLocaleString("ro-RO", {
                                  style: "currency",
                                  currency: "RON",
                                })}
                              </p>
                              <p className="font-medium mt-1">
                                {(item.quantity * item.price).toLocaleString(
                                  "ro-RO",
                                  {
                                    style: "currency",
                                    currency: "RON",
                                  }
                                )}
                              </p>
                            </div>
                          </div>
                          {order.orderStatus === "Comanda finalizata!" && (
                            <Button
                              variant="outline"
                              className="w-full mt-4"
                              onClick={(e) => {
                                e.preventDefault();
                                setSelectedProduct({
                                  productId: item.productId,
                                  orderId: order.id,
                                  productName: item.productName,
                                });
                              }}
                            >
                              Lasă o recenzie
                            </Button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-end">
                    {order.invoiceUrl ? (
                      <Button
                        onClick={() =>
                          handleDownloadInvoice(order.id, order.invoiceUrl)
                        }
                        className="flex items-center gap-2"
                      >
                        <Download className="h-4 w-4" />
                        Descarcă Factura
                      </Button>
                    ) : (
                      <p className="text-sm text-gray-500 italic">
                        Factura va fi disponibilă în curând
                      </p>
                    )}
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ))}
      </div>
      {selectedProduct && (
        <ReviewModal
          isOpen={!!selectedProduct}
          onClose={() => setSelectedProduct(null)}
          productId={selectedProduct.productId}
          orderId={selectedProduct.orderId}
          productName={selectedProduct.productName}
        />
      )}
    </div>
  );
}
