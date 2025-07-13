import { OrderItem, OrderDetails, OrderDiscountCode, DiscountCode, Product as PrismaProduct } from "@prisma/client";

export interface Product {
  id: string;
  name: string;
  description?: string;
  price: number;
  images: string[];
  category?: string;
  make?: string;
  model?: string;
  year?: string;
  tags?: string[];
}

export interface SizeVariant {
  id: string;
  size: string;
  price: number;
  oldPrice?: number | null;
  stock: number;
  lowStockThreshold?: number | null;
}

export interface ProductWithVariants extends Product {
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

export type OrderWithItems = {
  id: string;
  userId?: string;
  items: (OrderItem & { product: PrismaProduct })[];
  details: OrderDetails;
  total: number;
  paymentStatus: string;
  orderStatus: string;
  createdAt: Date;
  updatedAt: Date;
  paymentType?: string | null;
  courier?: string | null;
  awb?: string | null;
  dpdShipmentId?: string | null;
  dpdOperationCode?: string | null;
  orderNumber?: string | null;
  oblioInvoiceId?: string | null;
  oblioInvoiceNumber?: string | null;
  oblioInvoiceUrl?: string | null;
  discountCodes: (OrderDiscountCode & { discountCode: DiscountCode })[];
};

