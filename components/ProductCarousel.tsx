"use client";

import { useCallback } from "react";
import useEmblaCarousel from "embla-carousel-react";
import type { ProductWithVariants } from "@/lib/types";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./ui/button";
import ProductCard from "./ProductCard";

export default function ProductCarousel({
  products,
}: {
  products: ProductWithVariants[];
}) {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    loop: true,
    align: "start",
    slidesToScroll: 1,
    containScroll: "keepSnaps",
  });

  const scrollPrev = useCallback(() => {
    if (emblaApi) emblaApi.scrollPrev();
  }, [emblaApi]);

  const scrollNext = useCallback(() => {
    if (emblaApi) emblaApi.scrollNext();
  }, [emblaApi]);

  return (
    <div className="relative px-16 pb-8">
      <div className="overflow-hidden h-[520px]" ref={emblaRef}>
        <div className="flex h-full -ml-4">
          {products.map((product) => (
            <div
              key={`${product.id}-${product.name}`}
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
        className="absolute -left-4 sm:-left-8 top-1/2 -translate-y-1/2 bg-[#F57228] hover:bg-[#e05a1f] transition-colors duration-300 rounded-2xl border-none z-10 w-12 h-12"
        onClick={scrollPrev}
      >
        <ChevronLeft className="h-8 w-8 text-white" />
      </Button>
      <Button
        variant="outline"
        size="icon"
        className="absolute -right-4 sm:-right-8 top-1/2 -translate-y-1/2 bg-[#F57228] hover:bg-[#e05a1f] transition-colors duration-300 rounded-2xl border-none z-10 w-12 h-12"
        onClick={scrollNext}
      >
        <ChevronRight className="h-8 w-8 text-white" />
      </Button>
    </div>
  );
}
