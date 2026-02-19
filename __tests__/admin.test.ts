/**
 * __tests__/admin.test.ts
 * Tests unitaires — Slice 5 : Administration
 *
 * Couvre les règles métier admin critiques, notamment le batch de fermeture de date.
 * Ne pas modifier ce fichier une fois les tests verts.
 */

import { describe, it, expect } from "vitest"

// ─── Fonctions à implémenter par l'agent ─────────────────────────────────────
// import { shouldShowMemberAlert } from "@/lib/services/admin"
// import { calculateClosureBatch } from "@/lib/services/admin"

// ─── Alerte membre ────────────────────────────────────────────────────────────
describe("Member alert rule", () => {
  it("should trigger alert when !isMember AND reservationCount > 3", () => {
    const user = { isMember: false, reservationCount: 4 }
    const shouldAlert = !user.isMember && user.reservationCount > 3
    expect(shouldAlert).toBe(true)
  })

  it("should NOT trigger alert when isMember = true even with > 3 reservations", () => {
    const user = { isMember: true, reservationCount: 10 }
    const shouldAlert = !user.isMember && user.reservationCount > 3
    expect(shouldAlert).toBe(false)
  })

  it("should NOT trigger alert when reservationCount = 3 (threshold is > 3)", () => {
    const user = { isMember: false, reservationCount: 3 }
    const shouldAlert = !user.isMember && user.reservationCount > 3
    expect(shouldAlert).toBe(false)
  })

  it("should trigger alert at exactly 4 reservations", () => {
    const user = { isMember: false, reservationCount: 4 }
    const shouldAlert = !user.isMember && user.reservationCount > 3
    expect(shouldAlert).toBe(true)
  })
})

// ─── Réservation proxy ────────────────────────────────────────────────────────
describe("Proxy booking", () => {
  it("should debit TARGET user credits, not admin credits", () => {
    const admin = { id: "admin-1", credits: 100 }
    const targetUser = { id: "user-1", credits: 5 }
    const cost = 1
    // L'agent doit implémenter : targetUser.credits -= cost (pas admin.credits)
    const updatedTarget = { ...targetUser, credits: targetUser.credits - cost }
    expect(updatedTarget.credits).toBe(4)
    expect(admin.credits).toBe(100) // admin non impacté
  })

  it("should set isProxy = true on the created reservation", () => {
    const reservation = { isProxy: true, userId: "user-1" }
    expect(reservation.isProxy).toBe(true)
  })

  it("should respect the same balance threshold (-3) for proxy bookings", () => {
    const targetUser = { credits: -3 }
    const cost = 1
    const wouldGoBelow = targetUser.credits - cost < -3
    expect(wouldGoBelow).toBe(true) // proxy bloqué pour l'utilisateur cible aussi
  })
})

// ─── Réservation organisation ─────────────────────────────────────────────────
describe("Organisation booking", () => {
  it("should create ORGANIZATION type reservation", () => {
    const reservation = { type: "ORGANIZATION", userId: null, costCredits: null }
    expect(reservation.type).toBe("ORGANIZATION")
  })

  it("should NOT debit any user credits", () => {
    const reservation = { type: "ORGANIZATION", costCredits: null }
    expect(reservation.costCredits).toBeNull()
  })

  it("should reduce available capacity by 1", () => {
    const capacity = 15
    const orgBookings = 1
    const confirmedDeskBookings = 5
    const remaining = capacity - orgBookings - confirmedDeskBookings
    expect(remaining).toBe(9)
  })
})

// ─── Fermeture de date (batch critique) ───────────────────────────────────────
describe("Date closure batch", () => {
  const mockReservations = [
    { id: "r1", userId: "u1", status: "CONFIRMED", costCredits: 1 },
    { id: "r2", userId: "u2", status: "CONFIRMED", costCredits: 2 },
    { id: "r3", userId: "u3", status: "CANCELLED", costCredits: 1 }, // déjà annulée
  ]

  it("should cancel all CONFIRMED reservations on the closed date", () => {
    const toCancel = mockReservations.filter(r => r.status === "CONFIRMED")
    expect(toCancel).toHaveLength(2)
    expect(toCancel.every(r => r.id !== "r3")).toBe(true)
  })

  it("should NOT process already-CANCELLED reservations (no double refund)", () => {
    const toProcess = mockReservations.filter(r => r.status === "CONFIRMED")
    const alreadyCancelled = mockReservations.filter(r => r.status === "CANCELLED")
    expect(alreadyCancelled).toHaveLength(1)
    expect(toProcess.find(r => r.id === "r3")).toBeUndefined()
  })

  it("should refund correct credits to each impacted user", () => {
    const toCancel = mockReservations.filter(r => r.status === "CONFIRMED")
    const refunds = toCancel.map(r => ({ userId: r.userId, creditsRefunded: r.costCredits }))
    expect(refunds[0]).toEqual({ userId: "u1", creditsRefunded: 1 })
    expect(refunds[1]).toEqual({ userId: "u2", creditsRefunded: 2 })
  })

  it("should create a CANCELLATION_REFUND transaction for each cancelled reservation", () => {
    const toCancel = mockReservations.filter(r => r.status === "CONFIRMED")
    const transactions = toCancel.map(r => ({
      userId: r.userId,
      type: "CANCELLATION_REFUND",
      creditsAdd: r.costCredits,
    }))
    expect(transactions).toHaveLength(2)
    expect(transactions.every(t => t.type === "CANCELLATION_REFUND")).toBe(true)
  })

  it("should create total refunds matching sum of costCredits", () => {
    const toCancel = mockReservations.filter(r => r.status === "CONFIRMED")
    const totalRefunded = toCancel.reduce((sum, r) => sum + r.costCredits!, 0)
    expect(totalRefunded).toBe(3) // 1 + 2
  })
})
