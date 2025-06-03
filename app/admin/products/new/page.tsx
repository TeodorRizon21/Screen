import AdminPanel from "@/components/AdminPanel";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  PlusCircle,
  CircleDollarSign,
} from "lucide-react";

export default function NewProductPage() {
  return (
    <div className="p-6 pb-24 md:p-10">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
              <PlusCircle className="h-8 w-8 text-blue-500" />
              Adaugă Produs Nou
            </h1>
            <p className="text-gray-500 mt-1">
              Completează detaliile pentru a adăuga un produs în catalog
            </p>
          </div>
          <Link href="/admin/products">
            <Button
              variant="ghost"
              className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              Înapoi la Produse
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="border-b border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <CircleDollarSign className="h-5 w-5 text-blue-500" />
              Informații Produs
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Completează toate câmpurile obligatorii marcate cu *
            </p>
          </div>
          <div className="p-6">
            <AdminPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
