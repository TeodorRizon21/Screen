import { auth } from "@clerk/nextjs/server";
import OrderDetailsForm from "@/components/OrderDetailsForm";

export default async function OrderDetailsPage() {
  const { userId } = await auth();

  return (
    <div className="container mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold mb-8 text-center">Detalii comandă</h1>
      <OrderDetailsForm userId={userId || undefined} />
    </div>
  );
}
