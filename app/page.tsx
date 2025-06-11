"use client";

import Image from "next/image";
import Link from "next/link";
import UserCarsDisplay from "@/components/UserCarsDisplay";
import { useEffect, useState, useRef } from "react";
import { useUser } from "@clerk/nextjs";
import ProductCarousel from "@/components/ProductCarousel";
import { ProductWithVariants } from "@/lib/types";
import Newsletter from "@/components/Newsletter";

interface HeroSlide {
  id: string;
  imageUrl: string;
  title: string;
  description: string;
  ctaText: string;
  ctaLink: string;
}

export default function Home() {
  const [slides, setSlides] = useState<HeroSlide[]>([]);
  const [popularProducts, setPopularProducts] = useState<ProductWithVariants[]>(
    []
  );
  const [sliderPosition, setSliderPosition] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const { isSignedIn } = useUser();

  const handleMouseDown = () => {
    setIsDragging(true);
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging || !containerRef.current) return;
    updateSliderPosition(e.clientX);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || !containerRef.current) return;
    e.preventDefault(); // Prevent scrolling while dragging
    updateSliderPosition(e.touches[0].clientX);
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
    setTouchStartX(null);
  };

  const updateSliderPosition = (clientX: number) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = (x / rect.width) * 100;
    
    // Limitează poziția între 10% și 90%
    const boundedPercentage = Math.min(Math.max(percentage, 10), 90);
    setSliderPosition(boundedPercentage);
  };

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove);
      window.addEventListener("mouseup", handleMouseUp);
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  useEffect(() => {
    async function getHeroSlides() {
      try {
        const response = await fetch("/api/hero-settings");
        const data = await response.json();
        setSlides(data.slides || []);
      } catch (error) {
        console.error("Error fetching hero slides:", error);
        setSlides([]);
      }
    }

    getHeroSlides();
  }, []);

  useEffect(() => {
    async function fetchPopularProducts() {
      try {
        const response = await fetch("/api/products");
        const data = await response.json();
        setPopularProducts(data);
      } catch (error) {
        console.error("Failed to fetch popular products:", error);
      }
    }

    fetchPopularProducts();
  }, []);

  return (
    <main className="relative">
      {/* Hero Section - Before/After Effect */}
      <section className="relative w-full h-screen bg-black">
        <div 
          className="relative w-full h-full select-none" 
          ref={containerRef}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Container pentru imagini cu dimensiuni reduse pe mobil */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="relative w-full h-[90vh] md:h-full">
              {/* Imaginea de bază (navcuamp) */}
              <Image
                src="/navcuamp.png"
                alt="Hero Background Before"
                fill
                className="object-contain pointer-events-none"
                priority
              />

              {/* Imaginea de suprapunere (navfaraamp) cu efect de reveal */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{
                  clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
                }}
              >
                <Image
                  src="/navmat.png"
                  alt="Hero Background After"
                  fill
                  className="object-contain pointer-events-none"
                  priority
                />
              </div>
            </div>
          </div>

          {/* Titlu deasupra liniei */}
          <div className="absolute top-[20%] left-1/2 transform -translate-x-1/2 z-10 text-center w-full max-w-xl sm:max-w-4xl px-6">
            <h2 className="text-3xl md:text-4xl font-poppins font-thin uppercase text-white">
              Protejează ecranul mașinii așa cum trebuie!
            </h2>
          </div>

          {/* Text instructiv fix */}
          <div className="absolute bottom-[30%] sm:bottom-[20%] left-1/2 transform -translate-x-1/2 whitespace-nowrap z-10">
            <p className="text-white text-sm opacity-70 animate-pulse">
              PPF Lucios | PPF Mat -
            </p>
          </div>

          {/* Linia de separare și handler */}
          <div
            className="absolute top-[38%] bottom-[38%] sm:top-[35%] sm:bottom-[35%] md:top-[30%] md:bottom-[30%] w-1 bg-white cursor-ew-resize z-10"
            style={{
              left: `${sliderPosition}%`,
              transform: "translateX(-50%)",
            }}
            onMouseDown={handleMouseDown}
          >
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-white rounded-full flex items-center justify-center">
              <div className="w-6 h-6 bg-[#FFD66C] rounded-full"></div>
            </div>
          </div>

          {/* Text explicativ */}
          <div className="absolute bottom-[10%] sm:bottom-[5%] left-1/2 transform -translate-x-1/2 z-10 text-center w-full max-w-4xl px-6">
            <p className="text-sm md:text-base font-sans font-extralight text-white/90 max-w-3xl mx-auto">
              Filmele de protecție premium pentru sistemele infotainment sunt
              esențiale pentru menținerea aspectului impecabil al ecranului tău.
              Cu o protecție de înaltă calitate, previi zgârieturile, amprentele
              și deteriorările cauzate de uzura zilnică, păstrând claritatea și
              funcționalitatea perfectă a display-ului pentru o experiență de
              conducere optimă.
            </p>
          </div>
        </div>
      </section>

      {/* Secțiunea pentru mașinile utilizatorului și produse */}
      <section className="py-8 mb-8 bg-gray-50">
        <div className="container mx-auto px-6">
          <div className="text-center space-y-2 mb-8 font-poppins relative pb-6">
            <p className="text-sm uppercase tracking-wider text-black font-medium">
              ALEGE PROTECȚIA PERFECTĂ
            </p>
            <h2 className="text-2xl md:text-3xl font-bold">
              {isSignedIn ? "Produse pentru mașinile tale" : "Produse Populare"}
            </h2>
            <div className="absolute -bottom-[0.2rem] left-1/2 transform -translate-x-1/2 w-40 h-1 bg-[#F57228]"></div>
          </div>

          {isSignedIn ? (
            <UserCarsDisplay />
          ) : (
            <div className="relative">
              <ProductCarousel products={popularProducts} />
            </div>
          )}
        </div>
      </section>

      {/* Secțiunea Colecții Auto */}
      <section className="mt-8 mb-16">
        <div className="container mx-auto px-6">
          <div className="text-center space-y-2 mb-12 font-poppins relative pb-6">
            <p className="text-sm uppercase tracking-wider text-black font-medium">
              COLECȚIILE NOASTRE
            </p>
            <h2 className="text-3xl md:text-4xl font-bold">
              Descoperă toate colecțiile
            </h2>
            <div className="absolute -bottom-[0.2rem] left-1/2 transform -translate-x-1/2 w-40 h-1 bg-[#F57228]"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Mercedes Collection Card */}
            <Link href="/collection/Mercedes_Benz" className="group">
              <div className="relative h-[400px] rounded-[30px] overflow-hidden">
                <Image
                  src="/mercedes.jpg"
                  alt="Mercedes Collection"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-500"></div>
                <div className="absolute bottom-6 left-6 text-white">
                  <h3 className="text-2xl font-bold">Mercedes-Benz</h3>
                  <p className="text-sm mt-1">Colecția pentru Mercedes-Benz</p>
                </div>
              </div>
            </Link>

            {/* BMW Collection Card */}
            <Link href="/collection/Bmw" className="group">
              <div className="relative h-[400px] rounded-[30px] overflow-hidden">
                <Image
                  src="/bmw,jpg.jpg"
                  alt="BMW Collection"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-500"></div>
                <div className="absolute bottom-6 left-6 text-white">
                  <h3 className="text-2xl font-bold">BMW</h3>
                  <p className="text-sm mt-1">Colecția pentru BMW</p>
                </div>
              </div>
            </Link>

            {/* Audi Collection Card */}
            <Link href="/collection/Audi" className="group">
              <div className="relative h-[400px] rounded-[30px] overflow-hidden">
                <Image
                  src="/audi.jpg"
                  alt="Audi Collection"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-500"></div>
                <div className="absolute bottom-6 left-6 text-white">
                  <h3 className="text-2xl font-bold">Audi</h3>
                  <p className="text-sm mt-1">Colecția pentru Audi</p>
                </div>
              </div>
            </Link>

            {/* Volkswagen Collection Card */}
            <Link href="/collection/Volkswagen" className="group">
              <div className="relative h-[400px] rounded-[30px] overflow-hidden">
                <Image
                  src="/volkswagen.jpg"
                  alt="Volkswagen Collection"
                  fill
                  className="object-cover group-hover:scale-110 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/30 group-hover:bg-black/20 transition-colors duration-500"></div>
                <div className="absolute bottom-6 left-6 text-white">
                  <h3 className="text-2xl font-bold">Volkswagen</h3>
                  <p className="text-sm mt-1">Colecția pentru Volkswagen</p>
                </div>
              </div>
            </Link>
          </div>

          <div className="text-center mt-12">
            <Link
              href="/collection/allproducts"
              className="inline-flex items-center text-lg font-medium hover:text-gray-700 transition-colors"
            >
              Vezi toate produsele
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={2}
                stroke="currentColor"
                className="w-4 h-4 ml-2"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3"
                />
              </svg>
            </Link>
          </div>
        </div>
      </section>

      {/* Newsletter la final */}
      <section>
        <Newsletter />
      </section>
    </main>
  );
}
