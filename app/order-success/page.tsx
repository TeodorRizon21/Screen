import Link from "next/link";
import { Button } from "@/components/ui/button";
import { CheckCircle } from "lucide-react";

export default function OrderSuccessPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <CheckCircle className="mx-auto h-12 w-12 text-green-500" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Comandă plasată cu succes!
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Vă mulțumim pentru comandă. Veți primi un email de confirmare în
            curând.
          </p>
        </div>

        <div className="mt-8 flex justify-center space-x-4">
          <Link href="/my-orders">
            <Button variant="outline">Vezi comenzile mele</Button>
          </Link>
          <Link href="/">
            <Button>Înapoi la magazin</Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
