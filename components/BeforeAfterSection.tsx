"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";

export default function BeforeAfterSection() {
  const [sliderPosition, setSliderPosition] = useState(15);
  const [isMobile, setIsMobile] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const scrollableRef = useRef(true);

  // Calculăm lățimea racletei în funcție de tipul de dispozitiv
  const racletaWidth = isMobile ? "40%" : "30%";

  useEffect(() => {
    // Detectăm dacă este dispozitiv mobil
    const checkIsMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    // Verificăm inițial și la redimensionare
    checkIsMobile();
    window.addEventListener("resize", checkIsMobile);

    // Funcție pentru a verifica dacă secțiunea este în viewpoint
    const isInViewport = () => {
      if (!sectionRef.current) return false;
      const rect = sectionRef.current.getBoundingClientRect();
      const threshold = window.innerHeight / 2; // Adjusted threshold
      return rect.top <= threshold && rect.bottom >= 0;
    };

    // Funcție pentru scroll
    const handleScroll = (e: Event) => {
      if (!sectionRef.current || isMobile) return; // Skip scroll handling on mobile

      const currentScrollY = window.scrollY;
      const scrollingDown = currentScrollY > lastScrollY.current;
      const inView = isInViewport();

      if (inView) {
        if (scrollingDown) {
          if (sliderPosition < 100) {
            setSliderPosition((prev) => Math.min(100, prev + 2));
            if (sliderPosition < 98) {
              e.preventDefault();
              window.scrollTo(0, lastScrollY.current);
              setIsLocked(true);
              return;
            }
          }
          setIsLocked(false);
        } else {
          setSliderPosition((prev) => Math.max(15, prev - 2));
          setIsLocked(false);
        }
      } else {
        setIsLocked(false);
      }

      lastScrollY.current = currentScrollY;
    };

    // Prevenirea scrollului normal când suntem blocați în secțiune
    const preventDefaultScroll = (e: WheelEvent) => {
      if (isLocked) {
        e.preventDefault();

        // Actualizăm poziția sliderului în funcție de direcția de scroll
        const delta = e.deltaY > 0 ? 2 : -2;
        setSliderPosition((prev) => Math.max(15, Math.min(100, prev + delta)));
      }
    };

    // Touch event handlers
    const handleTouchStart = (e: TouchEvent) => {
      if (!isInViewport()) return;
      setTouchStartY(e.touches[0].clientY);
      setIsDragging(true);
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!isDragging || !isInViewport()) return;

      const touchY = e.touches[0].clientY;
      const diff = touchStartY - touchY;
      const sensitivity = 1.5; // Increased sensitivity for mobile

      // Update slider position based on touch movement
      setSliderPosition((prev) => {
        const newPosition = prev + (diff * sensitivity) / 10;
        return Math.max(15, Math.min(100, newPosition));
      });

      setTouchStartY(touchY);
    };

    const handleTouchEnd = () => {
      setIsDragging(false);
    };

    // Add event listeners
    if (isMobile) {
      window.addEventListener("touchstart", handleTouchStart, { passive: true });
      window.addEventListener("touchmove", handleTouchMove, { passive: true });
      window.addEventListener("touchend", handleTouchEnd);
    } else {
      window.addEventListener("scroll", handleScroll, { passive: false });
      window.addEventListener("wheel", preventDefaultScroll, { passive: false });
    }

    // Cleanup
    return () => {
      window.removeEventListener("resize", checkIsMobile);
      if (isMobile) {
        window.removeEventListener("touchstart", handleTouchStart);
        window.removeEventListener("touchmove", handleTouchMove);
        window.removeEventListener("touchend", handleTouchEnd);
      } else {
        window.removeEventListener("scroll", handleScroll);
        window.removeEventListener("wheel", preventDefaultScroll);
      }
    };
  }, [sliderPosition, isLocked, isMobile, isDragging, touchStartY]);

  return (
    <div ref={containerRef} className="w-full relative py-8">
      <div
        ref={sectionRef}
        className="w-full h-[60vh] md:h-[70vh] bg-black mx-auto md:rounded-lg overflow-hidden shadow-lg"
      >
        <div className="relative w-full h-full">
          {/* Container pentru imaginile de before/after */}
          <div className="relative w-full h-full overflow-hidden">
            {/* X6 AMP - Imagine vizibilă de la început, sub tot */}
            <div className="absolute inset-0">
              <Image
                src="/x6amp.png"
                alt="X6 AMP"
                fill
                className="object-contain md:object-cover"
                priority
                unoptimized
              />
              <div
                className="absolute bottom-4 md:bottom-8 right-4 md:right-8 bg-black/70 text-white px-2 py-1 md:px-4 md:py-2 rounded-md text-xs md:text-base"
                style={{
                  opacity: Math.min(1, sliderPosition / 50),
                  transition: "opacity 0.3s ease",
                }}
              >
                X6 AMP
              </div>
            </div>

            {/* X6 - Imagine vizibilă doar în stânga racletei */}
            <div
              className="absolute inset-0 overflow-hidden"
              style={{
                clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
              }}
            >
              <Image
                src="/x6.webp"
                alt="X6"
                fill
                className="object-contain md:object-cover"
                priority
                unoptimized
              />
              <div
                className="absolute bottom-4 md:bottom-8 left-4 md:left-8 bg-black/70 text-white px-2 py-1 md:px-4 md:py-2 rounded-md text-xs md:text-base"
                style={{
                  opacity: Math.max(0, 1 - sliderPosition / 50),
                  transition: "opacity 0.3s ease",
                }}
              >
                X6
              </div>
            </div>

            {/* Racleta - poziționată pe marginea dintre cele două imagini */}
            <div
              className="absolute inset-y-0 z-20"
              style={{
                left: `${sliderPosition}%`,
                transform: "translateX(-50%)",
                transition: "left 0.05s linear",
                width: racletaWidth,
                height: "100%",
              }}
            >
              <div className="relative h-full w-full">
                <Image
                  src="/racleta.png"
                  alt="Racleta"
                  fill
                  className="object-contain"
                  style={{
                    transform: "rotate(-90deg) scale(1, 2)",
                    transformOrigin: "center",
                  }}
                  priority
                  unoptimized
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
