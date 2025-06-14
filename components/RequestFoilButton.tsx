"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RequestFoilButton() {
  const router = useRouter();
  const [isPulsing, setIsPulsing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [hasPopped, setHasPopped] = useState(false);

  useEffect(() => {
    // Setez pulsarea la fiecare 5 secunde
    const interval = setInterval(() => {
      setIsPulsing(true);
      // Opresc pulsarea după 1 secundă
      setTimeout(() => setIsPulsing(false), 1000);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // Caut grid-ul cu produsele - structura din CollectionContent
      const productsGrid = document.querySelector('.grid.grid-cols-1.max-\\[750px\\]\\:grid-cols-1') ||
                          document.querySelector('[class*="grid"][class*="grid-cols"]') ||
                          document.querySelector('.grid') ||
                          document.querySelector('[class*="product"]');
      
             if (productsGrid) {
         const rect = productsGrid.getBoundingClientRect();
         // Butonul apare când grid-ul de produse este aproape complet vizibil
         const isNearBottom = rect.bottom <= window.innerHeight + 200;
         
         if (isNearBottom && !isVisible && !hasPopped) {
           setHasPopped(true);
         }
         setIsVisible(isNearBottom);
       } else {
         // Fallback mai conservator: verifică dacă utilizatorul a dat scroll suficient
         const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
         const windowHeight = window.innerHeight;
         const documentHeight = document.documentElement.scrollHeight;
         
         // Butonul apare când utilizatorul a dat scroll 50% din pagină
         const scrollPercent = scrollTop / (documentHeight - windowHeight);
         const shouldBeVisible = scrollPercent > 0.5;
         
         if (shouldBeVisible && !isVisible && !hasPopped) {
           setHasPopped(true);
         }
         setIsVisible(shouldBeVisible);
       }
    };

    window.addEventListener('scroll', handleScroll);
    handleScroll(); // Verific poziția inițială

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleClick = () => {
    router.push("/request-foil");
  };

  if (!isVisible) return null;

  return (
    <div className="fixed right-6 top-[75%] md:top-[60%] transform -translate-y-1/2 z-50">
      <Button
        onClick={handleClick}
        className={`
          bg-gradient-to-r from-orange-500/80 to-orange-600/80 
          hover:from-orange-600/90 hover:to-orange-700/90
          text-white shadow-lg hover:shadow-xl
          transition-all duration-300 ease-in-out
          flex items-center justify-center
          px-6 py-5 md:px-8 md:py-6
          rounded-full
          border-2 border-orange-400 border-opacity-40 hover:border-orange-300 hover:border-opacity-80
          text-xs md:text-sm font-bold
          whitespace-nowrap
          backdrop-blur-sm
          drop-shadow-lg
          [text-shadow:_2px_2px_4px_rgb(0_0_0_/_80%)]
          ${isPulsing ? 'animate-pulse scale-110' : 'scale-100'}
          ${hasPopped ? 'animate-bounce' : ''}
          ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 scale-95'}
        `}
        size="sm"
        style={{
          animationDuration: hasPopped ? '0.6s' : undefined,
          animationTimingFunction: hasPopped ? 'cubic-bezier(0.68, -0.55, 0.265, 1.55)' : undefined,
        }}
      >
        Nu găsești modelul tău?
      </Button>
    </div>
  );
} 