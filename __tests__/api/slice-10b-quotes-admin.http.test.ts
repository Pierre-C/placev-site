/**
 * __tests__/api/slice-10b-quotes-admin.http.test.ts
 * Tests HTTP — Slice 10b : Gestion Admin des Devis Salle de Réunion
 *
 * Couvre :
 * - POST /api/booking/quote       → startTime/endTime maintenant sauvegardés
 * - POST /api/admin/quotes/[id]/cancel → nouvelle route d'annulation
 * - POST /api/admin/quotes/[id]/confirm (régression)
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
import * as confirmQuoteHandler from "@/app/api/admin/quotes/[id]/confirm/route"
import * as cancelQuoteHandler from "@/app/api/admin/quotes/[id]/cancel/route"
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
    firstName: "Admin",
    lastName: "Place V",
    role: "ADMIN",
    segment: "BOULIACAIS",
    credits: 99,
  },
}

const fakeUserSession = {
  user: {
    id: "user-123",
    email: "user@test.fr",
    firstName: "Jean",
    lastName: "Dupont",
    role: "USER",
    segment: "EXTERNE",
    credits: 5,
  },
}

const fakePendingQuote = {
  id: "quote-123",
  userId: null,
  date: new Date(FUTURE_DATE),
  slot: "AM" as const,
  type: "MEETING_ROOM" as const,
  status: "PENDING_QUOTE" as const,
  isProxy: false,
  proxyAdminId: null,
  label: null,
  startTime: "09:00",
  endTime: "12:00",
  companyName: "ACME Corp",
  message: "Besoin d'une salle pour 10 personnes",
  contactName: "John Doe",
  contactEmail: "john@example.com",
  contactPhone: "0612345678",
  creditsCost: null,
  stripePriceAmount: null,
  stripePaymentIntentId: null,
  cancelledAt: null,
  createdAt: new Date(),
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockReset(mockPrisma)
  vi.clearAllMocks()
  vi.mocked(auth).mockResolvedValue(fakeAdminSession as Awaited<ReturnType<typeof auth>>)
  mockPrisma.systemSetting.findUnique.mockImplementation(async ({ where }: any) => {
    if (where.key === "OPEN_DAYS") return { key: "OPEN_DAYS", value: "1,2,3,4,5" }
    if (where.key === "DESK_CAPACITY") return { key: "DESK_CAPACITY", value: "15" }
    return null
  })
  mockPrisma.closedDate.findMany.mockResolvedValue([])
  mockPrisma.reservation.findMany.mockResolvedValue([])
})

// ─── POST /api/booking/quote — startTime/endTime ─────────────────────────────

describe("POST /api/booking/quote — startTime et endTime sauvegardés", () => {
  it("201 — startTime et endTime inclus dans la création de la réservation", async () => {
    mockPrisma.reservation.create.mockResolvedValue(fakePendingQuote as any)

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
            contactName: "John Doe",
            contactEmail: "john@example.com",
            contactPhone: "0612345678",
            message: "Besoin d'une salle pour 10 personnes",
          }),
        })

        expect(res.status).toBe(201)
        expect(mockPrisma.reservation.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              startTime: "09:00",
              endTime: "12:00",
              type: "MEETING_ROOM",
              status: "PENDING_QUOTE",
            }),
          })
        )
      },
    })
  })

  it("201 — PM slot : startTime=13:00, endTime=17:00 sauvegardés", async () => {
    const fakePmQuote = { ...fakePendingQuote, slot: "PM" as const, startTime: "13:00", endTime: "17:00" }
    mockPrisma.reservation.create.mockResolvedValue(fakePmQuote as any)

    await testApiHandler({
      appHandler: quoteHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            date: FUTURE_DATE,
            start: "13:00",
            end: "17:00",
            companyName: "Beta Corp",
            contactName: "Jane Smith",
            contactEmail: "jane@beta.com",
            contactPhone: "0712345678",
          }),
        })

        expect(res.status).toBe(201)
        expect(mockPrisma.reservation.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              startTime: "13:00",
              endTime: "17:00",
            }),
          })
        )
      },
    })
  })
})

// ─── POST /api/admin/quotes/[id]/cancel ──────────────────────────────────────

describe("POST /api/admin/quotes/[id]/cancel", () => {
  const quoteId = "quote-123"

  it("200 — PENDING_QUOTE → CANCELLED avec cancelledAt renseigné", async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue(fakePendingQuote as any)
    mockPrisma.reservation.update.mockResolvedValue({
      ...fakePendingQuote,
      status: "CANCELLED" as const,
      cancelledAt: new Date(),
    } as any)

    await testApiHandler({
      appHandler: cancelQuoteHandler,
      params: { id: quoteId },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST" })

        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.reservation.status).toBe("CANCELLED")

        expect(mockPrisma.reservation.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: quoteId },
            data: expect.objectContaining({
              status: "CANCELLED",
              cancelledAt: expect.any(Date),
            }),
          })
        )
      },
    })
  })

  it("404 — devis introuvable", async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue(null)

    await testApiHandler({
      appHandler: cancelQuoteHandler,
      params: { id: "unknown-id" },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST" })

        expect(res.status).toBe(404)
        expect(mockPrisma.reservation.update).not.toHaveBeenCalled()
      },
    })
  })

  it("409 — devis déjà CANCELLED → conflit", async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue({
      ...fakePendingQuote,
      status: "CANCELLED" as const,
      cancelledAt: new Date(),
    } as any)

    await testApiHandler({
      appHandler: cancelQuoteHandler,
      params: { id: quoteId },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST" })

        expect(res.status).toBe(409)
        expect(mockPrisma.reservation.update).not.toHaveBeenCalled()
      },
    })
  })

  it("409 — devis CONFIRMED → impossible d'annuler", async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue({
      ...fakePendingQuote,
      status: "CONFIRMED" as const,
    } as any)

    await testApiHandler({
      appHandler: cancelQuoteHandler,
      params: { id: quoteId },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST" })

        expect(res.status).toBe(409)
        expect(mockPrisma.reservation.update).not.toHaveBeenCalled()
      },
    })
  })

  it("403 — non-admin → accès refusé", async () => {
    vi.mocked(auth).mockResolvedValueOnce(fakeUserSession as Awaited<ReturnType<typeof auth>>)

    await testApiHandler({
      appHandler: cancelQuoteHandler,
      params: { id: quoteId },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST" })

        expect(res.status).toBe(403)
        expect(mockPrisma.reservation.findUnique).not.toHaveBeenCalled()
        expect(mockPrisma.reservation.update).not.toHaveBeenCalled()
      },
    })
  })

  it("403 — non authentifié → accès refusé", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as Awaited<ReturnType<typeof auth>>)

    await testApiHandler({
      appHandler: cancelQuoteHandler,
      params: { id: quoteId },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST" })

        expect(res.status).toBe(403)
        expect(mockPrisma.reservation.update).not.toHaveBeenCalled()
      },
    })
  })
})

// ─── Régression POST /api/admin/quotes/[id]/confirm ──────────────────────────

describe("POST /api/admin/quotes/[id]/confirm — régression", () => {
  const quoteId = "quote-123"

  it("200 — PENDING_QUOTE → CONFIRMED (comportement inchangé)", async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue(fakePendingQuote as any)
    mockPrisma.reservation.update.mockResolvedValue({
      ...fakePendingQuote,
      status: "CONFIRMED" as const,
    } as any)

    await testApiHandler({
      appHandler: confirmQuoteHandler,
      params: { id: quoteId },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST" })

        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.reservation.status).toBe("CONFIRMED")
      },
    })
  })

  it("409 — CONFIRMED → déjà confirmé (comportement inchangé)", async () => {
    mockPrisma.reservation.findUnique.mockResolvedValue({
      ...fakePendingQuote,
      status: "CONFIRMED" as const,
    } as any)

    await testApiHandler({
      appHandler: confirmQuoteHandler,
      params: { id: quoteId },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST" })

        expect(res.status).toBe(409)
        expect(mockPrisma.reservation.update).not.toHaveBeenCalled()
      },
    })
  })
})
