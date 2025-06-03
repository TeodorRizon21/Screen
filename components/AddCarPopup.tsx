"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { carsData } from "@/app/cars/cars";
import { useCar } from "@/contexts/car-context";
import { toast } from "@/hooks/use-toast";

interface CarModel {
  model: string;
  generations: string[];
}

interface CarData {
  make: string;
  models: CarModel[];
}

interface AddCarPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function AddCarPopup({ open, onOpenChange }: AddCarPopupProps) {
  const { addCar } = useCar();
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [selectedGeneration, setSelectedGeneration] = useState("");
  const [carName, setCarName] = useState("");

  const availableModels =
    carsData.find((car: CarData) => car.make === selectedMake)?.models || [];
  const availableGenerations =
    availableModels.find((model: CarModel) => model.model === selectedModel)
      ?.generations || [];

  const handleAddCar = async () => {
    if (!selectedMake || !selectedModel || !selectedGeneration) {
      toast({
        title: "Eroare",
        description: "Toate câmpurile sunt obligatorii",
        variant: "destructive",
      });
      return;
    }

    try {
      await addCar({
        name: carName || `${selectedMake} ${selectedModel}`,
        make: selectedMake,
        model: selectedModel,
        generation: selectedGeneration,
      });
      onOpenChange(false);
      toast({
        title: "Succes",
        description: "Mașina a fost adăugată cu succes",
      });
    } catch (error) {
      toast({
        title: "Eroare",
        description:
          error instanceof Error
            ? error.message
            : "Eroare la adăugarea mașinii",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    if (!open) {
      setSelectedMake("");
      setSelectedModel("");
      setSelectedGeneration("");
      setCarName("");
    }
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-2">
            Adaugă mașina ta
          </DialogTitle>
          <p className="text-sm text-gray-500 text-center">
            Selectează mașina pentru a găsi filme de protecție compatibile
          </p>
        </DialogHeader>
        <div className="grid gap-6 py-4">
          <div className="grid gap-2">
            <Label htmlFor="name">Nume personalizat (opțional)</Label>
            <Input
              id="name"
              value={carName}
              onChange={(e) => setCarName(e.target.value)}
              placeholder="Ex: Mașina mea BMW"
            />
          </div>

          <div className="grid gap-2">
            <Label htmlFor="make">Marcă</Label>
            <Select value={selectedMake} onValueChange={setSelectedMake}>
              <SelectTrigger id="make" className="w-full">
                <SelectValue placeholder="Selectează marca" />
              </SelectTrigger>
              <SelectContent>
                {carsData.map((car: CarData) => (
                  <SelectItem key={car.make} value={car.make}>
                    {car.make}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedMake && (
            <div className="grid gap-2">
              <Label htmlFor="model">Model</Label>
              <Select value={selectedModel} onValueChange={setSelectedModel}>
                <SelectTrigger id="model" className="w-full">
                  <SelectValue placeholder="Selectează modelul" />
                </SelectTrigger>
                <SelectContent>
                  {availableModels.map((model: CarModel) => (
                    <SelectItem key={model.model} value={model.model}>
                      {model.model}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {selectedModel && (
            <div className="grid gap-2">
              <Label htmlFor="generation">Generație</Label>
              <Select
                value={selectedGeneration}
                onValueChange={setSelectedGeneration}
              >
                <SelectTrigger id="generation" className="w-full">
                  <SelectValue placeholder="Selectează generația" />
                </SelectTrigger>
                <SelectContent>
                  {availableGenerations.map((generation: string) => (
                    <SelectItem key={generation} value={generation}>
                      {generation}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex justify-end gap-3 mt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Anulează
            </Button>
            <Button
              onClick={handleAddCar}
              disabled={!selectedMake || !selectedModel || !selectedGeneration}
              className="bg-[#FFD66C] hover:bg-[#ffc936] text-black"
            >
              Adaugă mașina
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
