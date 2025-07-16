import { auth } from "@clerk/nextjs/server";
import Link from "next/link";
import OrdersContent from "@/components/OrdersContent";

export default async function OrdersPage() {
  const { userId } = await auth();

  if (!userId) {
    return (
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold mb-6">Comenzile mele</h1>
        <div className="text-center">
          <p className="mb-4">
            Pentru a vedea comenzile tale, te rugăm să te autentifici.
          </p>
          <Link
            href="/sign-in"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Autentificare
          </Link>
        </div>
      </div>
    );
  }

  return <OrdersContent userId={userId} />;
}
