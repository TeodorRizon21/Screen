"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import type { ProductWithVariants, SizeVariant } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { toast } from "@/hooks/use-toast";
import { ToastAction } from "@/components/ui/toast";

export default function ProductCard({
  product,
  maxPrice,
}: {
  product: ProductWithVariants;
  maxPrice?: number;
}) {
  const { dispatch } = useCart();
  const getInitialVariant = () => {
    if (!product.sizeVariants || product.sizeVariants.length === 0) return null;

    // Dacă avem un maxPrice, găsim prima variație care se încadrează în buget
    if (maxPrice !== undefined) {
      const affordableVariant = product.sizeVariants.find(
        (v) => v.price <= maxPrice && (v.stock > 0 || product.allowOutOfStock)
      );
      if (affordableVariant) return affordableVariant;
    }

    // Dacă nu avem maxPrice sau nu am găsit o variație accesibilă, folosim logica originală
    const inStockVariants = product.sizeVariants.filter(
      (v) => v.stock > 0 || product.allowOutOfStock
    );
    return inStockVariants[0] || product.sizeVariants[0];
  };

  const [selectedVariant, setSelectedVariant] = useState<SizeVariant | null>(
    getInitialVariant()
  );

  const isOutOfStock =
    !selectedVariant ||
    (selectedVariant.stock === 0 && !product.allowOutOfStock);

  const isBestSeller = product.tags?.includes("bestseller") ?? false;
  const isOnSale =
    selectedVariant?.oldPrice &&
    selectedVariant.oldPrice > selectedVariant.price;

  const productUrl = `/products/${product.id}${
    selectedVariant ? `?size=${selectedVariant.size}` : ""
  }`;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    if (selectedVariant) {
      dispatch({
        type: "ADD_TO_CART",
        payload: {
          product,
          size: selectedVariant.size,
          variant: selectedVariant,
          quantity: 1,
        },
      });

      toast({
        title: "Produs adăugat în coș",
        description: `${product.name} (${selectedVariant.size}) a fost adăugat în coșul tău.`,
        action: (
          <ToastAction altText="Vezi coșul" asChild>
            <Link
              href="/cart"
              className="bg-[#F57228] hover:bg-[#e05a1f] text-white transition-colors px-4 py-2 rounded-md"
            >
              Vezi coșul
            </Link>
          </ToastAction>
        ),
      });
    }
  };

  return (
    <div className="relative group w-[300px] rounded-lg p-4">
      <Link href={productUrl} className="block">
        <div className="flex flex-col items-center gap-6 bg-white rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 pt-0 pb-3">
          {/* Image Container */}
          <div className="relative h-[260px] w-full overflow-hidden rounded-t-lg">
            {/* Best Seller Badge */}
            {isBestSeller && (
              <div className="absolute top-4 left-4 z-10">
                <div className="bg-black text-white px-4 py-1 text-sm font-medium">
                  BestSeller
                </div>
              </div>
            )}

            <Image
              src={product.images[0] || `/api/placeholder?width=300&height=300`}
              alt={product.name}
              fill
              sizes="300px"
              className="object-cover transition-all duration-500 group-hover:scale-105 rounded-t-lg"
            />

            {/* Buy Now Button Overlay */}
            <div className="absolute bottom-0 left-0 right-0 transform translate-y-full group-hover:translate-y-0 transition-transform duration-300">
              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleAddToCart(e);
                }}
                disabled={isOutOfStock}
                className="w-full bg-black text-white py-3 px-6 font-medium hover:bg-gray-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cumpără acum
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="w-full px-4 flex flex-col items-center">
            <h3 className="text-lg font-medium mb-4 text-center group-hover:text-black transition-colors duration-300">
              {product.name}
            </h3>

            <div className="flex items-center justify-between w-full">
              <div className="flex items-baseline gap-2">
                <p
                  className={`text-xl font-medium ${
                    isOnSale ? "text-red-600" : "text-black"
                  }`}
                >
                  {selectedVariant?.price.toFixed(2)} lei
                </p>
                {isOnSale && (
                  <p className="text-xs text-gray-500 line-through">
                    {selectedVariant?.oldPrice?.toFixed(2)} lei
                  </p>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.preventDefault();
                  handleAddToCart(e);
                }}
                disabled={isOutOfStock}
                className="bg-black p-3 hover:bg-gray-900 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed rounded-full"
              >
                <ShoppingCart className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </Link>

      {/* Size Variants */}
      <div className="mt-4 w-full">
        <div className="bg-white p-3 rounded-lg shadow-lg hover:shadow-xl transition-all duration-300 min-h-[80px] flex items-center">
          <div className="flex justify-center gap-2 overflow-x-auto scrollbar-thin scrollbar-thumb-gray-200 scrollbar-track-transparent pb-2 pt-1 w-full">
            {product.sizeVariants.map((variant) => (
              <button
                key={variant.id}
                onClick={(e) => {
                  e.preventDefault();
                  setSelectedVariant(variant);
                }}
                disabled={variant.stock === 0 && !product.allowOutOfStock}
                className={`px-4 py-2 text-sm transition-all duration-200 whitespace-nowrap flex-shrink-0 min-w-[80px] rounded-full ${
                  selectedVariant?.id === variant.id
                    ? "bg-black text-white"
                    : "bg-white text-black border border-gray-200 hover:border-black"
                } ${
                  variant.stock === 0 && !product.allowOutOfStock
                    ? "opacity-50 cursor-not-allowed"
                    : ""
                }`}
              >
                {variant.size}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
