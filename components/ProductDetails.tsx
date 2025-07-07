"use client";

import { useState } from "react";
import { Product } from "@prisma/client";
import { useCart } from "@/contexts/cart-context";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import Carousel from "@/components/Carousel";
import YouTubePlayer from "@/components/YouTubePlayer";
import { ProductWithVariants, SizeVariant } from "@/lib/types";
import { ShoppingCart, Plus, Minus } from "lucide-react";
import ProductReviews from "@/components/ProductReviews";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

interface ProductDetailsProps {
  product: ProductWithVariants;
  initialSize?: string;
}

export default function ProductDetails({
  product,
  initialSize,
}: ProductDetailsProps) {
  const [selectedSize, setSelectedSize] = useState<string>(
    initialSize ||
      (product.sizeVariants && product.sizeVariants.length > 0
        ? product.sizeVariants[0].size
        : "")
  );
  const [quantity, setQuantity] = useState(1);
  const { dispatch } = useCart();

  const handleAddToCart = () => {
    const selectedVariant = product.sizeVariants.find(
      (v) => v.size === selectedSize
    );
    if (!selectedVariant) return;

    dispatch({
      type: "ADD_TO_CART",
      payload: {
        product,
        size: selectedSize,
        variant: selectedVariant,
        quantity,
      },
    });
    toast({
      title: "Produs adăugat în coș",
      description: `${product.name} (${selectedSize}) x${quantity} a fost adăugat în coșul tău.`,
    });
  };

  const incrementQuantity = () => {
    setQuantity((prev) => Math.min(prev + 1, 10));
  };

  const decrementQuantity = () => {
    setQuantity((prev) => Math.max(prev - 1, 1));
  };

  // Procesare imagini - gestionează diferite formate posibile
  let images: string[] = [];
  
  if (product.images) {
    if (Array.isArray(product.images)) {
      images = product.images.filter(img => img && img.trim() !== '');
    } else if (typeof product.images === 'string') {
      // Încearcă să parsezi ca JSON dacă este string
      try {
        const parsed = JSON.parse(product.images);
        images = Array.isArray(parsed) ? parsed.filter(img => img && img.trim() !== '') : [product.images];
      } catch {
        // Dacă nu este JSON valid, tratează ca o singură imagine
        images = [product.images];
      }
    }
  }
  
  // Fallback la placeholder dacă nu sunt imagini
  if (images.length === 0) {
    images = ["/placeholder.svg?height=500&width=500"];
  }

  // Debug: log images array
  console.log("Product images:", product.images);
  console.log("Processed images:", images);

  const selectedVariant = product.sizeVariants.find(
    (v) => v.size === selectedSize
  );
  const isOutOfStock = selectedVariant
    ? selectedVariant.stock === 0 && !product.allowOutOfStock
    : true;

  // Verificăm stocul scăzut doar dacă avem o variantă selectată și ea are lowStockThreshold definit
  let showLowStock = false;
  if (product.showStockLevel && selectedVariant && selectedVariant.stock > 0) {
    if (
      selectedVariant.lowStockThreshold &&
      selectedVariant.stock <= selectedVariant.lowStockThreshold
    ) {
      showLowStock = true;
    }
  }

  return (
    <div className="container mx-auto px-6">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row gap-8">
        {/* Secțiunea cu imaginea - fundal alb */}
        <div className="w-full md:w-1/2 relative">
          <div className="absolute inset-0 bg-white rounded-t-3xl md:rounded-t-none md:rounded-l-3xl"></div>
          <div className="relative z-10 aspect-square md:aspect-auto md:h-[600px] p-4 md:p-8 flex items-center justify-center">
            <div className="w-full h-full relative rounded-xl">
              <Carousel images={images} />
            </div>
          </div>
        </div>

        {/* Secțiunea cu detaliile produsului */}
        <div className="w-full md:w-1/2 p-8 flex flex-col justify-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <h1 className="text-4xl md:text-5xl font-bold text-black">
                {product.name}
              </h1>
            </div>

            {/* Mărimi disponibile */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-gray-500 uppercase tracking-wider">
                MĂRIME
              </h3>
              <div className="flex flex-wrap gap-3">
                {product.sizeVariants.map((variant) => (
                  <button
                    key={variant.size}
                    onClick={() => setSelectedSize(variant.size)}
                    className={`px-5 py-2.5 text-sm rounded-full border-2 transition-all duration-200 ${
                      selectedSize === variant.size
                        ? "bg-black text-white border-black"
                        : "bg-white text-black border-gray-200 hover:border-black hover:bg-gray-50"
                    } ${
                      variant.stock === 0 && !product.allowOutOfStock
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    }`}
                    disabled={variant.stock === 0 && !product.allowOutOfStock}
                  >
                    {variant.size}
                  </button>
                ))}
              </div>
            </div>

            {/* Prețul și reducerea */}
            <div className="space-y-3">
              {selectedVariant && (
                <>
                  {selectedVariant.oldPrice &&
                  selectedVariant.oldPrice > selectedVariant.price ? (
                    <div className="space-y-2">
                      <div className="flex items-baseline gap-3">
                        <p className="text-4xl md:text-5xl font-bold text-red-600">
                          {selectedVariant.price.toLocaleString("ro-RO", {
                            style: "currency",
                            currency: "RON",
                          })}
                        </p>
                        <span className="px-3 py-1 bg-red-100 text-red-600 rounded-full text-sm font-medium">
                          -
                          {Math.round(
                            (1 -
                              selectedVariant.price /
                                selectedVariant.oldPrice) *
                              100
                          )}
                          %
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <p className="text-lg text-gray-500 line-through">
                          {selectedVariant.oldPrice.toLocaleString("ro-RO", {
                            style: "currency",
                            currency: "RON",
                          })}
                        </p>
                        <p className="text-sm text-green-600">
                          Economisești{" "}
                          {(
                            selectedVariant.oldPrice - selectedVariant.price
                          ).toLocaleString("ro-RO", {
                            style: "currency",
                            currency: "RON",
                          })}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-4xl md:text-5xl font-bold text-black">
                      {selectedVariant.price.toLocaleString("ro-RO", {
                        style: "currency",
                        currency: "RON",
                      })}
                    </p>
                  )}
                </>
              )}
            </div>

            {/* Mesaje stoc */}
            {isOutOfStock && (
              <div className="bg-red-50 p-4 rounded-xl border border-red-100">
                <p className="text-red-600 font-medium">Stoc epuizat</p>
              </div>
            )}

            {showLowStock && selectedVariant && (
              <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                <p className="text-orange-600 font-medium">
                  Doar {selectedVariant.stock} produse rămase în stoc - comandă
                  acum!
                </p>
              </div>
            )}

            {/* Afirmații în verde */}
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-600 font-medium text-lg">🛡️ 5 ani de garantie</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-600 font-medium text-lg">🔄 Auto-regenerare</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-green-600 font-medium text-lg">⭐ Calitate de top</span>
              </div>
            </div>

            {/* Contor și buton adăugare în coș */}
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-gray-100 rounded-2xl overflow-hidden border border-gray-200">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 hover:bg-gray-200"
                  onClick={decrementQuantity}
                  disabled={quantity <= 1}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <div className="w-12 text-center font-medium">{quantity}</div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 hover:bg-gray-200"
                  onClick={incrementQuantity}
                  disabled={quantity >= 10}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <Button
                onClick={handleAddToCart}
                className="flex-1 bg-black hover:bg-gray-800 text-lg py-6 text-white flex items-center justify-center gap-2 transition-all duration-300"
                disabled={isOutOfStock}
              >
                {isOutOfStock ? (
                  "Stoc epuizat"
                ) : (
                  <>
                    <ShoppingCart className="w-6 h-6" />
                    <span>Cumpără</span>
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Secțiunea cu descrierea și specificațiile produsului */}
      <div className="max-w-6xl mx-auto mt-16">
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="description" className="border-2 border-orange-500 rounded-lg mb-4 bg-white">
            <AccordionTrigger className="px-6 py-4 text-lg font-semibold hover:no-underline">
              📝 Descrierea produsului
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="text-gray-700 leading-relaxed space-y-4">
                <p className="text-lg">
                  {product.description}
                </p>
                <p className="text-base">
                  Folia de protecție ScreenShield este proiectată pentru a oferi protecție maximă 
                  împotriva zgârieturilor, pietrelor și altor elemente care pot deteriora vopseaua mașinii. 
                  Cu tehnologia noastră avansată de auto-regenerare, folia se repară automat la temperaturi ridicate.
                </p>
              </div>
            </AccordionContent>
          </AccordionItem>

          <AccordionItem value="specifications" className="border-2 border-orange-500 rounded-lg bg-white">
            <AccordionTrigger className="px-6 py-4 text-lg font-semibold hover:no-underline">
              ⚙️ Specificații tehnice
            </AccordionTrigger>
            <AccordionContent className="px-6 pb-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-700">Grosime</span>
                    <span className="text-gray-900">200 microni</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-700">Transparență</span>
                    <span className="text-gray-900">99.9%</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-700">Temperatură minimă</span>
                    <span className="text-gray-900">-40°C</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-700">Temperatură maximă</span>
                    <span className="text-gray-900">+80°C</span>
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-700">Garanție</span>
                    <span className="text-gray-900">5 ani</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-700">Auto-regenerare</span>
                    <span className="text-green-600 font-medium">Da</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-700">Rezistență UV</span>
                    <span className="text-green-600 font-medium">Da</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="font-medium text-gray-700">Certificări</span>
                    <span className="text-gray-900">ISO 9001</span>
                  </div>
                </div>
              </div>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>

      {/* Secțiunea cu video YouTube */}
      <div className="max-w-6xl mx-auto mt-16">
        <h2 className="text-2xl font-bold mb-6">Vezi cum se aplică</h2>
        <YouTubePlayer videoId="6CF0bFJENXo" />
      </div>

      {/* Secțiunea cu recenzii */}
      <div className="max-w-6xl mx-auto mt-16">
        <ProductReviews productId={product.id} />
      </div>
    </div>
  );
}
