/**
 * __tests__/api/slice-08-auth.http.test.ts
 * Tests HTTP — Slice 8 : Réinitialisation de mot de passe (forgot/reset)
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

// ─── Imports après les mocks ──────────────────────────────────────────────────

import * as forgotPasswordHandler from "@/app/api/auth/forgot-password/route"
import * as resetPasswordHandler from "@/app/api/auth/reset-password/route"
import { brevo } from "@/lib/brevo"
import { prisma } from "@/lib/prisma"

const mockPrisma = prisma as ReturnType<typeof mockDeep<PrismaClient>>

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const fakeUser = {
  id: "cltest123",
  email: "test@test.fr",
  name: "Test User",
  passwordHash: "$2b$12$fakehashedpassword",
  role: "USER" as const,
  segment: "EXTERNE" as const,
  credits: 5,
  isMember: false,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const fakeToken = {
  id: "token-id-123",
  token: "secure-random-token-abc123",
  userId: fakeUser.id,
  expiresAt: new Date(Date.now() + 60 * 60 * 1000), // +1h, non expiré
  user: fakeUser,
}

const expiredToken = {
  ...fakeToken,
  id: "token-expired-456",
  token: "expired-token-xyz",
  expiresAt: new Date(Date.now() - 60 * 1000), // -1 min, expiré
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockReset(mockPrisma)
  vi.clearAllMocks()
})

// ─── POST /api/auth/forgot-password ──────────────────────────────────────────

describe("POST /api/auth/forgot-password", () => {
  it("200 — email existant : token créé et email Brevo envoyé", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(fakeUser)
    mockPrisma.passwordResetToken.create.mockResolvedValue(fakeToken)

    await testApiHandler({
      appHandler: forgotPasswordHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: fakeUser.email }),
        })
        expect(res.status).toBe(200)

        // Token créé en DB
        expect(mockPrisma.passwordResetToken.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              userId: fakeUser.id,
            }),
          })
        )

        // Email Brevo envoyé avec le bon template
        expect(vi.mocked(brevo.sendEmail)).toHaveBeenCalledWith(
          expect.objectContaining({
            template: "reset-password",
            to: fakeUser.email,
            variables: expect.objectContaining({
              resetLink: expect.stringContaining("reset-password?token="),
            }),
          })
        )
      },
    })
  })

  it("200 — email inexistant : répond 200 sans révéler l'existence du compte (sécurité)", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)

    await testApiHandler({
      appHandler: forgotPasswordHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "inexistant@test.fr" }),
        })
        // Toujours 200 pour ne pas révéler si l'email existe
        expect(res.status).toBe(200)

        // Aucun token créé, aucun email envoyé
        expect(mockPrisma.passwordResetToken.create).not.toHaveBeenCalled()
        expect(vi.mocked(brevo.sendEmail)).not.toHaveBeenCalled()
      },
    })
  })

  it("422 — email invalide (format incorrect)", async () => {
    await testApiHandler({
      appHandler: forgotPasswordHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "pas-un-email" }),
        })
        expect(res.status).toBe(422)
        expect(vi.mocked(brevo.sendEmail)).not.toHaveBeenCalled()
      },
    })
  })

  it("422 — email manquant dans le body", async () => {
    await testApiHandler({
      appHandler: forgotPasswordHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        })
        expect(res.status).toBe(422)
      },
    })
  })
})

// ─── POST /api/auth/reset-password ───────────────────────────────────────────

describe("POST /api/auth/reset-password", () => {
  it("200 — token valide : mot de passe mis à jour, token supprimé", async () => {
    mockPrisma.passwordResetToken.findUnique.mockResolvedValue(
      fakeToken as Awaited<ReturnType<typeof mockPrisma.passwordResetToken.findUnique>>
    )
    mockPrisma.user.update.mockResolvedValue(fakeUser)
    mockPrisma.passwordResetToken.delete.mockResolvedValue(fakeToken)

    await testApiHandler({
      appHandler: resetPasswordHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            token: fakeToken.token,
            newPassword: "NouveauMdp123!",
          }),
        })
        expect(res.status).toBe(200)

        // Le hash du nouveau mot de passe est mis à jour
        expect(mockPrisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: fakeUser.id },
            data: expect.objectContaining({
              passwordHash: expect.stringMatching(/^\$2b\$12\$/),
            }),
          })
        )

        // Le token est supprimé (usage unique)
        expect(mockPrisma.passwordResetToken.delete).toHaveBeenCalledWith(
          expect.objectContaining({ where: { token: fakeToken.token } })
        )
      },
    })
  })

  it("422 — token invalide (introuvable en DB)", async () => {
    mockPrisma.passwordResetToken.findUnique.mockResolvedValue(null)

    await testApiHandler({
      appHandler: resetPasswordHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: "token-invalide", newPassword: "NouveauMdp123!" }),
        })
        expect(res.status).toBe(422)
        const body = await res.json()
        expect(body.error).toMatch(/token/i)

        expect(mockPrisma.user.update).not.toHaveBeenCalled()
      },
    })
  })

  it("422 — token expiré (expiresAt dans le passé)", async () => {
    mockPrisma.passwordResetToken.findUnique.mockResolvedValue(
      expiredToken as Awaited<ReturnType<typeof mockPrisma.passwordResetToken.findUnique>>
    )

    await testApiHandler({
      appHandler: resetPasswordHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: expiredToken.token, newPassword: "NouveauMdp123!" }),
        })
        expect(res.status).toBe(422)
        const body = await res.json()
        expect(body.error).toMatch(/expir/i)

        expect(mockPrisma.user.update).not.toHaveBeenCalled()
      },
    })
  })

  it("422 — nouveau mot de passe trop court (< 8 caractères)", async () => {
    mockPrisma.passwordResetToken.findUnique.mockResolvedValue(
      fakeToken as Awaited<ReturnType<typeof mockPrisma.passwordResetToken.findUnique>>
    )

    await testApiHandler({
      appHandler: resetPasswordHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token: fakeToken.token, newPassword: "court" }),
        })
        expect(res.status).toBe(422)
        expect(mockPrisma.user.update).not.toHaveBeenCalled()
      },
    })
  })

  it("422 — token manquant dans le body", async () => {
    await testApiHandler({
      appHandler: resetPasswordHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newPassword: "NouveauMdp123!" }),
        })
        expect(res.status).toBe(422)
      },
    })
  })
})
