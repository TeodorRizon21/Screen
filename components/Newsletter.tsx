"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import {
  Facebook,
  Instagram,
  Twitter,
  Mail,
  Phone,
  MapPin,
} from "lucide-react";
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

      {/* Footer Section - white background */}
      <div className="bg-white pt-12 pb-8 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {/* Coloana 1 - Logo și Descriere */}
            <div className="md:col-span-1">
              <h3 className="font-bold text-xl mb-4">ScreenShield</h3>
              <p className="text-sm text-gray-700 mb-4">
                Protecție premium pentru sistemele infotainment auto. Oferim
                cele mai bune soluții pentru toate mărcile și modelele.
              </p>
              <div className="flex space-x-4">
                <Link href="#" className="text-gray-700 hover:text-black">
                  <Facebook size={20} />
                </Link>
                <Link href="#" className="text-gray-700 hover:text-black">
                  <Instagram size={20} />
                </Link>
                <Link href="#" className="text-gray-700 hover:text-black">
                  <Twitter size={20} />
                </Link>
              </div>
            </div>

            {/* Coloana 2 - Meniu Rapid */}
            <div className="md:col-span-1">
              <h3 className="font-bold text-lg mb-4">Meniu Rapid</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/"
                    className="text-gray-700 hover:text-black text-sm"
                  >
                    Acasă
                  </Link>
                </li>
                <li>
                  <Link
                    href="/collection/all"
                    className="text-gray-700 hover:text-black text-sm"
                  >
                    Produse
                  </Link>
                </li>
                <li>
                  <Link
                    href="/my-cars"
                    className="text-gray-700 hover:text-black text-sm"
                  >
                    Mașinile mele
                  </Link>
                </li>
                <li>
                  <Link
                    href="/cart"
                    className="text-gray-700 hover:text-black text-sm"
                  >
                    Coș de cumpărături
                  </Link>
                </li>
              </ul>
            </div>

            {/* Coloana 3 - Colecții Populare */}
            <div className="md:col-span-1">
              <h3 className="font-bold text-lg mb-4">Colecții Populare</h3>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/collection/BMW"
                    className="text-gray-700 hover:text-black text-sm"
                  >
                    BMW
                  </Link>
                </li>
                <li>
                  <Link
                    href="/collection/Mercedes"
                    className="text-gray-700 hover:text-black text-sm"
                  >
                    Mercedes
                  </Link>
                </li>
                <li>
                  <Link
                    href="/collection/Audi"
                    className="text-gray-700 hover:text-black text-sm"
                  >
                    Audi
                  </Link>
                </li>
                <li>
                  <Link
                    href="/collection/Volkswagen"
                    className="text-gray-700 hover:text-black text-sm"
                  >
                    Volkswagen
                  </Link>
                </li>
              </ul>
            </div>

            {/* Coloana 4 - Contact */}
            <div className="md:col-span-1">
              <h3 className="font-bold text-lg mb-4">Contact</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin size={18} className="text-gray-700 mt-0.5" />
                  <span className="text-sm text-gray-700">
                    Strada Exemplu, nr. 123, București
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone size={18} className="text-gray-700" />
                  <span className="text-sm text-gray-700">+40 123 456 789</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail size={18} className="text-gray-700" />
                  <span className="text-sm text-gray-700">
                    contact@screenshield.ro
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="border-t border-gray-200 mt-8 pt-6 text-center text-sm text-gray-700">
            <p>
              © {new Date().getFullYear()} ScreenShield. Toate drepturile
              rezervate.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
