"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"

export default function QuoteConfirmButton({ quoteId }: { quoteId: string }) {
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()

  const handleConfirm = async () => {
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/quotes/${quoteId}/confirm`, {
        method: "POST",
      })

      if (!res.ok) {
        throw new Error("Failed to confirm quote")
      }

      router.refresh()
    } catch (error) {
      console.error(error)
      alert("Une erreur est survenue lors de la confirmation")
      setIsLoading(false)
    }
  }

  return (
    <Button
      onClick={handleConfirm}
      data-testid="confirm-quote-btn"
      disabled={isLoading}
      variant="outline"
      size="sm"
    >
      {isLoading ? "En cours..." : "Confirmer"}
    </Button>
  )
}
