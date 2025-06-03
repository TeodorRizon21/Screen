"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import type { Product } from "@prisma/client";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/contexts/language-context";

interface SearchBarProps {
  className?: string;
}

type ProductWithCarInfo = Product & {
  make?: string | null;
  model?: string | null;
  generation?: string | null;
};

export default function SearchBar({ className }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<ProductWithCarInfo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const { t } = useLanguage();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        searchRef.current &&
        !searchRef.current.contains(event.target as Node)
      ) {
        setSearchResults([]);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSearch = useCallback(async () => {
    if (!searchTerm) {
      setSearchResults([]);
      return;
    }

    try {
      const response = await fetch(`/api/products/search?q=${searchTerm}`);
      if (!response.ok) throw new Error("Failed to fetch search results");
      const data = await response.json();
      setSearchResults(data);
    } catch (error) {
      console.error("Search error:", error);
      setSearchResults([]);
    }
  }, [searchTerm]);

  useEffect(() => {
    const timer = setTimeout(() => {
      handleSearch();
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, handleSearch]);

  const handleProductClick = (productId: string) => {
    setSearchResults([]);
    setSearchTerm("");
    router.push(`/products/${productId}`);
  };

  const getHighlightedText = (text: string, highlight: string) => {
    if (!highlight.trim()) return text;
    const regex = new RegExp(`(${highlight})`, "gi");
    return text.replace(regex, "<mark>$1</mark>");
  };

  return (
    <div className={`relative ${className}`} ref={searchRef}>
      <div className="flex items-center relative w-full">
        <Input
          type="text"
          placeholder={t("search.placeholder")}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pr-8 rounded-full bg-transparent placeholder:text-gray-500 text-black border border-gray-300 focus-visible:ring-1 focus-visible:ring-black"
        />
        <Search className="h-5 w-5 absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500" />
      </div>
      {isLoading && (
        <div className="absolute z-10 mt-2 w-full bg-white shadow-lg rounded-md p-2 text-center">
          Loading...
        </div>
      )}
      {!isLoading && searchResults.length > 0 && (
        <div className="absolute z-10 mt-2 w-full bg-white shadow-lg rounded-md overflow-hidden">
          {searchResults.map((product) => (
            <div
              key={product.id}
              onClick={() => handleProductClick(product.id)}
              className="flex items-center p-2 hover:bg-gray-100 cursor-pointer"
            >
              <Image
                src={product.images[0] || "/placeholder.svg"}
                alt={product.name}
                width={40}
                height={40}
                className="rounded-md object-cover"
              />
              <div className="ml-2 flex-1">
                <p className="font-semibold">{product.name}</p>
                {(product.make || product.model || product.generation) && (
                  <p className="text-xs text-gray-500">
                    {[product.make, product.model, product.generation]
                      .filter(Boolean)
                      .join(" • ")}
                  </p>
                )}
                <p className="text-sm text-gray-600">
                  ${product.price.toFixed(2)}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
