"use client";

import { useCar } from "@/contexts/car-context";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Plus, ChevronRight, Car } from "lucide-react";
import Link from "next/link";
import ProductList from "@/components/ProductList";

export default function UserCarsDisplay() {
  const { isLoaded } = useUser();
  const { cars } = useCar();
  const router = useRouter();

  // Dacă utilizatorul nu este autentificat
  if (!isLoaded) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm text-center max-w-lg mx-auto">
        <h3 className="text-lg font-semibold mb-3">
          🚘 Adaugă mașinile tale pentru recomandări personalizate
        </h3>
        <p className="text-gray-600 mb-4 text-sm">
          Autentifică-te pentru a adăuga mașinile tale
        </p>
        <Button size="sm" onClick={() => router.push("/sign-in")}>
          Autentifică-te
          <ChevronRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  }

  // Dacă utilizatorul nu are mașini adăugate
  if (cars.length === 0) {
    return (
      <div className="bg-white rounded-xl p-6 shadow-sm text-center max-w-lg mx-auto">
        <h3 className="text-lg font-semibold mb-3">
          🚘 Nu ai adăugat încă nicio mașină
        </h3>
        <p className="text-gray-600 mb-4 text-sm">
          Adaugă mașinile tale pentru produse compatibile
        </p>
        <Button size="sm" onClick={() => router.push("/my-cars")}>
          Adaugă mașini
          <Plus className="ml-2 h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Badge-uri pentru mașini */}
      <div className="flex flex-wrap justify-center gap-3 mb-6">
        {cars.map((car, index) => {
          const isPrimary = car.type === "primary";

          return (
            <motion.div
              key={`${car.make}-${car.model}-${car.generation}-${index}`}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-full shadow-sm border
                ${
                  isPrimary
                    ? "bg-blue-50 border-blue-200 text-blue-800"
                    : "bg-green-50 border-green-200 text-green-800"
                }
              `}
            >
              <Car className="h-4 w-4" />
              <span className="font-medium">
                {car.name || `${car.make} ${car.model}`}
              </span>
              <span
                className={`
                text-xs px-2 py-0.5 rounded-full
                ${isPrimary ? "bg-blue-100" : "bg-green-100"}
              `}
              >
                {isPrimary ? "Principal" : "Secundar"}
              </span>
            </motion.div>
          );
        })}
      </div>

      {/* Produse pentru mașinile utilizatorului */}
      <div className="mt-10">
        <ProductList hideTitle={true} />
      </div>

      <div className="text-center mt-8">
        <Link
          href="/my-cars"
          className="inline-flex items-center text-sm text-gray-700 hover:text-black font-medium"
        >
          Gestionează mașinile tale
          <ChevronRight className="ml-1 h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}
