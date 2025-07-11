"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Download } from "lucide-react";
import DPDTrackingDialog from "./DPDTrackingDialog";

type OrderItem = {
  id: string;
  productName: string;
  productId: string;
  quantity: number;
  size: string;
  price: number;
  image: string;
  carMake: string | null;
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
  dpdStatus?: string;
  dpdOperationCode?: string;
  paymentType: string;
  courier: string | null;
  awb: string | null;
  oblioInvoiceId?: string | null;
  oblioInvoiceNumber?: string | null;
  details: OrderDetails;
  discountCodes: {
    code: string;
    type: string;
    value: number;
  }[];
};

interface OrderCardProps {
  order: Order;
  onDelete: (id: string) => void;
  onFulfill: (id: string) => void;
  onDownloadInvoice: (id: string) => void;

  onCancel: (id: string) => void;
  onRefund: (id: string) => void;
}

function OrderCard({
  order,
  onDelete,
  onFulfill,
  onDownloadInvoice,
  onCancel,
  onRefund,
}: OrderCardProps) {
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRefundDialog, setShowRefundDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  return (
    <Card className="mb-4">
      <CardHeader>
        <div className="flex justify-between items-center">
          <CardTitle>Comanda {order.orderNumber}</CardTitle>
          <div className="flex gap-2">
            {order.courier === "DPD" && order.awb && (
              <DPDTrackingDialog awb={order.awb} />
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownloadInvoice(order.id)}
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFulfill(order.id)}
            >
              Finalizează
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCancelDialog(true)}
            >
              Anulează
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRefundDialog(true)}
            >
              Rambursare
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
            >
              Șterge
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible>
          <AccordionItem value="details">
            <AccordionTrigger>Detalii Comandă</AccordionTrigger>
            <AccordionContent>
              <div className="space-y-4">
                <div className="flex flex-col gap-2">
                  <p className="text-sm">
                    <span className="font-medium">Status Plată:</span>{" "}
                    {order.paymentStatus === "COMPLETED"
                      ? "Plătit"
                      : "În așteptare"}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Status Comandă:</span>{" "}
                    {order.courier === "DPD" && order.dpdStatus
                      ? `${order.dpdStatus}${
                          order.dpdOperationCode
                            ? ` (${order.dpdOperationCode})`
                            : ""
                        }`
                      : order.orderStatus}
                  </p>
                  <p className="text-sm">
                    <span className="font-medium">Tip Plată:</span>{" "}
                    {order.paymentType}
                  </p>
                  {order.courier && (
                    <p className="text-sm">
                      <span className="font-medium">Curier:</span>{" "}
                      {order.courier}
                    </p>
                  )}
                  {order.awb && (
                    <p className="text-sm">
                      <span className="font-medium">AWB:</span> {order.awb}
                    </p>
                  )}
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Detalii Client</h3>
                  <div className="space-y-1">
                    <p className="text-sm">
                      <span className="font-medium">Nume:</span>{" "}
                      {order.details.fullName}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Email:</span>{" "}
                      {order.details.email}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Telefon:</span>{" "}
                      {order.details.phoneNumber}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Adresă:</span>{" "}
                      {order.details.street} {order.details.streetNumber || ''}
                      {order.details.block && `, Bloc ${order.details.block}`}
                      {order.details.floor && `, Etaj ${order.details.floor}`}
                      {order.details.apartment && `, Ap ${order.details.apartment}`}
                      , {order.details.city}, {order.details.county}
                    </p>
                    <p className="text-sm">
                      <span className="font-medium">Cod Poștal:</span>{" "}
                      {order.details.postalCode}
                    </p>
                    {order.details.notes && (
                      <p className="text-sm">
                        <span className="font-medium">Note:</span>{" "}
                        {order.details.notes}
                      </p>
                    )}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">Produse</h3>
                  <div className="space-y-2">
                    {order.items.map((item) => (
                      <ProductCard key={item.id} item={item} />
                    ))}
                  </div>
                </div>
                {order.discountCodes.length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">Coduri de Reducere</h3>
                    <div className="space-y-1">
                      {order.discountCodes.map((discount, index) => (
                        <p key={index} className="text-sm">
                          <span className="font-medium">Cod:</span>{" "}
                          {discount.code} ({discount.value}
                          {discount.type === "percentage" ? "%" : " RON"})
                        </p>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <p className="text-lg font-semibold">
                    Total:{" "}
                    {order.total.toLocaleString("ro-RO", {
                      style: "currency",
                      currency: "RON",
                    })}
                  </p>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>

      {/* Dialog de confirmare pentru anulare */}
      <AlertDialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmă anularea comenzii</AlertDialogTitle>
            <AlertDialogDescription>
              Ești sigur că vrei să anulezi comanda #{order.id}? Această acțiune
              nu poate fi anulată.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Nu, renunță</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onCancel(order.id);
                setShowCancelDialog(false);
              }}
            >
              Da, anulează comanda
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmare pentru rambursare */}
      <AlertDialog open={showRefundDialog} onOpenChange={setShowRefundDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmă rambursarea comenzii</AlertDialogTitle>
            <AlertDialogDescription>
              Ești sigur că vrei să marchezi comanda #{order.id} ca rambursată?
              Această acțiune nu poate fi anulată.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Nu, renunță</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onRefund(order.id);
                setShowRefundDialog(false);
              }}
            >
              Da, marchează ca rambursată
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Dialog de confirmare pentru ștergere */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmă ștergerea comenzii</AlertDialogTitle>
            <AlertDialogDescription>
              Ești sigur că vrei să ștergi comanda #{order.id}? Această acțiune
              nu poate fi anulată.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Nu, renunță</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(order.id);
                setShowDeleteDialog(false);
              }}
            >
              Da, șterge comanda
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

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
            <p className="text-sm text-gray-600">Mărime: {item.size}</p>
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

export default function AdminOrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [orderFilter, setOrderFilter] = useState("nefinalizate");
  const [monthFilter, setMonthFilter] = useState<string>("toate");
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [showBulkActionDialog, setShowBulkActionDialog] = useState(false);
  const [bulkAction, setBulkAction] = useState<
    "delete" | "cancel" | "fulfill" | "refund" | null
  >(null);

  const filteredOrders = orders.filter((order) => {
    const searchTermLower = searchTerm.toLowerCase().trim();

    // Verificăm toate câmpurile relevante
    const matchesSearch =
      // Număr comandă și AWB
      order.orderNumber.toLowerCase().includes(searchTermLower) ||
      order.awb?.toLowerCase().includes(searchTermLower) ||
      false ||
      // Informații client
      order.details.fullName.toLowerCase().includes(searchTermLower) ||
      order.details.email.toLowerCase().includes(searchTermLower) ||
      order.details.phoneNumber.includes(searchTerm) ||
      order.details.street.toLowerCase().includes(searchTermLower) ||
      order.details.streetNumber?.toLowerCase().includes(searchTermLower) ||
      order.details.block?.toLowerCase().includes(searchTermLower) ||
      order.details.floor?.toLowerCase().includes(searchTermLower) ||
      order.details.apartment?.toLowerCase().includes(searchTermLower) ||
      order.details.city.toLowerCase().includes(searchTermLower) ||
      order.details.county.toLowerCase().includes(searchTermLower) ||
      order.details.postalCode.includes(searchTerm) ||
      order.details.notes?.toLowerCase().includes(searchTermLower) ||
      false ||
      // Status și tip plată
      order.paymentStatus.toLowerCase().includes(searchTermLower) ||
      order.orderStatus.toLowerCase().includes(searchTermLower) ||
      order.paymentType.toLowerCase().includes(searchTermLower) ||
      // Produse
      order.items.some(
        (item) =>
          item.productName.toLowerCase().includes(searchTermLower) ||
          item.size.toLowerCase().includes(searchTermLower)
      ) ||
      // Coduri de reducere
      order.discountCodes.some((discount) =>
        discount.code.toLowerCase().includes(searchTermLower)
      );

    // Funcție helper pentru a verifica statusul comenzii
    const isOrderStatus = (order: Order, statuses: string[]) => {
      const normalizedOrderStatus = order.orderStatus
        .toLowerCase()
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "");
      return statuses.some(
        (status) =>
          status
            .toLowerCase()
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "") === normalizedOrderStatus
      );
    };

    // Funcție helper pentru a verifica luna comenzii
    const matchesMonthFilter = (order: Order) => {
      if (monthFilter === "toate") return true;
      
      const orderDate = new Date(order.createdAt);
      const currentDate = new Date();
      const currentYear = currentDate.getFullYear();
      const currentMonth = currentDate.getMonth();
      
      switch (monthFilter) {
        case "luna_curenta":
          return orderDate.getFullYear() === currentYear && 
                 orderDate.getMonth() === currentMonth;
        case "luna_trecuta":
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          return orderDate.getFullYear() === lastMonthYear && 
                 orderDate.getMonth() === lastMonth;
        case "ultimele_3_luni":
          const threeMonthsAgo = new Date(currentDate);
          threeMonthsAgo.setMonth(currentMonth - 3);
          return orderDate >= threeMonthsAgo;
        case "ultimele_6_luni":
          const sixMonthsAgo = new Date(currentDate);
          sixMonthsAgo.setMonth(currentMonth - 6);
          return orderDate >= sixMonthsAgo;
        case "anul_curent":
          return orderDate.getFullYear() === currentYear;
        case "anul_trecut":
          return orderDate.getFullYear() === currentYear - 1;
        default:
          return true;
      }
    };

    // Aplicăm filtrele în funcție de selecție
    const matchesOrderFilter = (() => {
    switch (orderFilter) {
      case "nefinalizate":
        return (
          order.orderStatus !== "Comanda finalizata!" &&
          order.orderStatus !== "Comanda anulata" &&
          order.orderStatus !== "Comandă anulată" &&
          order.orderStatus !== "Comanda rambursata" &&
          order.orderStatus !== "Comandă rambursată"
        );
      case "card":
          return order.paymentType === "card";
      case "ramburs":
          return order.paymentType === "ramburs";
      case "completate":
          return isOrderStatus(order, ["Comanda finalizata!", "Comanda finalizată!"]);
      case "anulate":
          return isOrderStatus(order, ["Comanda anulata", "Comandă anulată"]);
      case "rambursate":
          return isOrderStatus(order, ["Comanda rambursata", "Comandă rambursată"]);
      case "toate":
          return true;
      default:
          return true;
    }
    })();

    return matchesSearch && matchesOrderFilter && matchesMonthFilter(order);
  });

  // Calculăm statisticile pentru comenzile filtrate
  const stats = {
    totalOrders: filteredOrders.length,
    totalRevenue: filteredOrders.reduce((sum, order) => sum + order.total, 0),
    totalProducts: filteredOrders.reduce(
      (sum, order) =>
        sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    ),
    averageOrderValue:
      filteredOrders.length > 0
        ? filteredOrders.reduce((sum, order) => sum + order.total, 0) /
          filteredOrders.length
        : 0,
  };

  // Funcție pentru a obține titlul statisticilor bazat pe filtrul curent
  const getStatsTitle = () => {
    let baseTitle = "";
    switch (orderFilter) {
      case "nefinalizate":
        baseTitle = "Comenzi Nefinalizate";
        break;
      case "card":
        baseTitle = "Comenzi cu Plata Card";
        break;
      case "ramburs":
        baseTitle = "Comenzi cu Plata Ramburs";
        break;
      case "completate":
        baseTitle = "Comenzi Completate";
        break;
      case "anulate":
        baseTitle = "Comenzi Anulate";
        break;
      case "rambursate":
        baseTitle = "Comenzi Rambursate";
        break;
      case "toate":
        baseTitle = "Toate Comenzile";
        break;
      default:
        baseTitle = "Toate Comenzile";
    }

    // Adăugăm informația despre perioada selectată
    let periodInfo = "";
    switch (monthFilter) {
      case "luna_curenta":
        periodInfo = " (Luna curentă)";
        break;
      case "luna_trecuta":
        periodInfo = " (Luna trecută)";
        break;
      case "ultimele_3_luni":
        periodInfo = " (Ultimele 3 luni)";
        break;
      case "ultimele_6_luni":
        periodInfo = " (Ultimele 6 luni)";
        break;
      case "anul_curent":
        periodInfo = " (Anul curent)";
        break;
      case "anul_trecut":
        periodInfo = " (Anul trecut)";
        break;
      default:
        periodInfo = "";
    }

    return baseTitle + periodInfo;
  };

  // Funcție pentru a selecta/deselecta toate comenzile filtrate
  const toggleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map((order) => order.id));
    }
  };

  // Funcție pentru a gestiona selecția individuală
  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  // Funcție pentru a executa acțiunea în bulk
  const executeBulkAction = async () => {
    if (!bulkAction || selectedOrders.length === 0) return;

    try {
      const actionMap = {
        delete: handleDeleteOrder,
        cancel: handleCancelOrder,
        fulfill: handleFulfillOrder,
        refund: handleRefundOrder,
      };

      const action = actionMap[bulkAction];

      // Executăm acțiunea pentru fiecare comandă selectată
      await Promise.all(selectedOrders.map((orderId) => action(orderId)));

      // Resetăm selecția și închidem dialogul
      setSelectedOrders([]);
      setShowBulkActionDialog(false);
      setBulkAction(null);

      // Reîmprospătăm lista de comenzi
      await fetchOrders();

      toast({
        title: "Succes!",
        description: `Acțiunea a fost executată cu succes pentru ${selectedOrders.length} comenzi.`,
      });
    } catch (error) {
      console.error("Error executing bulk action:", error);
      toast({
        title: "Eroare",
        description: "A apărut o eroare la executarea acțiunii în bulk.",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/orders");
      if (!response.ok) {
        throw new Error("Failed to fetch orders");
      }
      const data = await response.json();

      // Fetch DPD status for each order with DPD courier and AWB
      const ordersWithDPDStatus = await Promise.all(
        data.map(async (order: Order) => {
          if (order.courier === "DPD" && order.awb) {
            try {
              const response = await fetch("/api/admin/dpd/track", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                body: JSON.stringify({
                  parcelIds: [order.awb],
                }),
              });

              if (!response.ok) {
                throw new Error("Failed to fetch tracking info");
              }

              const trackingData = await response.json();
              if (trackingData.parcels?.[0]?.operations?.length > 0) {
                const operations = trackingData.parcels[0].operations;
                return {
                  ...order,
                  dpdStatus: operations[operations.length - 1].description,
                };
              }
            } catch (error) {
              console.error("Error fetching DPD status:", error);
            }
          }
          return order;
        })
      );

      setOrders(ordersWithDPDStatus);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleFulfillOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/fulfill`, {
        method: "POST",
      });
      if (!response.ok) {
        throw new Error("Failed to update order status");
      }
      const updatedOrder = await response.json();
      setOrders(
        orders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                orderStatus: updatedOrder.orderStatus,
                paymentStatus: updatedOrder.paymentStatus,
              }
            : order
        )
      );
      toast({
        title: "Success",
        description:
          updatedOrder.orderStatus === "Comanda finalizata!"
            ? "Order marked as fulfilled."
            : "Order unfulfilled.",
      });
    } catch (error) {
      console.error("Error updating order status:", error);
      toast({
        title: "Error",
        description: "Failed to update order status. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "DELETE",
      });
      if (!response.ok) {
        throw new Error("Failed to delete order");
      }
      setOrders(orders.filter((order) => order.id !== orderId));
      toast({
        title: "Success",
        description: "Order deleted successfully.",
      });
    } catch (error) {
      console.error("Error deleting order:", error);
      toast({
        title: "Error",
        description: "Failed to delete order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDownloadInvoice = async (orderId: string) => {
    try {
      console.log("=== ÎNCEPERE DESCĂRCARE FACTURĂ ===");
      console.log("Order ID:", orderId);
      
      // Verificăm dacă există factură
      const order = orders.find(o => o.id === orderId);
      console.log("Order găsit:", order);
      console.log("OblioInvoiceId:", order?.oblioInvoiceId);
      
      if (!order?.oblioInvoiceId) {
        console.log("Nu există factură pentru această comandă");
        toast({
          title: "Eroare",
          description: "Nu există factură pentru această comandă. Vă rugăm să contactați suportul.",
          variant: "destructive",
        });
        return;
      }

      console.log("Apelăm API-ul pentru descărcare...");
      // Descărcăm factura din Oblio
      const response = await fetch("/api/orders/" + orderId + "/invoice", {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log("Răspuns API:", response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Eroare API:", errorData);
        throw new Error(errorData.error || "Nu am putut descărca factura");
      }

      console.log("Descărcăm blob-ul...");
      // Descărcăm PDF-ul
      const blob = await response.blob();
      console.log("Blob descărcat:", blob.size, "bytes");
      
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `factura-${order.orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      console.log("Factura descărcată cu succes!");
      console.log("=== FINALIZARE DESCĂRCARE FACTURĂ ===");
    } catch (error) {
      console.error("=== EROARE LA DESCĂRCAREA FACTURII ===");
      console.error("Error downloading invoice:", error);
      console.error("=== SFÂRȘIT EROARE ===");
      toast({
        title: "Eroare",
        description:
          "Nu am putut descărca factura. Vă rugăm să încercați din nou.",
        variant: "destructive",
      });
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "Comandă anulată" }),
      });

      if (!response.ok) {
        throw new Error("Failed to cancel order");
      }

      setOrders(
        orders.map((order) =>
          order.id === orderId
            ? { ...order, orderStatus: "Comandă anulată" }
            : order
        )
      );
      toast({
        title: "Succes",
        description: "Comanda a fost anulată.",
      });
    } catch (error) {
      console.error("Error canceling order:", error);
      toast({
        title: "Eroare",
        description:
          "Nu s-a putut anula comanda. Vă rugăm să încercați din nou.",
        variant: "destructive",
      });
    }
  };

  const handleRefundOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: "Comandă rambursată" }),
      });

      if (!response.ok) {
        throw new Error("Failed to refund order");
      }

      setOrders(
        orders.map((order) =>
          order.id === orderId
            ? { ...order, orderStatus: "Comandă rambursată" }
            : order
        )
      );
      toast({
        title: "Succes",
        description: "Comanda a fost marcată ca rambursată.",
      });
    } catch (error) {
      console.error("Error refunding order:", error);
      toast({
        title: "Eroare",
        description:
          "Nu s-a putut marca comanda ca rambursată. Vă rugăm să încercați din nou.",
        variant: "destructive",
      });
    }
  };



  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex-1">
          <Input
            placeholder="Caută după ID, nume, email sau telefon..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        <div className="w-full md:w-48">
          <Select value={orderFilter} onValueChange={setOrderFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrează comenzile" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="toate">Toate Comenzile</SelectItem>
              <SelectItem value="nefinalizate">Nefinalizate</SelectItem>
              <SelectItem value="card">Plătite cu cardul</SelectItem>
              <SelectItem value="ramburs">Plată ramburs</SelectItem>
              <SelectItem value="completate">Completate</SelectItem>
              <SelectItem value="anulate">Anulate</SelectItem>
              <SelectItem value="rambursate">Rambursate</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-48">
          <Select value={monthFilter} onValueChange={setMonthFilter}>
            <SelectTrigger>
              <SelectValue placeholder="Filtrează după perioadă" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="toate">Toate perioadele</SelectItem>
              <SelectItem value="luna_curenta">Luna curentă</SelectItem>
              <SelectItem value="luna_trecuta">Luna trecută</SelectItem>
              <SelectItem value="ultimele_3_luni">Ultimele 3 luni</SelectItem>
              <SelectItem value="ultimele_6_luni">Ultimele 6 luni</SelectItem>
              <SelectItem value="anul_curent">Anul curent</SelectItem>
              <SelectItem value="anul_trecut">Anul trecut</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Statistici */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              {getStatsTitle()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalOrders}</div>
            <p className="text-xs text-muted-foreground">
              {stats.totalOrders === 1 ? "comandă" : "comenzi"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Venit Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalRevenue.toLocaleString("ro-RO", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              RON
            </div>
            <p className="text-xs text-muted-foreground">
              din {stats.totalProducts} produse
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Valoare Medie Comandă
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageOrderValue.toLocaleString("ro-RO", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}{" "}
              RON
            </div>
            <p className="text-xs text-muted-foreground">per comandă</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Produse per Comandă
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.totalOrders > 0
                ? (stats.totalProducts / stats.totalOrders).toLocaleString(
                    "ro-RO",
                    {
                      minimumFractionDigits: 1,
                      maximumFractionDigits: 1,
                    }
                  )
                : "0"}
            </div>
            <p className="text-xs text-muted-foreground">
              media produse/comandă
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Bara de acțiuni pentru comenzile selectate */}
      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg">
        <div className="flex items-center gap-4">
          <Checkbox
            id="select-all"
            checked={
              selectedOrders.length === filteredOrders.length &&
              filteredOrders.length > 0
            }
            onCheckedChange={toggleSelectAll}
          />
          <Label htmlFor="select-all">
            {selectedOrders.length === 0
              ? "Selectează toate comenzile"
              : `${selectedOrders.length} comenzi selectate`}
          </Label>
        </div>
        {selectedOrders.length > 0 && (
          <Select
            value=""
            onValueChange={(value) => {
              setBulkAction(value as any);
              setShowBulkActionDialog(true);
            }}
          >
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Acțiuni în bulk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fulfill">Finalizează Comenzile</SelectItem>
              <SelectItem value="cancel">Anulează Comenzile</SelectItem>
              <SelectItem value="refund">Rambursează Comenzile</SelectItem>
              <SelectItem value="delete">Șterge Comenzile</SelectItem>
            </SelectContent>
          </Select>
        )}
      </div>

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-gray-600">Se încarcă comenzile...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">Nu există comenzi</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-600">
            Nu s-au găsit comenzi care să corespundă criteriilor
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => (
            <div key={order.id} className="flex items-start gap-4">
              <div className="pt-4 pl-4">
                <Checkbox
                  checked={selectedOrders.includes(order.id)}
                  onCheckedChange={() => toggleOrderSelection(order.id)}
                />
              </div>
              <div className="flex-1">
                <OrderCard
                  key={order.id}
                  order={order}
                  onDelete={handleDeleteOrder}
                  onFulfill={handleFulfillOrder}
                  onDownloadInvoice={handleDownloadInvoice}
                  onCancel={handleCancelOrder}
                  onRefund={handleRefundOrder}
                />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog de confirmare pentru acțiuni în bulk */}
      <AlertDialog
        open={showBulkActionDialog}
        onOpenChange={setShowBulkActionDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmare acțiune în bulk</AlertDialogTitle>
            <AlertDialogDescription>
              Ești sigur că vrei să{" "}
              {bulkAction === "delete"
                ? "ștergi"
                : bulkAction === "cancel"
                ? "anulezi"
                : bulkAction === "fulfill"
                ? "finalizezi"
                : bulkAction === "refund"
                ? "rambursezi"
                : ""}{" "}
              {selectedOrders.length} comenzi? Această acțiune nu poate fi
              anulată.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowBulkActionDialog(false);
                setBulkAction(null);
              }}
            >
              Anulează
            </AlertDialogCancel>
            <AlertDialogAction onClick={executeBulkAction}>
              Confirmă
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
