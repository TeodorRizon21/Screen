'use client'

import { useEffect } from 'react'
import { Button } from "@/components/ui/button"

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="container mx-auto px-6 py-12 text-center">
      <h1 className="text-3xl font-bold mb-4">Something went wrong!</h1>
      <p className="text-gray-600 mb-8">Failed to load order details form.</p>
      <Button onClick={() => reset()}>Try again</Button>
    </div>
  )
}

