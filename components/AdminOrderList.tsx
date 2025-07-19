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
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <CardTitle>Comanda {order.orderNumber}</CardTitle>
          <div className="flex flex-wrap gap-2 w-full sm:w-auto">
            {order.awb && (
              <>
                {order.courier === "DPD" ? (
                  <DPDTrackingDialog awb={order.awb} />
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 sm:flex-none"
                    disabled
                  >
                    AWB: {order.awb}
                  </Button>
                )}
              </>
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => onDownloadInvoice(order.id)}
              className="flex-1 sm:flex-none"
            >
              <Download className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => onFulfill(order.id)}
              className="flex-1 sm:flex-none"
            >
              Finalizează
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowCancelDialog(true)}
              className="flex-1 sm:flex-none"
            >
              Anulează
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowRefundDialog(true)}
              className="flex-1 sm:flex-none"
            >
              Rambursare
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setShowDeleteDialog(true)}
              className="flex-1 sm:flex-none"
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
                      {order.details.street} {order.details.streetNumber || ""}
                      {order.details.block && `, Bloc ${order.details.block}`}
                      {order.details.floor && `, Etaj ${order.details.floor}`}
                      {order.details.apartment &&
                        `, Ap ${order.details.apartment}`}
                      ,{" "}
                      {order.details.locationType === "village" &&
                      order.details.commune
                        ? `${order.details.city}, ${order.details.commune}, ${order.details.county}`
                        : `${order.details.city}, ${order.details.county}`}
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

type BulkAction = "delete" | "cancel" | "fulfill" | "refund" | null;

export default function AdminOrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [bulkAction, setBulkAction] = useState<BulkAction>(null);
  const [timeFilter, setTimeFilter] = useState<string>("all");
  const [useYearMonthFilter, setUseYearMonthFilter] = useState(false);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const [showBulkActionDialog, setShowBulkActionDialog] = useState(false);
  const [orderFilter, setOrderFilter] = useState("nefinalizate");
  const [monthFilter, setMonthFilter] = useState("toate");

  const years = Array.from(
    { length: 5 },
    (_, i) => new Date().getFullYear() - i
  );
  const months = [
    { value: "1", label: "Ianuarie" },
    { value: "2", label: "Februarie" },
    { value: "3", label: "Martie" },
    { value: "4", label: "Aprilie" },
    { value: "5", label: "Mai" },
    { value: "6", label: "Iunie" },
    { value: "7", label: "Iulie" },
    { value: "8", label: "August" },
    { value: "9", label: "Septembrie" },
    { value: "10", label: "Octombrie" },
    { value: "11", label: "Noiembrie" },
    { value: "12", label: "Decembrie" },
  ];

  useEffect(() => {
    fetchOrders();
  }, [timeFilter, useYearMonthFilter, selectedYear, selectedMonth]);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      let url = "/api/admin/orders";

      if (useYearMonthFilter && selectedYear && selectedMonth) {
        url += `?year=${selectedYear}&month=${selectedMonth}`;
      }

      const response = await fetch(url);
      if (!response.ok) throw new Error("Failed to fetch orders");
      let data = await response.json();

      // Aplicăm filtrul de timp doar dacă nu folosim filtrul an/lună
      if (!useYearMonthFilter && timeFilter !== "all") {
        const now = new Date();
        const filterDate = new Date();

        switch (timeFilter) {
          case "today":
            filterDate.setHours(0, 0, 0, 0);
            break;
          case "week":
            filterDate.setDate(now.getDate() - 7);
            break;
          case "month":
            filterDate.setMonth(now.getMonth() - 1);
            break;
        }

        data = data.filter((order: Order) => {
          const orderDate = new Date(order.createdAt);
          return orderDate >= filterDate;
        });
      }

      setOrders(data);
      setFilteredOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
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
      const order = orders.find((o) => o.id === orderId);
      console.log("Order găsit:", order);
      console.log("OblioInvoiceId:", order?.oblioInvoiceId);

      if (!order?.oblioInvoiceId) {
        console.log("Nu există factură pentru această comandă");
        toast({
          title: "Eroare",
          description:
            "Nu există factură pentru această comandă. Vă rugăm să contactați suportul.",
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

  const handleBulkActionChange = (value: string) => {
    setBulkAction(value as BulkAction);
    setShowBulkActionDialog(true);
  };

  const applyFilters = (orders: Order[]) => {
    return orders.filter((order) => {
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
            return isOrderStatus(order, [
              "Comanda finalizata!",
              "Comanda finalizată!",
            ]);
          case "anulate":
            return isOrderStatus(order, ["Comanda anulata", "Comandă anulată"]);
          case "rambursate":
            return isOrderStatus(order, [
              "Comanda rambursata",
              "Comandă rambursată",
            ]);
          case "toate":
            return true;
          default:
            return true;
        }
      })();

      // Funcție helper pentru a verifica luna comenzii
      const matchesMonthFilter = (() => {
        if (monthFilter === "toate") return true;

        const orderDate = new Date(order.createdAt);
        const currentDate = new Date();
        const currentYear = currentDate.getFullYear();
        const currentMonth = currentDate.getMonth();

        switch (monthFilter) {
          case "luna_curenta":
            return (
              orderDate.getFullYear() === currentYear &&
              orderDate.getMonth() === currentMonth
            );
          case "luna_trecuta":
            const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
            const lastMonthYear =
              currentMonth === 0 ? currentYear - 1 : currentYear;
            return (
              orderDate.getFullYear() === lastMonthYear &&
              orderDate.getMonth() === lastMonth
            );
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
      })();

      return (
        matchesOrderFilter && (!useYearMonthFilter ? matchesMonthFilter : true)
      );
    });
  };

  useEffect(() => {
    if (orders.length > 0) {
      setFilteredOrders(applyFilters(orders));
    }
  }, [orders, orderFilter, monthFilter]);

  const toggleSelectAll = () => {
    if (selectedOrders.length === filteredOrders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(filteredOrders.map((order) => order.id));
    }
  };

  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId)
        ? prev.filter((id) => id !== orderId)
        : [...prev, orderId]
    );
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <Checkbox
                id="useYearMonthFilter"
                checked={useYearMonthFilter}
                onCheckedChange={(checked) => {
                  setUseYearMonthFilter(checked as boolean);
                  if (checked) {
                    setMonthFilter("toate");
                    if (!selectedYear) setSelectedYear(years[0].toString());
                    if (!selectedMonth)
                      setSelectedMonth(new Date().getMonth() + 1 + "");
                  }
                }}
              />
              <Label htmlFor="useYearMonthFilter">
                Filtrare după an și lună
              </Label>
            </div>

            {useYearMonthFilter ? (
              <div className="flex gap-2">
                <Select
                  value={selectedYear}
                  onValueChange={setSelectedYear}
                  disabled={!useYearMonthFilter}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Selectează anul" />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((year) => (
                      <SelectItem key={year} value={year.toString()}>
                        {year}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select
                  value={selectedMonth}
                  onValueChange={setSelectedMonth}
                  disabled={!useYearMonthFilter || !selectedYear}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Selectează luna" />
                  </SelectTrigger>
                  <SelectContent>
                    {months.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <Select
                value={monthFilter}
                onValueChange={setMonthFilter}
                disabled={useYearMonthFilter}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filtrează după perioadă" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="toate">Toate perioadele</SelectItem>
                  <SelectItem value="luna_curenta">Luna curentă</SelectItem>
                  <SelectItem value="luna_trecuta">Luna trecută</SelectItem>
                  <SelectItem value="ultimele_3_luni">
                    Ultimele 3 luni
                  </SelectItem>
                  <SelectItem value="ultimele_6_luni">
                    Ultimele 6 luni
                  </SelectItem>
                  <SelectItem value="anul_curent">Anul curent</SelectItem>
                  <SelectItem value="anul_trecut">Anul trecut</SelectItem>
                </SelectContent>
              </Select>
            )}
          </div>

          <Select value={orderFilter} onValueChange={setOrderFilter}>
            <SelectTrigger className="w-[180px]">
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

        <div className="flex gap-2">
          <Select
            value={bulkAction || ""}
            onValueChange={handleBulkActionChange}
            disabled={selectedOrders.length === 0}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Acțiune în bulk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fulfill">Finalizează</SelectItem>
              <SelectItem value="cancel">Anulează</SelectItem>
              <SelectItem value="refund">Rambursare</SelectItem>
              <SelectItem value="delete">Șterge</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={executeBulkAction}
            disabled={!bulkAction || selectedOrders.length === 0}
          >
            Aplică
          </Button>
        </div>
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
      </div>

      {/* Stats Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Comenzi</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{filteredOrders.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Venit Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("ro-RO", {
                style: "currency",
                currency: "RON",
              }).format(
                filteredOrders.reduce((sum, order) => sum + order.total, 0)
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">Total Produse</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredOrders.reduce(
                (sum, order) =>
                  sum +
                  order.items.reduce(
                    (itemSum, item) => itemSum + item.quantity,
                    0
                  ),
                0
              )}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-medium">
              Valoare Medie Comandă
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {new Intl.NumberFormat("ro-RO", {
                style: "currency",
                currency: "RON",
              }).format(
                filteredOrders.length > 0
                  ? filteredOrders.reduce(
                      (sum, order) => sum + order.total,
                      0
                    ) / filteredOrders.length
                  : 0
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders List */}
      {isLoading ? (
        <div className="text-center py-8">Se încarcă comenzile...</div>
      ) : filteredOrders.length > 0 ? (
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
      ) : (
        <div className="text-center py-8 text-gray-500">
          Nu s-au găsit comenzi pentru perioada selectată
        </div>
      )}

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
