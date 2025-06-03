"use client";

import { useEffect, useState } from "react";
import { toast } from "@/hooks/use-toast";

type Order = {
  id: string;
  createdAt: string;
  total: number;
  items: {
    productName: string;
    quantity: number;
    size: string;
    price: number;
  }[];
};

export default function OrderHistory({ userId }: { userId: string }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchOrders() {
      try {
        const response = await fetch(`/api/orders?userId=${userId}`);
        if (!response.ok) {
          throw new Error("Failed to fetch orders");
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
    }

    fetchOrders();
  }, [userId]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-12">Loading orders...</div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="container mx-auto px-6 py-12">
        You haven't placed any orders yet.
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="text-center space-y-2 mb-12 font-poppins relative pb-6">
        <p className="text-sm uppercase tracking-wider text-black font-medium">
          YOUR SHOPPING HISTORY
        </p>
        <h2 className="text-3xl md:text-4xl font-bold">Recent Orders</h2>
        <div className="absolute -bottom-[0.2rem] left-1/2 transform -translate-x-1/2 w-40 h-1 bg-[#FFD66C]"></div>
      </div>
      <div className="space-y-8">
        {orders.map((order) => (
          <div key={order.id} className="border rounded-lg p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Order #{order.id}</h2>
              <p className="text-gray-600">
                {new Date(order.createdAt).toLocaleDateString()}
              </p>
            </div>
            <ul className="divide-y">
              {order.items.map((item, index) => (
                <li key={index} className="py-4 flex justify-between">
                  <div>
                    <p className="font-medium">{item.productName}</p>
                    <p className="text-sm text-gray-600">Size: {item.size}</p>
                  </div>
                  <div className="text-right">
                    <p>
                      {item.quantity} x ${item.price.toFixed(2)}
                    </p>
                    <p className="font-medium">
                      ${(item.quantity * item.price).toFixed(2)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
            <div className="mt-4 text-right">
              <p className="text-xl font-bold">
                Total: ${order.total.toFixed(2)}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
