import HeroMainEditor from "@/components/HeroMainEditor";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ImageIcon } from "lucide-react";

async function getHeroMainImage() {
  try {
    // Încercăm să luăm datele din baza de date
    const heroSetting = await prisma.settings.findUnique({
      where: { id: "hero-main" },
    });

    // Dacă există setări, returnăm datele parsate
    if (heroSetting) {
      return JSON.parse(heroSetting.value);
    }
  } catch (error) {
    console.error("Error fetching hero main image:", error);
  }

  // Dacă nu există setări sau apare o eroare, returnăm valorile implicite
  return {
    imageUrl: "/x6.webp",
    title: "BMW X6 2022",
    subtitle: "X6 Display",
    linkUrl: "",
  };
}

export default async function AdminHeroPage() {
  const mainImage = await getHeroMainImage();

  return (
    <div className="p-6 pb-24 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header cu buton înapoi */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
              <ImageIcon className="h-8 w-8 text-blue-500" />
              Personalizare Banner
            </h1>
            <p className="text-gray-500 mt-1">
              Configurează bannerul principal al paginii de start
            </p>
          </div>
          <Link href="/admin">
            <Button
              variant="ghost"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Înapoi la Dashboard
            </Button>
          </Link>
        </div>

        {/* Conținut principal */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="border-b border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-800">Hero Banner</h2>
            <p className="text-gray-500 text-sm mt-1">
              Personalizează imaginea principală din header-ul paginii de start
            </p>
          </div>
          <div className="p-6">
            <HeroMainEditor initialImage={mainImage} />
          </div>
        </div>
      </div>
    </div>
  );
}
