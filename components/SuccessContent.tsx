"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/contexts/cart-context";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import { useUser } from "@clerk/nextjs";

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

  useEffect(() => {
    dispatch({ type: "CLEAR_CART" });
  }, [dispatch]);

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
