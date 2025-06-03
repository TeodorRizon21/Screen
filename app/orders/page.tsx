import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import OrdersContent from "@/components/OrdersContent"

export default async function OrdersPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/sign-in")
  }

  return <OrdersContent userId={userId} />
}

