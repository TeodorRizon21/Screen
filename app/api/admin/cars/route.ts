import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface CarGeneration {
  id: string;
  name: string;
  modelId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CarModel {
  id: string;
  name: string;
  makeId: string;
  generations: CarGeneration[];
  createdAt: Date;
  updatedAt: Date;
}

interface CarMake {
  id: string;
  name: string;
  models: CarModel[];
  createdAt: Date;
  updatedAt: Date;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { type, make, model, generation } = body;

    if (!type || !make) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    switch (type) {
      case "make":
        if (!model || !generation) {
          return NextResponse.json(
            { error: "Model and generation are required for adding a make" },
            { status: 400 }
          );
        }

        // Verificăm dacă marca există deja
        const existingMake = await prisma.carMake.findUnique({
          where: { name: make },
        });

        if (existingMake) {
          return NextResponse.json(
            { error: "Make already exists" },
            { status: 400 }
          );
        }

        // Adăugăm marca nouă cu modelul și generația
        await prisma.carMake.create({
          data: {
            name: make,
            models: {
              create: {
                name: model,
                generations: {
                  create: {
                    name: generation,
                  },
                },
              },
            },
          },
        });
        break;

      case "model":
        if (!model || !generation) {
          return NextResponse.json(
            { error: "Model and generation are required" },
            { status: 400 }
          );
        }

        const makeRecord = await prisma.carMake.findUnique({
          where: { name: make },
        });

        if (!makeRecord) {
          return NextResponse.json(
            { error: "Make not found" },
            { status: 404 }
          );
        }

        // Verificăm dacă modelul există deja
        const existingModel = await prisma.carModel.findFirst({
          where: {
            name: model,
            makeId: makeRecord.id,
          },
        });

        if (existingModel) {
          return NextResponse.json(
            { error: "Model already exists for this make" },
            { status: 400 }
          );
        }

        // Adăugăm modelul nou cu generația
        await prisma.carModel.create({
          data: {
            name: model,
            makeId: makeRecord.id,
            generations: {
              create: {
                name: generation,
              },
            },
          },
        });
        break;

      case "generation":
        if (!model || !generation) {
          return NextResponse.json(
            { error: "Model and generation are required" },
            { status: 400 }
          );
        }

        const makeRecord2 = await prisma.carMake.findUnique({
          where: { name: make },
        });

        if (!makeRecord2) {
          return NextResponse.json(
            { error: "Make not found" },
            { status: 404 }
          );
        }

        const modelRecord = await prisma.carModel.findFirst({
          where: {
            name: model,
            makeId: makeRecord2.id,
          },
        });

        if (!modelRecord) {
          return NextResponse.json(
            { error: "Model not found" },
            { status: 404 }
          );
        }

        // Verificăm dacă generația există deja
        const existingGeneration = await prisma.carGeneration.findFirst({
          where: {
            name: generation,
            modelId: modelRecord.id,
          },
        });

        if (existingGeneration) {
          return NextResponse.json(
            { error: "Generation already exists for this model" },
            { status: 400 }
          );
        }

        // Adăugăm generația nouă
        await prisma.carGeneration.create({
          data: {
            name: generation,
            modelId: modelRecord.id,
          },
        });
        break;

      default:
        return NextResponse.json(
          { error: "Invalid type" },
          { status: 400 }
        );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating cars data:", error);
    return NextResponse.json(
      { error: "Failed to update cars data" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const makes = await prisma.carMake.findMany({
      include: {
        models: {
          include: {
            generations: true,
          },
        },
      },
    });

    // Transformăm datele în formatul așteptat de frontend
    const formattedData = makes.map((make: CarMake) => ({
      make: make.name,
      models: make.models.map((model: CarModel) => ({
        model: model.name,
        generations: model.generations.map((gen: CarGeneration) => gen.name),
      })),
    }));

    return NextResponse.json(formattedData);
  } catch (error) {
    console.error("Error fetching cars data:", error);
    return NextResponse.json(
      { error: "Failed to fetch cars data" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    const { type, make, model, generation } = body;

    if (!type || !make) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    switch (type) {
      case "make":
        // Șterge marca și tot ce ține de ea (cascade)
        await prisma.carMake.delete({ where: { name: make } });
        break;
      case "model":
        if (!model) return NextResponse.json({ error: "Model is required" }, { status: 400 });
        const makeRecord = await prisma.carMake.findUnique({ where: { name: make } });
        if (!makeRecord) return NextResponse.json({ error: "Make not found" }, { status: 404 });
        await prisma.carModel.delete({ where: { name_makeId: { name: model, makeId: makeRecord.id } } });
        break;
      case "generation":
        if (!model || !generation) return NextResponse.json({ error: "Model and generation are required" }, { status: 400 });
        const makeRec = await prisma.carMake.findUnique({ where: { name: make } });
        if (!makeRec) return NextResponse.json({ error: "Make not found" }, { status: 404 });
        const modelRec = await prisma.carModel.findFirst({ where: { name: model, makeId: makeRec.id } });
        if (!modelRec) return NextResponse.json({ error: "Model not found" }, { status: 404 });
        await prisma.carGeneration.delete({ where: { name_modelId: { name: generation, modelId: modelRec.id } } });
        break;
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting car data:", error);
    return NextResponse.json({ error: "Failed to delete car data" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const body = await request.json();
    const { type, make, model, generation, newName } = body;
    if (!type || !make || !newName) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }
    switch (type) {
      case "make":
        await prisma.carMake.update({ where: { name: make }, data: { name: newName } });
        break;
      case "model":
        if (!model) return NextResponse.json({ error: "Model is required" }, { status: 400 });
        const makeRecord = await prisma.carMake.findUnique({ where: { name: make } });
        if (!makeRecord) return NextResponse.json({ error: "Make not found" }, { status: 404 });
        await prisma.carModel.update({ where: { name_makeId: { name: model, makeId: makeRecord.id } }, data: { name: newName } });
        break;
      case "generation":
        if (!model || !generation) return NextResponse.json({ error: "Model and generation are required" }, { status: 400 });
        const makeRec = await prisma.carMake.findUnique({ where: { name: make } });
        if (!makeRec) return NextResponse.json({ error: "Make not found" }, { status: 404 });
        const modelRec = await prisma.carModel.findFirst({ where: { name: model, makeId: makeRec.id } });
        if (!modelRec) return NextResponse.json({ error: "Model not found" }, { status: 404 });
        await prisma.carGeneration.update({ where: { name_modelId: { name: generation, modelId: modelRec.id } }, data: { name: newName } });
        break;
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating car data:", error);
    return NextResponse.json({ error: "Failed to update car data" }, { status: 500 });
  }
} 