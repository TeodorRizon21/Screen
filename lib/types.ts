import { Product as PrismaProduct } from "@prisma/client";

export interface Product {
  id: string;
  name: string;
  description: string;
  images: string[];
  allowOutOfStock: boolean;
  showStockLevel: boolean;
  make: string;
  model: string;
  generation: string;
  tags?: string[];
  createdAt: Date;
  updatedAt: Date;
}

export interface SizeVariant {
  id: string;
  size: string;
  price: number;
  oldPrice?: number | null;
  stock: number;
  lowStockThreshold?: number | null;
}

export interface ProductWithVariants extends PrismaProduct {
  sizeVariants: {
    id: string;
    size: string;
    price: number;
    oldPrice?: number | null;
    stock: number;
    lowStockThreshold?: number | null;
  }[];
  tags?: string[];
}

