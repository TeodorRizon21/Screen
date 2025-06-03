"use client";

import { useState, useEffect } from "react";
import { useCart } from "@/contexts/cart-context";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ProductWithVariants, SizeVariant } from "@/lib/types";
import { ShoppingCart } from "lucide-react";

interface AddToCartButtonProps {
  product: ProductWithVariants;
  selectedSize?: string;
  className?: string;
}

export default function AddToCartButton({
  product,
  selectedSize: propSelectedSize,
  className,
}: AddToCartButtonProps) {
  const [selectedSize, setSelectedSize] = useState<string>(
    propSelectedSize || ""
  );
  const { dispatch, state } = useCart();

  useEffect(() => {
    if (propSelectedSize) {
      setSelectedSize(propSelectedSize);
    }
  }, [propSelectedSize]);

  const selectedVariant = product.sizeVariants
    ? product.sizeVariants.find((v) => v.size === selectedSize)
    : undefined;
  const isOutOfStock =
    !selectedVariant ||
    (selectedVariant.stock === 0 && !product.allowOutOfStock);

  // Calculate remaining stock for the selected variant
  const currentCartQuantity = state.items
    .filter(
      (i) => i.product.id === product.id && i.selectedSize === selectedSize
    )
    .reduce((acc, i) => acc + i.quantity, 0);
  const remainingStock = selectedVariant
    ? product.allowOutOfStock
      ? Infinity
      : Math.max(0, selectedVariant.stock - currentCartQuantity)
    : 0;

  const handleAddToCart = () => {
    const selectedVariant = product.sizeVariants.find(
      (v) => v.size === selectedSize
    );
    if (!selectedVariant) {
      toast({
        title: "Error",
        description: "Please select a size.",
        variant: "destructive",
      });
      return;
    }

    if (isOutOfStock) {
      toast({
        title: "Cannot add to cart",
        description: "This product is out of stock for the selected size.",
        variant: "destructive",
      });
      return;
    }

    if (remainingStock === 0) {
      toast({
        title: "Maximum quantity reached",
        description: `You already have all available items (${currentCartQuantity}) for this size in your cart.`,
        variant: "destructive",
      });
      return;
    }

    dispatch({
      type: "ADD_TO_CART",
      payload: {
        product,
        size: selectedSize,
        variant: selectedVariant,
        quantity: 1,
      },
    });
    toast({
      title: "Added to cart",
      description: `${product.name} (${selectedSize}) has been added to your cart.`,
    });
  };

  const button = (
    <Button
      onClick={handleAddToCart}
      className={className}
      disabled={isOutOfStock}
    >
      {isOutOfStock ? (
        "Out of Stock"
      ) : (
        <span className="flex items-center justify-center gap-1 w-full">
          <ShoppingCart className="h-4 w-4" />
          <span>Add to Cart</span>
        </span>
      )}
    </Button>
  );

  // Only show tooltip for completely out of stock items
  if (isOutOfStock) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{button}</TooltipTrigger>
          <TooltipContent>
            <p>This product is currently out of stock for the selected size</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div className="flex gap-2">
      {!propSelectedSize && (
        <Select value={selectedSize} onValueChange={setSelectedSize}>
          <SelectTrigger className="w-24">
            <SelectValue placeholder="Size" />
          </SelectTrigger>
          <SelectContent>
            {product.sizeVariants.map((sizeVariant) => {
              const cartQuantity = state.items
                .filter(
                  (i) =>
                    i.product.id === product.id &&
                    i.selectedSize === sizeVariant.size
                )
                .reduce((acc, i) => acc + i.quantity, 0);
              const remaining = product.allowOutOfStock
                ? Infinity
                : Math.max(0, sizeVariant.stock - cartQuantity);

              return (
                <SelectItem
                  key={sizeVariant.size}
                  value={sizeVariant.size}
                  disabled={sizeVariant.stock === 0 && !product.allowOutOfStock}
                >
                  {sizeVariant.size}
                  {sizeVariant.stock === 0 && !product.allowOutOfStock
                    ? " (Out of Stock)"
                    : remaining === 0
                    ? ` (${cartQuantity} in cart)`
                    : remaining !== Infinity
                    ? ` (${remaining} available)`
                    : ""}
                </SelectItem>
              );
            })}
          </SelectContent>
        </Select>
      )}
      {button}
    </div>
  );
}
