"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { MessageSquare, Plus } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RequestFoilButton() {
  const router = useRouter();
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    // Setez pulsarea la fiecare 5 secunde
    const interval = setInterval(() => {
      setIsPulsing(true);
      // Opresc pulsarea după 1 secundă
      setTimeout(() => setIsPulsing(false), 1000);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const handleClick = () => {
    router.push("/request-foil");
  };

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
        `}
        size="sm"
      >
        Nu găsești modelul tău?
      </Button>
    </div>
  );
} 