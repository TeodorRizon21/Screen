"use client";

import { useState, useEffect, useCallback } from "react";
import type { ProductWithVariants } from "@/lib/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SORT_OPTIONS, COLLECTIONS } from "@/lib/collections";
import ProductCard from "./ProductCard";
import { useRouter, usePathname } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Search, X } from "lucide-react";

interface CollectionContentProps {
  collection: string;
  initialSort?: string;
}

export default function CollectionContent({
  collection,
  initialSort = SORT_OPTIONS.DEFAULT,
}: CollectionContentProps) {
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<
    ProductWithVariants[]
  >([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const [searchQuery, setSearchQuery] = useState("");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [maxPrice, setMaxPrice] = useState(1000);
  const [selectedMake, setSelectedMake] = useState<string>("_all");
  const [selectedModel, setSelectedModel] = useState<string>("_all");
  const [selectedGeneration, setSelectedGeneration] = useState<string>("_all");

  // Lists pentru filtre disponibile
  const [availableMakes, setAvailableMakes] = useState<string[]>([]);
  const [availableModels, setAvailableModels] = useState<string[]>([]);
  const [availableGenerations, setAvailableGenerations] = useState<string[]>(
    []
  );

  // Determină colecția curentă pentru a bloca marca dacă este necesă
  const [collectionKey, setCollectionKey] = useState<string | null>(null);

  // Mapare între numele colecției și marca corespunzătoare
  const collectionToMake: Record<string, string> = {
    Bmw: "BMW",
    Mercedes_Benz: "Mercedes-Benz",
    Audi: "Audi",
    Volkswagen: "Volkswagen",
    Porsche: "Porsche",
    Tesla: "Tesla",
    Volvo: "Volvo",
    Land_Rover: "Land Rover",
    Jaguar: "Jaguar",
  };

  useEffect(() => {
    // Detectăm colecția curentă din URL
    const currentCollectionKey = Object.keys(COLLECTIONS).find(
      (key) => COLLECTIONS[key as keyof typeof COLLECTIONS] === collection
    );
    setCollectionKey(currentCollectionKey || null);

    // Dacă suntem pe o pagină de marcă specifică, setăm automat marca selectată
    if (
      currentCollectionKey &&
      collectionToMake[currentCollectionKey as keyof typeof collectionToMake]
    ) {
      setSelectedMake(
        collectionToMake[currentCollectionKey as keyof typeof collectionToMake]
      );
    } else {
      setSelectedMake("_all");
    }
  }, [collection, collectionToMake]);

  useEffect(() => {
    async function fetchProducts() {
      try {
        const endpoint = `/api/products/collection?collection=${encodeURIComponent(
          collectionKey || collection
        )}`;

        const response = await fetch(`${endpoint}&sort=${initialSort}`);
        if (!response.ok) throw new Error("Failed to fetch products");
        const data = await response.json();
        setProducts(data);
        setFilteredProducts(data);

        // Găsim prețul maxim considerând toate variațiile produselor
        let highestPrice = 0;
        data.forEach((product: ProductWithVariants) => {
          if (product.sizeVariants && product.sizeVariants.length > 0) {
            product.sizeVariants.forEach((variant) => {
              if (variant.price > highestPrice) {
                highestPrice = variant.price;
              }
            });
          }
        });

        setMaxPrice(Math.ceil(highestPrice / 100) * 100); // Rotunjește la 100 în sus
        setPriceRange([0, highestPrice]);

        // Extrage opțiunile de filtrare disponibile
        const makes = Array.from(
          new Set(
            data
              .filter((p: ProductWithVariants) => p.make)
              .map((p: ProductWithVariants) => p.make)
          )
        );
        const models = Array.from(
          new Set(
            data
              .filter((p: ProductWithVariants) => p.model)
              .map((p: ProductWithVariants) => p.model)
          )
        );
        const generations = Array.from(
          new Set(
            data
              .filter((p: ProductWithVariants) => p.generation)
              .map((p: ProductWithVariants) => p.generation)
          )
        );

        setAvailableMakes(makes as string[]);
        setAvailableModels(models as string[]);
        setAvailableGenerations(generations as string[]);
      } catch (error) {
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchProducts();
  }, [collection, initialSort, collectionKey]);

  // Verificarea condiției de început pentru filtrarea modelelor
  useEffect(() => {
    if (products.length === 0) return;

    if (selectedMake !== "_all") {
      const filteredModels = Array.from(
        new Set(
          products
            .filter(
              (p: ProductWithVariants) => p.make === selectedMake && p.model
            )
            .map((p: ProductWithVariants) => p.model)
        )
      ) as string[];

      setAvailableModels(filteredModels);

      // Resetăm modelul selectat dacă nu mai e valid
      if (selectedModel !== "_all" && !filteredModels.includes(selectedModel)) {
        setSelectedModel("_all");
      }
    } else {
      // Dacă nu e selectată marca, arătăm toate modelele
      const allModels = Array.from(
        new Set(
          products
            .filter((p: ProductWithVariants) => p.model)
            .map((p: ProductWithVariants) => p.model)
        )
      ) as string[];

      setAvailableModels(allModels);
    }
  }, [selectedMake, products, selectedModel]);

  // Verificarea condiției de început pentru filtrarea generațiilor
  useEffect(() => {
    if (products.length === 0) return;

    if (selectedModel !== "_all") {
      const filteredGenerations = Array.from(
        new Set(
          products
            .filter(
              (p: ProductWithVariants) =>
                (selectedMake !== "_all" ? p.make === selectedMake : true) &&
                p.model === selectedModel &&
                p.generation
            )
            .map((p: ProductWithVariants) => p.generation)
        )
      ) as string[];

      setAvailableGenerations(filteredGenerations);

      // Resetăm generația selectată dacă nu mai e validă
      if (
        selectedGeneration !== "_all" &&
        !filteredGenerations.includes(selectedGeneration)
      ) {
        setSelectedGeneration("_all");
      }
    } else {
      // Dacă nu e selectat modelul, arătăm generațiile corespunzătoare mărcii selectate
      const filteredGenerations = Array.from(
        new Set(
          products
            .filter(
              (p: ProductWithVariants) =>
                (selectedMake !== "_all" ? p.make === selectedMake : true) &&
                p.generation
            )
            .map((p: ProductWithVariants) => p.generation)
        )
      ) as string[];

      setAvailableGenerations(filteredGenerations);
    }
  }, [selectedModel, selectedMake, products, selectedGeneration]);

  const filterProducts = useCallback(() => {
    let result = [...products];

    // Filtrare după text
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (product) =>
          product.name.toLowerCase().includes(query) ||
          (product.make && product.make.toLowerCase().includes(query)) ||
          (product.model && product.model.toLowerCase().includes(query)) ||
          (product.generation &&
            product.generation.toLowerCase().includes(query))
      );
    }

    // Filtrare după preț - verificăm dacă ORICARE dintre variațiile produsului se încadrează în interval
    result = result.filter((product) => {
      // Dacă produsul nu are variații, returnăm false
      if (!product.sizeVariants || product.sizeVariants.length === 0) {
        return false;
      }

      // Verificăm dacă măcar o variație se încadrează în intervalul de preț
      return product.sizeVariants.some(
        (variant) =>
          variant.price >= priceRange[0] && variant.price <= priceRange[1]
      );
    });

    // Filtrare după marcă
    if (selectedMake !== "_all") {
      result = result.filter((product) => product.make === selectedMake);
    }

    // Filtrare după model
    if (selectedModel !== "_all") {
      result = result.filter((product) => product.model === selectedModel);
    }

    // Filtrare după generație
    if (selectedGeneration !== "_all") {
      result = result.filter(
        (product) => product.generation === selectedGeneration
      );
    }

    setFilteredProducts(result);
  }, [searchQuery, priceRange, selectedMake, selectedModel, selectedGeneration, products]);

  // Filtrarea produselor când se schimbă searchQuery sau filtrele
  useEffect(() => {
    filterProducts();
  }, [filterProducts]);

  const handleSortChange = (value: string) => {
    router.push(`${pathname}?sort=${value}`);
  };

  const resetFilters = () => {
    setSearchQuery("");
    setPriceRange([0, maxPrice]);

    // Nu resetăm marca dacă suntem pe o pagină specifică unei mărci
    if (
      !collectionKey ||
      !collectionToMake[collectionKey as keyof typeof collectionToMake]
    ) {
      setSelectedMake("_all");
    }

    setSelectedModel("_all");
    setSelectedGeneration("_all");
  };

  if (isLoading) {
    return <div className="container mx-auto px-6 py-12">Loading...</div>;
  }

  // Verifică dacă suntem pe o pagină specifică unei mărci
  const isOnBrandPage = Boolean(
    collectionKey &&
      collectionToMake[collectionKey as keyof typeof collectionToMake]
  );

  // Funcție helper pentru a formata numele colecțiilor
  const formatCollectionName = (name: string) => {
    // Excludem colecțiile speciale
    if (name === "ALL_PRODUCTS") return "Toate Produsele";
    if (name === "SALES") return "Reduceri";
    if (name === "MY_CARS") return "Mașinile Mele";
    if (name === "HOME") return "Acasă";

    // Pentru mărci de mașini, formatăm numele
    return name
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(" ");
  };

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="flex flex-col md:flex-row justify-between items-start mb-8 gap-4">
        <h1 className="text-3xl font-bold">
          {formatCollectionName(collection)}
        </h1>

        <div className="flex flex-col md:flex-row items-center gap-4 w-full md:w-auto">
          {/* Search bar */}
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              className="pl-8 pr-4"
              placeholder="Caută produse..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-4 w-4 text-gray-400" />
              </button>
            )}
          </div>

          {/* Sort dropdown */}
          <Select defaultValue={initialSort} onValueChange={handleSortChange}>
            <SelectTrigger className="w-full md:w-[180px]">
              <SelectValue placeholder="Sortează după" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={SORT_OPTIONS.DEFAULT}>
                Nume (A la Z)
              </SelectItem>
              <SelectItem value={SORT_OPTIONS.NAME_DESC}>
                Nume (Z la A)
              </SelectItem>
              <SelectItem value={SORT_OPTIONS.PRICE_ASC}>
                Preț (Mic la Mare)
              </SelectItem>
              <SelectItem value={SORT_OPTIONS.PRICE_DESC}>
                Preț (Mare la Mic)
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Filter panel */}
      <div className="mb-8 p-4 border rounded-lg bg-gray-50">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-medium">Filtrează produsele</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={resetFilters}
            className="text-blue-500 hover:text-blue-700"
          >
            Resetează filtrele
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Price Range */}
          <div>
            <Label className="mb-2 block">Interval de preț</Label>
            <div className="py-6 px-2">
              <Slider
                defaultValue={[0, maxPrice]}
                max={maxPrice}
                step={1}
                value={priceRange}
                onValueChange={(value) =>
                  setPriceRange(value as [number, number])
                }
                className="mb-4"
              />
              <div className="flex justify-between">
                <span>{priceRange[0]} RON</span>
                <span>{priceRange[1]} RON</span>
              </div>
            </div>
          </div>

          {/* Make filter (dropdown) */}
          <div>
            <Label htmlFor="make-filter" className="mb-2 block">
              Marcă
            </Label>
            <Select
              value={selectedMake}
              onValueChange={setSelectedMake}
              disabled={isOnBrandPage}
            >
              <SelectTrigger className="w-full" id="make-filter">
                <SelectValue placeholder="Selectează marca" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Toate mărcile</SelectItem>
                {availableMakes.map((make) => (
                  <SelectItem key={make} value={make}>
                    {make}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isOnBrandPage && (
              <p className="text-xs text-gray-500 mt-1">
                Marca este fixată pentru această colecție
              </p>
            )}
          </div>

          {/* Model filter (dropdown) */}
          <div>
            <Label htmlFor="model-filter" className="mb-2 block">
              Model
            </Label>
            <Select
              value={selectedModel}
              onValueChange={setSelectedModel}
              disabled={availableModels.length === 0}
            >
              <SelectTrigger className="w-full" id="model-filter">
                <SelectValue placeholder="Selectează modelul" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Toate modelele</SelectItem>
                {availableModels.map((model) => (
                  <SelectItem key={model} value={model}>
                    {model}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableModels.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Nu există modele disponibile
              </p>
            )}
          </div>

          {/* Generation filter (dropdown) */}
          <div>
            <Label htmlFor="generation-filter" className="mb-2 block">
              Generație
            </Label>
            <Select
              value={selectedGeneration}
              onValueChange={setSelectedGeneration}
              disabled={availableGenerations.length === 0}
            >
              <SelectTrigger className="w-full" id="generation-filter">
                <SelectValue placeholder="Selectează generația" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="_all">Toate generațiile</SelectItem>
                {availableGenerations.map((generation) => (
                  <SelectItem key={generation} value={generation}>
                    {generation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {availableGenerations.length === 0 && (
              <p className="text-xs text-gray-500 mt-1">
                Nu există generații disponibile
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Results count */}
      <div className="mb-6 text-gray-600">
        {filteredProducts.length} produse găsite
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center p-12 border rounded-lg">
          <p className="text-xl text-gray-700 mb-2">
            Nu am găsit niciun produs
          </p>
          <p className="text-gray-500">
            Încearcă să schimbi criteriile de căutare sau filtrele.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 max-[750px]:grid-cols-1 min-[750px]:grid-cols-2 min-[1000px]:grid-cols-3 min-[1500px]:grid-cols-4 gap-8 md:gap-12 items-stretch">
          {filteredProducts.map((product) => (
            <div key={product.id} className="flex justify-center">
              <ProductCard product={product} maxPrice={priceRange[1]} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
