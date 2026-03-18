/**
 * app/(app)/dashboard/CreditQuantitySelector.tsx
 * Sélecteur de quantité libre de crédits — Client Component.
 * Remplace les packs fixes.
 */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const MIN_CREDITS = 1
const MAX_CREDITS = 50
const DEFAULT_CREDITS = 5

interface Props {
  pricePerCredit: number  // en centimes, pour affichage uniquement
}

export function CreditQuantitySelector({ pricePerCredit }: Props) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(DEFAULT_CREDITS)
  const [loading, setLoading] = useState(false)

  const totalCents = quantity * pricePerCredit
  const totalDisplay =
    totalCents % 100 === 0
      ? `${totalCents / 100} €`
      : `${(totalCents / 100).toFixed(2).replace(".", ",")} €`

  const pricePerCreditDisplay =
    pricePerCredit % 100 === 0
      ? `${pricePerCredit / 100} €/crédit`
      : `${(pricePerCredit / 100).toFixed(2).replace(".", ",")} €/crédit`

  const handleBuy = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/credits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditsAmount: quantity }),
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
      data-testid="credit-quantity-section"
      className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100 max-w-sm"
    >
      <p className="text-sm text-neutral-500 mb-1">{pricePerCreditDisplay}</p>

      {/* Contrôles quantité */}
      <div className="flex items-center gap-4 my-4">
        <button
          data-testid="credit-quantity-minus"
          onClick={() => setQuantity((q) => Math.max(MIN_CREDITS, q - 1))}
          disabled={quantity <= MIN_CREDITS}
          className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-700 font-bold text-xl
                     hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed
                     flex items-center justify-center"
          aria-label="Diminuer la quantité"
        >
          −
        </button>

        <div className="text-center min-w-[80px]">
          <p
            data-testid="credit-quantity-display"
            className="text-3xl font-bold text-neutral-900"
          >
            {quantity}
          </p>
          <p className="text-xs text-neutral-500">crédit{quantity > 1 ? "s" : ""}</p>
        </div>

        <button
          data-testid="credit-quantity-plus"
          onClick={() => setQuantity((q) => Math.min(MAX_CREDITS, q + 1))}
          disabled={quantity >= MAX_CREDITS}
          className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-700 font-bold text-xl
                     hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed
                     flex items-center justify-center"
          aria-label="Augmenter la quantité"
        >
          +
        </button>
      </div>

      {/* Prix total */}
      <p
        data-testid="credit-quantity-price"
        className="text-2xl font-semibold text-neutral-800 mb-5"
      >
        {totalDisplay}
      </p>

      {/* Bouton Acheter */}
      <button
        data-testid="credit-quantity-buy-btn"
        onClick={handleBuy}
        disabled={loading}
        className="w-full py-3 bg-neutral-900 text-white rounded-xl text-sm font-semibold
                   hover:bg-neutral-800 disabled:opacity-50 transition"
      >
        {loading ? "Redirection..." : "Acheter"}
      </button>
    </div>
  )
}
