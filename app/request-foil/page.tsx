"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Send, CheckCircle } from "lucide-react";
import { useRouter } from "next/navigation";

export default function RequestFoilPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    carMake: "",
    carModel: "",
    carYear: "",
    carGeneration: "",
    additionalInfo: "",
    urgency: "normal"
  });

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/request-foil', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'A apărut o eroare');
      }

      if (result.success) {
        setIsSubmitted(true);
      } else {
        throw new Error(result.error || 'A apărut o eroare');
      }
    } catch (error) {
      console.error("Eroare la trimiterea cererii:", error);
      alert(error instanceof Error ? error.message : "A apărut o eroare. Te rog să încerci din nou.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <div className="container mx-auto px-6 py-12">
        <div className="max-w-2xl mx-auto">
          <Card className="text-center">
            <CardContent className="pt-8 pb-8">
              <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
              <h1 className="text-2xl font-bold text-green-700 mb-2">
                Cererea ta a fost trimisă cu succes!
              </h1>
              <p className="text-gray-600 mb-6">
                Îți mulțumim pentru cerere! Echipa noastră va analiza informațiile furnizate și te va contacta în cel mai scurt timp pentru a-ți confirma disponibilitatea foliei pentru modelul tău de mașină.
              </p>
              <div className="flex gap-4 justify-center">
                <Button 
                  onClick={() => router.push("/collection/allproducts")}
                  variant="outline"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Înapoi la produse
                </Button>
                <Button onClick={() => router.push("/")}>
                  Acasă
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="mb-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Înapoi
          </Button>
          
          <h1 className="text-3xl font-bold mb-2">
            Cerere Folie Personalizată
          </h1>
          <p className="text-gray-600">
            Nu ai găsit folia pentru modelul tău de mașină? Completează formularul de mai jos și te vom contacta cu o soluție personalizată.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Detalii despre mașina ta</CardTitle>
            <CardDescription>
              Te rog să completezi toate câmpurile pentru a putea identifica cea mai potrivită folie pentru mașina ta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Informații personale */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Nume complet *</Label>
                  <Input
                    id="name"
                    type="text"
                    value={formData.name}
                    onChange={(e) => handleInputChange("name", e.target.value)}
                    required
                    placeholder="Ion Popescu"
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleInputChange("email", e.target.value)}
                    required
                    placeholder="ion.popescu@email.com"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="phone">Telefon *</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  required
                  placeholder="0712345678"
                />
              </div>

              {/* Detalii despre mașină */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-semibold mb-4">Informații despre mașină</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="carMake">Marca mașinii *</Label>
                    <Input
                      id="carMake"
                      type="text"
                      value={formData.carMake}
                      onChange={(e) => handleInputChange("carMake", e.target.value)}
                      required
                      placeholder="BMW, Mercedes, Audi..."
                    />
                  </div>
                  <div>
                    <Label htmlFor="carModel">Modelul mașinii *</Label>
                    <Input
                      id="carModel"
                      type="text"
                      value={formData.carModel}
                      onChange={(e) => handleInputChange("carModel", e.target.value)}
                      required
                      placeholder="X5, E-Class, A4..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div>
                    <Label htmlFor="carYear">Anul fabricației *</Label>
                    <Input
                      id="carYear"
                      type="number"
                      min="1990"
                      max="2024"
                      value={formData.carYear}
                      onChange={(e) => handleInputChange("carYear", e.target.value)}
                      required
                      placeholder="2020"
                    />
                  </div>
                  <div>
                    <Label htmlFor="carGeneration">Generația (opțional)</Label>
                    <Input
                      id="carGeneration"
                      type="text"
                      value={formData.carGeneration}
                      onChange={(e) => handleInputChange("carGeneration", e.target.value)}
                      placeholder="F15, W213, B9..."
                    />
                  </div>
                </div>
              </div>

              {/* Urgența cererii */}
              <div>
                <Label htmlFor="urgency">Urgența cererii</Label>
                <Select value={formData.urgency} onValueChange={(value) => handleInputChange("urgency", value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selectează urgența" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Scăzută - până în 2 săptămâni</SelectItem>
                    <SelectItem value="normal">Normală - până în 1 săptămână</SelectItem>
                    <SelectItem value="high">Ridicată - în 2-3 zile</SelectItem>
                    <SelectItem value="urgent">Urgentă - în 24 ore</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Informații suplimentare */}
              <div>
                <Label htmlFor="additionalInfo">Informații suplimentare (opțional)</Label>
                <Textarea
                  id="additionalInfo"
                  value={formData.additionalInfo}
                  onChange={(e) => handleInputChange("additionalInfo", e.target.value)}
                  placeholder="Specifică orice detalii suplimentare despre mașina ta, preferințe pentru folie, sau alte cerințe speciale..."
                  rows={4}
                />
              </div>

              <Button 
                type="submit" 
                className="w-full" 
                disabled={isSubmitting}
                size="lg"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Se trimite cererea...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Trimite cererea
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-sm text-gray-500">
          <p>
            * Câmpurile marcate sunt obligatorii. Informațiile tale vor fi folosite doar pentru a-ți oferi cea mai bună soluție pentru mașina ta.
          </p>
        </div>
      </div>
    </div>
  );
} 