"use client";

import { useCart } from "@/contexts/cart-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";
import { useUser } from "@clerk/nextjs";
import { useRouter, useSearchParams } from "next/navigation";
import { loadStripe } from "@stripe/stripe-js";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import Image from "next/image";

const stripePromise = loadStripe(
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!
);

export default function CartContent() {
  const { state, dispatch } = useCart();
  const { user } = useUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const detailsId = searchParams.get("detailsId");

  const updateQuantity = (
    productId: string,
    size: string,
    quantity: number
  ) => {
    if (quantity < 1) return;

    const item = state.items.find(
      (i) => i.product.id === productId && i.selectedSize === size
    );
    if (!item) return;

    const variant = item.product.sizeVariants.find((v) => v.size === size);
    if (!variant) return;

    const allowOutOfStock = item.product.allowOutOfStock;
    const maxQuantity = allowOutOfStock ? Infinity : variant.stock;

    if (quantity > maxQuantity) {
      toast({
        title: "Cannot update quantity",
        description: `Maximum quantity available for this item has been reached`,
        variant: "destructive",
      });
      return;
    }

    dispatch({
      type: "UPDATE_QUANTITY",
      payload: { productId, size, quantity },
    });
  };

  const removeItem = (productId: string, size: string) => {
    dispatch({
      type: "REMOVE_FROM_CART",
      payload: { productId, size },
    });
    toast({
      title: "Item removed",
      description: "The item has been removed from your cart.",
    });
  };

  const handleProceedToOrderDetails = () => {
    router.push("/order-details");
  };

  const handleCheckout = async () => {
    if (!detailsId) {
      router.push("/order-details");
      return;
    }

    try {
      const response = await fetch("/api/create-checkout-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          items: state.items,
          userId: user?.id || null,
          detailsId: detailsId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create checkout session");
      }

      const { sessionId } = await response.json();
      const stripe = await stripePromise;

      if (!stripe) {
        throw new Error("Failed to load Stripe");
      }

      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        throw error;
      }
    } catch (error: any) {
      console.error("Error in handleCheckout:", error);
      toast({
        title: "Eroare la checkout",
        description:
          error.message ||
          "A apărut o eroare în timpul procesării comenzii. Vă rugăm să încercați din nou.",
        variant: "destructive",
      });
    }
  };

  if (state.items.length === 0) {
    return (
      <div className="container mx-auto min-h-[70vh] flex flex-col justify-center items-center px-6 py-12">
        <div className="text-center space-y-6">
          <ShoppingBag className="mx-auto h-12 w-12 text-gray-400" />
          <h1 className="text-3xl font-bold">Coșul tău este gol</h1>
          <p className="text-gray-600">
            Adaugă produse în coș pentru a putea plasa o comandă.
          </p>
          <Link href="/">
            <Button
              size="lg"
              className="mt-6 bg-[#F57228] hover:bg-[#e05a1f] text-white border-none"
            >
              Vezi produse
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-2 py-8 md:py-12">
      <h1 className="text-3xl font-bold mb-8">Coș de cumpărături</h1>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Lista produse */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-4 md:p-8">
          <div className="space-y-8">
            {state.items.map((item) => (
              <div
                key={`${item.product.id}-${item.selectedSize}`}
                className="flex flex-col sm:flex-row sm:items-center justify-between border-b pb-4 gap-4"
              >
                <div className="flex items-center space-x-4">
                  <div className="relative w-24 h-24 flex-shrink-0">
                    <Image
                      src={item.product.images[0] || "/placeholder.svg"}
                      alt={item.product.name}
                      fill
                      className="object-cover rounded-md"
                    />
                  </div>
                  <div>
                    <h3 className="font-semibold">{item.product.name}</h3>
                    <p className="text-sm text-gray-600">
                      Mărime: {item.selectedSize}
                    </p>
                    <p className="text-sm font-medium">
                      {item.variant.price.toLocaleString("ro-RO", {
                        style: "currency",
                        currency: "RON",
                      })}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        updateQuantity(
                          item.product.id,
                          item.selectedSize,
                          item.quantity - 1
                        )
                      }
                      className="border-gray-200 text-gray-600 hover:bg-gray-100"
                    >
                      -
                    </Button>
                    <Input
                      type="number"
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(
                          item.product.id,
                          item.selectedSize,
                          parseInt(e.target.value)
                        )
                      }
                      className="w-16 text-center"
                      min="1"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() =>
                        updateQuantity(
                          item.product.id,
                          item.selectedSize,
                          item.quantity + 1
                        )
                      }
                      className="border-gray-200 text-gray-600 hover:bg-gray-100"
                    >
                      +
                    </Button>
                  </div>

                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() =>
                      removeItem(item.product.id, item.selectedSize)
                    }
                  >
                    Șterge
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Sumar comandă */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 h-fit flex flex-col gap-6">
          <h2 className="text-xl font-bold mb-2">Sumar comandă</h2>
          <div className="flex justify-between text-gray-700">
            <span>Subtotal</span>
            <span>
              {state.total.toLocaleString("ro-RO", {
                style: "currency",
                currency: "RON",
              })}
            </span>
          </div>
          <div className="flex justify-between text-gray-700">
            <span>Transport</span>
            <span>15,00 RON</span>
          </div>
          <div className="flex justify-between text-lg font-bold border-t pt-4">
            <span>Total</span>
            <span>
              {(state.total + 15).toLocaleString("ro-RO", {
                style: "currency",
                currency: "RON",
              })}
            </span>
          </div>
          <Button
            className="w-full mt-2 bg-[#F57228] hover:bg-[#e05a1f] text-white text-base font-semibold py-3"
            onClick={detailsId ? handleCheckout : handleProceedToOrderDetails}
          >
            {detailsId
              ? "Finalizează comanda"
              : "Continuă către detalii livrare"}
          </Button>
        </div>
      </div>
    </div>
  );
}
