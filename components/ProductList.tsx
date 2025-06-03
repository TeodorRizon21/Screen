"use client";

import { useCar } from "@/contexts/car-context";
import ProductCard from "./ProductCard";
import ProductCarousel from "./ProductCarousel";
import { ProductWithVariants } from "@/lib/types";
import { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";

interface ProductListProps {
  hideTitle?: boolean;
}

export default function ProductList({ hideTitle = false }: ProductListProps) {
  const { cars } = useCar();
  const { isSignedIn, isLoaded } = useUser();
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const response = await fetch("/api/products");
        const data = await response.json();
        setProducts(data);
      } catch (error) {
        console.error("Failed to fetch products:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, []);

  if (isLoading || !isLoaded) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="text-center">
          <p className="text-gray-600">Se încarcă produsele...</p>
        </div>
      </div>
    );
  }

  const compatibleProducts = cars.length
    ? products.filter((product) => {
        return cars.some(
          (car) =>
            product.make === car.make &&
            product.model === car.model &&
            product.generation === car.generation
        );
      })
    : [];

  // Forțăm afișarea tuturor produselor dacă utilizatorul nu este autentificat
  const showAllProducts =
    !isSignedIn || !cars.length || !compatibleProducts.length;

  console.log("Auth state:", { isSignedIn, isLoaded, showAllProducts });

  return (
    <div className="container mx-auto px-6 pt-6 pb-12">
      {!hideTitle && (
        <div className="text-center space-y-2 mb-20 font-poppins relative pb-6">
          <p className="text-sm uppercase tracking-wider text-black font-medium">
            ALEGE PROTECȚIA PERFECTĂ
          </p>
          <h2 className="text-3xl md:text-4xl font-bold">
            {showAllProducts
              ? "Toate produsele noastre"
              : "Produse pentru mașinile tale"}
          </h2>
          <div className="absolute -bottom-[0.2rem] left-1/2 transform -translate-x-1/2 w-40 h-1 bg-[#F57228]"></div>
        </div>
      )}

      {showAllProducts && !isSignedIn && (
        <div className="text-center mb-8">
          <p className="text-gray-600 mb-4">Nu ești autentificat.</p>
          <p className="text-gray-600">
            Autentifică-te pentru a vedea produsele compatibile cu mașinile
            tale.
          </p>
        </div>
      )}

      {showAllProducts && isSignedIn && !cars.length && (
        <div className="text-center mb-8">
          <p className="text-gray-600 mb-4">Nu ai adăugat nicio mașină încă.</p>
          <p className="text-gray-600">
            Adaugă mașinile tale pentru a vedea produsele compatibile.
          </p>
        </div>
      )}

      {showAllProducts &&
        isSignedIn &&
        cars.length &&
        !compatibleProducts.length && (
          <div className="text-center mb-8">
            <p className="text-gray-600">
              Nu există produse compatibile pentru mașinile tale în acest
              moment.
            </p>
          </div>
        )}

      {/* Mobile View - Stack */}
      <div className="block md:hidden">
        <div className="grid grid-cols-1 max-[750px]:grid-cols-1 min-[750px]:grid-cols-2 min-[1000px]:grid-cols-3 min-[1500px]:grid-cols-4 gap-8 md:gap-12">
          {(showAllProducts ? products : compatibleProducts).map((product) => (
            <div
              key={`${product.id}-${product.name}`}
              className="flex justify-center"
            >
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      </div>

      {/* Desktop View - Carousel */}
      <div className="hidden md:block">
        <ProductCarousel
          products={showAllProducts ? products : compatibleProducts}
        />
      </div>

      {/* About Us Section - Hidden for now */}
      {/* 
      <div className="mt-24 mb-12">
        <div className="text-center space-y-2 mb-12 font-poppins relative pb-6">
          <p className="text-sm uppercase tracking-wider text-black font-medium">
            DESPRE NOI
          </p>
          <h2 className="text-3xl md:text-4xl font-bold">Povestea ROUH</h2>
          <div className="absolute -bottom-[0.2rem] left-1/2 transform -translate-x-1/2 w-40 h-1 bg-[#F57228]"></div>
        </div>

        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="relative h-[300px] rounded-[50px] overflow-hidden flex items-center justify-center">
            <Image
              src="/infotainment.png"
              alt="ScreenShield Infotainment"
              width={400}
              height={400}
              className="rounded-[50px]"
            />
          </div>
          <div className="space-y-6">
            <p className="text-lg leading-relaxed text-gray-600">
              La ScreenShield, credem că protecția sistemelor infotainment auto
              este esențială pentru menținerea valorii și aspectului mașinii
              tale. Suntem dedicați furnizării de soluții de protecție premium
              pentru toate modelele de mașini.
            </p>
            <p className="text-lg leading-relaxed text-gray-600">
              Cu o experiență îndelungată în domeniul protecției auto și o
              pasiune pentru calitate, echipa noastră se străduiește să ofere
              cele mai durabile și eficiente soluții pentru clienții noștri.
            </p>
            <p className="text-lg leading-relaxed text-gray-600">
              Fiecare film de protecție ScreenShield este fabricat din materiale
              de înaltă calitate, testate pentru a asigura rezistență la
              zgârieturi, protecție UV și claritate optică optimă.
            </p>
          </div>
        </div>
      </div>
      */}
    </div>
  );
}
