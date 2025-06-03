import AdminProductList from "@/components/AdminProductList";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Plus, ShoppingBag } from "lucide-react";

export default function AdminProductsPage() {
  return (
    <div className="p-6 pb-24 md:p-10">
      <div className="max-w-7xl mx-auto">
        {/* Header cu buton înapoi */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-800 flex items-center gap-3">
              <ShoppingBag className="h-8 w-8 text-blue-500" />
              Gestionare Produse
            </h1>
            <p className="text-gray-500 mt-1">
              Adaugă, editează și monitorizează produsele din catalog
            </p>
          </div>
          <div className="flex gap-3">
            <Link href="/admin">
              <Button
                variant="ghost"
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
              >
                <ArrowLeft className="h-4 w-4" />
                Înapoi la Dashboard
              </Button>
            </Link>
            <Link href="/admin/products/new">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2">
                <Plus className="h-4 w-4" />
                Adaugă Produs
              </Button>
            </Link>
          </div>
        </div>

        {/* Conținut principal */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="border-b border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Catalog Produse
            </h2>
            <p className="text-gray-500 text-sm mt-1">
              Vizualizare și editare produse existente
            </p>
          </div>
          <div className="p-6">
            <AdminProductList />
          </div>
        </div>
      </div>
    </div>
  );
}
