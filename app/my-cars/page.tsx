"use client";

import { useUser } from "@clerk/nextjs";
import { useCar } from "@/contexts/car-context";
import { Button } from "@/components/ui/button";
import { Plus, Trash2, Edit2, RefreshCw } from "lucide-react";
import AddCarPopup from "@/components/AddCarPopup";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function MyCarsPage() {
  const { user } = useUser();
  const { cars, removeCar, updateCar, swapCarTypes } = useCar();
  const [isAddCarOpen, setIsAddCarOpen] = useState(false);
  const [isEditCarOpen, setIsEditCarOpen] = useState(false);
  const [editingCar, setEditingCar] = useState<any>(null);
  const [newName, setNewName] = useState("");

  if (!user) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="container mx-auto px-6 py-12 text-center"
      >
        <h1 className="text-2xl font-bold mb-4">
          🔒 Trebuie să fii autentificat pentru a vedea mașinile tale
        </h1>
        <p className="text-muted-foreground">
          Autentifică-te pentru a adăuga și gestiona mașinile tale.
        </p>
      </motion.div>
    );
  }

  const handleEditCar = (car: any) => {
    setEditingCar(car);
    setNewName(car.name);
    setIsEditCarOpen(true);
  };

  const handleUpdateCar = () => {
    if (editingCar && newName) {
      updateCar(editingCar, { name: newName });
      setIsEditCarOpen(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="container mx-auto px-6 py-12"
    >
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">🚗 Mașinile mele</h1>
        <Button onClick={() => setIsAddCarOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Adaugă mașină
        </Button>
      </div>

      {cars.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-12"
        >
          <h2 className="text-xl font-semibold mb-2">
            🚘 Nu ai adăugat nicio mașină încă
          </h2>
          <p className="text-muted-foreground mb-4">
            Adaugă mașinile tale pentru a vedea produsele compatibile.
          </p>
          <Button onClick={() => setIsAddCarOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Adaugă prima mașină
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cars.map((car, index) => (
            <motion.div
              key={`${car.make}-${car.model}-${car.generation}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="border rounded-lg p-6 hover:shadow-lg transition-all duration-300 relative group"
            >
              <div className="absolute top-4 right-4">
                <span className="text-sm font-medium px-2 py-1 rounded-full bg-green-100 text-green-800">
                  {car.type === "primary"
                    ? "Mașină principală"
                    : "Mașină secundară"}
                </span>
              </div>
              <h3 className="text-xl font-semibold mb-2">
                {car.name || `${car.make} ${car.model}`}
              </h3>
              <p className="text-muted-foreground mb-1">
                {car.make} {car.model}
              </p>
              <p className="text-muted-foreground mb-4">
                Generație: {car.generation}
              </p>
              <div className="flex flex-col gap-2 mt-4">
                <Button
                  variant="outline"
                  onClick={() => handleEditCar(car)}
                  className="w-full justify-start"
                >
                  <Edit2 className="mr-2 h-4 w-4" />
                  Editează numele
                </Button>
                {cars.length > 1 && (
                  <Button
                    variant="outline"
                    onClick={swapCarTypes}
                    className="w-full justify-start"
                  >
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Schimbă mașina principală
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => removeCar(car)}
                  className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Șterge mașina
                </Button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <AddCarPopup open={isAddCarOpen} onOpenChange={setIsAddCarOpen} />

      <Dialog open={isEditCarOpen} onOpenChange={setIsEditCarOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center mb-2">
              ✏️ Editează numele mașinii
            </DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Nume personalizat</Label>
              <Input
                id="name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Introdu un nume personalizat"
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setIsEditCarOpen(false)}>
                Anulează
              </Button>
              <Button onClick={handleUpdateCar}>Salvează</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}
