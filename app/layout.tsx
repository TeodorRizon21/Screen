import { ClerkProvider } from "@clerk/nextjs";
import { Inter } from "next/font/google";
import { CartProvider } from "@/contexts/cart-context";
import { LanguageProvider } from "@/contexts/language-context";
import { CarProvider } from "@/contexts/car-context";
import { ScrollProvider } from "@/contexts/scroll-context";
import { ScoutNavbar } from "@/components/newnavbar";
import { Toaster } from "@/components/ui/toaster";
import PageWrapper from "@/components/PageWrapper";
import CookieConsent from "@/components/CookieConsent";
import Footer from "@/components/Footer";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "ScreenShield - Protecție pentru Sisteme Infotainment",
  description:
    "Descoperă gama noastră de filme de protecție premium pentru sisteme infotainment auto. Protecție de înaltă calitate pentru ecranele tale.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro">
      <body className={`${inter.className} flex flex-col min-h-screen`}>
        <ClerkProvider>
          <LanguageProvider>
            <CartProvider>
              <CarProvider>
                <ScrollProvider>
                  <ScoutNavbar />
                  <div className="flex-1">
                    <PageWrapper>{children}</PageWrapper>
                  </div>
                  <Footer />
                  <Toaster />
                  <CookieConsent />
                </ScrollProvider>
              </CarProvider>
            </CartProvider>
          </LanguageProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
