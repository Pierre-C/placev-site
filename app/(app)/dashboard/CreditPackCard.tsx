/**
 * app/(app)/dashboard/CreditPackCard.tsx
 * Carte de pack de crédits préconfiguré — Client Component.
 */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface Props {
  label: string
  credits: number
  pricePerCredit: number // en centimes
}

export function CreditPackCard({ label, credits, pricePerCredit }: Props) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const totalCents = credits * pricePerCredit
  const totalDisplay =
    totalCents % 100 === 0
      ? `${totalCents / 100}€`
      : `${(totalCents / 100).toFixed(2).replace(".", ",")}€`

  const handleBuy = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/credits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditsAmount: credits }),
      })
      if (res.ok) {
        const { url } = await res.json()
        router.push(url)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      data-testid={`credit-pack-${credits}`}
      className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100 flex flex-col"
    >
      <p className="text-sm text-neutral-500 text-center mb-4">{label}</p>

      <div className="text-center mb-4 flex-1">
        <p className="text-4xl font-bold text-neutral-900">{credits}</p>
        <p className="text-xs text-neutral-500 mt-0.5">crédits</p>
      </div>

      <p
        data-testid={`pack-price-${credits}`}
        className="text-center text-2xl font-semibold text-blue-500 mb-5"
      >
        {totalDisplay}
      </p>

      <button
        data-testid={`buy-pack-${credits}`}
        onClick={handleBuy}
        disabled={loading}
        className="w-full py-3 bg-blue-500 text-white rounded-xl text-sm font-semibold
                   hover:bg-blue-600 disabled:opacity-50 transition"
      >
        {loading ? "Redirection..." : "Acheter"}
      </button>
    </div>
  )
}
