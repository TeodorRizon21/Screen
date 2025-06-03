"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroSlide {
  id: string;
  imageUrl: string;
  collectionLink: string;
}

interface HeroProps {
  slides: HeroSlide[];
  autoChangeInterval: number;
}

export default function Hero({ slides, autoChangeInterval }: HeroProps) {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const minSwipeDistance = 50;

  const goToSlide = useCallback((index: number) => {
    setCurrentSlide(index);
  }, []);

  const nextSlide = useCallback(() => {
    goToSlide((currentSlide + 1) % slides.length);
  }, [currentSlide, slides.length, goToSlide]);

  const prevSlide = useCallback(() => {
    goToSlide((currentSlide - 1 + slides.length) % slides.length);
  }, [currentSlide, slides.length, goToSlide]);

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  useEffect(() => {
    if (slides.length <= 1) return;

    const intervalId = setInterval(nextSlide, autoChangeInterval);

    return () => clearInterval(intervalId);
  }, [slides.length, autoChangeInterval, nextSlide]);

  const getCollectionName = (link: string) => {
    const match = link.match(/\/collection\/(.+)$/);
    if (match) {
      return decodeURIComponent(match[1]);
    }
    return "";
  };

  if (slides.length === 0) return null;

  return (
    <div 
      className="relative w-full h-[600px] sm:h-[500px] md:h-[600px] lg:h-[700px] mt-6 mb-12 overflow-hidden rounded-[50px]"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <Image
        src="/navmat.png"
        alt="Hero Image"
        fill
        className="object-cover"
        priority
      />
      {slides.map((slide, index) => (
        <div
          key={slide.id}
          className={`group absolute top-0 left-0 w-full h-full transition-all duration-1000 ease-in-out transform ${
            index === currentSlide
              ? "opacity-100 scale-100"
              : "opacity-0 scale-95 pointer-events-none"
          }`}
        >
          <div className="relative w-full h-full">
            <Image
              src={slide.imageUrl || "/placeholder.svg"}
              alt={`Hero slide ${index + 1}`}
              layout="fill"
              objectFit="cover"
              className="rounded-[50px] sm:object-cover object-[80%]"
              priority={index === 0}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent rounded-[50px]" />
            <Link
              href={slide.collectionLink}
              className="block absolute inset-0"
            >
              <div className="absolute bottom-0 left-0 right-0 p-8 sm:p-10 md:p-12 flex flex-col sm:flex-row justify-between items-center sm:items-end text-white">
                <div className="flex-1 text-center sm:text-left mb-6 sm:mb-0 px-4 sm:px-6 md:px-8">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 transform group-hover:translate-x-2 transition-transform">
                    {getCollectionName(slide.collectionLink)}
                  </h2>
                  <p className="text-sm sm:text-base md:text-lg lg:text-xl opacity-90 max-w-xl transform group-hover:translate-x-2 transition-transform duration-300">
                    {slide.collectionLink.includes("BMW") &&
                      "Filme de protecție premium pentru sistemele infotainment BMW"}
                    {slide.collectionLink.includes("MERCEDES") &&
                      "Soluții de protecție pentru sistemele Mercedes"}
                    {slide.collectionLink.includes("AUDI") &&
                      "Protecție specializată pentru sistemele Audi"}
                    {slide.collectionLink.includes("VOLKSWAGEN") &&
                      "Filme de protecție pentru sistemele Volkswagen"}
                    {slide.collectionLink.includes("All") &&
                      "Descoperă întreaga noastră gamă de filme de protecție"}
                  </p>
                  <Button className="mt-6 bg-[#FFD66C] hover:bg-[#ffc936] text-black text-sm sm:text-base uppercase font-semibold px-4 sm:px-6 py-4 sm:py-6 rounded-full transform group-hover:translate-x-2 transition-all duration-300">
                    Explorează Colecția
                  </Button>
                </div>
                {slides.length > 1 && (
                  <div className="flex space-x-2 mb-2 sm:mb-4">
                    {slides.map((_, dotIndex) => (
                      <div
                        key={dotIndex}
                        className={`w-2 sm:w-2.5 h-2 sm:h-2.5 rounded-full transition-colors duration-300 ${
                          dotIndex === currentSlide
                            ? "bg-[#FFD66C]"
                            : "bg-gray-300"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            </Link>
          </div>
        </div>
      ))}
      {slides.length > 1 && (
        <>
          <Button
            variant="outline"
            size="icon"
            className="hidden md:flex md:items-center md:justify-center absolute top-1/2 left-4 sm:left-8 transform -translate-y-1/2 bg-[#FFD66C] hover:bg-[#ffc936] transition-colors duration-300 rounded-full border-none z-10 w-10 sm:w-12 h-10 sm:h-12"
            onClick={(e) => {
              e.stopPropagation();
              prevSlide();
            }}
          >
            <ChevronLeft className="h-5 sm:h-6 w-5 sm:w-6 text-black" />
          </Button>
          <Button
            variant="outline"
            size="icon"
            className="hidden md:flex md:items-center md:justify-center absolute top-1/2 right-4 sm:right-8 transform -translate-y-1/2 bg-[#FFD66C] hover:bg-[#ffc936] transition-colors duration-300 rounded-full border-none z-10 w-10 sm:w-12 h-10 sm:h-12"
            onClick={(e) => {
              e.stopPropagation();
              nextSlide();
            }}
          >
            <ChevronRight className="h-5 sm:h-6 w-5 sm:w-6 text-black" />
          </Button>
        </>
      )}
    </div>
  );
}
