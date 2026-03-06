/**
 * __tests__/api/slice-11-compliance.http.test.ts
 * Tests HTTP — Slice 11 : Analytics Admin, Profil Membre & Conformité RGPD
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

// bcrypt est utilisé par change-password — on le mock pour les tests
vi.mock("bcrypt", () => ({
  default: {
    compare: vi.fn(),
    hash: vi.fn(),
  },
}))

// ─── Imports après les mocks ──────────────────────────────────────────────────

import * as profileHandler from "@/app/api/profile/route"
import * as updateProfileHandler from "@/app/api/profile/route"
import * as changePasswordHandler from "@/app/api/profile/change-password/route"
import * as requestDeletionHandler from "@/app/api/profile/request-deletion/route"
import * as anonymizeHandler from "@/app/api/admin/members/[id]/anonymize/route"
import { brevo } from "@/lib/brevo"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import bcrypt from "bcrypt"

const mockPrisma = prisma as ReturnType<typeof mockDeep<PrismaClient>>
const mockBcrypt = bcrypt as { compare: ReturnType<typeof vi.fn>; hash: ReturnType<typeof vi.fn> }

// ─── Fixtures ─────────────────────────────────────────────────────────────────

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

const fakeMemberSession = {
  user: {
    id: "user-extern-123",
    email: "externe@test.fr",
    firstName: "Externe",
    lastName: "Test",
    role: "USER",
    segment: "EXTERNE",
    credits: 5,
  },
}

const fakeTargetUser = {
  id: "user-extern-123",
  email: "externe@test.fr",
  firstName: "Externe",
  lastName: "Test",
  role: "USER" as const,
  segment: "EXTERNE" as const,
  credits: 5,
  isMember: false,
  passwordHash: "$2b$12$hashedpassword",
  city: "Bordeaux",
  address: null,
  phone: null,
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

// ─── PATCH /api/profile ────────────────────────────────────────────────────────

describe("PATCH /api/profile", () => {
  it("200 — met à jour prénom, nom, adresse et téléphone", async () => {
    mockPrisma.user.update.mockResolvedValue({
      ...fakeTargetUser,
      firstName: "Nouveau",
      lastName: "Nom",
      address: "12 rue de la Paix, 75001 Paris",
      phone: "0612345678",
    })

    await testApiHandler({
      appHandler: updateProfileHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            firstName: "Nouveau",
            lastName: "Nom",
            address: "12 rue de la Paix, 75001 Paris",
            phone: "0612345678",
          }),
        })
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.user.firstName).toBe("Nouveau")
        expect(body.user.lastName).toBe("Nom")
        expect(body.user.address).toBe("12 rue de la Paix, 75001 Paris")

        expect(mockPrisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: fakeMemberSession.user.id },
            data: expect.objectContaining({
              firstName: "Nouveau",
              lastName: "Nom",
              address: "12 rue de la Paix, 75001 Paris",
              phone: "0612345678",
            }),
          })
        )
      },
    })
  })

  it("200 — l'email fourni est ignoré (non modifiable)", async () => {
    mockPrisma.user.update.mockResolvedValue(fakeTargetUser)

    await testApiHandler({
      appHandler: updateProfileHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firstName: "Test", email: "hacker@evil.com" }),
        })
        expect(res.status).toBe(200)

        // L'email ne doit PAS être passé dans les data de update
        expect(mockPrisma.user.update).not.toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ email: "hacker@evil.com" }),
          })
        )
      },
    })
  })

  it("422 — firstName vide refusé", async () => {
    await testApiHandler({
      appHandler: updateProfileHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firstName: "" }),
        })
        expect(res.status).toBe(422)
        expect(mockPrisma.user.update).not.toHaveBeenCalled()
      },
    })
  })

  it("401 — non authentifié → refusé", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)

    await testApiHandler({
      appHandler: updateProfileHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ firstName: "Test" }),
        })
        expect(res.status).toBe(401)
        expect(mockPrisma.user.update).not.toHaveBeenCalled()
      },
    })
  })
})

// ─── POST /api/profile/change-password ───────────────────────────────────────

describe("POST /api/profile/change-password", () => {
  it("200 — mot de passe changé avec succès (ancien mdp correct)", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(fakeTargetUser)
    mockBcrypt.compare.mockResolvedValue(true as never) // ancien mdp correct
    mockBcrypt.hash.mockResolvedValue("$2b$12$newhashedpassword" as never)
    mockPrisma.user.update.mockResolvedValue({ ...fakeTargetUser, passwordHash: "$2b$12$newhashedpassword" })

    await testApiHandler({
      appHandler: changePasswordHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword: "OldPassword123!", newPassword: "NewPassword456!" }),
        })
        expect(res.status).toBe(200)

        expect(mockBcrypt.compare).toHaveBeenCalledWith("OldPassword123!", fakeTargetUser.passwordHash)
        expect(mockBcrypt.hash).toHaveBeenCalledWith("NewPassword456!", 12)
        expect(mockPrisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: fakeMemberSession.user.id },
            data: expect.objectContaining({ passwordHash: "$2b$12$newhashedpassword" }),
          })
        )
      },
    })
  })

  it("401 — ancien mot de passe incorrect → refusé", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(fakeTargetUser)
    mockBcrypt.compare.mockResolvedValue(false as never) // ancien mdp incorrect

    await testApiHandler({
      appHandler: changePasswordHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword: "MauvaisMdp!", newPassword: "NewPassword456!" }),
        })
        expect(res.status).toBe(401)
        expect(mockBcrypt.hash).not.toHaveBeenCalled()
        expect(mockPrisma.user.update).not.toHaveBeenCalled()
      },
    })
  })

  it("422 — nouveau mot de passe trop court (< 8 chars) → refusé", async () => {
    await testApiHandler({
      appHandler: changePasswordHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword: "OldPassword123!", newPassword: "court" }),
        })
        expect(res.status).toBe(422)
        expect(mockPrisma.user.findUnique).not.toHaveBeenCalled()
      },
    })
  })

  it("422 — champs manquants → refusé", async () => {
    await testApiHandler({
      appHandler: changePasswordHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newPassword: "NewPassword456!" }), // currentPassword manquant
        })
        expect(res.status).toBe(422)
      },
    })
  })

  it("401 — non authentifié → refusé", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)

    await testApiHandler({
      appHandler: changePasswordHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ currentPassword: "OldPassword123!", newPassword: "NewPassword456!" }),
        })
        expect(res.status).toBe(401)
      },
    })
  })
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

  it("200 — notification admin envoyée (template 'demande-suppression-compte')", async () => {
    mockPrisma.user.update.mockResolvedValue({
      ...fakeTargetUser,
      deletionRequestedAt: new Date(),
    })

    await testApiHandler({
      appHandler: requestDeletionHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST" })
        expect(res.status).toBe(200)
        expect(vi.mocked(brevo.sendEmail)).toHaveBeenCalledWith(
          expect.objectContaining({
            template: "demande-suppression-compte",
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

  it("200 — anonymisation : PII remplacées, address/phone effacés, données comptables conservées", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(fakeTargetUser)
    mockPrisma.user.update.mockResolvedValue({
      ...fakeTargetUser,
      email: `deleted_${fakeTargetUser.id}@anonymized.local`,
      firstName: "Utilisateur",
      lastName: "Supprimé",
      passwordHash: "",
      city: null,
      address: null,
      phone: null,
    })

    await testApiHandler({
      appHandler: anonymizeHandler,
      params: { id: fakeTargetUser.id },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "POST" })
        expect(res.status).toBe(200)

        expect(mockPrisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: fakeTargetUser.id },
            data: expect.objectContaining({
              email: `deleted_${fakeTargetUser.id}@anonymized.local`,
              firstName: "Utilisateur",
              lastName: "Supprimé",
              passwordHash: expect.any(String),
              city: null,
              address: null,
              phone: null,
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

  it("400 — ne peut pas anonymiser un ADMIN", async () => {
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
