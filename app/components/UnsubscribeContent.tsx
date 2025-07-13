"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";

export default function UnsubscribeContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  const handleUnsubscribe = async () => {
    if (!email) {
      toast({
        title: "Eroare",
        description: "Adresa de email lipsește",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/newsletter/unsubscribe", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) throw new Error("Failed to unsubscribe");

      setIsSuccess(true);
      toast({
        title: "Succes!",
        description: "Te-ai dezabonat cu succes de la newsletter!",
      });
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "A apărut o eroare la dezabonare",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Dezabonare Reușită
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ai fost dezabonat cu succes de la newsletter. Ne pare rău să te
            vedem plecând!
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Dezabonare de la Newsletter
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600 mb-8">
          Ești sigur că dorești să te dezabonezi de la newsletter?
        </p>
        {email ? (
          <div className="text-center">
            <p className="text-gray-600 mb-6">
              Adresa de email: <strong>{email}</strong>
            </p>
            <Button
              onClick={handleUnsubscribe}
              disabled={isLoading}
              className="w-full max-w-xs mx-auto"
            >
              {isLoading ? "Se procesează..." : "Confirmă Dezabonarea"}
            </Button>
          </div>
        ) : (
          <p className="text-center text-red-600">
            Link-ul de dezabonare este invalid. Te rugăm să verifici că ai
            accesat link-ul corect.
          </p>
        )}
      </div>
    </div>
  );
}
