"use client";

import { createContext, useContext, useReducer, useEffect } from "react";
import { ProductWithVariants, SizeVariant } from "@/lib/types";

type CartItem = {
  product: ProductWithVariants;
  quantity: number;
  selectedSize: string;
  variant: SizeVariant;
};

type CartState = {
  items: CartItem[];
  total: number;
  appliedDiscounts: Array<{
    code: string;
    type: "percentage" | "fixed" | "free_shipping";
    value: number;
  }>;
};

type CartAction =
  | {
      type: "ADD_TO_CART";
      payload: {
        product: ProductWithVariants;
        size: string;
        variant: SizeVariant;
        quantity: number;
      };
    }
  | { type: "REMOVE_FROM_CART"; payload: { productId: string; size: string } }
  | {
      type: "UPDATE_QUANTITY";
      payload: { productId: string; size: string; quantity: number };
    }
  | { type: "LOAD_CART"; payload: CartState }
  | { type: "CLEAR_CART" }
  | {
      type: "APPLY_DISCOUNT";
      payload: {
        code: string;
        type: "percentage" | "fixed" | "free_shipping";
        value: number;
      };
    }
  | { type: "REMOVE_DISCOUNT"; payload: { code: string } };

const CartContext = createContext<{
  state: CartState;
  dispatch: React.Dispatch<CartAction>;
} | null>(null);

function cartReducer(state: CartState, action: CartAction): CartState {
  switch (action.type) {
    case "ADD_TO_CART": {
      const existingItemIndex = state.items.findIndex(
        (item) =>
          item.product.id === action.payload.product.id &&
          item.selectedSize === action.payload.size
      );

      // Get the variant's stock limit
      const variant = action.payload.product.sizeVariants.find(
        (v) => v.size === action.payload.size
      );
      if (!variant) return state;

      const currentQuantity =
        existingItemIndex > -1 ? state.items[existingItemIndex].quantity : 0;
      const allowOutOfStock = action.payload.product.allowOutOfStock;
      const maxQuantity = allowOutOfStock ? Infinity : variant.stock;

      // Check if adding the specified quantity would exceed the stock limit
      if (currentQuantity + action.payload.quantity > maxQuantity) {
        return state;
      }

      if (existingItemIndex > -1) {
        const newItems = [...state.items];
        newItems[existingItemIndex].quantity += action.payload.quantity;
        return {
          ...state,
          items: newItems,
          total:
            state.total +
            action.payload.variant.price * action.payload.quantity,
        };
      }

      return {
        ...state,
        items: [
          ...state.items,
          {
            product: action.payload.product,
            quantity: action.payload.quantity,
            selectedSize: action.payload.size,
            variant: action.payload.variant,
          },
        ],
        total:
          state.total + action.payload.variant.price * action.payload.quantity,
      };
    }
    case "REMOVE_FROM_CART": {
      const itemToRemove = state.items.find(
        (item) =>
          item.product.id === action.payload.productId &&
          item.selectedSize === action.payload.size
      );
      if (!itemToRemove) return state;

      return {
        ...state,
        items: state.items.filter(
          (item) =>
            !(
              item.product.id === action.payload.productId &&
              item.selectedSize === action.payload.size
            )
        ),
        total: state.total - itemToRemove.variant.price * itemToRemove.quantity,
      };
    }
    case "UPDATE_QUANTITY": {
      const itemIndex = state.items.findIndex(
        (item) =>
          item.product.id === action.payload.productId &&
          item.selectedSize === action.payload.size
      );
      if (itemIndex === -1) return state;

      const item = state.items[itemIndex];
      const variant = item.product.sizeVariants.find(
        (v) => v.size === item.selectedSize
      );
      if (!variant) return state;

      // Check if the new quantity would exceed the stock limit
      const allowOutOfStock = item.product.allowOutOfStock;
      const maxQuantity = allowOutOfStock ? Infinity : variant.stock;
      if (action.payload.quantity > maxQuantity) {
        return state;
      }

      const quantityDiff = action.payload.quantity - item.quantity;
      const newItems = [...state.items];
      newItems[itemIndex] = { ...item, quantity: action.payload.quantity };

      return {
        ...state,
        items: newItems,
        total: state.total + item.variant.price * quantityDiff,
      };
    }
    case "LOAD_CART": {
      return action.payload;
    }
    case "APPLY_DISCOUNT": {
      return {
        ...state,
        appliedDiscounts: [...state.appliedDiscounts, action.payload],
      };
    }
    case "REMOVE_DISCOUNT": {
      return {
        ...state,
        appliedDiscounts: state.appliedDiscounts.filter(
          (discount) => discount.code !== action.payload.code
        ),
      };
    }
    case "CLEAR_CART": {
      return { items: [], total: 0, appliedDiscounts: [] };
    }
    default:
      return state;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(cartReducer, {
    items: [],
    total: 0,
    appliedDiscounts: [],
  });

  useEffect(() => {
    const savedCart = localStorage.getItem("cart");
    if (savedCart) {
      const parsedCart = JSON.parse(savedCart);
      // Asigură-te că appliedDiscounts există în datele salvate
      const cartWithDiscounts = {
        ...parsedCart,
        appliedDiscounts: parsedCart.appliedDiscounts || [],
      };
      dispatch({ type: "LOAD_CART", payload: cartWithDiscounts });
    }
  }, []);

  useEffect(() => {
    // Salvează starea completă în localStorage
    localStorage.setItem(
      "cart",
      JSON.stringify({
        ...state,
        appliedDiscounts: state.appliedDiscounts || [],
      })
    );
  }, [state]);

  return (
    <CartContext.Provider value={{ state, dispatch }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
