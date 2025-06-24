"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/cart-context";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";

interface OrderDetails {
  id: string;
  courier: string | null;
  awb: string | null;
  paymentType: string;
  orderStatus: string;
}

export default function SuccessContent({
  orderId,
  paymentType,
}: {
  orderId: string;
  paymentType: string;
}) {
  const router = useRouter();
  const { dispatch } = useCart();
  const { user } = useUser();
  const [orderDetails, setOrderDetails] = useState<OrderDetails | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    dispatch({ type: "CLEAR_CART" });

    const fetchOrderDetails = async () => {
      try {
        const response = await fetch(`/api/order-details/${orderId}`);
        if (!response.ok) throw new Error("Failed to fetch order details");
        const data = await response.json();
        setOrderDetails(data);
      } catch (error) {
        console.error("Error fetching order details:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOrderDetails();
  }, [dispatch, orderId]);

  const getTrackingUrl = () => {
    if (!orderDetails?.courier || !orderDetails?.awb) return null;

    switch (orderDetails.courier) {
      case "DPD":
        return `https://tracking.dpd.ro/?shipmentNumber=${orderDetails.awb}`;
      default:
        return null;
    }
  };

  const handleTrackingClick = () => {
    const url = getTrackingUrl();
    if (url) {
      window.open(url, "_blank");
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-md">
      <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        <div className="flex flex-col items-center text-center">
          <div className="bg-green-50 p-3 rounded-full mb-6">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>

          <h1 className="text-3xl font-bold text-gray-800">
            Mulțumim pentru comandă!
          </h1>

          <div className="mt-6 mb-8 w-full">
            <div className="border-t border-gray-100 py-4">
              <p className="text-gray-600">
                Comanda ta (ID:{" "}
                <span className="font-medium text-gray-800">{orderId}</span>) a
                fost plasată cu succes.
              </p>
            </div>

            <div className="border-t border-gray-100 py-4">
              <p className="text-gray-600">
                Metodă de plată:{" "}
                <span className="font-medium text-gray-800">
                  {paymentType === "card" ? "Card" : "Ramburs la curier"}
                </span>
              </p>
            </div>

            {isLoading ? (
              <div className="border-t border-gray-100 py-4 flex justify-center">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : orderDetails?.awb ? (
              <div className="border-t border-gray-100 py-4">
                <p className="text-gray-600">
                  AWB:{" "}
                  <button
                    onClick={handleTrackingClick}
                    className="font-medium text-gray-800 hover:text-blue-600 transition-colors cursor-pointer underline"
                  >
                    {orderDetails.awb}
                  </button>
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  Click pe AWB pentru urmărire
                </p>
              </div>
            ) : null}

            <div className="border-t border-gray-100 py-4">
              <p className="text-gray-600">
                {user
                  ? "Poți vedea detaliile comenzii în secțiunea 'Comenzile mele'."
                  : "O să primești detaliile comenzii pe email."}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 w-full">
            {user && (
              <Button onClick={() => router.push("/orders")} className="w-full">
                Vezi comenzile
              </Button>
            )}
            <Button
              onClick={() => router.push("/")}
              variant={user ? "outline" : "default"}
              className={user ? "w-full" : "w-full col-span-2"}
            >
              Continuă cumpărăturile
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
