import { redirect } from "next/navigation";
import { COLLECTIONS } from "@/lib/collections";
import CollectionContent from "@/components/CollectionContent";

export default function CollectionPage({
  params,
  searchParams,
}: {
  params: { name: string };
  searchParams: { sort?: string };
}) {
  // Verify valid collection
  const decodedName = decodeURIComponent(params.name);
  if (!Object.keys(COLLECTIONS).includes(decodedName)) {
    console.log("Invalid collection:", decodedName);
    console.log("Available collections:", Object.keys(COLLECTIONS));
    redirect("/");
  }

  return (
    <CollectionContent
      collection={COLLECTIONS[decodedName as keyof typeof COLLECTIONS]}
      initialSort={searchParams.sort}
    />
  );
}
