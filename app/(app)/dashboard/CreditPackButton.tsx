"use client"

/**
 * app/(app)/dashboard/CreditPackButton.tsx
 * Bouton "Acheter" pour un pack de crédits.
 * Fait un POST /api/credits/checkout puis redirige vers l'URL retournée.
 */

import { useState } from "react"

interface Props {
  creditsAmount: "5" | "10" | "20"
  label: string
}

export function CreditPackButton({ creditsAmount, label }: Props) {
  const [loading, setLoading] = useState(false)

  async function handlePurchase() {
    setLoading(true)
    try {
      const res = await fetch("/api/credits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditsAmount }),
      })

      if (!res.ok) {
        console.error("[CreditPackButton] Erreur checkout:", res.status)
        setLoading(false)
        return
      }

      const { url } = await res.json()
      if (url) {
        window.location.href = url
      }
    } catch (err) {
      console.error("[CreditPackButton] Erreur réseau:", err)
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handlePurchase}
      disabled={loading}
      data-testid={`buy-pack-${creditsAmount}`}
      className="mt-3 w-full rounded-xl bg-neutral-900 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-neutral-700 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {loading ? "Redirection…" : label}
    </button>
  )
}
