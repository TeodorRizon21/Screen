"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Product } from "@prisma/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import ImageUpload from "@/components/ImageUpload";
import { ArrowUp, ArrowDown } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { COLLECTIONS } from "@/lib/collections";

type EditProductFormProps = {
  product: Product;
};

export default function EditProductForm({ product }: EditProductFormProps) {
  const [editedProduct, setEditedProduct] = useState<Product>(product);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch(`/api/admin/products/${editedProduct.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...editedProduct,
          price: parseFloat(editedProduct.price.toString()),
          oldPrice: editedProduct.oldPrice
            ? parseFloat(editedProduct.oldPrice.toString())
            : null,
          stock: parseInt(editedProduct.stock.toString()),
          lowStockThreshold: editedProduct.lowStockThreshold
            ? parseInt(editedProduct.lowStockThreshold.toString())
            : null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update product");
      }

      toast({
        title: "Success",
        description: "Product updated successfully.",
      });
      router.push("/admin/products");
    } catch (error) {
      console.error("Error updating product:", error);
      toast({
        title: "Error",
        description: "Failed to update product. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const moveImage = (index: number, direction: "up" | "down") => {
    setEditedProduct((prevState) => {
      const newImages = [...prevState.images];
      if (direction === "up" && index > 0) {
        [newImages[index - 1], newImages[index]] = [
          newImages[index],
          newImages[index - 1],
        ];
      } else if (direction === "down" && index < newImages.length - 1) {
        [newImages[index], newImages[index + 1]] = [
          newImages[index + 1],
          newImages[index],
        ];
      }
      return { ...prevState, images: newImages };
    });
  };

  const handleCategoryChange = (category: string) => {
    const newCollections = editedProduct.collections.includes(category)
      ? editedProduct.collections.filter((c) => c !== category)
      : [...editedProduct.collections, category];

    // Ensure "All products" is always included
    if (!newCollections.includes(COLLECTIONS.All_Products)) {
      newCollections.push(COLLECTIONS.All_Products);
    }

    setEditedProduct((prevState) => ({
      ...prevState,
      collections: newCollections,
    }));
  };

  const toggleOnSale = (checked: boolean) => {
    setEditedProduct((prevState) => {
      if (checked) {
        return {
          ...prevState,
          oldPrice: prevState.price,
          collections: [...prevState.collections, COLLECTIONS.Sales].filter(
            (v, i, a) => a.indexOf(v) === i
          ),
        };
      } else {
        const { oldPrice, ...rest } = prevState;
        return {
          ...rest,
          oldPrice: null,
          collections: prevState.collections.filter(
            (c) => c !== COLLECTIONS.Sales
          ),
        };
      }
    });
  };

  const handleDelete = async () => {
    if (window.confirm("Are you sure you want to delete this product?")) {
      setIsLoading(true);
      try {
        const response = await fetch(
          `/api/admin/products/${editedProduct.id}`,
          {
            method: "DELETE",
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Failed to delete product");
        }

        toast({
          title: "Success",
          description: "Product deleted successfully.",
        });
        router.push("/admin/products");
      } catch (error) {
        console.error("Error deleting product:", error);
        toast({
          title: "Error",
          description:
            error instanceof Error
              ? error.message
              : "Failed to delete product. Please try again.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl">
      <div>
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          value={editedProduct.name}
          onChange={(e) =>
            setEditedProduct((prevState) => ({
              ...prevState,
              name: e.target.value,
            }))
          }
          required
        />
      </div>
      <div>
        <Label htmlFor="price">Price</Label>
        <Input
          id="price"
          type="number"
          step="0.01"
          value={editedProduct.price}
          onChange={(e) =>
            setEditedProduct((prevState) => ({
              ...prevState,
              price: parseFloat(e.target.value),
            }))
          }
          required
        />
      </div>
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={editedProduct.description}
          onChange={(e) =>
            setEditedProduct((prevState) => ({
              ...prevState,
              description: e.target.value,
            }))
          }
          required
        />
      </div>
      <div>
        <Label htmlFor="sizes">Sizes (comma-separated)</Label>
        <Input
          id="sizes"
          value={editedProduct.sizes.join(", ")}
          onChange={(e) =>
            setEditedProduct((prevState) => ({
              ...prevState,
              sizes: e.target.value.split(",").map((s) => s.trim()),
            }))
          }
          placeholder="30ml, 50ml, 100ml"
          required
        />
      </div>
      <div>
        <Label htmlFor="stock">Stock Quantity</Label>
        <Input
          id="stock"
          type="number"
          value={editedProduct.stock}
          onChange={(e) =>
            setEditedProduct((prevState) => ({
              ...prevState,
              stock: parseInt(e.target.value),
            }))
          }
          min="0"
          required
        />
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="allowOutOfStock"
          checked={editedProduct.allowOutOfStock}
          onCheckedChange={(checked) =>
            setEditedProduct((prevState) => ({
              ...prevState,
              allowOutOfStock: checked as boolean,
            }))
          }
        />
        <Label htmlFor="allowOutOfStock">Stock nelimitat</Label>
      </div>

      <div className="flex items-center space-x-2">
        <Checkbox
          id="showStockLevel"
          checked={editedProduct.showStockLevel}
          onCheckedChange={(checked) =>
            setEditedProduct((prevState) => ({
              ...prevState,
              showStockLevel: checked as boolean,
            }))
          }
        />
        <Label htmlFor="showStockLevel">Clienti vad stock-ul produsului</Label>
      </div>

      {editedProduct.showStockLevel && (
        <div>
          <Label htmlFor="lowStockThreshold">
            Show "Only X left" when stock is below
          </Label>
          <Input
            id="lowStockThreshold"
            type="number"
            value={editedProduct.lowStockThreshold || ""}
            onChange={(e) =>
              setEditedProduct((prevState) => ({
                ...prevState,
                lowStockThreshold: parseInt(e.target.value) || null,
              }))
            }
            min="0"
          />
        </div>
      )}
      <div>
        <Label>Categories</Label>
        <div className="grid grid-cols-2 gap-4 mt-2">
          {Object.values(COLLECTIONS)
            .filter(
              (c) => c !== COLLECTIONS.All_Products && c !== COLLECTIONS.Sales
            )
            .map((category) => (
              <div key={category} className="flex items-center space-x-2">
                <Checkbox
                  id={`category-${category}`}
                  checked={editedProduct.collections.includes(category)}
                  onCheckedChange={() => handleCategoryChange(category)}
                />
                <Label htmlFor={`category-${category}`}>{category}</Label>
              </div>
            ))}
        </div>
      </div>
      <div>
        <div className="flex items-center space-x-2">
          <Checkbox
            id="onSale"
            checked={editedProduct.collections.includes(COLLECTIONS.Sales)}
            onCheckedChange={(checked) => toggleOnSale(checked as boolean)}
          />
          <Label htmlFor="onSale">On Sale</Label>
        </div>
        {editedProduct.collections.includes(COLLECTIONS.Sales) && (
          <div className="mt-2">
            <Label htmlFor="oldPrice">Old Price</Label>
            <Input
              id="oldPrice"
              type="number"
              step="0.01"
              value={editedProduct.oldPrice || ""}
              onChange={(e) => {
                const newOldPrice = parseFloat(e.target.value);
                if (newOldPrice > editedProduct.price) {
                  setEditedProduct((prevState) => ({
                    ...prevState,
                    oldPrice: newOldPrice,
                  }));
                } else {
                  toast({
                    title: "Error",
                    description:
                      "Old price must be greater than the current price.",
                    variant: "destructive",
                  });
                }
              }}
              required
            />
          </div>
        )}
      </div>
      <div>
        <Label>Product Images</Label>
        <ImageUpload
          value={editedProduct.images}
          onChange={(urls) =>
            setEditedProduct((prevState) => ({ ...prevState, images: urls }))
          }
        />
      </div>
      <div>
        <Label>Reorder Images</Label>
        <ul className="space-y-2">
          {editedProduct.images.map((image, index) => (
            <li
              key={image}
              className="flex items-center space-x-2 p-2 bg-gray-100 rounded"
            >
              <img
                src={image}
                alt={`Product image ${index + 1}`}
                className="w-16 h-16 object-cover rounded"
              />
              <span>Image {index + 1}</span>
              <div className="ml-auto space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => moveImage(index, "up")}
                  disabled={index === 0}
                >
                  <ArrowUp className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  onClick={() => moveImage(index, "down")}
                  disabled={index === editedProduct.images.length - 1}
                >
                  <ArrowDown className="h-4 w-4" />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="flex justify-between">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.push("/admin/products")}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={handleDelete}
          disabled={isLoading}
        >
          Delete Product
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Updating..." : "Update Product"}
        </Button>
      </div>
    </form>
  );
}
