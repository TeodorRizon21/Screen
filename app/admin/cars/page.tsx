import AdminCars from "@/components/AdminCars";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Car } from "lucide-react";

export default function CarsPage() {
  return (
    <div className="p-6 pb-24 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
              <Car className="h-8 w-8 text-blue-500" />
              Administrare Mașini
            </h1>
            <p className="text-gray-500 mt-1">
              Adaugă sau editează mărci, modele și generații de mașini
            </p>
          </div>
          <Link href="/admin">
            <Button
              variant="ghost"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Înapoi la Admin
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="border-b border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <Car className="h-5 w-5 text-blue-500" />
              Adaugă Mașini
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Selectează tipul de adăugare și completează câmpurile necesare
            </p>
          </div>
          <div className="p-6">
            <AdminCars />
          </div>
        </div>
      </div>
    </div>
  );
}
