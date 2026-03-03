/**
 * __tests__/api/slice-03-booking.http.test.ts
 * Tests HTTP — Slice 3 : Routes de réservation et de disponibilité
 *
 * Utilise next-test-api-route-handler pour tester les vraies routes Next.js.
 * Prisma et Brevo sont mockés — aucun appel réel.
 */

import { testApiHandler } from "next-test-api-route-handler"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockDeep, mockReset } from "vitest-mock-extended"
import type { PrismaClient } from "@prisma/client"

// ─── Mocks (avant tout import de module) ─────────────────────────────────────

vi.mock("@/lib/prisma", () => ({
  prisma: mockDeep<PrismaClient>(),
}))

vi.mock("@/lib/brevo")

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

// ─── Imports après les mocks ──────────────────────────────────────────────────

import * as availabilityHandler from "@/app/api/availability/route"
import * as bookingHandler from "@/app/api/booking/route"
import * as cancelHandler from "@/app/api/booking/[id]/cancel/route"
import { brevo } from "@/lib/brevo"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

const mockPrisma = prisma as ReturnType<typeof mockDeep<PrismaClient>>

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FUTURE_DATE = (() => {
  const d = new Date()
  let futureDate = new Date(d.setDate(d.getDate() + 2)) // Start from tomorrow

  while (
    futureDate.getUTCDay() !== 1 && // Not Monday
    futureDate.getUTCDay() !== 2 && // Not Tuesday
    futureDate.getUTCDay() !== 3    // Not Wednesday
  ) {
    futureDate.setDate(futureDate.getDate() + 1)
  }
  // Use UTC for consistency with new Date("YYYY-MM-DD")
  return futureDate.toISOString().slice(0, 10)
})()

const fakeSession = {
  user: {
    id: "user-externe-123",
    email: "externe@test.fr",
    name: "Externe Test",
    segment: "EXTERNE",
    role: "USER",
    credits: 5,
  },
}

const fakeUser = {
  id: "user-externe-123",
  email: "externe@test.fr",
  name: "Externe Test",
  segment: "EXTERNE" as const,
  role: "USER" as const,
  credits: 5,
  isMember: false,
  passwordHash: "$2b$12$hash",
  createdAt: new Date(),
  updatedAt: new Date(),
}

// Slice 8 : seuil = 0. credits=0 → 0 - cost < 0 → 403.
const fakePoorUser = {
  ...fakeUser,
  id: "user-pauvre-456",
  email: "pauvre@test.fr",
  credits: 0,
}

const fakeCapacitySetting = { key: "DESK_CAPACITY", value: "15" }

const fakeReservation = {
  id: "resa-123",
  userId: fakeUser.id,
  date: new Date(FUTURE_DATE),
  slot: "AM" as const,
  type: "OPENSPACE" as const,
  status: "CONFIRMED" as const,
  isProxy: false,
  proxyAdminId: null,
  creditsCost: 1,
  stripePriceAmount: null,
  stripePaymentIntentId: null,
  cancelledAt: null,
  createdAt: new Date(),
  user: fakeUser,
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockReset(mockPrisma)
  vi.clearAllMocks()

  // Defaults
  vi.mocked(auth).mockResolvedValue(fakeSession as Awaited<ReturnType<typeof auth>>)
  mockPrisma.systemSetting.findUnique.mockResolvedValue(fakeCapacitySetting)
  mockPrisma.closedDate.findMany.mockResolvedValue([])
  mockPrisma.closedDate.findFirst.mockResolvedValue(null)
  mockPrisma.reservation.findMany.mockResolvedValue([])
  mockPrisma.reservation.count.mockResolvedValue(0)
  mockPrisma.user.findUnique.mockResolvedValue(fakeUser)
  mockPrisma.user.update.mockResolvedValue({ ...fakeUser, credits: 4 })
  mockPrisma.reservation.create.mockResolvedValue(fakeReservation)
  mockPrisma.transaction.create.mockResolvedValue({
    id: "tx-123",
    userId: fakeUser.id,
    type: "DEBIT_RESERVATION" as const,
    creditsAdd: -1,
    creditsBefore: 5,
    stripeId: null,
    createdAt: new Date(),
  })
})

// ─── GET /api/availability ────────────────────────────────────────────────────

describe("GET /api/availability", () => {
  it("200 — retourne les créneaux AM et PM pour une plage de dates", async () => {
    await testApiHandler({
      appHandler: availabilityHandler,
      url: `/api/availability?start=${FUTURE_DATE}&end=${FUTURE_DATE}`,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(Array.isArray(body)).toBe(true)
        // 1 jour × 2 créneaux = 2 éléments
        expect(body).toHaveLength(2)
        expect(body[0]).toMatchObject({
          date: FUTURE_DATE,
          slot: expect.stringMatching(/^(AM|PM)$/),
          remaining: expect.any(Number),
          isClosed: false,
        })
      },
    })
  })

  it("200 — retourne remaining=0 et isClosed=true pour une ClosedDate", async () => {
    const closedDateStr = "2099-01-01"
    mockPrisma.closedDate.findMany.mockResolvedValue([
      {
        id: "cd-1",
        date: new Date(closedDateStr),
        reason: "Test fermeture",
        createdByAdminId: "admin-1",
        createdAt: new Date(),
      },
    ])

    await testApiHandler({
      appHandler: availabilityHandler,
      url: `/api/availability?start=${closedDateStr}&end=${closedDateStr}`,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.every((slot: { remaining: number; isClosed: boolean }) => slot.remaining === 0)).toBe(true)
        expect(body.every((slot: { isClosed: boolean }) => slot.isClosed === true)).toBe(true)
      },
    })
  })

  it("200 — respecte la capacité dynamique DESK_CAPACITY", async () => {
    mockPrisma.systemSetting.findUnique.mockResolvedValue({ key: "DESK_CAPACITY", value: "5" })
    // Simuler 3 réservations AM existantes
    mockPrisma.reservation.findMany.mockResolvedValue([
      { date: new Date(FUTURE_DATE), slot: "AM" as const },
      { date: new Date(FUTURE_DATE), slot: "AM" as const },
      { date: new Date(FUTURE_DATE), slot: "AM" as const },
    ] as Awaited<ReturnType<typeof mockPrisma.reservation.findMany>>)

    await testApiHandler({
      appHandler: availabilityHandler,
      url: `/api/availability?start=${FUTURE_DATE}&end=${FUTURE_DATE}`,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })
        expect(res.status).toBe(200)
        const body = await res.json()
        const amSlot = body.find((s: { slot: string }) => s.slot === "AM")
        // capacity=5, 3 réservations AM → remaining=2
        expect(amSlot.remaining).toBe(2)
      },
    })
  })

  it("400 — paramètres start/end manquants", async () => {
    await testApiHandler({
      appHandler: availabilityHandler,
      url: "/api/availability",
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })
        expect(res.status).toBe(400)
      },
    })
  })
})

// ─── POST /api/booking (multi-booking — Slice 9) ─────────────────────────────
// Nouveau format : { bookings: [{ date, slot }] }
// Brevo envoie UN SEUL email "confirmation-reservation-multiple" pour tout le panier.

describe("POST /api/booking", () => {
  it("201 — panier avec 1 créneau AM valide, solde débité, brevo appelé 1 fois", async () => {
    await testApiHandler({
      appHandler: bookingHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookings: [{ date: FUTURE_DATE, slot: "AM" }] }),
        })
        expect(res.status).toBe(201)
        const body = await res.json()
        expect(body.reservations).toHaveLength(1)
        expect(body.reservations[0].status).toBe("CONFIRMED")
        expect(body.totalCost).toBe(1)

        // Débit crédits global (totalCost = 1)
        expect(mockPrisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: fakeUser.id },
            data: { credits: { decrement: 1 } },
          })
        )

        // 1 seule Transaction globale pour tout le panier
        expect(mockPrisma.transaction.create).toHaveBeenCalledTimes(1)
        expect(mockPrisma.transaction.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              type: "DEBIT_RESERVATION",
              creditsAdd: -1,
              creditsBefore: 5,
            }),
          })
        )

        // Brevo appelé 1 seule fois avec le template multi-booking
        expect(vi.mocked(brevo.sendEmail)).toHaveBeenCalledTimes(1)
        expect(vi.mocked(brevo.sendEmail)).toHaveBeenCalledWith(
          expect.objectContaining({
            template: "confirmation-reservation-multiple",
            to: fakeUser.email,
            variables: expect.objectContaining({
              totalCost: 1,
              bookings: expect.any(Array),
            }),
          })
        )
      },
    })
  })

  it("201 — panier avec AM + PM du même jour = 2 réservations séparées, coût total 2", async () => {
    // Configurer le mock pour créer 2 réservations successives
    mockPrisma.reservation.create
      .mockResolvedValueOnce(fakeReservation) // AM
      .mockResolvedValueOnce({ ...fakeReservation, id: "resa-456", slot: "PM" as const }) // PM
    mockPrisma.user.update.mockResolvedValue({ ...fakeUser, credits: 3 })
    mockPrisma.transaction.create.mockResolvedValue({
      id: "tx-multi",
      userId: fakeUser.id,
      type: "DEBIT_RESERVATION" as const,
      creditsAdd: -2,
      creditsBefore: 5,
      stripeId: null,
      createdAt: new Date(),
    })

    await testApiHandler({
      appHandler: bookingHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bookings: [
              { date: FUTURE_DATE, slot: "AM" },
              { date: FUTURE_DATE, slot: "PM" },
            ],
          }),
        })
        expect(res.status).toBe(201)
        const body = await res.json()
        expect(body.reservations).toHaveLength(2)
        expect(body.totalCost).toBe(2)

        // Débit total de 2 crédits
        expect(mockPrisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: { credits: { decrement: 2 } },
          })
        )

        // 1 seule transaction globale (pas 2)
        expect(mockPrisma.transaction.create).toHaveBeenCalledTimes(1)

        // Brevo appelé 1 seule fois (pas 2)
        expect(vi.mocked(brevo.sendEmail)).toHaveBeenCalledTimes(1)
      },
    })
  })

  it("401 — non authentifié → brevo NON appelé", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)

    await testApiHandler({
      appHandler: bookingHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookings: [{ date: FUTURE_DATE, slot: "AM" }] }),
        })
        expect(res.status).toBe(401)
        expect(vi.mocked(brevo.sendEmail)).not.toHaveBeenCalled()
      },
    })
  })

  it("403 — solde insuffisant pour le total du panier (credits=0, totalCost=1 → -1 < 0) → brevo NON appelé", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(fakePoorUser as typeof fakeUser)

    await testApiHandler({
      appHandler: bookingHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookings: [{ date: FUTURE_DATE, slot: "AM" }] }),
        })
        expect(res.status).toBe(403)
        const body = await res.json()
        expect(body.error).toMatch(/solde/i)
        expect(vi.mocked(brevo.sendEmail)).not.toHaveBeenCalled()
        // Aucune réservation créée
        expect(mockPrisma.reservation.create).not.toHaveBeenCalled()
      },
    })
  })

  it("409 — pre-check : un créneau du panier est complet → abort total, brevo NON appelé", async () => {
    // Le pre-check sur count retourne 15 (capacité pleine) pour le créneau demandé
    mockPrisma.reservation.count.mockResolvedValue(15)
    mockPrisma.systemSetting.findUnique.mockResolvedValue({ key: "DESK_CAPACITY", value: "15" })

    await testApiHandler({
      appHandler: bookingHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookings: [{ date: FUTURE_DATE, slot: "AM" }] }),
        })
        expect(res.status).toBe(409)
        expect(vi.mocked(brevo.sendEmail)).not.toHaveBeenCalled()
        // Aucune réservation créée (abort avant tout insert)
        expect(mockPrisma.reservation.create).not.toHaveBeenCalled()
      },
    })
  })

  it("422 — une date du panier est fermée (ClosedDate) → abort total, brevo NON appelé", async () => {
    mockPrisma.closedDate.findFirst.mockResolvedValue({
      id: "cd-1",
      date: new Date(FUTURE_DATE),
      reason: "Fermeture test",
      createdByAdminId: "admin-1",
      createdAt: new Date(),
    })

    await testApiHandler({
      appHandler: bookingHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookings: [{ date: FUTURE_DATE, slot: "AM" }] }),
        })
        expect(res.status).toBe(422)
        expect(vi.mocked(brevo.sendEmail)).not.toHaveBeenCalled()
        expect(mockPrisma.reservation.create).not.toHaveBeenCalled()
      },
    })
  })

  it("422 — une date du panier est passée → abort total, brevo NON appelé", async () => {
    await testApiHandler({
      appHandler: bookingHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookings: [{ date: "2020-01-01", slot: "AM" }] }),
        })
        expect(res.status).toBe(422)
        expect(vi.mocked(brevo.sendEmail)).not.toHaveBeenCalled()
      },
    })
  })

  it("422 — panier vide → rejeté", async () => {
    await testApiHandler({
      appHandler: bookingHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ bookings: [] }),
        })
        expect(res.status).toBe(422)
        expect(vi.mocked(brevo.sendEmail)).not.toHaveBeenCalled()
      },
    })
  })
})

// ─── POST /api/booking/[id]/cancel ────────────────────────────────────────────

describe("POST /api/booking/[id]/cancel", () => {
  it("200 — annulation réussie > 12h avant le créneau, crédits remboursés, brevo appelé", async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue(fakeReservation as Awaited<ReturnType<typeof mockPrisma.reservation.findUnique>>)
    mockPrisma.reservation.update.mockResolvedValue({ ...fakeReservation, status: "CANCELLED" as const, cancelledAt: new Date() })
    mockPrisma.user.update.mockResolvedValue({ ...fakeUser, credits: 6 })
    mockPrisma.transaction.create.mockResolvedValue({
      id: "tx-refund",
      userId: fakeUser.id,
      type: "REFUND_CANCELLATION" as const,
      creditsAdd: 1,
      creditsBefore: 5,
      stripeId: null,
      createdAt: new Date(),
    })

    await testApiHandler({
      appHandler: cancelHandler,
      params: { id: fakeReservation.id },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST" })
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.cancelled).toBe(true)
        expect(body.creditsRefunded).toBe(1)

        // Vérifier le remboursement crédits
        expect(mockPrisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: fakeUser.id },
            data: { credits: { increment: 1 } },
          })
        )

        // Vérifier la Transaction REFUND
        expect(mockPrisma.transaction.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              type: "REFUND_CANCELLATION",
              creditsAdd: 1,
            }),
          })
        )

        // Brevo appelé avec confirmation-annulation
        expect(vi.mocked(brevo.sendEmail)).toHaveBeenCalledWith(
          expect.objectContaining({
            template: "confirmation-annulation",
            to: fakeUser.email,
            variables: expect.objectContaining({
              creditsRefunded: 1,
            }),
          })
        )
      },
    })
  })

  it("403 — tentative d'annulation d'une réservation appartenant à un autre utilisateur → brevo NON appelé", async () => {
    const otherUserReservation = {
      ...fakeReservation,
      userId: "other-user-999",
      user: { ...fakeUser, id: "other-user-999" },
    }
    mockPrisma.reservation.findUnique.mockResolvedValue(otherUserReservation as Awaited<ReturnType<typeof mockPrisma.reservation.findUnique>>)

    await testApiHandler({
      appHandler: cancelHandler,
      params: { id: fakeReservation.id },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST" })
        expect(res.status).toBe(403)
        expect(vi.mocked(brevo.sendEmail)).not.toHaveBeenCalled()
      },
    })
  })

  it("422 — annulation impossible < 12h avant le créneau → brevo NON appelé", async () => {
    // Date dans 6h (< 12h)
    const soonDate = new Date()
    soonDate.setHours(soonDate.getHours() + 6)

    const soonReservation = {
      ...fakeReservation,
      date: soonDate,
    }
    mockPrisma.reservation.findUnique.mockResolvedValue(soonReservation as Awaited<ReturnType<typeof mockPrisma.reservation.findUnique>>)

    await testApiHandler({
      appHandler: cancelHandler,
      params: { id: fakeReservation.id },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST" })
        expect(res.status).toBe(422)
        expect(vi.mocked(brevo.sendEmail)).not.toHaveBeenCalled()
      },
    })
  })

  it("422 — réservation déjà annulée (double annulation) → brevo NON appelé", async () => {
    const cancelledReservation = {
      ...fakeReservation,
      status: "CANCELLED" as const,
      cancelledAt: new Date(),
    }
    mockPrisma.reservation.findUnique.mockResolvedValue(cancelledReservation as Awaited<ReturnType<typeof mockPrisma.reservation.findUnique>>)

    await testApiHandler({
      appHandler: cancelHandler,
      params: { id: fakeReservation.id },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST" })
        expect(res.status).toBe(422)
        expect(vi.mocked(brevo.sendEmail)).not.toHaveBeenCalled()
      },
    })
  })
})
