"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/hooks/use-toast";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "A apărut o eroare");
      }

      toast({
        title: "Succes!",
        description: "Te-ai abonat cu succes la newsletter!",
      });
      setEmail("");
    } catch (error: any) {
      toast({
        title: "Eroare",
        description: error.message || "A apărut o eroare la abonare",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Newsletter Section */}
      <div className="bg-[#F57228] rounded-t-[100px] py-16">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-evenly gap-4">
            {/* Text section */}
            <div className="text-left max-w-sm">
              <p className="text-sm mb-2">Fii la curent cu ScreenShield</p>
              <h2 className="text-2xl md:text-4xl font-bold mb-2">
                Abonează-te la Newsletter!
              </h2>
              <p className="text-gray-700 text-sm">
                Primește notificări despre noile produse de protecție auto și
                ofertele speciale. Îți promitem că nu te vom deranja cu emailuri
                inutile, doar informații relevante pentru tine!
              </p>
            </div>

            {/* Form section */}
            <div className="w-full max-w-md">
              <form onSubmit={handleSubmit}>
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-white border-none rounded-full px-6 h-14 pr-32"
                    required
                    disabled={isLoading}
                  />
                  <Button
                    type="submit"
                    className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black hover:opacity-90 text-white rounded-full px-4 h-10"
                    disabled={isLoading}
                  >
                    {isLoading ? "Se procesează..." : "ABONEAZĂ-TE"}
                  </Button>
                </div>
              </form>
              <p className="text-xs text-gray-700 mt-2">
                Ne pasă de datele tale și nu vom partaja niciodată adresa ta de
                email cu terți.
              </p>
            </div>
          </div>
        </div>
      </div>


    </div>
  );
}
