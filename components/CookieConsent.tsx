"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { X, Cookie } from "lucide-react";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Verifică dacă localStorage este disponibil și dacă utilizatorul a acceptat deja cookies
    try {
      const cookieConsent = localStorage.getItem("cookie-consent");
      if (!cookieConsent) {
        setIsVisible(true);
      }
    } catch (error) {
      // Dacă localStorage nu este disponibil, afișează pop-up-ul
      setIsVisible(true);
    }
  }, []);

  const acceptCookies = () => {
    try {
      localStorage.setItem("cookie-consent", "accepted");
      setIsVisible(false);
    } catch (error) {
      console.error("Nu s-au putut salva preferințele de cookies:", error);
      setIsVisible(false);
    }
  };

  const declineCookies = () => {
    try {
      localStorage.setItem("cookie-consent", "declined");
      setIsVisible(false);
      // Șterge localStorage existent pentru coș
      localStorage.removeItem("cart");
    } catch (error) {
      console.error("Nu s-au putut salva preferințele de cookies:", error);
      setIsVisible(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-[100] flex items-end md:items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-md w-full md:max-w-lg transform animate-in slide-in-from-bottom-4 duration-300">
        <div className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Cookie className="h-6 w-6 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Utilizarea Cookie-urilor
            </h2>
          </div>
          
          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            Utilizăm localStorage pentru a păstra produsele în coșul tău de cumpărături 
            și pentru a îmbunătăți experiența ta pe site. Prin acceptarea acestor cookie-uri, 
            ne permiți să salvăm preferințele tale și să îți oferim o experiență personalizată.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <Button
              onClick={acceptCookies}
              className="flex-1 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white font-medium"
            >
              Accept toate cookie-urile
            </Button>
            <Button
              onClick={declineCookies}
              variant="outline"
              className="flex-1 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Refuz
            </Button>
          </div>
          
          <p className="text-xs text-gray-500 mt-4 text-center">
            Poți modifica aceste setări oricând din preferințele browserului.
          </p>
        </div>
      </div>
    </div>
  );
} 