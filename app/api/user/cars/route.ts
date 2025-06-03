import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

// Obține toate mașinile utilizatorului
export async function GET() {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const cars = await prisma.userCar.findMany({
      where: { userId: session.userId },
      orderBy: { addedAt: "desc" },
    });

    return NextResponse.json(cars);
  } catch (error) {
    console.error("Error fetching user cars:", error);
    return NextResponse.json(
      { error: "Failed to fetch user cars" },
      { status: 500 }
    );
  }
}

// Adaugă o mașină nouă
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    console.log("Received request body:", body);
    
    const { name, make, model, generation, type } = body;

    // Verificăm dacă toate câmpurile necesare sunt prezente
    if (!make || !model || !generation) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Verificăm dacă mașina există deja pentru acest utilizator
    const existingCar = await prisma.userCar.findFirst({
      where: {
        userId: session.userId,
        make,
        model,
        generation,
      },
    });

    if (existingCar) {
      return NextResponse.json(
        { error: "Car already exists for this user" },
        { status: 400 }
      );
    }

    // Verificăm dacă există alte mașini pentru a determina tipul
    const userCars = await prisma.userCar.findMany({
      where: { userId: session.userId },
    });

    const carType = userCars.length === 0 ? "primary" : (type || "secondary");

    const car = await prisma.userCar.create({
      data: {
        userId: session.userId,
        name: name || `${make} ${model}`,
        make,
        model,
        generation,
        type: carType,
      },
    });

    console.log("Created car:", car);
    return NextResponse.json(car);
  } catch (error) {
    console.error("Error adding user car:", error);
    return NextResponse.json(
      { error: "Failed to add user car", details: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Actualizează o mașină
export async function PUT(request: Request) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { id, name, type } = body;

    const car = await prisma.userCar.update({
      where: { id },
      data: { name, type },
    });

    return NextResponse.json(car);
  } catch (error) {
    console.error("Error updating user car:", error);
    return NextResponse.json(
      { error: "Failed to update user car" },
      { status: 500 }
    );
  }
}

// Șterge o mașină
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.userId) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Car ID is required" },
        { status: 400 }
      );
    }

    await prisma.userCar.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user car:", error);
    return NextResponse.json(
      { error: "Failed to delete user car" },
      { status: 500 }
    );
  }
} 