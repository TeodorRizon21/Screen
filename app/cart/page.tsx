import CartContent from "@/components/CartContent"
import { Suspense } from "react"

export default function CartPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CartContent />
    </Suspense>
  )
}

