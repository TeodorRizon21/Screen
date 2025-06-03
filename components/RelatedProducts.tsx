"use client";

import { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { ProductWithVariants } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import ProductCard from "./ProductCard";

export default function RelatedProducts({
  products,
  currentProductId,
}: {
  products: ProductWithVariants[];
  currentProductId: string;
}) {
  // Filter out the current product
  const filteredProducts = products.filter(
    (product) => product.id !== currentProductId
  );

  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    slidesToScroll: 1,
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  if (!filteredProducts.length) return null;

  return (
    <div className="bg-gray-50">
      <div className="container mx-auto">
        <div className="py-12">
          <div className="text-center space-y-2 mb-12 font-poppins relative pb-6">
            <p className="text-sm uppercase tracking-wider text-black font-medium">
              DESCOPERĂ MAI MULTE PRODUSE
            </p>
            <h2 className="text-3xl md:text-4xl font-bold">Produse Similare</h2>
            <div className="absolute -bottom-[0.2rem] left-1/2 transform -translate-x-1/2 w-40 h-1 bg-[#F57228]"></div>
          </div>

          {/* Mobile View - Stack */}
          <div className="flex flex-col gap-8 mt-8 md:hidden">
            {filteredProducts.map((product) => (
              <div key={product.id} className="flex justify-center w-full">
                <ProductCard product={product} />
              </div>
            ))}
          </div>

          {/* Desktop View - Carousel */}
          <div className="hidden md:block relative px-16 pb-8">
            <div className="overflow-hidden h-[520px]" ref={emblaRef}>
              <div className="flex h-full -ml-4">
                {filteredProducts.map((product) => (
                  <div
                    key={product.id}
                    className="flex-[0_0_100%] min-w-0 sm:flex-[0_0_50%] lg:flex-[0_0_25%] pl-4 h-full"
                  >
                    <div className="flex justify-center h-full">
                      <ProductCard product={product} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Button
              variant="outline"
              size="icon"
              className="absolute -left-8 top-1/2 -translate-y-1/2 bg-[#F57228] hover:bg-[#e05a1f] transition-colors duration-300 rounded-2xl border-none z-10"
              onClick={scrollPrev}
            >
              <ChevronLeft className="h-6 w-6 text-black" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="absolute -right-8 top-1/2 -translate-y-1/2 bg-[#F57228] hover:bg-[#e05a1f] transition-colors duration-300 rounded-2xl border-none z-10"
              onClick={scrollNext}
            >
              <ChevronRight className="h-6 w-6 text-black" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
