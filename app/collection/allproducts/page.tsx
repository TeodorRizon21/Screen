"use client";

import CollectionContent from "@/components/CollectionContent";
import { COLLECTIONS } from "@/lib/collections";

export default function AllProductsPage({
  searchParams,
}: {
  searchParams: { sort?: string };
}) {
  return (
    <CollectionContent
      collection={COLLECTIONS.All_Products}
      initialSort={searchParams.sort}
    />
  );
}
