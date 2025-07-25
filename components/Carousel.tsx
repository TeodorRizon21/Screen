"use client";

import { useState, TouchEvent } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CarouselProps = {
  images: string[];
};

export default function Carousel({ images }: CarouselProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);

  const showNavigation = images.length > 1;

  const prevSlide = () => {
    const isFirstSlide = currentIndex === 0;
    const newIndex = isFirstSlide ? images.length - 1 : currentIndex - 1;
    setCurrentIndex(newIndex);
  };

  const nextSlide = () => {
    const isLastSlide = currentIndex === images.length - 1;
    const newIndex = isLastSlide ? 0 : currentIndex + 1;
    setCurrentIndex(newIndex);
  };

  const handleTouchStart = (e: TouchEvent) => {
    setTouchStart(e.touches[0].clientX);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (touchStart === null) return;

    const currentTouch = e.touches[0].clientX;
    const diff = touchStart - currentTouch;

    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
      setTouchStart(null);
    }
  };

  const handleTouchEnd = () => {
    setTouchStart(null);
  };

  return (
    <div className="h-full w-full flex flex-col relative">
      <div
        className="relative h-full w-full flex-1"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <Image
            src={images[currentIndex]}
            alt="Product image"
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            className="object-contain p-2 rounded-xl"
            priority
          />
        </div>

        {showNavigation && (
          <div className="absolute -left-12 -right-12 top-1/2 transform -translate-y-1/2 flex items-center justify-between pointer-events-none z-10">
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full bg-white shadow-lg pointer-events-auto border-2 border-gray-300 hover:border-black"
              onClick={prevSlide}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-10 w-10 rounded-full bg-white shadow-lg pointer-events-auto border-2 border-gray-300 hover:border-black"
              onClick={nextSlide}
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
        )}
      </div>

      {showNavigation && (
        <div className="mt-4">
          <div className="flex gap-2 justify-center">
            {images.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  currentIndex === index ? "bg-black" : "bg-gray-300"
                )}
              />
            ))}
          </div>

          <div className="hidden md:flex gap-2 overflow-x-auto mt-4 justify-center">
            {images.map((image, index) => (
              <button
                key={image}
                onClick={() => setCurrentIndex(index)}
                className={cn(
                  "relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden border-2",
                  currentIndex === index ? "border-black" : "border-transparent"
                )}
              >
                <Image
                  src={image}
                  alt={`Thumbnail ${index + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
