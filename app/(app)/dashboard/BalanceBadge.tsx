"use client"

/**
 * app/(app)/dashboard/BalanceBadge.tsx
 * Client Component — affiche le solde de crédits et se met à jour
 * immédiatement via un CustomEvent "credit-balance-update".
 *
 * Ceci permet à UpcomingReservations de mettre à jour l'affichage
 * du solde après une annulation sans attendre le router.refresh().
 */

import { useEffect, useState } from "react"

interface Props {
  initialCredits: number
}

export function BalanceBadge({ initialCredits }: Props) {
  const [credits, setCredits] = useState(initialCredits)

  useEffect(() => {
    function handler(e: Event) {
      setCredits((e as CustomEvent<number>).detail)
    }
    window.addEventListener("credit-balance-update", handler)
    return () => window.removeEventListener("credit-balance-update", handler)
  }, [])

  return (
    <p className="mt-1 text-5xl font-bold" data-testid="credit-balance">
      {credits}
    </p>
  )
}
