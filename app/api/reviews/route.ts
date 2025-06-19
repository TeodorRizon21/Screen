import { NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import type { User } from "@clerk/nextjs/server";

export async function POST(req: Request) {
  try {
    const session = await auth();
    const userId = session?.userId;
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const body = await req.json();
    const { productId, orderId, rating, comment } = body;

    console.log("Received review data:", { productId, orderId, rating, comment });

    if (!productId || !orderId || !rating || rating < 1 || rating > 5) {
      console.log("Invalid request data:", { productId, orderId, rating });
      return new NextResponse("Invalid request data", { status: 400 });
    }

    // Verifică dacă utilizatorul a comandat acest produs
    console.log("Checking order:", { orderId, userId, productId });
    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: userId,
        orderStatus: "Comanda finalizata!",
        items: {
          some: {
            productId: productId
          }
        }
      }
    });

    console.log("Found order:", order);

    if (!order) {
      return new NextResponse("Comanda nu a fost găsită, nu este finalizată sau nu aparține acestui utilizator", { status: 404 });
    }

    // Verifică dacă utilizatorul a lăsat deja o recenzie pentru acest produs în această comandă
    console.log("Checking existing review");
    const existingReview = await prisma.review.findFirst({
      where: {
        userId,
        productId,
        orderId
      }
    });

    console.log("Existing review:", existingReview);

    if (existingReview) {
      return new NextResponse("Review already exists", { status: 400 });
    }

    console.log("Creating new review");
    const review = await prisma.review.create({
      data: {
        userId,
        productId,
        orderId,
        rating,
        comment
      }
    });

    console.log("Review created successfully:", review);
    return NextResponse.json(review);
  } catch (error) {
    console.error("[REVIEWS_POST] Full error:", {
      error,
      message: error instanceof Error ? error.message : "Unknown error",
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    return new NextResponse(
      error instanceof Error ? error.message : "Internal error", 
      { status: 500 }
    );
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const sortBy = searchParams.get("sortBy") || "date"; // "date" sau "rating"
    const order = searchParams.get("order") || "desc"; // "asc" sau "desc"

    if (!productId) {
      return new NextResponse("Product ID is required", { status: 400 });
    }

    const reviews = await prisma.review.findMany({
      where: {
        productId
      },
      orderBy: sortBy === "date" 
        ? { createdAt: order === "desc" ? "desc" : "asc" }
        : { rating: order === "desc" ? "desc" : "asc" }
    });

    // Obține informații despre utilizatori pentru toate recenziile
    const userIds = Array.from(new Set(reviews.map(review => review.userId)));
    const clerk = await clerkClient();
    const users = await clerk.users.getUserList({
      userId: userIds,
      limit: 100
    });

    const reviewsWithUserInfo = reviews.map(review => {
      const user = users.data.find((u: User) => u.id === review.userId);
      return {
        ...review,
        userName: user?.firstName 
          ? `${user.firstName}${user.lastName ? ` ${user.lastName.charAt(0)}.` : ''}`
          : "Utilizator anonim",
        userImage: user?.imageUrl || null
      };
    });

    return NextResponse.json(reviewsWithUserInfo);
  } catch (error) {
    console.error("[REVIEWS_GET]", error);
    return new NextResponse("Internal error", { status: 500 });
  }
} 