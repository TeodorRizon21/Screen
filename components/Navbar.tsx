"use client";

import Link from "next/link";
import { ShoppingCart, Package, User, Globe, Menu } from "lucide-react";
import { useCart } from "@/contexts/cart-context";
import { Button } from "@/components/ui/button";
import { SignInButton, SignUpButton, UserButton, useUser } from "@clerk/nextjs";
import SearchBar from "./SearchBar";
import MobileMenu from "./MobileMenu";
import { useLanguage } from "@/contexts/language-context";
import { useScroll } from "@/contexts/scroll-context";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

export default function Navbar() {
  const { state } = useCart();
  const { isSignedIn, user } = useUser();
  const { language, setLanguage, t } = useLanguage();
  const { isScrolled } = useScroll();
  const itemCount = state.items.reduce((acc, item) => acc + item.quantity, 0);
  const isAdmin = user?.publicMetadata?.isAdmin === true;

  return (
    <nav
      className={`fixed left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled ? "top-0" : "top-0 px-4 py-2"
      }`}
    >
      <div
        className={`container mx-auto bg-background rounded-t-lg rounded-l-lg rounded-r-lg shadow-[0_4px_10px_rgba(0,0,0,0.15)] px-4 sm:px-8 py-3 sm:py-5 ${
          isScrolled ? "rounded-b-none mb-0" : "my-2"
        }`}
      >
        <div className="flex items-center justify-between">
          {/* Mobile Menu */}
          <div className="block lg:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[300px] sm:w-[400px]">
                <SheetHeader>
                  <SheetTitle>Menu</SheetTitle>
                </SheetHeader>
                <div className="flex flex-col gap-4 mt-8">
                  <SearchBar className="w-full" />
                  {isAdmin && (
                    <Link href="/admin" className="w-full">
                      <Button
                        variant="outline"
                        className="w-full justify-start"
                      >
                        {t("nav.admin")}
                      </Button>
                    </Link>
                  )}
                  <Link href="/orders" className="w-full">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                    >
                      <Package className="h-5 w-5" />
                      Orders
                    </Button>
                  </Link>
                  <Link href="/cart" className="w-full">
                    <Button
                      variant="outline"
                      className="w-full justify-start gap-2"
                    >
                      <ShoppingCart className="h-5 w-5" />
                      Cart{" "}
                      {itemCount > 0 && (
                        <span className="bg-[#F57228] text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                          {itemCount}
                        </span>
                      )}
                    </Button>
                  </Link>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Logo - Centered on mobile, left on desktop */}
          <div className="flex-1 flex justify-center lg:justify-start">
            <Link href="/" className="text-2xl uppercase font-bold">
              ScreenShield
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden lg:flex items-center gap-8">
            <SearchBar className="w-64" />
            <div className="flex items-center gap-4">
              {isAdmin && (
                <Link href="/admin">
                  <Button variant="ghost">{t("nav.admin")}</Button>
                </Link>
              )}
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
                    <User className="h-5 w-5" />
                  </Button>
                </SignInButton>
              )}
            </div>
          </div>

          {/* Mobile User Button */}
          <div className="block lg:hidden">
            {isSignedIn ? (
              <UserButton afterSignOutUrl="/" />
            ) : (
              <SignInButton mode="modal">
                <Button variant="ghost" size="icon">
                  <User className="h-5 w-5" />
                </Button>
              </SignInButton>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
