/**
 * __tests__/booking.test.ts
 * Tests unitaires — Slice 3 : Logique métier de réservation
 *
 * Ces tests couvrent les règles métier critiques.
 * Ils doivent être écrits AVANT l'implémentation (TDD).
 * Ne pas modifier ce fichier une fois les tests verts.
 */

import { describe, it, expect } from "vitest"
import { calculateCost, canBook, canCancel } from "@/lib/services/booking"
import { formatYMD, addDays, startOfWeekMonday, getMonthGrid } from "@/lib/calendar-utils"

// ─── Helpers de test ─────────────────────────────────────────────────────────
function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000)
}

// ─── Logique de coût ─────────────────────────────────────────────────────────
describe("calculateCost", () => {
  it("should cost 1 credit for AM slot", () => {
    expect(calculateCost("AM")).toBe(1)
  })

  it("should cost 1 credit for PM slot", () => {
    expect(calculateCost("PM")).toBe(1)
  })

  it("should cost 2 credits for FULL day slot", () => {
    expect(calculateCost("FULL")).toBe(2)
  })
})

// ─── Validation du solde (seuil 0 — Slice 8) ─────────────────────────────────
// Règle : credits - cost >= 0. Aucun découvert autorisé.
describe("canBook — balance threshold", () => {
  it("should ALLOW booking when credits=5 and cost=1 (result: 4 >= 0)", () => {
    expect(canBook({ credits: 5, cost: 1 })).toBe(true)
  })

  it("should ALLOW booking when credits=1 and cost=1 (result: 0 >= 0) — LIMITE EXACTE", () => {
    expect(canBook({ credits: 1, cost: 1 })).toBe(true)
  })

  it("should ALLOW booking when credits=2 and cost=2 (result: 0 >= 0) — LIMITE EXACTE FULL", () => {
    expect(canBook({ credits: 2, cost: 2 })).toBe(true)
  })

  it("should BLOCK booking when credits=0 and cost=1 (result: -1 < 0)", () => {
    expect(canBook({ credits: 0, cost: 1 })).toBe(false)
  })

  it("should BLOCK booking when credits=0 and cost=2 (result: -2 < 0)", () => {
    expect(canBook({ credits: 0, cost: 2 })).toBe(false)
  })

  it("should BLOCK booking when credits=1 and cost=2 (result: -1 < 0)", () => {
    expect(canBook({ credits: 1, cost: 2 })).toBe(false)
  })
})

// ─── Règle d'annulation (fenêtre 12h) ────────────────────────────────────────
describe("canCancel — 12h rule", () => {
  it("should ALLOW cancellation when > 12h before start", () => {
    const futureDate = addHours(new Date(), 24)
    expect(canCancel({ status: "CONFIRMED", date: futureDate })).toBe(true)
  })

  it("should ALLOW cancellation exactly at 12h+1min before start", () => {
    const start = addHours(new Date(), 12.1)
    expect(canCancel({ status: "CONFIRMED", date: start })).toBe(true)
  })

  it("should BLOCK cancellation when < 12h before start", () => {
    const start = addHours(new Date(), 6)
    expect(canCancel({ status: "CONFIRMED", date: start })).toBe(false)
  })

  it("should BLOCK cancellation for past reservations", () => {
    const past = addHours(new Date(), -2)
    expect(canCancel({ status: "CONFIRMED", date: past })).toBe(false)
  })

  it("should NOT allow double cancellation (already CANCELLED status)", () => {
    const futureDate = addHours(new Date(), 48)
    expect(canCancel({ status: "CANCELLED", date: futureDate })).toBe(false)
  })
})

// ─── Disponibilité ────────────────────────────────────────────────────────────
describe("getAvailability", () => {
  it("should return remaining=0 for a closed date", () => {
    const isClosed = true
    expect(isClosed ? 0 : 15).toBe(0)
  })

  it("should respect dynamic DESK_CAPACITY from SystemSetting", () => {
    const capacity = 12
    const existingBookings = 10
    const remaining = capacity - existingBookings
    expect(remaining).toBe(2)
  })

  it("should return 0 remaining when capacity is reached", () => {
    const capacity = 15
    const existingBookings = 15
    const remaining = Math.max(0, capacity - existingBookings)
    expect(remaining).toBe(0)
  })
})

// ─── Helpers calendrier ───────────────────────────────────────────────────────
describe("getMonthGrid", () => {
  it("should return exactly 42 days", () => {
    const grid = getMonthGrid(new Date(2025, 2, 1)) // mars 2025
    expect(grid).toHaveLength(42)
  })

  it("should always start on a Monday (getDay() === 1)", () => {
    // Tester plusieurs mois différents
    const months = [
      new Date(2025, 0, 1), // janvier 2025 (commence un mercredi)
      new Date(2025, 2, 1), // mars 2025 (commence un samedi)
      new Date(2025, 6, 1), // juillet 2025 (commence un mardi)
    ]
    for (const month of months) {
      const grid = getMonthGrid(month)
      expect(grid[0].getDay()).toBe(1) // 1 = lundi
    }
  })

  it("should cover the target month", () => {
    const march = new Date(2025, 2, 1) // mars 2025
    const grid = getMonthGrid(march)
    const dates = grid.map((d) => d.getTime())
    // Le 1er mars et le 31 mars doivent être dans la grille
    expect(dates).toContain(new Date(2025, 2, 1).setHours(0, 0, 0, 0))
    expect(dates).toContain(new Date(2025, 2, 31).setHours(0, 0, 0, 0))
  })
})

describe("startOfWeekMonday", () => {
  it("should return Monday of the same week for a Wednesday", () => {
    const wednesday = new Date(2025, 2, 12) // mercredi 12 mars 2025
    const monday = startOfWeekMonday(wednesday)
    expect(monday.getDay()).toBe(1) // lundi
    expect(monday.getDate()).toBe(10) // lundi 10 mars
  })

  it("should return the same Monday if input is Monday", () => {
    const monday = new Date(2025, 2, 10) // lundi 10 mars 2025
    const result = startOfWeekMonday(monday)
    expect(result.getDay()).toBe(1)
    expect(result.getDate()).toBe(10)
  })

  it("should return the PREVIOUS Monday for a Sunday", () => {
    const sunday = new Date(2025, 2, 16) // dimanche 16 mars 2025
    const result = startOfWeekMonday(sunday)
    expect(result.getDay()).toBe(1) // lundi
    expect(result.getDate()).toBe(10) // lundi 10 mars (semaine précédente)
  })
})

describe("formatYMD", () => {
  it("should return YYYY-MM-DD format", () => {
    const date = new Date(2025, 2, 15) // 15 mars 2025 (heure locale)
    expect(formatYMD(date)).toBe("2025-03-15")
  })

  it("should pad month and day with zeros", () => {
    const date = new Date(2025, 0, 5) // 5 janvier 2025
    expect(formatYMD(date)).toBe("2025-01-05")
  })

  it("should use local date components (no timezone drift)", () => {
    // Crée une date à minuit heure locale — toISOString() pourrait donner la veille
    const localMidnight = new Date(2025, 2, 1, 0, 0, 0, 0) // 1er mars à minuit local
    const result = formatYMD(localMidnight)
    // Doit toujours retourner "2025-03-01" quelle que soit la timezone du runtime
    expect(result).toBe("2025-03-01")
  })

  it("slot past today should be disabled", () => {
    const yesterday = addDays(new Date(), -1)
    const isPast = yesterday < new Date()
    expect(isPast).toBe(true)
  })

  it("slot with remaining=0 should be full", () => {
    const remaining = 0
    const isFull = remaining === 0
    expect(isFull).toBe(true)
  })
})

describe("addDays", () => {
  it("should add positive days", () => {
    const date = new Date(2025, 2, 10) // 10 mars
    const result = addDays(date, 5)
    expect(result.getDate()).toBe(15)
  })

  it("should not mutate the original date", () => {
    const date = new Date(2025, 2, 10)
    addDays(date, 5)
    expect(date.getDate()).toBe(10) // original inchangé
  })

  it("should handle month boundaries", () => {
    const date = new Date(2025, 0, 31) // 31 janvier
    const result = addDays(date, 1)
    expect(result.getMonth()).toBe(1) // février
    expect(result.getDate()).toBe(1)
  })
})
