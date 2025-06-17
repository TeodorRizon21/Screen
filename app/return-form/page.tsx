"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { ArrowLeft, Package, Mail, Phone, User } from "lucide-react";
import Link from "next/link";

export default function ReturnFormPage() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    orderNumber: "",
    productName: "",
    returnReason: "",
    description: "",
    preferredSolution: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch('/api/return-request', {
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
        toast({
          title: "Cerere de retur trimisă",
          description: "Vă vom contacta în cel mai scurt timp pentru procesarea cererii de retur.",
        });

        // Reset form
        setFormData({
          firstName: "",
          lastName: "",
          email: "",
          phone: "",
          orderNumber: "",
          productName: "",
          returnReason: "",
          description: "",
          preferredSolution: "",
        });
      } else {
        throw new Error(result.error || 'A apărut o eroare');
      }

    } catch (error) {
      console.error("Eroare la trimiterea cererii de retur:", error);
      toast({
        title: "Eroare",
        description: error instanceof Error ? error.message : "Nu am putut trimite cererea de retur. Vă rugăm să încercați din nou.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-6 py-12 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link 
          href="/"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
        >
          <ArrowLeft className="h-4 w-4" />
          Înapoi la magazin
        </Link>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Formular de retur</h1>
        <p className="text-gray-600">
          Completați formularul de mai jos pentru a solicita returnarea unui produs.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Formularul principal */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Package className="h-5 w-5" />
                Detalii retur
              </CardTitle>
              <CardDescription>
                Vă rugăm să completați toate câmpurile obligatorii.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Informații personale */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Prenume *</Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Nume *</Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      required
                      className="mt-1"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Telefon</Label>
                    <Input
                      id="phone"
                      name="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Detalii comandă */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="orderNumber">Numărul comenzii *</Label>
                    <Input
                      id="orderNumber"
                      name="orderNumber"
                      value={formData.orderNumber}
                      onChange={handleInputChange}
                      required
                      className="mt-1"
                      placeholder="ex: SS-2024-001"
                    />
                  </div>
                  <div>
                    <Label htmlFor="productName">Numele produsului *</Label>
                    <Input
                      id="productName"
                      name="productName"
                      value={formData.productName}
                      onChange={handleInputChange}
                      required
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Motivul returului */}
                <div>
                  <Label htmlFor="returnReason">Motivul returului *</Label>
                  <Select 
                    value={formData.returnReason} 
                    onValueChange={(value) => handleSelectChange("returnReason", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selectați motivul" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="defect">Produs defect</SelectItem>
                      <SelectItem value="wrong-size">Mărime greșită</SelectItem>
                      <SelectItem value="not-as-described">Nu corespunde descrierii</SelectItem>
                      <SelectItem value="damaged-shipping">Deteriorat la transport</SelectItem>
                      <SelectItem value="changed-mind">Am schimbat părerea</SelectItem>
                      <SelectItem value="other">Altul</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Soluția preferată */}
                <div>
                  <Label htmlFor="preferredSolution">Soluția preferată *</Label>
                  <Select 
                    value={formData.preferredSolution} 
                    onValueChange={(value) => handleSelectChange("preferredSolution", value)}
                  >
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Selectați soluția" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="refund">Rambursare</SelectItem>
                      <SelectItem value="exchange">Schimb cu produs similar</SelectItem>
                      <SelectItem value="repair">Reparare</SelectItem>
                      <SelectItem value="store-credit">Credit magazin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Descrierea problemei */}
                <div>
                  <Label htmlFor="description">Descrierea problemei</Label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows={4}
                    className="mt-1"
                    placeholder="Descrieți problema în detaliu..."
                  />
                </div>

                {/* Butonul de submit */}
                <Button 
                  type="submit" 
                  className="w-full bg-orange-600 hover:bg-orange-700"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Se trimite..." : "Trimite cererea de retur"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Informații suplimentare */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="h-5 w-5" />
                Informații importante
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h4 className="font-medium mb-2">Termeni de retur</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Retururile sunt acceptate în 14 zile</li>
                  <li>• Produsul trebuie să fie în starea originală</li>
                  <li>• Ambalajul original este necesar</li>
                  <li>• Taxa de transport poate fi suportată de client</li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-medium mb-2">Timp de procesare</h4>
                <p className="text-sm text-gray-600">
                  Vom procesa cererea în 2-3 zile lucrătoare și vă vom contacta cu instrucțiunile.
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Phone className="h-5 w-5" />
                Aveți nevoie de ajutor?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-600 mb-4">
                Dacă aveți întrebări despre procesul de retur, ne puteți contacta:
              </p>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-500" />
                  <span>contact@screenshield.ro</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-gray-500" />
                  <span>+40 123 456 789</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
} 