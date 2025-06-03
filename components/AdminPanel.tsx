"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import ImageUpload from "@/components/ImageUpload";
import { Product } from "@prisma/client";
import { COLLECTIONS, Collection } from "@/lib/collections";
import { Trash2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import carsData from "@/app/cars/cars.json";

interface SizeVariant {
  id?: string;
  size: string;
  price: string;
  oldPrice: string;
  stock: string;
  lowStockThreshold: string;
}

type AdminPanelProps = {
  product?: Product & {
    sizeVariants: Array<{
      id: string;
      size: string;
      price: number;
      oldPrice: number | null;
      stock: number;
      lowStockThreshold: number | null;
    }>;
  };
};

export default function AdminPanel({ product }: AdminPanelProps) {
  const [name, setName] = useState(product?.name || "");
  const [description, setDescription] = useState(product?.description || "");
  const [images, setImages] = useState<string[]>(product?.images || []);
  const [allowOutOfStock, setAllowOutOfStock] = useState(
    product?.allowOutOfStock || false
  );
  const [showStockLevel, setShowStockLevel] = useState(
    product?.showStockLevel || false
  );
  const [sizeVariants, setSizeVariants] = useState<SizeVariant[]>(
    product?.sizeVariants.map((variant) => ({
      id: variant.id,
      size: variant.size,
      price: variant.price.toString(),
      oldPrice: variant.oldPrice?.toString() || "",
      stock: variant.stock.toString(),
      lowStockThreshold: variant.lowStockThreshold?.toString() || "",
    })) || []
  );
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // State pentru selecția mașinilor
  const [selectedMake, setSelectedMake] = useState<string>(product?.make || "");
  const [selectedModel, setSelectedModel] = useState<string>(
    product?.model || ""
  );
  const [selectedGeneration, setSelectedGeneration] = useState<string>(
    product?.generation || ""
  );
  const [availableModels, setAvailableModels] = useState<
    Array<{ model: string; generations: string[] }>
  >([]);
  const [availableGenerations, setAvailableGenerations] = useState<string[]>(
    []
  );

  const [selectedCollections, setSelectedCollections] = useState<Collection[]>([
    "All_Products",
  ]);

  useEffect(() => {
    if (selectedMake) {
      const makeData = carsData.find((car) => car.make === selectedMake);
      if (makeData) {
        setAvailableModels(makeData.models);
        setSelectedModel("");
        setSelectedGeneration("");
      }
    }
  }, [selectedMake]);

  useEffect(() => {
    if (selectedModel && selectedMake) {
      const modelData = availableModels.find((m) => m.model === selectedModel);
      if (modelData) {
        setAvailableGenerations(modelData.generations);
        setSelectedGeneration("");
      }
    }
  }, [selectedModel, availableModels]);

  useEffect(() => {
    // Initialize array with All_Products collection
    const newCollections: Collection[] = ["All_Products"];

    // Add the brand-specific collection
    if (selectedMake) {
      // Convert brand name to match collection key format
      const makeCollection = Object.entries(COLLECTIONS).find(
        ([_, value]) => value === selectedMake
      )?.[0] as Collection | undefined;
      
      if (makeCollection) {
        newCollections.push(makeCollection);
      }
    }

    // Check for discounts
    const hasDiscount = sizeVariants.some(
      (variant) =>
        variant.oldPrice &&
        parseFloat(variant.oldPrice) > parseFloat(variant.price)
    );
    if (hasDiscount) {
      newCollections.push("Sales");
    }

    setSelectedCollections(newCollections);
  }, [sizeVariants, selectedMake]);

  const addSizeVariant = () => {
    setSizeVariants([
      ...sizeVariants,
      {
        size: "",
        price: "",
        oldPrice: "",
        stock: "0",
        lowStockThreshold: "",
      },
    ]);
  };

  const removeSizeVariant = (index: number) => {
    setSizeVariants(sizeVariants.filter((_, i) => i !== index));
  };

  const updateSizeVariant = (
    index: number,
    field: keyof SizeVariant,
    value: string
  ) => {
    setSizeVariants((prev) => {
      const newVariants = [...prev];
      newVariants[index] = { ...newVariants[index], [field]: value };
      return newVariants;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    if (!selectedMake || !selectedModel || !selectedGeneration) {
      toast({
        title: "Error",
        description:
          "Please select a make, model, and generation for the product",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (images.length === 0) {
      toast({
        title: "Error",
        description: "Please upload at least one image",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    if (sizeVariants.length === 0) {
      toast({
        title: "Error",
        description: "Please add at least one size variant",
        variant: "destructive",
      });
      setIsLoading(false);
      return;
    }

    // Validate size variants
    for (const variant of sizeVariants) {
      if (!variant.size || !variant.price) {
        toast({
          title: "Error",
          description: "All size variants must have a size and price",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }

      if (
        variant.oldPrice &&
        parseFloat(variant.oldPrice) <= parseFloat(variant.price)
      ) {
        toast({
          title: "Error",
          description: "Old price must be greater than current price",
          variant: "destructive",
        });
        setIsLoading(false);
        return;
      }
    }

    // Verificăm dacă există prețuri reduse pentru a adăuga produsul în colecția de reduceri
    const hasDiscount = sizeVariants.some(
      (variant) =>
        variant.oldPrice &&
        parseFloat(variant.oldPrice) > parseFloat(variant.price)
    );

    try {
      const response = await fetch(
        product ? `/api/admin/products/${product.id}` : "/api/admin/products",
        {
          method: product ? "PUT" : "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name,
            description,
            images,
            collections: selectedCollections,
            allowOutOfStock,
            showStockLevel,
            make: selectedMake,
            model: selectedModel,
            generation: selectedGeneration,
            sizeVariants: sizeVariants.map((variant) => ({
              id: variant.id,
              size: variant.size,
              price: parseFloat(variant.price),
              oldPrice: variant.oldPrice ? parseFloat(variant.oldPrice) : null,
              stock: parseInt(variant.stock),
              lowStockThreshold: variant.lowStockThreshold
                ? parseInt(variant.lowStockThreshold)
                : null,
            })),
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to create product");
      }

      toast({
        title: "Success",
        description: product
          ? "Product updated successfully"
          : "Product added successfully",
      });
      router.push("/admin/products");
    } catch (error) {
      console.error("Error adding/updating product:", error);
      toast({
        title: "Error",
        description:
          error instanceof Error
            ? error.message
            : "Failed to add/update product",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-8 text-gray-800">
          {product ? "Edit Product" : "Add New Product"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information Section */}
          <div className="bg-gray-50 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-700">
              Basic Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <Label htmlFor="name" className="text-gray-700">
                  Product Name
                </Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="description" className="text-gray-700">
                  Description
                </Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  required
                  className="mt-2"
                />
              </div>
            </div>
          </div>

          {/* Car Information Section */}
          <div className="bg-gray-50 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-700">
              Car Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <Label className="text-gray-700">Make</Label>
                <Select value={selectedMake} onValueChange={setSelectedMake}>
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="Select a make" />
                  </SelectTrigger>
                  <SelectContent>
                    {carsData.map((car) => (
                      <SelectItem key={car.make} value={car.make}>
                        {car.make}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedMake && (
                <div>
                  <Label className="text-gray-700">Model</Label>
                  <Select
                    value={selectedModel}
                    onValueChange={setSelectedModel}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select a model" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map((model) => (
                        <SelectItem key={model.model} value={model.model}>
                          {model.model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {selectedModel && (
                <div>
                  <Label className="text-gray-700">Generation</Label>
                  <Select
                    value={selectedGeneration}
                    onValueChange={setSelectedGeneration}
                  >
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select a generation" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableGenerations.map((generation) => (
                        <SelectItem key={generation} value={generation}>
                          {generation}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>

          {/* Images Section */}
          <div className="bg-gray-50 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-700">
              Product Images
            </h3>
            <div className="space-y-4 mb-8">
              <div className="flex flex-col space-y-2">
                <Label htmlFor="images">Imagini (min. 1)</Label>
                <ImageUpload
                  value={images}
                  onChange={(urls) => setImages(urls)}
                  maxFiles={5}
                />
              </div>
            </div>
          </div>

          {/* Size Variants Section */}
          <div className="bg-gray-50 rounded-lg p-6 space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-700">
                Size Variants
              </h3>
              <Button
                type="button"
                onClick={addSizeVariant}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Add Size Variant
              </Button>
            </div>
            <div className="space-y-4">
              {sizeVariants.map((variant, index) => (
                <Card key={index} className="border-0 shadow-sm">
                  <CardContent className="pt-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                      <div>
                        <Label className="text-gray-700">Size</Label>
                        <Input
                          value={variant.size}
                          onChange={(e) =>
                            updateSizeVariant(index, "size", e.target.value)
                          }
                          required
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-700">Price</Label>
                        <Input
                          type="number"
                          value={variant.price}
                          onChange={(e) =>
                            updateSizeVariant(index, "price", e.target.value)
                          }
                          required
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-700">
                          Old Price (optional)
                        </Label>
                        <Input
                          type="number"
                          value={variant.oldPrice}
                          onChange={(e) =>
                            updateSizeVariant(index, "oldPrice", e.target.value)
                          }
                          className="mt-2"
                        />
                      </div>
                      <div>
                        <Label className="text-gray-700">Stock</Label>
                        <Input
                          type="number"
                          value={variant.stock}
                          onChange={(e) =>
                            updateSizeVariant(index, "stock", e.target.value)
                          }
                          required
                          className="mt-2"
                        />
                      </div>
                      {showStockLevel && (
                        <div>
                          <Label className="text-gray-700">
                            Low Stock Threshold
                          </Label>
                          <Input
                            type="number"
                            value={variant.lowStockThreshold}
                            onChange={(e) =>
                              updateSizeVariant(
                                index,
                                "lowStockThreshold",
                                e.target.value
                              )
                            }
                            className="mt-2"
                          />
                        </div>
                      )}
                      <div className="flex items-end">
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeSizeVariant(index)}
                          className="w-full"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Settings Section */}
          <div className="bg-gray-50 rounded-lg p-6 space-y-6">
            <h3 className="text-lg font-semibold text-gray-700">
              Product Settings
            </h3>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Checkbox
                  id="allowOutOfStock"
                  checked={allowOutOfStock}
                  onCheckedChange={(checked) =>
                    setAllowOutOfStock(checked as boolean)
                  }
                />
                <Label htmlFor="allowOutOfStock" className="text-gray-700">
                  Allow sales when out of stock
                </Label>
              </div>

              <div className="flex items-center space-x-3">
                <Checkbox
                  id="showStockLevel"
                  checked={showStockLevel}
                  onCheckedChange={(checked) =>
                    setShowStockLevel(checked as boolean)
                  }
                />
                <Label htmlFor="showStockLevel" className="text-gray-700">
                  Show stock level to customers
                </Label>
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-blue-600 hover:bg-blue-700 px-8 py-6 text-lg"
            >
              {isLoading
                ? product
                  ? "Updating..."
                  : "Adding..."
                : product
                ? "Update Product"
                : "Add Product"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
