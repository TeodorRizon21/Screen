import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { isSortOption, SORT_OPTIONS, COLLECTIONS } from "@/lib/collections"

export const dynamic = 'force-dynamic'

// Generăm automat maparea între colecții și mărci
const COLLECTION_TO_MAKE = Object.entries(COLLECTIONS).reduce((acc, [key, value]) => {
  // Excludem colecțiile speciale
  if (key !== 'Home' && key !== 'My_Cars' && key !== 'All_Products' && key !== 'Sales') {
    acc[key] = value;
  }
  return acc;
}, {} as Record<string, string>);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const collectionKey = searchParams.get("collection")
    const sort = searchParams.get("sort") || SORT_OPTIONS.DEFAULT

    if (!collectionKey) {
      return NextResponse.json({ error: "Collection is required" }, { status: 400 })
    }

    if (!isSortOption(sort)) {
      return NextResponse.json({ error: "Invalid sort option" }, { status: 400 })
    }

    const [sortField, sortOrder] = sort.split("-") as ["name" | "price", "asc" | "desc"]

    const make = COLLECTION_TO_MAKE[collectionKey as keyof typeof COLLECTION_TO_MAKE]
    const collectionValue = COLLECTIONS[collectionKey as keyof typeof COLLECTIONS]

    let whereCondition = {};

    if (collectionKey === "Sales") {
      whereCondition = {
        sizeVariants: {
          some: {
            oldPrice: {
              gt: prisma.sizeVariant.fields.price
            }
          }
        }
      };
    } else if (collectionKey === "All_Products") {
      whereCondition = {}; // Nu aplicăm niciun filtru pentru a returna toate produsele
    } else if (make) {
      whereCondition = {
        OR: [
          { make: make },
          { collections: { has: collectionValue } }
        ]
      };
    } else {
      whereCondition = {
        collections: {
          has: collectionValue,
        },
      };
    }

    const products = await prisma.product.findMany({
      where: whereCondition,
      include: {
        sizeVariants: true,
      },
      orderBy: {
        [sortField]: sortOrder,
      },
    })

    return NextResponse.json(products)
  } catch (error) {
    console.error("Failed to fetch products:", error)
    return NextResponse.json({ error: "Failed to fetch products" }, { status: 500 })
  }
}

