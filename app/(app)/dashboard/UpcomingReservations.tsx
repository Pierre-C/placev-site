"use client"

/**
 * app/(app)/dashboard/UpcomingReservations.tsx
 * Client Component — liste des réservations à venir avec bouton d'annulation.
 *
 * L'annulation nécessite une confirmation et recharge la page après succès.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { formatYMD } from "@/lib/calendar-utils"

type Reservation = {
  id: string
  date: Date
  slot: "AM" | "PM" | "FULL"
  type: "OPENSPACE" | "MEETING_ROOM"
  creditsCost: number | null
  status: "CONFIRMED" | "CANCELLED"
  canCancel: boolean
}

const SLOT_LABELS: Record<string, string> = {
  AM: "Matin (08h30–13h)",
  PM: "Après-midi (13h–18h)",
  FULL: "Journée (08h30–18h)",
}

interface Props {
  reservations: Reservation[]
}

export function UpcomingReservations({ reservations }: Props) {
  const router = useRouter()
  const [cancellingId, setCancellingId] = useState<string | null>(null)
  const [confirmId, setConfirmId] = useState<string | null>(null)
  const [successId, setSuccessId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function handleCancel(reservationId: string) {
    setCancellingId(reservationId)
    setError(null)

    try {
      const res = await fetch(`/api/booking/${reservationId}/cancel`, {
        method: "POST",
      })

      if (res.ok) {
        const { newBalance } = await res.json()
        setSuccessId(reservationId)
        setConfirmId(null)
        // Mise à jour immédiate du solde via CustomEvent → BalanceBadge réagit sans attendre
        window.dispatchEvent(new CustomEvent("credit-balance-update", { detail: newBalance }))
        // Délai avant router.refresh() : permet à l'UI de montrer cancel-success et à
        // Playwright de lire le nouveau solde avant que la réservation soit retirée de la liste.
        setTimeout(() => router.refresh(), 2000)
      } else {
        const body = await res.json()
        setError(body.error ?? "Erreur lors de l'annulation")
      }
    } catch {
      setError("Une erreur est survenue. Veuillez réessayer.")
    } finally {
      setCancellingId(null)
    }
  }

  if (reservations.length === 0) {
    return (
      <section className="mb-6" data-testid="upcoming-reservations">
        <h2 className="mb-3 text-lg font-semibold text-neutral-900">Réservations à venir</h2>
        <p className="text-sm text-neutral-400">Aucune réservation à venir.</p>
      </section>
    )
  }

  return (
    <section className="mb-6" data-testid="upcoming-reservations">
      <h2 className="mb-3 text-lg font-semibold text-neutral-900">Réservations à venir</h2>

      {error && (
        <div className="mb-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      )}

      <div className="space-y-2">
        {reservations.map((r) => (
          <div
            key={r.id}
            className="rounded-xl bg-white p-4 shadow-sm ring-1 ring-neutral-100"
          >
            {/* Succès annulation */}
            {successId === r.id && (
              <div
                data-testid="cancel-success"
                className="mb-2 rounded-lg bg-green-50 px-3 py-2 text-sm font-medium text-green-700"
              >
                ✓ Réservation annulée — vos crédits ont été remboursés.
              </div>
            )}

            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium text-neutral-900">
                  {/* Date ISO en sr-only pour les assertions de test (toContainText) */}
                  <time
                    dateTime={formatYMD(r.date instanceof Date ? r.date : new Date(r.date as unknown as string))}
                    className="sr-only"
                  >
                    {formatYMD(r.date instanceof Date ? r.date : new Date(r.date as unknown as string))}
                  </time>
                  {r.date.toLocaleDateString("fr-FR", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                  })}
                </p>
                <p className="text-sm text-neutral-500">
                  {SLOT_LABELS[r.slot] ?? r.slot} —{" "}
                  {r.type === "OPENSPACE" ? "Open-space" : "Salle de réunion"}
                  {r.creditsCost != null && ` — ${r.creditsCost} crédit${r.creditsCost > 1 ? "s" : ""}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
                  Confirmée
                </span>

                {r.canCancel && successId !== r.id && (
                  <button
                    data-testid="cancel-booking-btn"
                    onClick={() => setConfirmId(r.id)}
                    disabled={cancellingId === r.id}
                    className="rounded-lg border border-red-200 px-3 py-1 text-xs font-medium text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    Annuler
                  </button>
                )}
              </div>
            </div>

            {/* Dialog de confirmation */}
            {confirmId === r.id && (
              <div className="mt-3 rounded-xl bg-neutral-50 p-4">
                <p className="mb-3 text-sm text-neutral-700">
                  Confirmer l&apos;annulation de cette réservation ? Vos crédits seront remboursés.
                </p>
                <div className="flex gap-2">
                  <button
                    data-testid="confirm-cancel"
                    onClick={() => handleCancel(r.id)}
                    disabled={cancellingId === r.id}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {cancellingId === r.id ? "Annulation…" : "Oui, annuler"}
                  </button>
                  <button
                    onClick={() => setConfirmId(null)}
                    className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-50"
                  >
                    Garder la réservation
                  </button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </section>
  )
}
