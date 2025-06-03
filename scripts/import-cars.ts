import { PrismaClient } from "@prisma/client";
import carsData from "../app/cars/cars.json";

const prisma = new PrismaClient();

async function importCars() {
  try {
    console.log("Încep importul datelor...");

    for (const car of carsData) {
      // Creăm marca
      const make = await prisma.carMake.create({
        data: {
          name: car.make,
        },
      });

      console.log(`Marcă adăugată: ${car.make}`);

      // Creăm modelele și generațiile
      for (const modelData of car.models) {
        const model = await prisma.carModel.create({
          data: {
            name: modelData.model,
            makeId: make.id,
          },
        });

        console.log(`Model adăugat: ${car.make} ${modelData.model}`);

        // Creăm generațiile
        for (const generation of modelData.generations) {
          await prisma.carGeneration.create({
            data: {
              name: generation,
              modelId: model.id,
            },
          });

          console.log(`Generație adăugată: ${car.make} ${modelData.model} ${generation}`);
        }
      }
    }

    console.log("Import finalizat cu succes!");
  } catch (error) {
    console.error("Eroare la import:", error);
  } finally {
    await prisma.$disconnect();
  }
}

importCars(); 