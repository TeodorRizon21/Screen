"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  CardFooter,
} from "@/components/ui/card";
import { Plus, Trash2, Pencil, Percent, Tag } from "lucide-react";
import LoadingSpinner from "./LoadingSpinner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type DiscountType = "free_shipping" | "percentage" | "fixed";

type DiscountCode = {
  id: string;
  code: string;
  type: DiscountType;
  value: number;
  usesLeft: number | null;
  totalUses: number;
  expirationDate: string | null;
  canCumulate: boolean;
  totalTransactions?: number;
  totalTransactionAmount?: number;
};

// Componente personalizate pentru a înlocui componentele lipsă
function Alert({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={`bg-yellow-50 border border-yellow-200 rounded-md p-4 ${className}`}
    >
      {children}
    </div>
  );
}

function AlertDescription({ children }: { children: React.ReactNode }) {
  return <p className="text-yellow-800 text-sm">{children}</p>;
}

export default function DiscountManager() {
  const [discounts, setDiscounts] = useState<DiscountCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [newDiscount, setNewDiscount] = useState<Omit<DiscountCode, "id">>({
    code: "",
    type: "percentage",
    value: 10,
    usesLeft: null,
    totalUses: 0,
    expirationDate: null,
    canCumulate: false,
  });
  const [editingDiscount, setEditingDiscount] = useState<DiscountCode | null>(
    null
  );

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/discount");
      if (!response.ok) throw new Error("Failed to fetch discount codes");
      const data = await response.json();
      setDiscounts(data);
    } catch (error) {
      console.error("Error fetching discount codes:", error);
      toast({
        title: "Eroare",
        description: "Nu s-au putut încărca codurile de reducere.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddDiscount = async () => {
    if (!newDiscount.code || newDiscount.value <= 0) {
      toast({
        title: "Eroare",
        description: "Codul și valoarea reducerii sunt obligatorii.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/admin/discount", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newDiscount),
      });

      if (!response.ok)
        throw new Error("Nu s-a putut adăuga codul de reducere");

      toast({
        title: "Succes",
        description: "Codul de reducere a fost adăugat cu succes",
      });

      fetchDiscounts();
      setNewDiscount({
        code: "",
        type: "percentage",
        value: 10,
        usesLeft: null,
        totalUses: 0,
        expirationDate: null,
        canCumulate: false,
      });
    } catch (error) {
      console.error("Eroare la adăugarea codului de reducere:", error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut adăuga codul de reducere. Încearcă din nou.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateDiscount = async () => {
    if (!editingDiscount) return;

    setLoading(true);
    try {
      const response = await fetch(
        `/api/admin/discount/${editingDiscount.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(editingDiscount),
        }
      );

      if (!response.ok)
        throw new Error("Nu s-a putut actualiza codul de reducere");

      toast({
        title: "Succes",
        description: "Codul de reducere a fost actualizat cu succes",
      });

      fetchDiscounts();
      setEditingDiscount(null);
    } catch (error) {
      console.error("Eroare la actualizarea codului de reducere:", error);
      toast({
        title: "Eroare",
        description:
          "Nu s-a putut actualiza codul de reducere. Încearcă din nou.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDiscount = async (id: string) => {
    if (!confirm("Ești sigur că vrei să ștergi acest cod de reducere?")) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/discount/${id}`, {
        method: "DELETE",
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.canDeactivate) {
          // Dacă nu poate fi șters dar poate fi dezactivat
          const discountToUpdate = discounts.find((d) => d.id === id);
          if (discountToUpdate) {
            const updatedDiscount = { ...discountToUpdate, usesLeft: 0 };
            setEditingDiscount(updatedDiscount);
            handleUpdateDiscount();
          }
          return;
        }
        throw new Error(
          data.message || "Nu s-a putut șterge codul de reducere"
        );
      }

      toast({
        title: "Succes",
        description: "Codul de reducere a fost șters cu succes",
      });

      fetchDiscounts();
    } catch (error) {
      console.error("Eroare la ștergerea codului de reducere:", error);
      toast({
        title: "Eroare",
        description: "Nu s-a putut șterge codul de reducere",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const isDiscountCodeActive = (discountCode: DiscountCode) => {
    const isExpired =
      discountCode.expirationDate &&
      new Date(discountCode.expirationDate) < new Date();
    const hasNoUsesLeft = discountCode.usesLeft === 0;

    return !isExpired && !hasNoUsesLeft;
  };

  if (loading && discounts.length === 0) {
    return <LoadingSpinner text="Se încarcă reducerile..." />;
  }

  return (
    <Tabs defaultValue="active" className="w-full">
      <TabsList className="grid grid-cols-3 w-full max-w-md mb-6">
        <TabsTrigger value="active">Active</TabsTrigger>
        <TabsTrigger value="add">Adaugă</TabsTrigger>
        <TabsTrigger value="history">Istoric</TabsTrigger>
      </TabsList>

      <TabsContent value="active" className="space-y-4">
        <div className="grid md:grid-cols-2 gap-4">
          {discounts
            .filter((d) => isDiscountCodeActive(d))
            .map((discount) => (
              <Card key={discount.id} className="overflow-hidden">
                <CardHeader className="bg-gray-50 pb-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-blue-50 text-blue-500">
                        {discount.type === "free_shipping"
                          ? "Transport Gratuit"
                          : discount.type === "percentage"
                          ? `${discount.value}%`
                          : "Valoare Fixă"}
                      </Badge>
                      <CardTitle className="text-lg">{discount.code}</CardTitle>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-green-600 bg-green-50 px-2 py-1 rounded-full flex items-center">
                        Utilizări rămase:{" "}
                        {discount.usesLeft === null
                          ? "Nelimitat"
                          : discount.usesLeft}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-500">Total Utilizări</p>
                        <p className="text-lg font-semibold">
                          {discount.totalUses}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">
                          Total Tranzacții
                        </p>
                        <p className="text-lg font-semibold">
                          {discount.totalTransactionAmount?.toFixed(2) ||
                            "0.00"}{" "}
                          RON
                        </p>
                      </div>
                    </div>
                    {discount.expirationDate && (
                      <div>
                        <p className="text-sm text-gray-500">Expiră la</p>
                        <p className="text-sm">
                          {new Date(discount.expirationDate).toLocaleDateString(
                            "ro-RO"
                          )}
                        </p>
                      </div>
                    )}
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setEditingDiscount(discount)}
                      >
                        <Pencil className="h-4 w-4 mr-1" />
                        Editează
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDeleteDiscount(discount.id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1" />
                        Șterge
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

          {discounts.filter((d) => isDiscountCodeActive(d)).length === 0 && (
            <Alert className="col-span-2">
              <AlertDescription>
                Nu există reduceri active în acest moment. Adaugă una nouă din
                tab-ul &quot;Adaugă&quot;.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </TabsContent>

      <TabsContent value="add">
        <Card>
          <CardHeader>
            <CardTitle>Adaugă o nouă reducere</CardTitle>
            <CardDescription>
              Completează detaliile pentru a crea o nouă reducere
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="code">Cod reducere</Label>
                <Input
                  id="code"
                  placeholder="ex: VARA2023"
                  value={newDiscount.code}
                  onChange={(e) =>
                    setNewDiscount({
                      ...newDiscount,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Tip reducere</Label>
                <RadioGroup
                  value={newDiscount.type}
                  onValueChange={(value) =>
                    setNewDiscount({
                      ...newDiscount,
                      type: value as DiscountType,
                    })
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="free_shipping" id="free_shipping" />
                    <Label htmlFor="free_shipping">Transport Gratuit</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="percentage" id="percentage" />
                    <Label htmlFor="percentage">Procent Reducere</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixed" id="fixed" />
                    <Label htmlFor="fixed">Valoare Fixă</Label>
                  </div>
                </RadioGroup>
              </div>
              {newDiscount.type !== "free_shipping" && (
                <div className="space-y-2">
                  <Label htmlFor="value">Valoare reducere</Label>
                  <Input
                    id="value"
                    type="number"
                    min="1"
                    max={newDiscount.type === "percentage" ? "100" : "10000"}
                    value={newDiscount.value}
                    onChange={(e) =>
                      setNewDiscount({
                        ...newDiscount,
                        value: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="usesLeft">
                  Număr de utilizări (gol = nelimitat)
                </Label>
                <Input
                  id="usesLeft"
                  type="number"
                  value={newDiscount.usesLeft?.toString() || ""}
                  onChange={(e) =>
                    setNewDiscount({
                      ...newDiscount,
                      usesLeft:
                        e.target.value === "" ? null : parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="expirationDate">Dată expirare (opțional)</Label>
                <Input
                  id="expirationDate"
                  type="date"
                  value={
                    newDiscount.expirationDate
                      ? new Date(newDiscount.expirationDate)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    setNewDiscount({
                      ...newDiscount,
                      expirationDate: e.target.value ? e.target.value : null,
                    })
                  }
                />
              </div>
              <div className="space-y-2 flex items-center space-x-2">
                <Checkbox
                  id="canCumulate"
                  checked={newDiscount.canCumulate}
                  onCheckedChange={(checked) =>
                    setNewDiscount({
                      ...newDiscount,
                      canCumulate: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="canCumulate">
                  Se poate folosi cu alte reduceri
                </Label>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end">
            <Button onClick={handleAddDiscount} disabled={loading}>
              <Plus className="h-4 w-4 mr-1" />
              Adaugă Reducere
            </Button>
          </CardFooter>
        </Card>
      </TabsContent>

      <TabsContent value="history">
        <div className="grid md:grid-cols-2 gap-4">
          {discounts
            .filter((d) => !isDiscountCodeActive(d))
            .map((discount) => (
              <Card key={discount.id} className="overflow-hidden opacity-80">
                <CardHeader className="bg-gray-50 pb-3">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-gray-50 text-gray-500">
                        {discount.type === "free_shipping"
                          ? "Transport Gratuit"
                          : discount.type === "percentage"
                          ? `${discount.value}%`
                          : "Valoare Fixă"}
                      </Badge>
                      <CardTitle className="text-lg">{discount.code}</CardTitle>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm font-medium text-gray-600 bg-gray-100 px-2 py-1 rounded-full flex items-center">
                        Utilizări rămase:{" "}
                        {discount.usesLeft === null
                          ? "Nelimitat"
                          : discount.usesLeft}
                      </span>
                    </div>
                  </div>
                  <CardDescription className="mt-1">
                    {discount.expirationDate
                      ? `Expiră la: ${new Date(
                          discount.expirationDate
                        ).toLocaleDateString()}`
                      : "Fără expirare"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                  <div className="text-sm space-y-1">
                    {discount.type !== "free_shipping" && (
                      <div className="flex items-center text-gray-600">
                        <Percent className="h-4 w-4 mr-2" />
                        Valoare: {discount.value}{" "}
                        {discount.type === "percentage" ? "%" : "RON"}
                      </div>
                    )}
                    <div className="flex items-center text-gray-600">
                      <Tag className="h-4 w-4 mr-2" />
                      Utilizări totale: {discount.totalUses}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="flex justify-end gap-2 pt-2 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingDiscount({ ...discount, usesLeft: null });
                      handleUpdateDiscount();
                    }}
                    className="text-gray-600"
                  >
                    Reactivează
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteDiscount(discount.id)}
                    className="text-gray-600 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Șterge
                  </Button>
                </CardFooter>
              </Card>
            ))}

          {discounts.filter((d) => !isDiscountCodeActive(d)).length === 0 && (
            <Alert className="col-span-2">
              <AlertDescription>
                Nu există reduceri inactive în acest moment.
              </AlertDescription>
            </Alert>
          )}
        </div>
      </TabsContent>

      {editingDiscount && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Editează reducerea</CardTitle>
              <CardDescription>
                Actualizează detaliile pentru reducerea {editingDiscount.code}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-code">Cod reducere</Label>
                <Input
                  id="edit-code"
                  value={editingDiscount.code}
                  onChange={(e) =>
                    setEditingDiscount({
                      ...editingDiscount,
                      code: e.target.value.toUpperCase(),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-type">Tip reducere</Label>
                <RadioGroup
                  value={editingDiscount.type}
                  onValueChange={(value) =>
                    setEditingDiscount({
                      ...editingDiscount,
                      type: value as DiscountType,
                    })
                  }
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem
                      value="free_shipping"
                      id="edit-free_shipping"
                    />
                    <Label htmlFor="edit-free_shipping">
                      Transport Gratuit
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="percentage" id="edit-percentage" />
                    <Label htmlFor="edit-percentage">Procent Reducere</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="fixed" id="edit-fixed" />
                    <Label htmlFor="edit-fixed">Valoare Fixă</Label>
                  </div>
                </RadioGroup>
              </div>
              {editingDiscount.type !== "free_shipping" && (
                <div className="space-y-2">
                  <Label htmlFor="edit-value">Valoare reducere</Label>
                  <Input
                    id="edit-value"
                    type="number"
                    min="1"
                    max={
                      editingDiscount.type === "percentage" ? "100" : "10000"
                    }
                    value={editingDiscount.value}
                    onChange={(e) =>
                      setEditingDiscount({
                        ...editingDiscount,
                        value: parseInt(e.target.value),
                      })
                    }
                  />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="edit-usesLeft">
                  Număr de utilizări (gol = nelimitat)
                </Label>
                <Input
                  id="edit-usesLeft"
                  type="number"
                  value={editingDiscount.usesLeft?.toString() || ""}
                  onChange={(e) =>
                    setEditingDiscount({
                      ...editingDiscount,
                      usesLeft:
                        e.target.value === "" ? null : parseInt(e.target.value),
                    })
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-expirationDate">
                  Dată expirare (opțional)
                </Label>
                <Input
                  id="edit-expirationDate"
                  type="date"
                  value={
                    editingDiscount.expirationDate
                      ? new Date(editingDiscount.expirationDate)
                          .toISOString()
                          .split("T")[0]
                      : ""
                  }
                  onChange={(e) =>
                    setEditingDiscount({
                      ...editingDiscount,
                      expirationDate: e.target.value ? e.target.value : null,
                    })
                  }
                />
              </div>
              <div className="space-y-2 flex items-center space-x-2">
                <Checkbox
                  id="edit-canCumulate"
                  checked={editingDiscount.canCumulate}
                  onCheckedChange={(checked) =>
                    setEditingDiscount({
                      ...editingDiscount,
                      canCumulate: checked as boolean,
                    })
                  }
                />
                <Label htmlFor="edit-canCumulate">
                  Se poate folosi cu alte reduceri
                </Label>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="ghost" onClick={() => setEditingDiscount(null)}>
                Anulează
              </Button>
              <Button onClick={handleUpdateDiscount}>
                Salvează modificările
              </Button>
            </CardFooter>
          </Card>
        </div>
      )}
    </Tabs>
  );
}
