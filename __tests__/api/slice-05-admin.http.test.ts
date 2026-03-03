/**
 * __tests__/api/slice-05-admin.http.test.ts
 * Tests HTTP — Slice 5 : Routes Administration
 *
 * Utilise next-test-api-route-handler pour tester les vraies routes Next.js.
 * Prisma et Brevo sont mockés — aucun appel réel à Neon ou Brevo.
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

import * as membersHandler from "@/app/api/admin/members/route"
import * as memberCreditsHandler from "@/app/api/admin/members/[id]/credits/route"
import * as memberStatusHandler from "@/app/api/admin/members/[id]/member-status/route"
import * as proxyHandler from "@/app/api/admin/bookings/proxy/route"
import * as orgHandler from "@/app/api/admin/bookings/organisation/route"
import * as closeDateHandler from "@/app/api/admin/close-date/route"
import * as capacityHandler from "@/app/api/admin/settings/capacity/route"
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

const fakeTargetUser = {
  id: "user-extern-123",
  email: "externe@test.fr",
  name: "Externe Test",
  role: "USER" as const,
  segment: "EXTERNE" as const,
  credits: 5,
  isMember: false,
  passwordHash: "$2b$12$hash",
  createdAt: new Date(),
  updatedAt: new Date(),
}

// Slice 8 : seuil = 0. credits=0, cost=1 → -1 → below threshold (< 0)
const fakePoorUser = {
  ...fakeTargetUser,
  id: "user-pauvre-456",
  email: "pauvre@test.fr",
  credits: 0,
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockReset(mockPrisma)
  vi.clearAllMocks()
  // Mock transaction to just run the callback with mockPrisma
  mockPrisma.$transaction.mockImplementation(async (arg) => {
    if (typeof arg === "function") {
      return arg(mockPrisma)
    }
    return Promise.all(arg)
  })
  // Par défaut : session admin
  vi.mocked(auth).mockResolvedValue(fakeAdminSession as Awaited<ReturnType<typeof auth>>)
})

// ─── GET /api/admin/members ───────────────────────────────────────────────────

describe("GET /api/admin/members", () => {
  it("200 — admin voit la liste des membres avec reservationCount, alertFlag et lifetimeCredits (Slice 11)", async () => {
    mockPrisma.user.findMany.mockResolvedValue([
      { ...fakeTargetUser, _count: { reservations: 2 } } as unknown as typeof fakeTargetUser,
    ])
    // Mock de l'agrégat lifetimeCredits (prisma.transaction.aggregate ou groupBy)
    mockPrisma.transaction.aggregate.mockResolvedValue({
      _sum: { creditsAdd: 20 },
    } as Awaited<ReturnType<typeof mockPrisma.transaction.aggregate>>)

    await testApiHandler({
      appHandler: membersHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(Array.isArray(body)).toBe(true)
        expect(body[0]).toMatchObject({
          id: fakeTargetUser.id,
          email: fakeTargetUser.email,
          credits: fakeTargetUser.credits,
          isMember: fakeTargetUser.isMember,
          reservationCount: 2,
          alertFlag: false, // 2 ≤ 3, pas d'alerte
          lifetimeCredits: expect.any(Number), // Slice 11 : crédits cumulés depuis création du compte
        })
      },
    })
  })

  it("200 — alertFlag=true si !isMember ET reservationCount > 3", async () => {
    mockPrisma.user.findMany.mockResolvedValue([
      { ...fakeTargetUser, isMember: false, _count: { reservations: 4 } } as unknown as typeof fakeTargetUser,
    ])
    mockPrisma.transaction.aggregate.mockResolvedValue({
      _sum: { creditsAdd: 5 },
    } as Awaited<ReturnType<typeof mockPrisma.transaction.aggregate>>)

    await testApiHandler({
      appHandler: membersHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body[0].alertFlag).toBe(true)
      },
    })
  })

  it("200 — badge deletionRequested visible si deletionRequestedAt non null (Slice 11)", async () => {
    mockPrisma.user.findMany.mockResolvedValue([
      {
        ...fakeTargetUser,
        deletionRequestedAt: new Date(),
        _count: { reservations: 1 },
      } as unknown as typeof fakeTargetUser,
    ])
    mockPrisma.transaction.aggregate.mockResolvedValue({
      _sum: { creditsAdd: 0 },
    } as Awaited<ReturnType<typeof mockPrisma.transaction.aggregate>>)

    await testApiHandler({
      appHandler: membersHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body[0].deletionRequestedAt).not.toBeNull()
      },
    })
  })

  it("403 — non-admin → accès refusé", async () => {
    vi.mocked(auth).mockResolvedValue(fakeUserSession as Awaited<ReturnType<typeof auth>>)

    await testApiHandler({
      appHandler: membersHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })
        expect(res.status).toBe(403)
      },
    })
  })
})

// ─── PUT /api/admin/members/[id]/credits ─────────────────────────────────────

describe("PUT /api/admin/members/[id]/credits", () => {
  it("200 — ajustement valide avec description, Transaction MANUAL_ADJUSTMENT créée, brevo NON appelé", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(fakeTargetUser)
    mockPrisma.user.update.mockResolvedValue({ ...fakeTargetUser, credits: 10 })
    mockPrisma.transaction.create.mockResolvedValue({
      id: "tx-adj-123",
      userId: fakeTargetUser.id,
      type: "MANUAL_ADJUSTMENT" as const,
      creditsAdd: 5,
      creditsBefore: 5,
      stripeId: null,
      createdAt: new Date(),
    })

    await testApiHandler({
      appHandler: memberCreditsHandler,
      params: { id: fakeTargetUser.id },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ delta: 5, description: "Correction manuelle suite erreur" }),
        })
        expect(res.status).toBe(200)

        expect(mockPrisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            data: { credits: { increment: 5 } },
          })
        )
        expect(mockPrisma.transaction.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              type: "MANUAL_ADJUSTMENT",
              creditsAdd: 5,
            }),
          })
        )
        expect(vi.mocked(brevo.sendEmail)).not.toHaveBeenCalled()
      },
    })
  })

  it("422 — description manquante → refusé, brevo NON appelé", async () => {
    await testApiHandler({
      appHandler: memberCreditsHandler,
      params: { id: fakeTargetUser.id },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ delta: 5 }),
        })
        expect(res.status).toBe(422)
        expect(vi.mocked(brevo.sendEmail)).not.toHaveBeenCalled()
      },
    })
  })
})

// ─── PUT /api/admin/members/[id]/member-status ───────────────────────────────

describe("PUT /api/admin/members/[id]/member-status", () => {
  it("200 — toggle isMember false → true", async () => {
    mockPrisma.user.update.mockResolvedValue({ ...fakeTargetUser, isMember: true })

    await testApiHandler({
      appHandler: memberStatusHandler,
      params: { id: fakeTargetUser.id },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ isMember: true }),
        })
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.isMember).toBe(true)

        expect(mockPrisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: fakeTargetUser.id },
            data: { isMember: true },
          })
        )
      },
    })
  })
})

// ─── POST /api/admin/bookings/proxy ──────────────────────────────────────────

describe("POST /api/admin/bookings/proxy", () => {
  beforeEach(() => {
    mockPrisma.closedDate.findFirst.mockResolvedValue(null)
    mockPrisma.systemSetting.findUnique.mockResolvedValue({ key: "DESK_CAPACITY", value: "15" })
    mockPrisma.reservation.count.mockResolvedValue(0)
  })

  it("201 — proxy DESK valide, cible débitée (pas admin), isProxy=true, brevo TO cible", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(fakeTargetUser)
    mockPrisma.reservation.create.mockResolvedValue({
      id: "resa-proxy-123",
      userId: fakeTargetUser.id,
      date: new Date(FUTURE_DATE),
      slot: "AM" as const,
      type: "OPENSPACE" as const,
      status: "CONFIRMED" as const,
      isProxy: true,
      proxyAdminId: "admin-123",
      label: null,
      creditsCost: 1,
      stripePriceAmount: null,
      stripePaymentIntentId: null,
      cancelledAt: null,
      createdAt: new Date(),
    })
    mockPrisma.user.update.mockResolvedValue({ ...fakeTargetUser, credits: 4 })
    mockPrisma.transaction.create.mockResolvedValue({
      id: "tx-proxy-123",
      userId: fakeTargetUser.id,
      type: "DEBIT_RESERVATION" as const,
      creditsAdd: -1,
      creditsBefore: 5,
      stripeId: null,
      createdAt: new Date(),
    })

    await testApiHandler({
      appHandler: proxyHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUserId: fakeTargetUser.id, date: FUTURE_DATE, slot: "AM" }),
        })
        expect(res.status).toBe(201)

        // Crédits débités sur la CIBLE (pas l'admin)
        expect(mockPrisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: fakeTargetUser.id },
            data: { credits: { decrement: 1 } },
          })
        )

        // isProxy=true et type=OPENSPACE (DESK)
        expect(mockPrisma.reservation.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              isProxy: true,
              type: "OPENSPACE",
              userId: fakeTargetUser.id,
            }),
          })
        )

        // Brevo envoyé à la cible, pas à l'admin
        expect(vi.mocked(brevo.sendEmail)).toHaveBeenCalledWith(
          expect.objectContaining({
            template: "confirmation-reservation",
            to: fakeTargetUser.email,
          })
        )
      },
    })
  })

  it("403 — solde cible insuffisant (credits=0, cost=1 → -1 < 0), brevo NON appelé", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(fakePoorUser)

    await testApiHandler({
      appHandler: proxyHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ targetUserId: fakePoorUser.id, date: FUTURE_DATE, slot: "AM" }),
        })
        expect(res.status).toBe(403)
        expect(vi.mocked(brevo.sendEmail)).not.toHaveBeenCalled()
      },
    })
  })
})

// ─── POST /api/admin/bookings/organisation ───────────────────────────────────

describe("POST /api/admin/bookings/organisation", () => {
  it("201 — blocage organisation créé, userId=null, creditsCost=null, aucun email", async () => {
    mockPrisma.reservation.create.mockResolvedValue({
      id: "resa-org-123",
      userId: null,
      date: new Date(FUTURE_DATE),
      slot: "FULL" as const,
      type: "ORGANIZATION" as const,
      status: "CONFIRMED" as const,
      isProxy: false,
      proxyAdminId: null,
      label: "Événement entreprise",
      creditsCost: null,
      stripePriceAmount: null,
      stripePaymentIntentId: null,
      cancelledAt: null,
      createdAt: new Date(),
    })

    await testApiHandler({
      appHandler: orgHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: FUTURE_DATE, slot: "FULL", label: "Événement entreprise" }),
        })
        expect(res.status).toBe(201)

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
})

// ─── POST /api/admin/close-date ──────────────────────────────────────────────

describe("POST /api/admin/close-date", () => {
  // 2 CONFIRMED + 1 CANCELLED (le CANCELLED est ignoré par la query WHERE status=CONFIRMED)
  const confirmedResa1 = {
    id: "r1",
    userId: "u1",
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
    user: { id: "u1", email: "user1@test.fr", name: "User 1" },
  }
  const confirmedResa2 = {
    ...confirmedResa1,
    id: "r2",
    userId: "u2",
    creditsCost: 2,
    user: { id: "u2", email: "user2@test.fr", name: "User 2" },
  }

  it("200 — fermeture avec 2 CONFIRMED, brevo appelé EXACTEMENT 2 fois (pas N+1)", async () => {
    mockPrisma.closedDate.findFirst.mockResolvedValue(null)
    // findMany retourne uniquement les CONFIRMED (le CANCELLED est filtré par la query)
    mockPrisma.reservation.findMany.mockResolvedValue([confirmedResa1, confirmedResa2] as any)
    mockPrisma.closedDate.create.mockResolvedValue({
      id: "cd-1",
      date: new Date(FUTURE_DATE),
      reason: "Travaux",
      createdByAdminId: "admin-123",
      createdAt: new Date(),
    })
    mockPrisma.reservation.update.mockResolvedValue({ ...confirmedResa1, status: "CANCELLED" as const })
    mockPrisma.user.update.mockResolvedValue({ ...fakeTargetUser })
    mockPrisma.transaction.create.mockResolvedValue({
      id: "tx-refund-1",
      userId: "u1",
      type: "REFUND_CANCELLATION" as const,
      creditsAdd: 1,
      creditsBefore: 0,
      stripeId: null,
      createdAt: new Date(),
    })
    mockPrisma.reservation.create.mockResolvedValue({ ...confirmedResa1, type: "ORGANIZATION" as const })

    await testApiHandler({
      appHandler: closeDateHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: FUTURE_DATE, reason: "Travaux" }),
        })
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.cancelledCount).toBe(2)

        // EXACTEMENT 2 emails — pas 3 (le CANCELLED ne reçoit pas d'email)
        expect(vi.mocked(brevo.sendEmail)).toHaveBeenCalledTimes(2)
        expect(vi.mocked(brevo.sendEmail)).toHaveBeenCalledWith(
          expect.objectContaining({ template: "annulation-par-admin", to: "user1@test.fr" })
        )
        expect(vi.mocked(brevo.sendEmail)).toHaveBeenCalledWith(
          expect.objectContaining({ template: "annulation-par-admin", to: "user2@test.fr" })
        )
      },
    })
  })

  it("409 — date déjà fermée, brevo NON appelé", async () => {
    mockPrisma.closedDate.create.mockRejectedValue({
      code: "P2002",
      message: "Unique constraint failed on the fields: (`date`)",
    })

    await testApiHandler({
      appHandler: closeDateHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: FUTURE_DATE, reason: "Doublon" }),
        })
        expect(res.status).toBe(409)
        expect(vi.mocked(brevo.sendEmail)).not.toHaveBeenCalled()
      },
    })
  })
})

// ─── PUT /api/admin/settings/capacity ────────────────────────────────────────

describe("PUT /api/admin/settings/capacity", () => {
  it("200 — capacité mise à jour à 12", async () => {
    mockPrisma.systemSetting.upsert.mockResolvedValue({ key: "DESK_CAPACITY", value: "12" })

    await testApiHandler({
      appHandler: capacityHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: 12 }),
        })
        expect(res.status).toBe(200)

        expect(mockPrisma.systemSetting.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { key: "DESK_CAPACITY" },
            update: { value: "12" },
            create: { key: "DESK_CAPACITY", value: "12" },
          })
        )
      },
    })
  })

  it("422 — valeur < 1 refusée", async () => {
    await testApiHandler({
      appHandler: capacityHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ value: 0 }),
        })
        expect(res.status).toBe(422)
      },
    })
  })
})

// ─── GET /api/admin/export/reservations ──────────────────────────────────────

describe("GET /api/admin/export/reservations", () => {
  it("200 — CSV retourné avec Content-Type text/csv, uniquement DESK (OPENSPACE)", async () => {
    mockPrisma.reservation.findMany.mockResolvedValue([
      {
        id: "resa-export-1",
        userId: fakeTargetUser.id,
        date: new Date("2099-06-15"),
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
        user: { name: "Externe Test", email: "externe@test.fr", segment: "EXTERNE" as const },
      },
    ] as any)

    await testApiHandler({
      appHandler: exportHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })
        expect(res.status).toBe(200)
        const contentType = res.headers.get("content-type")
        expect(contentType).toContain("text/csv")

        const text = await res.text()
        // En-têtes CSV
        expect(text).toContain("date,slot,name,email,segment,costCredits,status,isProxy")
        // Données
        expect(text).toContain("2099-06-15")
        expect(text).toContain("externe@test.fr")
        // La query doit filtrer type=OPENSPACE uniquement (pas ORGANIZATION)
        expect(mockPrisma.reservation.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({ type: "OPENSPACE" }),
          })
        )
      },
    })
  })
})
