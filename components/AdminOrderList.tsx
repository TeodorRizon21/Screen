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
  city: string;
  county: string;
  postalCode: string;
  country: string;
  notes?: string;
};

type Order = {
  id: string;
  createdAt: string;
  total: number;
  items: OrderItem[];
  paymentStatus: string;
  orderStatus: string;
  paymentType: string;
  courier: string | null;
  awb: string | null;
  details: OrderDetails;
  discountCodes: {
    code: string;
    type: string;
    value: number;
  }[];
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
              ${item.price.toFixed(2)} x {item.quantity}
            </p>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function AdminOrderList() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [deleteOrderId, setDeleteOrderId] = useState<string | null>(null);
  const [editingOrder, setEditingOrder] = useState<string | null>(null);
  const [courier, setCourier] = useState<string>("");
  const [awb, setAwb] = useState<string>("");

  // Filtrare locală
  const [search, setSearch] = useState("");
  const [year, setYear] = useState<string>("all");
  const [month, setMonth] = useState<string>("all");
  const [selectedCounty, setSelectedCounty] = useState<string>("all");
  const [selectedMake, setSelectedMake] = useState<string>("all");
  const [showCompletedPayments, setShowCompletedPayments] = useState(false);
  const [showFulfilledOrders, setShowFulfilledOrders] = useState(false);
  const [showOnlyFulfilledOrders, setShowOnlyFulfilledOrders] = useState(false);

  // Extragem anii și lunile disponibile din comenzi
  const years = Array.from(
    new Set(orders.map((o) => new Date(o.createdAt).getFullYear().toString()))
  ).sort((a, b) => b.localeCompare(a));
  const months =
    year && year !== "all"
      ? Array.from(
          new Set(
            orders
              .filter(
                (o) => new Date(o.createdAt).getFullYear().toString() === year
              )
              .map((o) =>
                (new Date(o.createdAt).getMonth() + 1)
                  .toString()
                  .padStart(2, "0")
              )
          )
        )
      : [];

  // Extragem județele și mărcile de mașini unice
  const counties = Array.from(
    new Set(orders.map((o) => o.details.county))
  ).sort();

  const carMakes = Array.from(
    new Set(
      orders.flatMap((o) =>
        o.items
          .map((item) => item.carMake)
          .filter((make): make is string => make !== null)
      )
    )
  ).sort();

  // Filtrare efectivă
  const filteredOrders = orders.filter((order) => {
    // Filtru an
    if (
      year &&
      year !== "all" &&
      new Date(order.createdAt).getFullYear().toString() !== year
    )
      return false;
    // Filtru lună
    if (
      month &&
      month !== "all" &&
      (new Date(order.createdAt).getMonth() + 1).toString().padStart(2, "0") !==
        month
    )
      return false;
    // Filtru județ
    if (
      selectedCounty &&
      selectedCounty !== "all" &&
      order.details.county !== selectedCounty
    )
      return false;
    // Filtru marcă mașină
    if (selectedMake && selectedMake !== "all") {
      const hasSelectedMake = order.items.some(
        (item) => item.carMake === selectedMake
      );
      if (!hasSelectedMake) return false;
    }
    // Filtru plăți completate
    if (showCompletedPayments && order.paymentStatus !== "COMPLETED")
      return false;
    // Filtru comenzi îndeplinite
    if (!showFulfilledOrders && order.orderStatus === "Comanda finalizata!")
      return false;
    // Filtru doar comenzi finalizate
    if (showOnlyFulfilledOrders && order.orderStatus !== "Comanda finalizata!")
      return false;
    // Filtru search (user, produs, orice detaliu)
    const searchLower = search.toLowerCase();
    const details = [
      order.details.fullName,
      order.details.email,
      order.details.phoneNumber,
      order.details.street,
      order.details.city,
      order.details.county,
      order.details.postalCode,
      order.details.country,
      order.details.notes,
      ...order.items.map((i) => i.productName),
    ]
      .join(" ")
      .toLowerCase();
    return (
      details.includes(searchLower) ||
      order.id.toLowerCase().includes(searchLower)
    );
  });

  // Calculăm sumarul pentru comenzile filtrate
  const filteredSummary = {
    totalOrders: filteredOrders.length,
    totalRevenue: filteredOrders.reduce((sum, order) => sum + order.total, 0),
    totalProducts: filteredOrders.reduce(
      (sum, order) =>
        sum + order.items.reduce((itemSum, item) => itemSum + item.quantity, 0),
      0
    ),
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await fetch("/api/admin/orders");
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setOrders(data);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to fetch orders. Please try again later.",
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
    } finally {
      setDeleteOrderId(null);
    }
  };

  const handleDownloadInvoice = async (orderId: string) => {
    try {
      const response = await fetch(`/api/orders/${orderId}/invoice`);
      if (!response.ok) {
        throw new Error("Nu am putut descărca factura");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `factura-${orderId}.pdf`;
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

  const handleUpdateOrder = async (orderId: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          courier,
          awb,
          orderStatus: "Comanda se indreapta catre tine!",
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order");
      }

      setOrders(
        orders.map((order) =>
          order.id === orderId
            ? {
                ...order,
                courier,
                awb,
                orderStatus: "Comanda se indreapta catre tine!",
              }
            : order
        )
      );
      setEditingOrder(null);
      toast({
        title: "Success",
        description: "Order updated successfully.",
      });
    } catch (error) {
      console.error("Error updating order:", error);
      toast({
        title: "Error",
        description: "Failed to update order. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    try {
      const response = await fetch(`/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        throw new Error("Failed to update order status");
      }

      setOrders(
        orders.map((order) =>
          order.id === orderId ? { ...order, orderStatus: newStatus } : order
        )
      );
      toast({
        title: "Success",
        description: "Order status updated successfully.",
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

  if (isLoading) {
    return <div>Loading orders...</div>;
  }

  return (
    <>
      {/* Bara de căutare și filtre */}
      <div className="flex flex-col gap-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <Input
            placeholder="Caută după nume, email, produs..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full md:w-72"
          />
          <Select value={year} onValueChange={setYear}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="An" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toți anii</SelectItem>
              {years.map((y) => (
                <SelectItem key={y} value={y}>
                  {y}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select
            value={month}
            onValueChange={setMonth}
            disabled={!year || year === "all"}
          >
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Lună" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate lunile</SelectItem>
              {months.map((m) => (
                <SelectItem key={m} value={m}>
                  {new Date(2000, parseInt(m) - 1).toLocaleString("ro-RO", {
                    month: "long",
                  })}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedCounty} onValueChange={setSelectedCounty}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Județ" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate județele</SelectItem>
              {counties.map((county) => (
                <SelectItem key={county} value={county}>
                  {county}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={selectedMake} onValueChange={setSelectedMake}>
            <SelectTrigger className="w-32">
              <SelectValue placeholder="Mărci" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toate mărcile</SelectItem>
              {carMakes.map((make) => (
                <SelectItem key={make} value={make}>
                  {make}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex flex-wrap gap-4">
          <div className="flex items-center space-x-2">
            <Checkbox
              id="completedPayments"
              checked={showCompletedPayments}
              onCheckedChange={(checked) =>
                setShowCompletedPayments(checked as boolean)
              }
            />
            <Label htmlFor="completedPayments">
              Arată doar plățile completate
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="fulfilledOrders"
              checked={showFulfilledOrders}
              onCheckedChange={(checked) =>
                setShowFulfilledOrders(checked as boolean)
              }
            />
            <Label htmlFor="fulfilledOrders">
              Arată și comenzile finalizate
            </Label>
          </div>
          <div className="flex items-center space-x-2">
            <Checkbox
              id="onlyFulfilledOrders"
              checked={showOnlyFulfilledOrders}
              onCheckedChange={(checked) => {
                setShowOnlyFulfilledOrders(checked as boolean);
                if (checked) {
                  setShowFulfilledOrders(true);
                }
              }}
            />
            <Label htmlFor="onlyFulfilledOrders">
              Arată doar comenzile finalizate
            </Label>
          </div>
        </div>
      </div>

      {/* Sumar pentru comenzile filtrate */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">
              Comenzi Filtrare
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredSummary.totalOrders}
            </div>
            <p className="text-xs text-muted-foreground">
              {filteredSummary.totalOrders === 1 ? "comandă" : "comenzi"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Venit Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {filteredSummary.totalRevenue.toFixed(2)} RON
            </div>
            <p className="text-xs text-muted-foreground">
              din {filteredSummary.totalProducts} produse
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
              {filteredSummary.totalOrders > 0
                ? (
                    filteredSummary.totalRevenue / filteredSummary.totalOrders
                  ).toFixed(2)
                : "0.00"}{" "}
              RON
            </div>
            <p className="text-xs text-muted-foreground">per comandă</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de comenzi filtrată */}
      <div className="space-y-8">
        {filteredOrders.map((order) => (
          <Accordion type="single" collapsible key={order.id}>
            <AccordionItem value={order.id}>
              <AccordionTrigger>
                <div className="flex flex-col items-start w-full">
                  <div className="flex justify-between items-center w-full mb-4">
                    <span className="font-semibold">Order #{order.id}</span>
                    <div className="flex items-center gap-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadInvoice(order.id);
                        }}
                      >
                        <Download className="w-4 h-4 mr-2" />
                        Descarcă Factura
                      </Button>
                      <span className="text-sm text-gray-500">
                        {new Date(order.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-4">
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center space-x-2"
                      >
                        <Image
                          src={item.image}
                          alt={item.productName}
                          width={40}
                          height={40}
                          className="rounded-md"
                        />
                        <div>
                          <p className="text-sm font-medium">
                            {item.productName}
                          </p>
                          <p className="text-xs text-gray-500">
                            ${item.price.toFixed(2)} x {item.quantity}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-2 font-semibold">
                    Total: ${order.total.toFixed(2)}
                  </p>
                </div>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold">Order Status</h3>
                    <p>Payment Status: {order.paymentStatus}</p>
                    <p>Order Status: {order.orderStatus}</p>
                    <p>
                      Payment Method:{" "}
                      {order.paymentType === "card"
                        ? "Card"
                        : "Ramburs la curier"}
                    </p>
                    {order.courier && <p>Courier: {order.courier}</p>}
                    {order.awb && <p>AWB: {order.awb}</p>}
                  </div>
                  <div>
                    <h3 className="font-semibold">Customer Details</h3>
                    <p>{order.details.fullName}</p>
                    <p>{order.details.email}</p>
                    <p>{order.details.phoneNumber}</p>
                    <p>{order.details.street}</p>
                    <p>
                      {order.details.city}, {order.details.county}{" "}
                      {order.details.postalCode}
                    </p>
                    <p>{order.details.country}</p>
                    {order.details.notes && <p>Notes: {order.details.notes}</p>}
                  </div>
                  {order.discountCodes && order.discountCodes.length > 0 && (
                    <div>
                      <h3 className="font-semibold">Applied Discounts</h3>
                      {order.discountCodes.map((discount) => (
                        <p key={discount.code}>
                          {discount.code}:{" "}
                          {discount.type === "free_shipping"
                            ? "Free Shipping"
                            : discount.type === "percentage"
                            ? `${discount.value}% off`
                            : `$${discount.value.toFixed(2)} off`}
                        </p>
                      ))}
                    </div>
                  )}
                  <div>
                    <h3 className="font-semibold">Order Items</h3>
                    <div className="space-y-4">
                      {order.items.map((item) => (
                        <ProductCard key={item.id} item={item} />
                      ))}
                    </div>
                  </div>
                  <div className="space-y-2">
                    {editingOrder === order.id ? (
                      <>
                        <Input
                          placeholder="Courier"
                          value={courier}
                          onChange={(e) => setCourier(e.target.value)}
                          className="w-full"
                        />
                        <Input
                          placeholder="AWB"
                          value={awb}
                          onChange={(e) => setAwb(e.target.value)}
                          className="w-full"
                        />
                        <Button onClick={() => handleUpdateOrder(order.id)}>
                          Update
                        </Button>
                        <Button
                          onClick={() => setEditingOrder(null)}
                          variant="outline"
                        >
                          Cancel
                        </Button>
                      </>
                    ) : (
                      <Button onClick={() => setEditingOrder(order.id)}>
                        Edit Courier & AWB
                      </Button>
                    )}
                    <select
                      value={order.orderStatus}
                      onChange={(e) =>
                        handleStatusChange(order.id, e.target.value)
                      }
                      className="p-2 border rounded w-full"
                    >
                      <option value="Comanda este in curs de procesare">
                        În curs de procesare
                      </option>
                      <option value="Comanda se indreapta catre tine!">
                        Se îndreaptă către tine
                      </option>
                      <option value="Comanda finalizata!">Finalizată</option>
                      <option value="Comanda anulata">Anulată</option>
                      <option value="Refund">Refund</option>
                    </select>
                    <Button
                      onClick={() => handleFulfillOrder(order.id)}
                      className="w-full"
                    >
                      {order.orderStatus === "Comanda finalizata!"
                        ? "Unfulfill"
                        : "Fulfill"}
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => setDeleteOrderId(order.id)}
                      className="w-full"
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        ))}
        <AlertDialog
          open={!!deleteOrderId}
          onOpenChange={() => setDeleteOrderId(null)}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Are you sure you want to delete this order?
              </AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                order from the database.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() =>
                  deleteOrderId && handleDeleteOrder(deleteOrderId)
                }
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
}
