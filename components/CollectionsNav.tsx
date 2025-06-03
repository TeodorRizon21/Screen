"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { COLLECTIONS } from "@/lib/collections";
import { useScroll } from "@/contexts/scroll-context";

export default function CollectionsNav() {
  const pathname = usePathname();
  const { isScrolled } = useScroll();

  const getHref = (collection: string) => {
    if (collection === COLLECTIONS.Home) return "/";
    if (collection === COLLECTIONS.My_Cars) return "/my-cars";
    if (collection === COLLECTIONS.All_Products)
      return "/collection/allproducts";
    const collectionKey = Object.keys(COLLECTIONS).find(
      (key) => COLLECTIONS[key as keyof typeof COLLECTIONS] === collection
    );
    return `/collection/${encodeURIComponent(collectionKey || collection)}`;
  };

  return (
    <nav
      className={`hidden md:block fixed left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled ? "top-[72px]" : "top-[80px]"
      }`}
    >
      <div
        className={`container mx-auto ${isScrolled ? "-mt-[1px]" : ""} px-4`}
      >
        <div
          className={`bg-background rounded-l-lg rounded-r-lg shadow-[0_4px_10px_rgba(0,0,0,0.15)] px-8 py-3 ${
            isScrolled ? "rounded-t-none my-0 mt-0 pt-4" : "rounded-t-lg my-2"
          }`}
        >
          <ul className="flex items-center justify-center space-x-10 overflow-x-auto">
            {Object.values(COLLECTIONS).map((collection) => (
              <li key={collection}>
                <Link
                  href={getHref(collection)}
                  className={cn(
                    "whitespace-nowrap text-sm font-medium transition-colors hover:text-primary",
                    pathname === getHref(collection)
                      ? "text-primary"
                      : "text-muted-foreground"
                  )}
                >
                  {collection}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </nav>
  );
}
