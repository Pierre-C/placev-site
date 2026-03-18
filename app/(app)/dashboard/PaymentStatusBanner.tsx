"use client"

/**
 * app/(app)/dashboard/PaymentStatusBanner.tsx
 * Bannière de confirmation/annulation paiement — Client Component.
 * Lit le paramètre ?payment= depuis l'URL et affiche le message correspondant.
 * Se masque automatiquement après 6 secondes.
 */

import { useSearchParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function PaymentStatusBanner() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const payment = searchParams.get("payment")
  const [visible, setVisible] = useState(!!payment)

  useEffect(() => {
    if (!payment) return

    let refreshTimer: NodeJS.Timeout

    if (payment === "success") {
      // 1. Rafraîchir immédiatement (souvent le webhook a déjà fini)
      router.refresh()
      
      // 2. Sécurité : rafraîchir à nouveau 2 secondes plus tard si le webhook Stripe a un peu de retard
      refreshTimer = setTimeout(() => {
        router.refresh()
      }, 2000)
    }

    const timer = setTimeout(() => {
      setVisible(false)
      // Nettoyer le paramètre de l'URL
      router.replace("/dashboard", { scroll: false })
    }, 6000)

    return () => {
      clearTimeout(timer)
      if (refreshTimer) clearTimeout(refreshTimer)
    }
  }, [payment, router])

  if (!visible || !payment) return null

  if (payment === "success") {
    return (
      <div
        role="alert"
        data-testid="payment-success-toast"
        className="mb-6 flex items-center gap-3 rounded-xl border border-green-200 bg-green-50 px-4 py-3"
      >
        <span className="text-green-600">✓</span>
        <p className="text-sm font-medium text-green-800">
          Paiement réussi — vos crédits ont été ajoutés à votre compte.
        </p>
        <button
          onClick={() => {
            setVisible(false)
            router.replace("/dashboard", { scroll: false })
          }}
          className="ml-auto text-green-500 hover:text-green-700"
          aria-label="Fermer"
        >
          ×
        </button>
      </div>
    )
  }

  if (payment === "cancelled") {
    return (
      <div
        role="alert"
        data-testid="payment-cancelled-banner"
        className="mb-6 flex items-center gap-3 rounded-xl border border-neutral-200 bg-neutral-50 px-4 py-3"
      >
        <span className="text-neutral-400">○</span>
        <p className="text-sm text-neutral-600">
          Paiement annulé — aucun crédit n'a été débité.
        </p>
        <button
          onClick={() => {
            setVisible(false)
            router.replace("/dashboard", { scroll: false })
          }}
          className="ml-auto text-neutral-400 hover:text-neutral-600"
          aria-label="Fermer"
        >
          ×
        </button>
      </div>
    )
  }

  return null
}
