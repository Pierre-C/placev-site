/**
 * __tests__/api/slice-10-meeting.http.test.ts
 * Tests HTTP — Slice 10 : Devis Salle de Réunion & Événements Admin
 *
 * Utilise next-test-api-route-handler pour tester les vraies routes Next.js.
 * Prisma et Brevo sont mockés — aucun appel réel.
 */

import { testApiHandler } from "next-test-api-route-handler"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockDeep, mockReset } from "vitest-mock-extended"
import type { PrismaClient } from "@prisma/client"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/prisma", () => ({
  prisma: mockDeep<PrismaClient>(),
}))

vi.mock("@/lib/brevo")

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

// ─── Imports après les mocks ──────────────────────────────────────────────────

import * as quoteHandler from "@/app/api/booking/quote/route"
import * as orgHandler from "@/app/api/admin/bookings/organisation/route"
import * as availabilityHandler from "@/app/api/availability/route"
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

const fakePendingQuoteReservation = {
  id: "quote-resa-123",
  userId: null,
  date: new Date(FUTURE_DATE),
  slot: "AM" as const,
  type: "MEETING_ROOM" as const,
  status: "PENDING_QUOTE" as const,
  isProxy: false,
  proxyAdminId: null,
  label: null,
  companyName: "ACME Corp",
  message: "Besoin d'une salle pour 10 personnes",
  creditsCost: null,
  stripePriceAmount: null,
  stripePaymentIntentId: null,
  cancelledAt: null,
  createdAt: new Date(),
}

const fakeOrgReservation = {
  id: "org-resa-123",
  userId: null,
  date: new Date(FUTURE_DATE),
  slot: "AM" as const,
  type: "ORGANIZATION" as const,
  status: "CONFIRMED" as const,
  isProxy: false,
  proxyAdminId: null,
  label: "Atelier formation",
  companyName: null,
  message: null,
  creditsCost: null,
  stripePriceAmount: null,
  stripePaymentIntentId: null,
  cancelledAt: null,
  createdAt: new Date(),
}

const fakeCapacitySetting = { key: "DESK_CAPACITY", value: "15" }

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockReset(mockPrisma)
  vi.clearAllMocks()
  vi.mocked(auth).mockResolvedValue(fakeAdminSession as Awaited<ReturnType<typeof auth>>)
  mockPrisma.systemSetting.findUnique.mockResolvedValue(fakeCapacitySetting)
  mockPrisma.closedDate.findMany.mockResolvedValue([])
  mockPrisma.reservation.findMany.mockResolvedValue([])
})

// ─── POST /api/booking/quote ─────────────────────────────────────────────────

describe("POST /api/booking/quote", () => {
  it("201 — demande de devis valide : PENDING_QUOTE créée, email admin envoyé", async () => {
    mockPrisma.reservation.findFirst.mockResolvedValue(null) // Pas de devis existant
    mockPrisma.reservation.create.mockResolvedValue(fakePendingQuoteReservation)

    await testApiHandler({
      appHandler: quoteHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: FUTURE_DATE,
            start: "09:00",
            end: "12:00",
            companyName: "ACME Corp",
            message: "Besoin d'une salle pour 10 personnes",
          }),
        })
        expect(res.status).toBe(201)

        // Réservation créée avec le bon type et statut
        expect(mockPrisma.reservation.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              type: "MEETING_ROOM",
              status: "PENDING_QUOTE",
              companyName: "ACME Corp",
            }),
          })
        )

        // Email envoyé à l'admin avec le bon template
        expect(vi.mocked(brevo.sendEmail)).toHaveBeenCalledWith(
          expect.objectContaining({
            template: "nouvelle-demande-devis",
            variables: expect.objectContaining({
              companyName: "ACME Corp",
              date: FUTURE_DATE,
            }),
          })
        )
      },
    })
  })

  it("422 — champs obligatoires manquants (date absente)", async () => {
    await testApiHandler({
      appHandler: quoteHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            start: "09:00",
            end: "12:00",
            companyName: "ACME Corp",
          }),
        })
        expect(res.status).toBe(422)
        expect(vi.mocked(brevo.sendEmail)).not.toHaveBeenCalled()
        expect(mockPrisma.reservation.create).not.toHaveBeenCalled()
      },
    })
  })

  it("422 — companyName manquant", async () => {
    await testApiHandler({
      appHandler: quoteHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: FUTURE_DATE, start: "09:00", end: "12:00" }),
        })
        expect(res.status).toBe(422)
        expect(mockPrisma.reservation.create).not.toHaveBeenCalled()
      },
    })
  })
})

// ─── Impact PENDING_QUOTE sur /api/availability ───────────────────────────────

describe("GET /api/availability — PENDING_QUOTE ne réduit pas la disponibilité", () => {
  it("200 — une PENDING_QUOTE existante n'affecte pas le remaining (isClosed=false)", async () => {
    // La query availability filtre status=CONFIRMED → PENDING_QUOTE exclue
    mockPrisma.reservation.findMany.mockResolvedValue([]) // Aucune CONFIRMED
    mockPrisma.closedDate.findMany.mockResolvedValue([])
    mockPrisma.systemSetting.findUnique.mockResolvedValue({ key: "DESK_CAPACITY", value: "15" })

    await testApiHandler({
      appHandler: availabilityHandler,
      url: `/api/availability?start=${FUTURE_DATE}&end=${FUTURE_DATE}`,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })
        expect(res.status).toBe(200)
        const body = await res.json()
        const amSlot = body.find((s: { slot: string }) => s.slot === "AM")
        // remaining = 15 (PENDING_QUOTE ignorée)
        expect(amSlot.remaining).toBe(15)
        expect(amSlot.isClosed).toBe(false)
      },
    })
  })
})

// ─── POST /api/admin/bookings/organisation (avec seatsBlocked) ───────────────

describe("POST /api/admin/bookings/organisation — seatsBlocked", () => {
  beforeEach(() => {
    mockPrisma.reservation.create.mockResolvedValue(fakeOrgReservation)
  })

  it("201 — seatsBlocked=1 (défaut) : 1 réservation ORGANIZATION créée", async () => {
    await testApiHandler({
      appHandler: orgHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: FUTURE_DATE,
            slot: "AM",
            label: "Atelier formation",
          }),
        })
        expect(res.status).toBe(201)

        // 1 seule réservation (seatsBlocked=1 par défaut)
        expect(mockPrisma.reservation.create).toHaveBeenCalledTimes(1)
        expect(mockPrisma.reservation.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              type: "ORGANIZATION",
              userId: null,
              creditsCost: null,
            }),
          })
        )
        expect(vi.mocked(brevo.sendEmail)).not.toHaveBeenCalled()
      },
    })
  })

  it("201 — seatsBlocked=3 : 3 réservations ORGANIZATION créées (N inserts séquentiels)", async () => {
    mockPrisma.reservation.create
      .mockResolvedValueOnce({ ...fakeOrgReservation, id: "org-1" })
      .mockResolvedValueOnce({ ...fakeOrgReservation, id: "org-2" })
      .mockResolvedValueOnce({ ...fakeOrgReservation, id: "org-3" })

    await testApiHandler({
      appHandler: orgHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: FUTURE_DATE,
            slot: "AM",
            label: "Conférence",
            seatsBlocked: 3,
          }),
        })
        expect(res.status).toBe(201)

        // 3 réservations insérées
        expect(mockPrisma.reservation.create).toHaveBeenCalledTimes(3)

        // Chaque réservation est de type ORGANIZATION
        const calls = mockPrisma.reservation.create.mock.calls
        calls.forEach((call) => {
          expect(call[0].data).toMatchObject({
            type: "ORGANIZATION",
            userId: null,
          })
        })

        expect(vi.mocked(brevo.sendEmail)).not.toHaveBeenCalled()
      },
    })
  })

  it("422 — seatsBlocked=0 rejeté", async () => {
    await testApiHandler({
      appHandler: orgHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: FUTURE_DATE,
            slot: "AM",
            seatsBlocked: 0,
          }),
        })
        expect(res.status).toBe(422)
        expect(mockPrisma.reservation.create).not.toHaveBeenCalled()
      },
    })
  })

  it("403 — non-admin → accès refusé", async () => {
    vi.mocked(auth).mockResolvedValueOnce({
      user: { id: "user-1", role: "USER" },
    } as Awaited<ReturnType<typeof auth>>)

    await testApiHandler({
      appHandler: orgHandler,
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
