"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

type CarData = {
  make: string;
  models: {
    model: string;
    generations: string[];
  }[];
};

export default function AdminCars() {
  const [activeTab, setActiveTab] = useState<"make" | "model" | "generation">(
    "make"
  );
  const [newMake, setNewMake] = useState("");
  const [newModel, setNewModel] = useState("");
  const [newGeneration, setNewGeneration] = useState("");
  const [selectedMake, setSelectedMake] = useState("");
  const [selectedModel, setSelectedModel] = useState("");
  const [makes, setMakes] = useState<CarData[]>([]);

  useEffect(() => {
    fetchCars();
  }, []);

  const fetchCars = async () => {
    try {
      const response = await fetch("/api/admin/cars");
      if (!response.ok) throw new Error("Failed to fetch cars");
      const data = await response.json();
      setMakes(data);
    } catch (error) {
      console.error("Error fetching cars:", error);
      toast({
        title: "Eroare",
        description: "Eroare la încărcarea datelor",
        variant: "destructive",
      });
    }
  };

  const handleMakeChange = (value: string) => {
    setSelectedMake(value);
    setSelectedModel("");
  };

  const handleModelChange = (value: string) => {
    setSelectedModel(value);
  };

  const handleAddMake = async () => {
    if (!newMake || !newModel || !newGeneration) {
      toast({
        title: "Eroare",
        description: "Toate câmpurile sunt obligatorii",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/admin/cars", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "make",
          make: newMake,
          model: newModel,
          generation: newGeneration,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add make");
      }

      toast({
        title: "Succes",
        description: "Marcă adăugată cu succes",
      });
      setNewMake("");
      setNewModel("");
      setNewGeneration("");
      fetchCars();
    } catch (error) {
      console.error("Error adding make:", error);
      toast({
        title: "Eroare",
        description:
          error instanceof Error ? error.message : "Eroare la adăugarea mărcii",
        variant: "destructive",
      });
    }
  };

  const handleAddModel = async () => {
    if (!selectedMake || !newModel || !newGeneration) {
      toast({
        title: "Eroare",
        description: "Toate câmpurile sunt obligatorii",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/admin/cars", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "model",
          make: selectedMake,
          model: newModel,
          generation: newGeneration,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add model");
      }

      toast({
        title: "Succes",
        description: "Model adăugat cu succes",
      });
      setNewModel("");
      setNewGeneration("");
      fetchCars();
    } catch (error) {
      console.error("Error adding model:", error);
      toast({
        title: "Eroare",
        description:
          error instanceof Error
            ? error.message
            : "Eroare la adăugarea modelului",
        variant: "destructive",
      });
    }
  };

  const handleAddGeneration = async () => {
    if (!selectedMake || !selectedModel || !newGeneration) {
      toast({
        title: "Eroare",
        description: "Toate câmpurile sunt obligatorii",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await fetch("/api/admin/cars", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          type: "generation",
          make: selectedMake,
          model: selectedModel,
          generation: newGeneration,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to add generation");
      }

      toast({
        title: "Succes",
        description: "Generație adăugată cu succes",
      });
      setNewGeneration("");
      fetchCars();
    } catch (error) {
      console.error("Error adding generation:", error);
      toast({
        title: "Eroare",
        description:
          error instanceof Error
            ? error.message
            : "Eroare la adăugarea generației",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-2xl font-bold mb-8 text-gray-800">
          Administrare Mașini
        </h2>

        <div className="flex space-x-4 mb-8">
          <Button
            variant={activeTab === "make" ? "default" : "outline"}
            onClick={() => setActiveTab("make")}
          >
            Adaugă Marcă
          </Button>
          <Button
            variant={activeTab === "model" ? "default" : "outline"}
            onClick={() => setActiveTab("model")}
          >
            Adaugă Model
          </Button>
          <Button
            variant={activeTab === "generation" ? "default" : "outline"}
            onClick={() => setActiveTab("generation")}
          >
            Adaugă Generație
          </Button>
        </div>

        {activeTab === "make" && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="newMake">Marcă Nouă</Label>
              <Input
                id="newMake"
                value={newMake}
                onChange={(e) => setNewMake(e.target.value)}
                placeholder="Introduceți marca"
              />
            </div>
            <div>
              <Label htmlFor="newModel">Model Nou</Label>
              <Input
                id="newModel"
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                placeholder="Introduceți modelul"
              />
            </div>
            <div>
              <Label htmlFor="newGeneration">Generație Nouă</Label>
              <Input
                id="newGeneration"
                value={newGeneration}
                onChange={(e) => setNewGeneration(e.target.value)}
                placeholder="Introduceți generația"
              />
            </div>
            <Button onClick={handleAddMake}>Adaugă Marcă</Button>
          </div>
        )}

        {activeTab === "model" && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="selectedMake">Selectează Marca</Label>
              <Select value={selectedMake} onValueChange={handleMakeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectează marca" />
                </SelectTrigger>
                <SelectContent>
                  {makes.map((make) => (
                    <SelectItem key={make.make} value={make.make}>
                      {make.make}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="newModel">Model Nou</Label>
              <Input
                id="newModel"
                value={newModel}
                onChange={(e) => setNewModel(e.target.value)}
                placeholder="Introduceți modelul"
              />
            </div>
            <div>
              <Label htmlFor="newGeneration">Generație Nouă</Label>
              <Input
                id="newGeneration"
                value={newGeneration}
                onChange={(e) => setNewGeneration(e.target.value)}
                placeholder="Introduceți generația"
              />
            </div>
            <Button onClick={handleAddModel}>Adaugă Model</Button>
          </div>
        )}

        {activeTab === "generation" && (
          <div className="space-y-6">
            <div>
              <Label htmlFor="selectedMake">Selectează Marca</Label>
              <Select value={selectedMake} onValueChange={handleMakeChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Selectează marca" />
                </SelectTrigger>
                <SelectContent>
                  {makes.map((make) => (
                    <SelectItem key={make.make} value={make.make}>
                      {make.make}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="selectedModel">Selectează Modelul</Label>
              <Select
                value={selectedModel}
                onValueChange={handleModelChange}
                disabled={!selectedMake}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selectează modelul" />
                </SelectTrigger>
                <SelectContent>
                  {makes
                    .find((make) => make.make === selectedMake)
                    ?.models.map((model) => (
                      <SelectItem key={model.model} value={model.model}>
                        {model.model}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="newGeneration">Generație Nouă</Label>
              <Input
                id="newGeneration"
                value={newGeneration}
                onChange={(e) => setNewGeneration(e.target.value)}
                placeholder="Introduceți generația"
              />
            </div>
            <Button onClick={handleAddGeneration}>Adaugă Generație</Button>
          </div>
        )}

        <div className="mt-10">
          <h3 className="text-lg font-semibold mb-4">
            Listă mărci, modele și generații
          </h3>
          <div className="space-y-4">
            {makes.map((make) => (
              <div key={make.make} className="border rounded p-4 bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-blue-900">{make.make}</div>
                  <div className="space-x-2">
                    <button
                      className="text-xs text-yellow-600 hover:underline"
                      onClick={async () => {
                        const newName = prompt(
                          "Editează numele mărcii:",
                          make.make
                        );
                        if (newName && newName !== make.make) {
                          await fetch("/api/admin/cars", {
                            method: "PATCH",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              type: "make",
                              make: make.make,
                              newName,
                            }),
                          });
                          toast({ title: "Marcă editată" });
                          fetchCars();
                        }
                      }}
                    >
                      Editează
                    </button>
                    <button
                      className="text-xs text-red-600 hover:underline"
                      onClick={async () => {
                        if (
                          confirm(`Sigur vrei să ștergi marca ${make.make}?`)
                        ) {
                          await fetch("/api/admin/cars", {
                            method: "DELETE",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                              type: "make",
                              make: make.make,
                            }),
                          });
                          toast({ title: "Marcă ștearsă" });
                          fetchCars();
                        }
                      }}
                    >
                      Șterge
                    </button>
                  </div>
                </div>
                <div className="ml-4 mt-2 space-y-2">
                  {make.models.map((model) => (
                    <div
                      key={model.model}
                      className="border rounded p-2 bg-white"
                    >
                      <div className="flex items-center justify-between">
                        <div className="font-medium text-gray-800">
                          {model.model}
                        </div>
                        <div className="space-x-2">
                          <button
                            className="text-xs text-yellow-600 hover:underline"
                            onClick={async () => {
                              const newName = prompt(
                                "Editează numele modelului:",
                                model.model
                              );
                              if (newName && newName !== model.model) {
                                await fetch("/api/admin/cars", {
                                  method: "PATCH",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    type: "model",
                                    make: make.make,
                                    model: model.model,
                                    newName,
                                  }),
                                });
                                toast({ title: "Model editat" });
                                fetchCars();
                              }
                            }}
                          >
                            Editează
                          </button>
                          <button
                            className="text-xs text-red-600 hover:underline"
                            onClick={async () => {
                              if (
                                confirm(
                                  `Sigur vrei să ștergi modelul ${model.model}?`
                                )
                              ) {
                                await fetch("/api/admin/cars", {
                                  method: "DELETE",
                                  headers: {
                                    "Content-Type": "application/json",
                                  },
                                  body: JSON.stringify({
                                    type: "model",
                                    make: make.make,
                                    model: model.model,
                                  }),
                                });
                                toast({ title: "Model șters" });
                                fetchCars();
                              }
                            }}
                          >
                            Șterge
                          </button>
                        </div>
                      </div>
                      <div className="ml-4 mt-1 flex flex-wrap gap-2">
                        {model.generations.map((gen) => (
                          <span
                            key={gen}
                            className="inline-flex items-center bg-gray-200 rounded px-2 py-1 text-xs mr-2 mb-1"
                          >
                            {gen}
                            <button
                              className="ml-2 text-yellow-600 hover:underline"
                              onClick={async () => {
                                const newName = prompt(
                                  "Editează numele generației:",
                                  gen
                                );
                                if (newName && newName !== gen) {
                                  await fetch("/api/admin/cars", {
                                    method: "PATCH",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      type: "generation",
                                      make: make.make,
                                      model: model.model,
                                      generation: gen,
                                      newName,
                                    }),
                                  });
                                  toast({ title: "Generație editată" });
                                  fetchCars();
                                }
                              }}
                            >
                              ✎
                            </button>
                            <button
                              className="ml-1 text-red-600 hover:underline"
                              onClick={async () => {
                                if (
                                  confirm(
                                    `Sigur vrei să ștergi generația ${gen}?`
                                  )
                                ) {
                                  await fetch("/api/admin/cars", {
                                    method: "DELETE",
                                    headers: {
                                      "Content-Type": "application/json",
                                    },
                                    body: JSON.stringify({
                                      type: "generation",
                                      make: make.make,
                                      model: model.model,
                                      generation: gen,
                                    }),
                                  });
                                  toast({ title: "Generație ștearsă" });
                                  fetchCars();
                                }
                              }}
                            >
                              ✕
                            </button>
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
