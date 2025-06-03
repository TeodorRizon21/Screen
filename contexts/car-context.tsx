"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { useUser } from "@clerk/nextjs";
import { toast } from "@/hooks/use-toast";

type CarType = "primary" | "secondary";

interface Car {
  id: string;
  make: string;
  model: string;
  generation: string;
  addedAt: number;
  name: string;
  type: CarType;
}

interface CarContextType {
  cars: Car[];
  addCar: (car: Omit<Car, "id" | "addedAt" | "type">) => Promise<void>;
  removeCar: (car: Car) => Promise<void>;
  updateCar: (oldCar: Car, newCar: Partial<Car>) => Promise<void>;
  swapCarTypes: () => Promise<void>;
  showAddCarPopup: boolean;
  setShowAddCarPopup: (show: boolean) => void;
}

const CarContext = createContext<CarContextType | undefined>(undefined);

export function CarProvider({ children }: { children: ReactNode }) {
  const { user, isSignedIn } = useUser();
  const [cars, setCars] = useState<Car[]>([]);
  const [showAddCarPopup, setShowAddCarPopup] = useState(false);

  // Încarcă mașinile utilizatorului
  useEffect(() => {
    if (isSignedIn && user?.id) {
      fetchCars();
    } else {
      setCars([]);
    }
  }, [isSignedIn, user?.id]);

  const fetchCars = async () => {
    try {
      const response = await fetch("/api/user/cars");
      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch cars");
      }
      const data = await response.json();
      setCars(data);
    } catch (error) {
      console.error("Error fetching cars:", error);
      toast({
        title: "Eroare",
        description:
          error instanceof Error
            ? error.message
            : "Eroare la încărcarea mașinilor",
        variant: "destructive",
      });
      setCars([]);
    }
  };

  // Adaugă o mașină nouă
  const addCar = async (car: Omit<Car, "id" | "addedAt" | "type">) => {
    if (!isSignedIn || !user?.id) {
      throw new Error("Trebuie să fii autentificat pentru a adăuga o mașină");
    }

    try {
      const response = await fetch("/api/user/cars", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...car,
          type: "secondary",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to add car");
      }

      setCars((prev) => [...prev, data]);
    } catch (error) {
      console.error("Error adding car:", error);
      throw error;
    }
  };

  // Șterge o mașină
  const removeCar = async (car: Car) => {
    if (!isSignedIn || !user?.id) {
      throw new Error("Trebuie să fii autentificat pentru a șterge o mașină");
    }

    try {
      const response = await fetch(`/api/user/cars?id=${car.id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to remove car");
      }

      setCars((prev) => prev.filter((c) => c.id !== car.id));
    } catch (error) {
      console.error("Error removing car:", error);
      throw error;
    }
  };

  // Actualizează o mașină
  const updateCar = async (oldCar: Car, newCar: Partial<Car>) => {
    if (!isSignedIn || !user?.id) {
      throw new Error(
        "Trebuie să fii autentificat pentru a actualiza o mașină"
      );
    }

    try {
      const response = await fetch("/api/user/cars", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: oldCar.id,
          ...newCar,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update car");
      }

      setCars((prev) => prev.map((car) => (car.id === oldCar.id ? data : car)));
    } catch (error) {
      console.error("Error updating car:", error);
      throw error;
    }
  };

  // Schimbă tipurile mașinilor
  const swapCarTypes = async () => {
    if (!isSignedIn || !user?.id) {
      throw new Error(
        "Trebuie să fii autentificat pentru a schimba tipurile mașinilor"
      );
    }

    try {
      const primaryCar = cars.find((car) => car.type === "primary");
      const secondaryCar = cars.find((car) => car.type === "secondary");

      if (primaryCar && secondaryCar) {
        await Promise.all([
          updateCar(primaryCar, { type: "secondary" }),
          updateCar(secondaryCar, { type: "primary" }),
        ]);
      }
    } catch (error) {
      console.error("Error swapping car types:", error);
      throw error;
    }
  };

  return (
    <CarContext.Provider
      value={{
        cars,
        addCar,
        removeCar,
        updateCar,
        swapCarTypes,
        showAddCarPopup,
        setShowAddCarPopup,
      }}
    >
      {children}
    </CarContext.Provider>
  );
}

export function useCar() {
  const context = useContext(CarContext);
  if (context === undefined) {
    throw new Error("useCar must be used within a CarProvider");
  }
  return context;
}
