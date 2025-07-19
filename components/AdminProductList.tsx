"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";

interface SizeVariant {
  id: string;
  size: string;
  price: number;
  oldPrice: number | null;
  stock: number;
  lowStockThreshold: number | null;
}

interface ProductWithVariants {
  id: string;
  name: string;
  description: string;
  images: string[];
  sizeVariants: SizeVariant[];
  allowOutOfStock: boolean;
  showStockLevel: boolean;
}

export default function AdminProductList() {
  const [products, setProducts] = useState<ProductWithVariants[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");
  const router = useRouter();

  // Debounce search term
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch products when search term changes
  useEffect(() => {
    fetchProducts();
  }, [debouncedSearchTerm]);

  const fetchProducts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch(
        `/api/admin/products?search=${encodeURIComponent(debouncedSearchTerm)}`
      );
      if (!response.ok) {
        throw new Error("Failed to fetch products");
      }
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
      toast({
        title: "Error",
        description: "Failed to fetch products. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      try {
        const response = await fetch(`/api/admin/products/${productId}`, {
          method: "DELETE",
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete product");
        }

        setProducts(products.filter((p) => p.id !== productId));
        toast({
          title: "Success",
          description: "Product deleted successfully.",
        });
      } catch (error) {
        console.error("Error deleting product:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to delete product. It may be associated with existing orders.",
          variant: "destructive",
        });
      }
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <Button onClick={() => router.push("/admin/products/new")}>
          Add New Product
        </Button>
        <div className="relative w-1/3">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <Input
            type="text"
            placeholder="Caută produse după nume sau descriere..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 bg-white w-full"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center py-8">Se încarcă produsele...</div>
      ) : products.length > 0 ? (
        products.map((product) => (
          <div key={product.id} className="border rounded-lg p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h2 className="text-xl font-semibold">{product.name}</h2>
                <p className="text-gray-600">{product.description}</p>
              </div>
              <div className="flex space-x-4">
                <Link href={`/admin/products/edit/${product.id}`}>
                  <Button>Edit</Button>
                </Link>
                <Button
                  variant="destructive"
                  onClick={() => handleDeleteProduct(product.id)}
                >
                  Delete
                </Button>
              </div>
            </div>
            <div className="flex space-x-4 mb-4">
              <Image
                src={product.images[0]}
                alt={product.name}
                width={40}
                height={40}
                className="object-cover rounded-md"
              />
            </div>
            {product.sizeVariants && product.sizeVariants.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Size</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Old Price</TableHead>
                    <TableHead>Stock</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.sizeVariants.map((variant) => (
                    <TableRow key={variant.id}>
                      <TableCell>{variant.size}</TableCell>
                      <TableCell>${variant.price.toFixed(2)}</TableCell>
                      <TableCell>
                        {variant.oldPrice
                          ? `$${variant.oldPrice.toFixed(2)}`
                          : "-"}
                      </TableCell>
                      <TableCell>{variant.stock}</TableCell>
                      <TableCell>
                        {variant.stock === 0 && !product.allowOutOfStock ? (
                          <Badge variant="destructive">Out of Stock</Badge>
                        ) : variant.stock <=
                          (variant.lowStockThreshold || 5) ? (
                          <Badge variant="secondary">Low Stock</Badge>
                        ) : (
                          <Badge variant="default">In Stock</Badge>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p>No size variants available for this product.</p>
            )}
          </div>
        ))
      ) : (
        <div className="text-center py-8 text-gray-500">
          Nu s-au găsit produse{searchTerm ? " pentru căutarea efectuată" : ""}
        </div>
      )}
    </div>
  );
}
