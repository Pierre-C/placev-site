/**
 * __tests__/admin.test.ts
 * Tests unitaires â€” Slice 5 : Administration
 *
 * Couvre les rÃ¨gles mÃ©tier admin critiques, notamment le batch de fermeture de date.
 * Ne pas modifier ce fichier une fois les tests verts.
 */

import { describe, it, expect } from "vitest"

// â”€â”€â”€ Fonctions Ã  implÃ©menter par l'agent â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
import {
  shouldShowMemberAlert,
  calculateClosureBatch,
  validateCreditAdjustment,
  filterCsvExport,
  proxyBookingDebit,
  organisationBooking,
  capacityRemaining
} from "@/lib/services/admin"

// â”€â”€â”€ Alerte membre â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("Member alert rule", () => {
  it("should trigger alert when !isMember AND reservationCount > 3", () => {
    const user = { isMember: false, reservationCount: 4 }
    expect(shouldShowMemberAlert(user)).toBe(true)
  })

  it("should NOT trigger alert when isMember = true even with > 3 reservations", () => {
    const user = { isMember: true, reservationCount: 10 }
    expect(shouldShowMemberAlert(user)).toBe(false)
  })

  it("should NOT trigger alert when reservationCount = 3 (threshold is > 3)", () => {
    const user = { isMember: false, reservationCount: 3 }
    expect(shouldShowMemberAlert(user)).toBe(false)
  })

  it("should trigger alert at exactly 4 reservations", () => {
    const user = { isMember: false, reservationCount: 4 }
    expect(shouldShowMemberAlert(user)).toBe(true)
  })
})

// â”€â”€â”€ RÃ©servation proxy â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("Proxy booking", () => {
  it("should debit TARGET user credits, not admin credits", () => {
    const admin = { id: "admin-1", credits: 100 }
    const targetUser = { id: "user-1", credits: 5 }
    const cost = 1
    
    const result = proxyBookingDebit(targetUser, cost)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.user.credits).toBe(4)
    }
    expect(admin.credits).toBe(100) // admin non impactÃ©
  })

  it("should respect the same balance threshold (-3) for proxy bookings", () => {
    const targetUser = { id: "user-1", credits: -3 }
    const cost = 1
    
    const result = proxyBookingDebit(targetUser, cost)
    expect(result.success).toBe(false) // proxy bloquÃ© pour l'utilisateur cible aussi
  })
})

// â”€â”€â”€ RÃ©servation organisation â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("Organisation booking", () => {
  it("should create ORGANIZATION type reservation", () => {
    const reservation = organisationBooking()
    expect(reservation.type).toBe("ORGANIZATION")
  })

  it("should NOT debit any user credits", () => {
    const reservation = organisationBooking()
    expect(reservation.costCredits).toBeNull()
  })

  it("should reduce available capacity by 1", () => {
    const capacity = 15
    const orgBookings = 1
    const confirmedDeskBookings = 5
    const remaining = capacityRemaining(capacity, orgBookings, confirmedDeskBookings)
    expect(remaining).toBe(9)
  })
})

// â”€â”€â”€ Fermeture de date (batch critique) â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
describe("Date closure batch", () => {
  const mockReservations = [
    { id: "r1", userId: "u1", status: "CONFIRMED", costCredits: 1 },
    { id: "r2", userId: "u2", status: "CONFIRMED", costCredits: 2 },
    { id: "r3", userId: "u3", status: "CANCELLED", costCredits: 1 }, // dÃ©jÃ  annulÃ©e
  ]

  it("should cancel all CONFIRMED reservations on the closed date", () => {
    const { toCancel } = calculateClosureBatch(mockReservations)
    expect(toCancel).toHaveLength(2)
    expect(toCancel.every(r => r.id !== "r3")).toBe(true)
  })

  it("should NOT process already-CANCELLED reservations (no double refund)", () => {
    const { toCancel } = calculateClosureBatch(mockReservations)
    const alreadyCancelled = mockReservations.filter(r => r.status === "CANCELLED")
    expect(alreadyCancelled).toHaveLength(1)
    expect(toCancel.find(r => r.id === "r3")).toBeUndefined()
  })

  it("should refund correct credits to each impacted user", () => {
    const { refunds } = calculateClosureBatch(mockReservations)
    expect(refunds[0]).toEqual({ userId: "u1", creditsRefunded: 1 })
    expect(refunds[1]).toEqual({ userId: "u2", creditsRefunded: 2 })
  })

  it("should create a CANCELLATION_REFUND transaction for each cancelled reservation", () => {
    const { transactions } = calculateClosureBatch(mockReservations)
    expect(transactions).toHaveLength(2)
    expect(transactions.every(t => t.type === "CANCELLATION_REFUND")).toBe(true)
  })

  it("should create total refunds matching sum of costCredits", () => {
    const { totalRefunded } = calculateClosureBatch(mockReservations)
    expect(totalRefunded).toBe(3) // 1 + 2
  })
})

describe("Credit adjustment validation", () => {
  it("should require description", () => {
    expect(validateCreditAdjustment({ delta: 5, description: "" })).toBe(false)
    expect(validateCreditAdjustment({ delta: 5, description: "    " })).toBe(false)
    expect(validateCreditAdjustment({ delta: 5, description: "Test" })).toBe(true)
  })
})

describe("CSV filter", () => {
  it("should filter only DESK (OPENSPACE) and exclude ORGANIZATION", () => {
    const reservations = [
      { type: "OPENSPACE" },
      { type: "ORGANIZATION" },
      { type: "OPENSPACE" },
    ]
    const filtered = filterCsvExport(reservations)
    expect(filtered).toHaveLength(2)
    expect(filtered.every(r => r.type === "OPENSPACE")).toBe(true)
  })
})
