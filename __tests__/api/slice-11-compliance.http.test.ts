/**
 * __tests__/api/slice-11-compliance.http.test.ts
 * Tests HTTP — Slice 11 : Analytics Admin & Conformité RGPD
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

import * as requestDeletionHandler from "@/app/api/profile/request-deletion/route"
import * as anonymizeHandler from "@/app/api/admin/members/[id]/anonymize/route"
import { brevo } from "@/lib/brevo"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

const mockPrisma = prisma as ReturnType<typeof mockDeep<PrismaClient>>

// ─── Fixtures ─────────────────────────────────────────────────────────────────

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

const fakeMemberSession = {
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
  city: "Bordeaux",
  tarifReduitRequested: false,
  cguAccepted: true,
  deletionRequestedAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockReset(mockPrisma)
  vi.clearAllMocks()
  vi.mocked(auth).mockResolvedValue(fakeMemberSession as Awaited<ReturnType<typeof auth>>)
})

// ─── POST /api/profile/request-deletion ──────────────────────────────────────

describe("POST /api/profile/request-deletion", () => {
  it("200 — membre connecté : deletionRequestedAt mis à jour", async () => {
    mockPrisma.user.update.mockResolvedValue({
      ...fakeTargetUser,
      deletionRequestedAt: new Date(),
    })

    await testApiHandler({
      appHandler: requestDeletionHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST" })
        expect(res.status).toBe(200)

        expect(mockPrisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: fakeMemberSession.user.id },
            data: expect.objectContaining({
              deletionRequestedAt: expect.any(Date),
            }),
          })
        )
      },
    })
  })

  it("200 — notification admin envoyée (Brevo ou log)", async () => {
    mockPrisma.user.update.mockResolvedValue({
      ...fakeTargetUser,
      deletionRequestedAt: new Date(),
    })

    await testApiHandler({
      appHandler: requestDeletionHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST" })
        expect(res.status).toBe(200)
        // L'admin est notifié
        expect(vi.mocked(brevo.sendEmail)).toHaveBeenCalledWith(
          expect.objectContaining({
            template: expect.stringContaining("suppression"),
          })
        )
      },
    })
  })

  it("401 — non authentifié → refusé", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)

    await testApiHandler({
      appHandler: requestDeletionHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST" })
        expect(res.status).toBe(401)
        expect(mockPrisma.user.update).not.toHaveBeenCalled()
      },
    })
  })

  it("idempotent — une 2ème demande ne cause pas d'erreur", async () => {
    mockPrisma.user.update.mockResolvedValue({
      ...fakeTargetUser,
      deletionRequestedAt: new Date(),
    })

    await testApiHandler({
      appHandler: requestDeletionHandler,
      test: async ({ fetch }) => {
        const res1 = await fetch({ method: "POST" })
        const res2 = await fetch({ method: "POST" })
        expect(res1.status).toBe(200)
        expect(res2.status).toBe(200)
      },
    })
  })
})

// ─── POST /api/admin/members/[id]/anonymize ───────────────────────────────────

describe("POST /api/admin/members/[id]/anonymize", () => {
  beforeEach(() => {
    vi.mocked(auth).mockResolvedValue(fakeAdminSession as Awaited<ReturnType<typeof auth>>)
  })

  it("200 — anonymisation : PII remplacées, données comptables conservées", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(fakeTargetUser)
    mockPrisma.user.update.mockResolvedValue({
      ...fakeTargetUser,
      email: `deleted_${fakeTargetUser.id}@anonymized.local`,
      name: "Utilisateur Supprimé",
      passwordHash: "",
      city: null,
      tarifReduitRequested: false,
    })

    await testApiHandler({
      appHandler: anonymizeHandler,
      params: { id: fakeTargetUser.id },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST" })
        expect(res.status).toBe(200)

        // Vérifier que les PII sont anonymisées
        expect(mockPrisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: fakeTargetUser.id },
            data: expect.objectContaining({
              email: `deleted_${fakeTargetUser.id}@anonymized.local`,
              name: "Utilisateur Supprimé",
              passwordHash: expect.any(String), // chaîne vide ou random
              city: null,
            }),
          })
        )

        // Les Transactions et Réservations ne sont PAS supprimées
        expect(mockPrisma.transaction.deleteMany).not.toHaveBeenCalled()
        expect(mockPrisma.reservation.deleteMany).not.toHaveBeenCalled()
      },
    })
  })

  it("403 — non-admin → refusé", async () => {
    vi.mocked(auth).mockResolvedValueOnce(fakeMemberSession as Awaited<ReturnType<typeof auth>>)

    await testApiHandler({
      appHandler: anonymizeHandler,
      params: { id: fakeTargetUser.id },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST" })
        expect(res.status).toBe(403)
        expect(mockPrisma.user.update).not.toHaveBeenCalled()
      },
    })
  })

  it("404 — user inexistant", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)

    await testApiHandler({
      appHandler: anonymizeHandler,
      params: { id: "user-inexistant" },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST" })
        expect(res.status).toBe(404)
        expect(mockPrisma.user.update).not.toHaveBeenCalled()
      },
    })
  })

  it("400 — ne peut pas anonymiser l'admin lui-même", async () => {
    mockPrisma.user.findUnique.mockResolvedValue({
      ...fakeTargetUser,
      id: fakeAdminSession.user.id,
      role: "ADMIN" as const,
    })

    await testApiHandler({
      appHandler: anonymizeHandler,
      params: { id: fakeAdminSession.user.id },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST" })
        expect(res.status).toBe(400)
        expect(mockPrisma.user.update).not.toHaveBeenCalled()
      },
    })
  })
})
