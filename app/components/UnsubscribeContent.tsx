"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "@/hooks/use-toast";

export default function UnsubscribeContent() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  useEffect(() => {
    if (email) {
      handleUnsubscribe(email);
    }
  }, [email]);

  const handleUnsubscribe = async (email: string) => {
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
        <p className="mt-2 text-center text-sm text-gray-600">
          {isLoading
            ? "Procesăm dezabonarea..."
            : "Ne pare rău să te vedem plecând! Procesăm dezabonarea ta..."}
        </p>
      </div>
    </div>
  );
} 