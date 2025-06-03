"use client";

import type React from "react";
import { createContext, useContext, useState, useEffect } from "react";

type Language = "en" | "ro";

type TranslationKeys =
  | "search.placeholder"
  | "nav.admin"
  | "nav.cart"
  | "nav.orders"
  | "nav.signin"
  | "nav.language";

type Translations = {
  [key in TranslationKeys]: string;
};

type AllTranslations = {
  [key in Language]: Translations;
};

type LanguageContextType = {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKeys) => string;
};

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

const translations: AllTranslations = {
  en: {
    "search.placeholder": "Search products...",
    "nav.admin": "Admin",
    "nav.cart": "Cart",
    "nav.orders": "Orders",
    "nav.signin": "Sign In",
    "nav.language": "Language",
  },
  ro: {
    "search.placeholder": "Caută produse...",
    "nav.admin": "Admin",
    "nav.cart": "Coș",
    "nav.orders": "Comenzi",
    "nav.signin": "Autentificare",
    "nav.language": "Limbă",
  },
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [language, setLanguage] = useState<Language>(() => {
    if (typeof window !== "undefined") {
      const savedLanguage = localStorage.getItem("language") as Language;
      return savedLanguage && (savedLanguage === "en" || savedLanguage === "ro")
        ? savedLanguage
        : "en";
    }
    return "en";
  });

  // useEffect(() => {
  //   const savedLanguage = localStorage.getItem("language") as Language
  //   if (savedLanguage) {
  //     setLanguage(savedLanguage)
  //   }
  // }, [])

  const changeLanguage = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
  };

  const t = (key: TranslationKeys): string => {
    return translations[language]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider
      value={{ language, setLanguage: changeLanguage, t }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
};
