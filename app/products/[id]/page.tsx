import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductDetails from "@/components/ProductDetails";
import RelatedProducts from "@/components/RelatedProducts";
import { ProductWithVariants } from "@/lib/types";

async function getProduct(id: string): Promise<ProductWithVariants | null> {
  try {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        sizeVariants: true,
      },
    });
    return product as ProductWithVariants | null;
  } catch (error) {
    console.error("Failed to fetch product:", error);
    return null;
  }
}

async function getOtherProducts(
  currentProductId: string
): Promise<ProductWithVariants[]> {
  try {
    return await prisma.product.findMany({
      where: {
        id: {
          not: currentProductId,
        },
      },
      include: {
        sizeVariants: true,
      },
    });
  } catch (error) {
    console.error("Failed to fetch other products:", error);
    return [];
  }
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { size?: string };
}) {
  const product = await getProduct(params.id);
  const otherProducts = await getOtherProducts(params.id);

  if (!product) {
    notFound();
  }

  return (
    <div className="space-y-16 mb-16">
      <ProductDetails product={product} initialSize={searchParams.size} />
      <RelatedProducts products={otherProducts} currentProductId={params.id} />
    </div>
  );
}
