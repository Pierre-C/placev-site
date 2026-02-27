/**
 * __tests__/api/slice-05b-admin-ux.http.test.ts
 * Tests HTTP — Slice 5b : Admin UX Improvements
 *
 * Nouvelles routes :
 *   GET  /api/admin/calendar
 *   GET  /api/admin/reservations
 *   POST /api/admin/reservations/[id]/cancel
 *   POST /api/admin/reservations/cancel-slot
 *   GET  /api/admin/members/[id]
 *   PUT  /api/admin/members/[id]/segment
 *   GET  /api/admin/export/reservations  (fix \\n → vrai newline)
 *
 * Utilise next-test-api-route-handler + vitest-mock-extended.
 * Aucun appel réel à Neon ou Brevo.
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

import * as calendarHandler from "@/app/api/admin/calendar/route"
import * as reservationsHandler from "@/app/api/admin/reservations/route"
import * as cancelReservationHandler from "@/app/api/admin/reservations/[id]/cancel/route"
import * as cancelSlotHandler from "@/app/api/admin/reservations/cancel-slot/route"
import * as memberDetailHandler from "@/app/api/admin/members/[id]/route"
import * as memberSegmentHandler from "@/app/api/admin/members/[id]/segment/route"
import * as exportHandler from "@/app/api/admin/export/reservations/route"
import { brevo } from "@/lib/brevo"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

const mockPrisma = prisma as ReturnType<typeof mockDeep<PrismaClient>>

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FUTURE_DATE = (() => {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  return d.toISOString().slice(0, 10)
})()

const fakeAdminSession = {
  user: {
    id: "admin-123",
    email: "admin@placev.fr",
    name: "Admin Place V",
    role: "ADMIN",
    segment: "BOULIACAIS",
    credits: 99,
  },
}

const fakeUserSession = {
  user: {
    id: "user-extern-123",
    email: "externe@test.fr",
    name: "Externe Test",
    role: "USER",
    segment: "EXTERNE",
    credits: 5,
  },
}

const fakeUser = {
  id: "user-extern-123",
  email: "externe@test.fr",
  name: "Externe Test",
  role: "USER" as const,
  segment: "EXTERNE" as const,
  credits: 5,
  isMember: false,
  passwordHash: "$2b$12$hash",
  createdAt: new Date("2025-06-01T10:00:00Z"),
  updatedAt: new Date("2025-06-01T10:00:00Z"),
}

const makeReservation = (overrides: Record<string, unknown> = {}) => ({
  id: "resa-1",
  userId: fakeUser.id,
  date: new Date(FUTURE_DATE),
  slot: "AM" as const,
  type: "OPENSPACE" as const,
  status: "CONFIRMED" as const,
  isProxy: false,
  proxyAdminId: null,
  label: null,
  creditsCost: 1,
  stripePriceAmount: null,
  stripePaymentIntentId: null,
  cancelledAt: null,
  createdAt: new Date(),
  user: { id: fakeUser.id, name: fakeUser.name, email: fakeUser.email, segment: fakeUser.segment },
  ...overrides,
})

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockReset(mockPrisma)
  vi.clearAllMocks()
  mockPrisma.$transaction.mockImplementation(async (arg) => {
    if (typeof arg === "function") return arg(mockPrisma)
    return Promise.all(arg)
  })
  // Session admin par défaut
  vi.mocked(auth).mockResolvedValue(fakeAdminSession as Awaited<ReturnType<typeof auth>>)
})

// ─── GET /api/admin/calendar ──────────────────────────────────────────────────

describe("GET /api/admin/calendar", () => {
  beforeEach(() => {
    mockPrisma.systemSetting.findUnique.mockImplementation(async ({ where }: { where: { key: string } }) => {
      if (where.key === "DESK_CAPACITY") return { key: "DESK_CAPACITY", value: "15" }
      if (where.key === "OPEN_DAYS") return { key: "OPEN_DAYS", value: "1,2,3" }
      return null
    })
    mockPrisma.closedDate.findMany.mockResolvedValue([])
    mockPrisma.reservation.findMany.mockResolvedValue([])
  })

  it("200 — admin reçoit l'occupancy (count+capacity) par slot pour la plage demandée", async () => {
    // 2 réservations AM sur FUTURE_DATE
    mockPrisma.reservation.findMany.mockResolvedValue([
      makeReservation({ slot: "AM" }),
      makeReservation({ id: "resa-2", slot: "AM" }),
    ])

    await testApiHandler({
      appHandler: calendarHandler,
      url: `/api/admin/calendar?start=${FUTURE_DATE}&end=${FUTURE_DATE}`,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(Array.isArray(body)).toBe(true)
        // Chaque entrée doit avoir count, capacity, isClosed
        const amEntry = body.find((e: { date: string; slot: string }) => e.date === FUTURE_DATE && e.slot === "AM")
        expect(amEntry).toBeDefined()
        expect(amEntry.count).toBe(2)
        expect(amEntry.capacity).toBe(15)
        expect(typeof amEntry.isClosed).toBe("boolean")
      },
    })
  })

  it("200 — réservation FULL compte pour AM et PM", async () => {
    mockPrisma.reservation.findMany.mockResolvedValue([
      makeReservation({ slot: "FULL" }),
    ])

    await testApiHandler({
      appHandler: calendarHandler,
      url: `/api/admin/calendar?start=${FUTURE_DATE}&end=${FUTURE_DATE}`,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })
        expect(res.status).toBe(200)
        const body = await res.json()
        const amEntry = body.find((e: { date: string; slot: string }) => e.date === FUTURE_DATE && e.slot === "AM")
        const pmEntry = body.find((e: { date: string; slot: string }) => e.date === FUTURE_DATE && e.slot === "PM")
        expect(amEntry.count).toBe(1)
        expect(pmEntry.count).toBe(1)
      },
    })
  })

  it("400 — paramètres start/end manquants", async () => {
    await testApiHandler({
      appHandler: calendarHandler,
      url: "/api/admin/calendar",
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })
        expect(res.status).toBe(400)
      },
    })
  })

  it("403 — non-admin refusé", async () => {
    vi.mocked(auth).mockResolvedValue(fakeUserSession as Awaited<ReturnType<typeof auth>>)
    await testApiHandler({
      appHandler: calendarHandler,
      url: `/api/admin/calendar?start=${FUTURE_DATE}&end=${FUTURE_DATE}`,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })
        expect(res.status).toBe(403)
      },
    })
  })
})

// ─── GET /api/admin/reservations ─────────────────────────────────────────────

describe("GET /api/admin/reservations", () => {
  it("200 — retourne les réservations d'une date avec données utilisateur", async () => {
    mockPrisma.reservation.findMany.mockResolvedValue([makeReservation()])

    await testApiHandler({
      appHandler: reservationsHandler,
      url: `/api/admin/reservations?date=${FUTURE_DATE}`,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(Array.isArray(body)).toBe(true)
        expect(body[0]).toMatchObject({
          id: "resa-1",
          slot: "AM",
          status: "CONFIRMED",
          isProxy: false,
          creditsCost: 1,
        })
        expect(body[0].user).toMatchObject({
          id: fakeUser.id,
          name: fakeUser.name,
          email: fakeUser.email,
          segment: fakeUser.segment,
        })
      },
    })
  })

  it("400 — date manquante", async () => {
    await testApiHandler({
      appHandler: reservationsHandler,
      url: "/api/admin/reservations",
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })
        expect(res.status).toBe(400)
      },
    })
  })

  it("403 — non-admin refusé", async () => {
    vi.mocked(auth).mockResolvedValue(fakeUserSession as Awaited<ReturnType<typeof auth>>)
    await testApiHandler({
      appHandler: reservationsHandler,
      url: `/api/admin/reservations?date=${FUTURE_DATE}`,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })
        expect(res.status).toBe(403)
      },
    })
  })
})

// ─── POST /api/admin/reservations/[id]/cancel ────────────────────────────────

describe("POST /api/admin/reservations/[id]/cancel", () => {
  const cancelledResa = makeReservation({ status: "CANCELLED", cancelledAt: new Date() })

  it("200 — annulation valide, crédits remboursés, Transaction créée, brevo appelé 1x", async () => {
    const resa = makeReservation()
    mockPrisma.reservation.findUnique.mockResolvedValue(resa as any)
    mockPrisma.reservation.update.mockResolvedValue(cancelledResa as any)
    mockPrisma.user.update.mockResolvedValue({ ...fakeUser, credits: fakeUser.credits + 1 })
    mockPrisma.transaction.create.mockResolvedValue({
      id: "tx-refund-1",
      userId: fakeUser.id,
      type: "REFUND_CANCELLATION" as const,
      creditsAdd: 1,
      creditsBefore: fakeUser.credits,
      stripeId: null,
      createdAt: new Date(),
    })

    await testApiHandler({
      appHandler: cancelReservationHandler,
      params: { id: resa.id },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST" })
        expect(res.status).toBe(200)

        // Réservation annulée
        expect(mockPrisma.reservation.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: resa.id },
            data: expect.objectContaining({ status: "CANCELLED" }),
          })
        )
        // Crédits remboursés à l'utilisateur
        expect(mockPrisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: fakeUser.id },
            data: { credits: { increment: 1 } },
          })
        )
        // Transaction créée
        expect(mockPrisma.transaction.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ type: "REFUND_CANCELLATION" }),
          })
        )
        // Email envoyé
        expect(vi.mocked(brevo.sendEmail)).toHaveBeenCalledTimes(1)
        expect(vi.mocked(brevo.sendEmail)).toHaveBeenCalledWith(
          expect.objectContaining({
            template: "annulation-par-admin",
            to: fakeUser.email,
          })
        )
      },
    })
  })

  it("404 — réservation introuvable, brevo NON appelé", async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue(null)

    await testApiHandler({
      appHandler: cancelReservationHandler,
      params: { id: "inexistant" },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST" })
        expect(res.status).toBe(404)
        expect(vi.mocked(brevo.sendEmail)).not.toHaveBeenCalled()
      },
    })
  })

  it("409 — réservation déjà CANCELLED, brevo NON appelé", async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue(
      makeReservation({ status: "CANCELLED" }) as any
    )

    await testApiHandler({
      appHandler: cancelReservationHandler,
      params: { id: "resa-1" },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST" })
        expect(res.status).toBe(409)
        expect(vi.mocked(brevo.sendEmail)).not.toHaveBeenCalled()
      },
    })
  })

  it("403 — non-admin refusé", async () => {
    vi.mocked(auth).mockResolvedValue(fakeUserSession as Awaited<ReturnType<typeof auth>>)
    await testApiHandler({
      appHandler: cancelReservationHandler,
      params: { id: "resa-1" },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST" })
        expect(res.status).toBe(403)
      },
    })
  })
})

// ─── POST /api/admin/reservations/cancel-slot ────────────────────────────────

describe("POST /api/admin/reservations/cancel-slot", () => {
  const resaAM = makeReservation({ id: "r-am", slot: "AM", userId: "u1",
    user: { id: "u1", name: "User AM", email: "user-am@test.fr", segment: "EXTERNE" } })
  const resaFULL = makeReservation({ id: "r-full", slot: "FULL", userId: "u2",
    user: { id: "u2", name: "User FULL", email: "user-full@test.fr", segment: "BOULIACAIS" } })
  const resaPM = makeReservation({ id: "r-pm", slot: "PM", userId: "u3",
    user: { id: "u3", name: "User PM", email: "user-pm@test.fr", segment: "REDUIT" } })

  it("200 — annulation AM : inclut slot=AM et slot=FULL, brevo EXACTEMENT 2 fois (pas PM)", async () => {
    // La route doit filtrer slot IN [AM, FULL] pour annuler
    mockPrisma.reservation.findMany.mockResolvedValue([resaAM, resaFULL] as any)
    mockPrisma.reservation.update.mockResolvedValue({ ...resaAM, status: "CANCELLED" as const })
    mockPrisma.user.update.mockResolvedValue({ ...fakeUser })
    mockPrisma.transaction.create.mockResolvedValue({
      id: "tx-1", userId: "u1", type: "REFUND_CANCELLATION" as const,
      creditsAdd: 1, creditsBefore: 5, stripeId: null, createdAt: new Date(),
    })

    await testApiHandler({
      appHandler: cancelSlotHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: FUTURE_DATE, slot: "AM" }),
        })
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.cancelledCount).toBe(2)

        // Brevo appelé 2 fois, pour AM et FULL uniquement
        expect(vi.mocked(brevo.sendEmail)).toHaveBeenCalledTimes(2)
        expect(vi.mocked(brevo.sendEmail)).toHaveBeenCalledWith(
          expect.objectContaining({ template: "annulation-par-admin", to: "user-am@test.fr" })
        )
        expect(vi.mocked(brevo.sendEmail)).toHaveBeenCalledWith(
          expect.objectContaining({ template: "annulation-par-admin", to: "user-full@test.fr" })
        )
      },
    })
  })

  it("200 — annulation PM : inclut slot=PM et slot=FULL, pas AM", async () => {
    mockPrisma.reservation.findMany.mockResolvedValue([resaPM, resaFULL] as any)
    mockPrisma.reservation.update.mockResolvedValue({ ...resaPM, status: "CANCELLED" as const })
    mockPrisma.user.update.mockResolvedValue({ ...fakeUser })
    mockPrisma.transaction.create.mockResolvedValue({
      id: "tx-1", userId: "u3", type: "REFUND_CANCELLATION" as const,
      creditsAdd: 1, creditsBefore: 5, stripeId: null, createdAt: new Date(),
    })

    await testApiHandler({
      appHandler: cancelSlotHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: FUTURE_DATE, slot: "PM" }),
        })
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.cancelledCount).toBe(2)
      },
    })
  })

  it("422 — slot invalide (ni AM ni PM)", async () => {
    await testApiHandler({
      appHandler: cancelSlotHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: FUTURE_DATE, slot: "FULL" }),
        })
        // FULL n'est pas accepté — on ne peut annuler que par demi-journée
        expect(res.status).toBe(422)
      },
    })
  })

  it("403 — non-admin refusé", async () => {
    vi.mocked(auth).mockResolvedValue(fakeUserSession as Awaited<ReturnType<typeof auth>>)
    await testApiHandler({
      appHandler: cancelSlotHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: FUTURE_DATE, slot: "AM" }),
        })
        expect(res.status).toBe(403)
      },
    })
  })
})

// ─── GET /api/admin/members/[id] ─────────────────────────────────────────────

describe("GET /api/admin/members/[id]", () => {
  it("200 — retourne les détails du membre avec les 5 réservations récentes", async () => {
    const userWithCount = {
      ...fakeUser,
      _count: { reservations: 7 },
    }
    const recentResas = [makeReservation(), makeReservation({ id: "r2" })]

    mockPrisma.user.findUnique.mockResolvedValue(userWithCount as any)
    mockPrisma.reservation.findMany.mockResolvedValue(recentResas as any)

    await testApiHandler({
      appHandler: memberDetailHandler,
      params: { id: fakeUser.id },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body).toMatchObject({
          id: fakeUser.id,
          email: fakeUser.email,
          name: fakeUser.name,
          credits: fakeUser.credits,
          isMember: fakeUser.isMember,
          segment: fakeUser.segment,
          role: fakeUser.role,
        })
        expect(body.reservationCount).toBe(7)
        expect(Array.isArray(body.recentReservations)).toBe(true)
        expect(body.recentReservations.length).toBeLessThanOrEqual(5)
      },
    })
  })

  it("404 — membre inexistant", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)

    await testApiHandler({
      appHandler: memberDetailHandler,
      params: { id: "inexistant" },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })
        expect(res.status).toBe(404)
      },
    })
  })

  it("403 — non-admin refusé", async () => {
    vi.mocked(auth).mockResolvedValue(fakeUserSession as Awaited<ReturnType<typeof auth>>)
    await testApiHandler({
      appHandler: memberDetailHandler,
      params: { id: fakeUser.id },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })
        expect(res.status).toBe(403)
      },
    })
  })
})

// ─── PUT /api/admin/members/[id]/segment ─────────────────────────────────────

describe("PUT /api/admin/members/[id]/segment", () => {
  it("200 — modification segment EXTERNE → BOULIACAIS", async () => {
    mockPrisma.user.update.mockResolvedValue({ ...fakeUser, segment: "BOULIACAIS" as const })

    await testApiHandler({
      appHandler: memberSegmentHandler,
      params: { id: fakeUser.id },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ segment: "BOULIACAIS" }),
        })
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.segment).toBe("BOULIACAIS")

        expect(mockPrisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: fakeUser.id },
            data: { segment: "BOULIACAIS" },
          })
        )
      },
    })
  })

  it("422 — segment invalide refusé", async () => {
    await testApiHandler({
      appHandler: memberSegmentHandler,
      params: { id: fakeUser.id },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ segment: "INVALIDE" }),
        })
        expect(res.status).toBe(422)
      },
    })
  })

  it("403 — non-admin refusé", async () => {
    vi.mocked(auth).mockResolvedValue(fakeUserSession as Awaited<ReturnType<typeof auth>>)
    await testApiHandler({
      appHandler: memberSegmentHandler,
      params: { id: fakeUser.id },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ segment: "BOULIACAIS" }),
        })
        expect(res.status).toBe(403)
      },
    })
  })
})

// ─── GET /api/admin/export/reservations (fix \\n) ────────────────────────────

describe("GET /api/admin/export/reservations — fix newline", () => {
  it("200 — CSV avec VRAIS retours à la ligne (char code 10, pas \\\\n littéral)", async () => {
    mockPrisma.reservation.findMany.mockResolvedValue([
      {
        ...makeReservation(),
        user: { name: "User Test", email: "test@test.fr", segment: "EXTERNE" as const },
      },
      {
        ...makeReservation({ id: "r2", slot: "PM" }),
        user: { name: "User 2", email: "user2@test.fr", segment: "BOULIACAIS" as const },
      },
    ] as any)

    await testApiHandler({
      appHandler: exportHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })
        expect(res.status).toBe(200)

        const text = await res.text()

        // L'en-tête CSV exact
        expect(text.startsWith("date,slot,name,email,segment,costCredits,status,isProxy")).toBe(true)

        // Vrais retours à la ligne — le texte doit contenir le char \n (code 10)
        // Si le bug \\n est présent, on aurait des "\\n" littéraux au lieu de sauts de ligne
        const lines = text.split("\n")
        expect(lines.length).toBeGreaterThanOrEqual(3) // en-tête + 2 données

        // Pas de "\\n" littéral dans le CSV
        expect(text).not.toContain("\\n")
      },
    })
  })

  it("CSV filtré uniquement type=OPENSPACE (query findMany vérifiée)", async () => {
    mockPrisma.reservation.findMany.mockResolvedValue([])

    await testApiHandler({
      appHandler: exportHandler,
      test: async ({ fetch }) => {
        await fetch({ method: "GET" })
        expect(mockPrisma.reservation.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ type: "OPENSPACE" }),
          })
        )
      },
    })
  })
})
