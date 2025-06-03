"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { ShoppingCart, Package, X, ArrowUp } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { SignInButton, UserButton, useUser } from "@clerk/nextjs";
import { Button } from "@/components/ui/button";
import Logo from "@/public/logoscreenshield.png";
import Image from "next/image";

// Add type for car makes data
interface CarMake {
  make: string;
}

export function ScoutNavbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [carMakes, setCarMakes] = useState<string[]>([]);
  const { state } = useCart();
  const { isSignedIn, user } = useUser();
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const itemCount = state.items.reduce((acc, item) => acc + item.quantity, 0);
  const isAdmin = user?.publicMetadata?.isAdmin === true;
  const [showScrollTop, setShowScrollTop] = useState(false);

  // Fetch car makes from database
  useEffect(() => {
    const fetchCarMakes = async () => {
      try {
        console.log("Fetching car makes...");
        const response = await fetch("/api/admin/cars");
        const data = await response.json();
        console.log("Received car makes:", data);
        const makes = data.map((item: CarMake) => item.make).filter(Boolean);
        setCarMakes(makes);
      } catch (error) {
        console.error("Error fetching car makes:", error);
      }
    };

    fetchCarMakes();
  }, []);

  // Debug pentru carMakes
  useEffect(() => {
    console.log("Current car makes state:", carMakes);
  }, [carMakes]);

  // Logica pentru ascunderea navbar-ului la scroll
  const [showNavbar, setShowNavbar] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 40) {
        setShowNavbar(false);
      } else {
        setShowNavbar(true);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Adăugăm logica pentru butonul de scroll to top
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > 300) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Funcție pentru a converti numele mărcii în cheia colecției
  const getCollectionKey = (make: string) => {
    if (!make || typeof make !== "string") return "";

    // Înlocuim spațiile și cratimele cu underscore înainte de conversie
    const normalizedMake = make.replace(/[\s-]+/g, "_");

    // Convertim numele mărcii în formatul cheii (prima literă mare, restul litere mici)
    return normalizedMake
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join("_");
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <>
      <div
        className={`c-header_outer transition-all duration-500 ease-in-out ${
          showNavbar
            ? "opacity-100 pointer-events-auto translate-y-0"
            : "opacity-0 pointer-events-none -translate-y-10"
        }`}
      >
        <div className="c-header_primary c-header_col">
          {/* Left razor/cutout */}
          <div className="c-header_col-razor">
            <div
              style={{ backgroundColor: isHomePage ? "#000000" : "#f5f5f5" }}
            ></div>
          </div>

          <div className="c-header_col-bg"></div>

          {/* Logo on the left */}
          <Link
            href="/"
            className="c-header_logo ml-4 sm:ml-12 flex justify-center sm:justify-start w-full sm:w-auto"
            aria-label="ScreenShield"
          >
            <Image
              src={Logo}
              alt="ScreenShield"
              width={150}
              height={50}
              className="w-[150px] sm:w-[100px]"
            />
          </Link>

          {/* Products navigation - evenly spaced */}
          <div className="c-header_products">
            <span className="u-sr-only">Navigation</span>
            <ul className="c-header_nav">
              <li className="c-header_nav-item">
                <Link
                  href="/my-cars"
                  className="c-header_link -product c-button -link"
                >
                  Mașinile Mele
                </Link>
              </li>
              <li className="c-header_nav-item">
                <Link
                  href="/collection/allproducts"
                  className="c-header_link -product c-button -link"
                >
                  Toate Produsele
                </Link>
              </li>
              <li className="c-header_nav-item">
                <Link
                  href="/collection/Sales"
                  className="c-header_link -product c-button -link text-red-600 font-semibold"
                >
                  REDUCERI
                </Link>
              </li>
              {isAdmin && (
                <li className="c-header_nav-item">
                  <Link
                    href="/admin"
                    className="c-header_link -product c-button -link"
                  >
                    Admin
                  </Link>
                </li>
              )}
            </ul>
          </div>

          {/* Right razor/cutout */}
          <div className="c-header_col-razor">
            <div
              style={{ backgroundColor: isHomePage ? "#000000" : "#f5f5f5" }}
            ></div>
          </div>
        </div>

        <div
          className="c-header_secondary c-header_col"
          tabIndex={-1}
          id="secondary-nav"
        >
          {/* Left razor/cutout */}
          <div className="c-header_col-razor">
            <div
              style={{ backgroundColor: isHomePage ? "#000000" : "#f5f5f5" }}
            ></div>
          </div>

          <div className="c-header_col-bg"></div>

          {/* Secondary navigation with icons */}
          <div className="flex items-center gap-4">
            <Link href="/cart">
              <Button variant="ghost" size="icon" className="relative">
                <ShoppingCart className="h-5 w-5" />
                {itemCount > 0 && (
                  <span className="absolute -top-2 -right-2 !bg-[#F57228] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                    {itemCount}
                  </span>
                )}
              </Button>
            </Link>

            <Link href="/orders">
              <Button variant="ghost" size="icon">
                <Package className="h-5 w-5" />
              </Button>
            </Link>

            {isSignedIn ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <SignInButton mode="modal">
                <Button variant="ghost" size="icon">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    className="h-5 w-5"
                  >
                    <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
                    <circle cx="12" cy="7" r="4" />
                  </svg>
                </Button>
              </SignInButton>
            )}
          </div>

          {/* Custom hamburger menu icon with two lines */}
          <button
            type="button"
            data-menu-toggler=""
            id="headerMenuToggler"
            aria-label="Menu"
            className="c-button c-header_menu-toggler -light -menu"
            onClick={() => setIsOpen(!isOpen)}
          >
            <div className="hamburger-icon">
              <span className="hamburger-line"></span>
              <span className="hamburger-line"></span>
            </div>
          </button>

          {/* Right razor/cutout */}
          <div className="c-header_col-razor">
            <div
              style={{ backgroundColor: isHomePage ? "#000000" : "#f5f5f5" }}
            ></div>
          </div>
        </div>
      </div>

      {/* Floating Menu */}
      <div
        className={`fixed top-[calc(var(--header-height,64px)+var(--header-mt,24px)+8px)] left-1/2 transform -translate-x-1/2 bg-white shadow-lg rounded-lg transition-all duration-300 ease-in-out z-50 w-[calc(100%-2rem)] max-w-[1440px] ${
          isOpen
            ? "opacity-100 translate-y-0"
            : "opacity-0 -translate-y-4 pointer-events-none"
        }`}
      >
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold block lg:hidden">Navigare</h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-full"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Mobile Menu */}
          <div className="block lg:hidden">
            <div className="flex flex-col gap-2">
              <Link
                href="/my-cars"
                className="block py-2 px-4 hover:bg-gray-100 rounded-md transition-colors text-sm"
                onClick={() => setIsOpen(false)}
              >
                Mașinile Mele
              </Link>
              <Link
                href="/collection/allproducts"
                className="block py-2 px-4 hover:bg-gray-100 rounded-md transition-colors text-sm"
                onClick={() => setIsOpen(false)}
              >
                Toate Produsele
              </Link>
              <Link
                href="/collection/Sales"
                className="block py-2 px-4 hover:bg-gray-100 rounded-md transition-colors text-sm text-red-600 font-semibold"
                onClick={() => setIsOpen(false)}
              >
                REDUCERI
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="block py-2 px-4 hover:bg-gray-100 rounded-md transition-colors text-sm"
                  onClick={() => setIsOpen(false)}
                >
                  Admin
                </Link>
              )}
            </div>
          </div>

          {/* Desktop Menu */}
          <div className="hidden lg:block">
            <h2 className="text-xl font-semibold mb-4">Mărci de Mașini</h2>
            <div className="grid grid-cols-3 gap-2">
              {carMakes
                .filter((make) => make && typeof make === "string")
                .map((make) => {
                  const collectionKey = getCollectionKey(make);
                  return (
                    <Link
                      key={make}
                      href={`/collection/${collectionKey}`}
                      className="block py-2 px-4 hover:bg-gray-100 rounded-md transition-colors text-sm"
                      onClick={() => setIsOpen(false)}
                    >
                      {make}
                    </Link>
                  );
                })}
            </div>
          </div>
        </div>
      </div>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Scroll to Top Button */}
      <button
        onClick={scrollToTop}
        className={`fixed bottom-20 right-4 bg-[#F57228] text-white p-3 rounded-full shadow-lg transition-all duration-300 z-50 ${
          showScrollTop
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-10 pointer-events-none"
        }`}
        aria-label="Scroll to top"
      >
        <ArrowUp className="h-6 w-6 text-white" />
      </button>
    </>
  );
}
