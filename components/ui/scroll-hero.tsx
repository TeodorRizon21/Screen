"use client";

import { useEffect, useState, useRef } from "react";
import Image from "next/image";

export default function ScrollHero() {
  const [imagePosition, setImagePosition] = useState(0); // Start at 0% (left side)
  const lastScrollTopRef = useRef(0);
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Reduce scroll range to make effect more responsive
    const scrollRange = 1000;

    const handleScroll = () => {
      const currentScrollTop =
        window.scrollY || document.documentElement.scrollTop;

      // Calculate percentage scrolled (0 to 1)
      const percentScrolled = Math.min(
        1,
        Math.max(0, currentScrollTop / scrollRange)
      );

      // Update the image position based on scroll
      setImagePosition(percentScrolled * 300); // Map 0-1 to 0-300%

      // Update last scroll position
      lastScrollTopRef.current = currentScrollTop;
    };

    window.addEventListener("scroll", handleScroll);

    // Create a div that allows scrolling but is hidden
    const scrollableDiv = document.createElement("div");
    scrollableDiv.style.height = `${scrollRange + window.innerHeight}px`;
    scrollableDiv.style.position = "absolute";
    scrollableDiv.style.top = "0";
    scrollableDiv.style.left = "0";
    scrollableDiv.style.width = "100%";
    scrollableDiv.style.pointerEvents = "none";
    scrollableDiv.style.zIndex = "-1";
    document.body.appendChild(scrollableDiv);

    // Reset scroll position when component mounts
    window.scrollTo(0, 0);

    return () => {
      window.removeEventListener("scroll", handleScroll);
      document.body.removeChild(scrollableDiv);
    };
  }, []);

  // Calculate the width of the revealed area based on the racleta position
  const revealWidth = Math.min(100, Math.max(0, imagePosition / 3 + 10));

  return (
    <>
      {/* Secțiunea pentru scroll */}
      <div
        style={{
          height: "100vh",
          position: "absolute",
          width: "100%",
          top: 0,
          left: 0,
          zIndex: -2,
        }}
      ></div>

      <div
        ref={heroRef}
        className="absolute w-full h-[100vh] flex items-center justify-center bg-black pointer-events-none"
        style={{
          zIndex: 30,
          top: 0,
        }}
      >
        <div className="relative w-full max-w-5xl h-[60vh] mx-auto overflow-hidden rounded-lg mt-16">
          {/* X6 AMP Base image (visible everywhere except under the mask) */}
          <div className="absolute inset-0">
            <Image
              src="/x6amp.png"
              alt="X6 Amplified"
              fill
              className="object-cover object-center"
              priority
            />
            <div className="absolute bottom-8 right-8 bg-black/70 text-white px-4 py-2 rounded-md z-10">
              X6 AMP
            </div>
          </div>

          {/* X6 with clip path mask (visible only on left of racleta) */}
          <div
            className="absolute inset-0"
            style={{
              clipPath: `polygon(0 0, ${revealWidth}% 0, ${revealWidth}% 100%, 0 100%)`,
            }}
          >
            <Image
              src="/x6.webp"
              alt="X6 BMW"
              fill
              className="object-cover object-center"
              priority
            />
            <div className="absolute bottom-8 left-8 bg-black/70 text-white px-4 py-2 rounded-md">
              X6
            </div>
          </div>

          {/* Sliding racleta - rotated 90 degrees */}
          <div
            className="absolute inset-y-0 w-1/3 transition-transform duration-100 z-20 drop-shadow-xl"
            style={{
              left: 0,
              transform: `translateX(${imagePosition}%)`,
              transitionTimingFunction: "ease-out",
            }}
          >
            <div className="relative h-full w-full">
              <Image
                src="/racleta.png"
                alt="Racleta"
                fill
                className="object-contain"
                style={{ transform: "rotate(-90deg)" }}
                priority
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
