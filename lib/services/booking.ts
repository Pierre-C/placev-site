/**
 * lib/services/booking.ts
 * Logique métier pure pour les réservations de postes (open-space).
 * Fonctions pures — aucun appel DB.
 */

import type { Slot } from "@prisma/client"

/**
 * Calcule le coût en crédits d'un créneau.
 * AM = 1 crédit, PM = 1 crédit, FULL = 2 crédits.
 */
export function calculateCost(slot: Slot): number {
  return slot === "FULL" ? 2 : 1
}

/**
 * Vérifie si une réservation est possible au regard du solde.
 * Règle : user.credits - cost >= 0.
 */
export function canBook({ credits, cost }: { credits: number; cost: number }): boolean {
  return credits - cost >= 0
}

/**
 * Vérifie si une réservation peut être annulée.
 * Règles :
 *  - status doit être "CONFIRMED" (pas "CANCELLED")
 *  - Il reste plus de 12h avant la date de réservation (date UTC midnight)
 */
export function canCancel(reservation: {
  status: string
  date: Date
}): boolean {
  if (reservation.status === "CANCELLED") return false
  const hoursBeforeStart = (reservation.date.getTime() - Date.now()) / (1000 * 60 * 60)
  return hoursBeforeStart > 12
}
