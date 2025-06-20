"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTrigger,
} from "@/components/ui/sheet";
import { COLLECTIONS } from "@/lib/collections";
import { cn } from "@/lib/utils";
import { useUser } from "@clerk/nextjs";
import { useLanguage } from "@/contexts/language-context";

export default function MobileMenu() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();
  const isAdmin = user?.publicMetadata?.isAdmin === true;
  const { t } = useLanguage();

  const getHref = (collection: string) => {
    if (collection === COLLECTIONS.Home) return "/";
    if (collection === COLLECTIONS.About_Foil) return "/despre-folie";
    if (collection === COLLECTIONS.All_Products)
      return "/collection/allproducts";
    const collectionKey = Object.keys(COLLECTIONS).find(
      (key) => COLLECTIONS[key as keyof typeof COLLECTIONS] === collection
    );
    return `/collection/${encodeURIComponent(collectionKey || collection)}`;
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="h-6 w-6" />
          <span className="sr-only">Toggle menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0 flex flex-col">
        <SheetHeader className="border-b p-4">
          <h2 className="text-lg font-semibold">Menu</h2>
        </SheetHeader>
        <div className="flex-1 overflow-auto py-4">
          <nav className="flex flex-col px-4">
            {Object.values(COLLECTIONS).map((collection) => (
              <Link
                key={collection}
                href={getHref(collection)}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "py-2 text-lg transition-colors hover:text-primary",
                  pathname === getHref(collection)
                    ? "text-primary font-medium"
                    : "text-muted-foreground"
                )}
              >
                {collection}
              </Link>
            ))}
          </nav>
        </div>
        <div className="border-t p-4 mt-auto">
          {isAdmin && (
            <div className="flex items-center justify-between">
              <Link
                href="/admin"
                className="flex items-center space-x-2"
                onClick={() => setIsOpen(false)}
              >
                <span>{t("nav.admin")}</span>
              </Link>
            </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
