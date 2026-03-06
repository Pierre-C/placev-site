/**
 * __tests__/api/slice-08b-email-verification.http.test.ts
 * Tests HTTP — Slice 8b : Vérification d'adresse email
 *
 * Couvre :
 *   - GET  /api/auth/verify-email?token=xxx
 *   - POST /api/auth/resend-verification
 *   - loginAction bloqué si emailVerified=null (testé via mock Prisma + Server Action)
 *
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

import * as verifyEmailHandler from "@/app/api/auth/verify-email/route"
import * as resendVerificationHandler from "@/app/api/auth/resend-verification/route"
import { brevo } from "@/lib/brevo"
import { prisma } from "@/lib/prisma"

const mockPrisma = prisma as ReturnType<typeof mockDeep<PrismaClient>>

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const fakeUser = {
  id: "user-08b-test",
  email: "unverified@test.fr",
  name: "Marie Non-Vérifiée",
  passwordHash: "$2b$12$fakehashedpassword",
  role: "USER" as const,
  segment: "EXTERNE" as const,
  credits: 0,
  isMember: false,
  emailVerified: null,           // compte non vérifié
  city: null,
  tarifReduitRequested: false,
  cguAccepted: true,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const fakeVerifiedUser = {
  ...fakeUser,
  email: "verified@test.fr",
  emailVerified: new Date(),     // compte déjà vérifié
}

const fakeEvToken = {
  id: "ev-token-id-001",
  token: "valid-ev-token-hex32chars0000000000",
  userId: fakeUser.id,
  expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // +24h, non expiré
  user: fakeUser,
}

const expiredEvToken = {
  ...fakeEvToken,
  id: "ev-token-id-expired",
  token: "expired-ev-token-hex32chars000000",
  expiresAt: new Date(Date.now() - 60 * 1000), // -1 min, expiré
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockReset(mockPrisma)
  vi.clearAllMocks()
})

// ─── GET /api/auth/verify-email ───────────────────────────────────────────────

describe("GET /api/auth/verify-email", () => {
  it("302 → /verify-email/callback?vt=xxx — token valide et non expiré", async () => {
    mockPrisma.emailVerificationToken.findUnique.mockResolvedValue(
      fakeEvToken as Awaited<ReturnType<typeof mockPrisma.emailVerificationToken.findUnique>>
    )
    mockPrisma.user.update.mockResolvedValue({ ...fakeUser, emailVerified: new Date() })
    mockPrisma.emailVerificationToken.delete.mockResolvedValue(fakeEvToken)
    mockPrisma.verifiedUserToken.create.mockResolvedValue({
      id: "vut-id-001",
      token: "auto-login-token-hex16",
      userId: fakeUser.id,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
      user: fakeUser,
    } as Awaited<ReturnType<typeof mockPrisma.verifiedUserToken.create>>)

    await testApiHandler({
      appHandler: verifyEmailHandler,
      url: `/api/auth/verify-email?token=${fakeEvToken.token}`,
      test: async ({ fetch }) => {
        const res = await fetch({ redirect: "manual" })

        // Redirection vers la page de callback auto-login
        expect([301, 302, 307, 308]).toContain(res.status)
        const location = res.headers.get("location") ?? ""
        expect(location).toContain("/verify-email/callback")
        expect(location).toContain("vt=")

        // user.emailVerified mis à jour
        expect(mockPrisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: fakeUser.id },
            data: expect.objectContaining({ emailVerified: expect.any(Date) }),
          })
        )

        // Token de vérification supprimé (single-use)
        expect(mockPrisma.emailVerificationToken.delete).toHaveBeenCalledWith(
          expect.objectContaining({ where: { id: fakeEvToken.id } })
        )

        // VerifiedUserToken créé pour l'auto-login
        expect(mockPrisma.verifiedUserToken.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              userId: fakeUser.id,
              expiresAt: expect.any(Date),
            }),
          })
        )
      },
    })
  })

  it("302 → /verify-email-error?reason=invalid — token introuvable en DB", async () => {
    mockPrisma.emailVerificationToken.findUnique.mockResolvedValue(null)

    await testApiHandler({
      appHandler: verifyEmailHandler,
      url: `/api/auth/verify-email?token=token-inexistant`,
      test: async ({ fetch }) => {
        const res = await fetch({ redirect: "manual" })

        expect([301, 302, 307, 308]).toContain(res.status)
        const location = res.headers.get("location") ?? ""
        expect(location).toContain("/verify-email-error")
        expect(location).toContain("reason=invalid")

        // Aucune mise à jour en DB
        expect(mockPrisma.user.update).not.toHaveBeenCalled()
        expect(mockPrisma.verifiedUserToken.create).not.toHaveBeenCalled()
      },
    })
  })

  it("302 → /verify-email-error?reason=expired — token expiré", async () => {
    mockPrisma.emailVerificationToken.findUnique.mockResolvedValue(
      expiredEvToken as Awaited<ReturnType<typeof mockPrisma.emailVerificationToken.findUnique>>
    )
    mockPrisma.emailVerificationToken.delete.mockResolvedValue(expiredEvToken)

    await testApiHandler({
      appHandler: verifyEmailHandler,
      url: `/api/auth/verify-email?token=${expiredEvToken.token}`,
      test: async ({ fetch }) => {
        const res = await fetch({ redirect: "manual" })

        expect([301, 302, 307, 308]).toContain(res.status)
        const location = res.headers.get("location") ?? ""
        expect(location).toContain("/verify-email-error")
        expect(location).toContain("reason=expired")

        // Token expiré supprimé de la DB (nettoyage)
        expect(mockPrisma.emailVerificationToken.delete).toHaveBeenCalled()
        // Mais user.emailVerified PAS mis à jour
        expect(mockPrisma.user.update).not.toHaveBeenCalled()
        expect(mockPrisma.verifiedUserToken.create).not.toHaveBeenCalled()
      },
    })
  })

  it("302 → /verify-email-error?reason=invalid — token manquant dans l'URL", async () => {
    await testApiHandler({
      appHandler: verifyEmailHandler,
      url: `/api/auth/verify-email`,
      test: async ({ fetch }) => {
        const res = await fetch({ redirect: "manual" })

        expect([301, 302, 307, 308]).toContain(res.status)
        const location = res.headers.get("location") ?? ""
        expect(location).toContain("reason=invalid")
        expect(mockPrisma.emailVerificationToken.findUnique).not.toHaveBeenCalled()
      },
    })
  })
})

// ─── POST /api/auth/resend-verification ───────────────────────────────────────

describe("POST /api/auth/resend-verification", () => {
  it("200 — email non vérifié : ancien token supprimé, nouveau créé, Brevo envoyé", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(fakeUser)
    mockPrisma.emailVerificationToken.deleteMany.mockResolvedValue({ count: 1 })
    mockPrisma.emailVerificationToken.create.mockResolvedValue(fakeEvToken)

    await testApiHandler({
      appHandler: resendVerificationHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: fakeUser.email }),
        })
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.success).toBe(true)

        // Ancien token supprimé avant création du nouveau
        expect(mockPrisma.emailVerificationToken.deleteMany).toHaveBeenCalledWith(
          expect.objectContaining({ 
            where: { 
              userId: fakeUser.id,
              token: { not: "seed-valid-ev-token-001" }
            } 
          })
        )

        // Nouveau token créé
        expect(mockPrisma.emailVerificationToken.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              userId: fakeUser.id,
              expiresAt: expect.any(Date),
            }),
          })
        )

        // Email Brevo envoyé avec le bon template
        expect(vi.mocked(brevo.sendEmail)).toHaveBeenCalledWith(
          expect.objectContaining({
            template: "bienvenue-validation",
            to: fakeUser.email,
            variables: expect.objectContaining({
              verifyLink: expect.stringContaining("verify-email?token="),
            }),
          })
        )
      },
    })
  })

  it("200 — email inexistant : répond 200 sans rien faire (ne révèle pas l'existence)", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)

    await testApiHandler({
      appHandler: resendVerificationHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: "inexistant@test.fr" }),
        })
        expect(res.status).toBe(200)

        expect(mockPrisma.emailVerificationToken.deleteMany).not.toHaveBeenCalled()
        expect(mockPrisma.emailVerificationToken.create).not.toHaveBeenCalled()
        expect(vi.mocked(brevo.sendEmail)).not.toHaveBeenCalled()
      },
    })
  })

  it("200 — email déjà vérifié : répond 200 sans rien faire (cas normal)", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(fakeVerifiedUser)

    await testApiHandler({
      appHandler: resendVerificationHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: fakeVerifiedUser.email }),
        })
        expect(res.status).toBe(200)

        // Compte déjà vérifié → aucune action
        expect(mockPrisma.emailVerificationToken.deleteMany).not.toHaveBeenCalled()
        expect(vi.mocked(brevo.sendEmail)).not.toHaveBeenCalled()
      },
    })
  })

  it("422 — email invalide (format incorrect)", async () => {
    await testApiHandler({
      appHandler: resendVerificationHandler,
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
      appHandler: resendVerificationHandler,
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

// ─── loginAction — bloqué si emailVerified=null ───────────────────────────────
// Note: loginAction est un Server Action, pas une route API.
// On teste la logique métier via un mock direct de prisma.user.findUnique.

describe("loginAction — détection email non vérifié", () => {
  it("retourne EMAIL_NOT_VERIFIED si le user existe avec emailVerified=null", async () => {
    // Le loginAction fait un prisma.user.findUnique avant signIn pour détecter ce cas
    mockPrisma.user.findUnique.mockResolvedValue(fakeUser) // emailVerified: null

    // On importe et appelle directement le Server Action
    const { loginAction } = await import("@/app/(app)/login/actions")

    const formData = new FormData()
    formData.set("email", fakeUser.email)
    formData.set("password", "monmotdepasse")

    const result = await loginAction({ error: "" }, formData)

    expect(result.error).toBe("EMAIL_NOT_VERIFIED")
  })

  it("ne bloque pas si emailVerified est défini (flow normal)", async () => {
    // Si emailVerified est set, le loginAction continue avec signIn()
    // signIn() lancera ensuite AuthError si le mot de passe est incorrect —
    // ce cas est déjà couvert par les tests d'auth existants.
    mockPrisma.user.findUnique.mockResolvedValue(fakeVerifiedUser) // emailVerified: Date

    const { loginAction } = await import("@/app/(app)/login/actions")

    const formData = new FormData()
    formData.set("email", fakeVerifiedUser.email)
    formData.set("password", "mauvais-mdp")

    // signIn() est mocké globalement via vi.mock("@/lib/auth") dans d'autres tests
    // Ici on vérifie juste que le check EMAIL_NOT_VERIFIED n'est PAS retourné
    const result = await loginAction({ error: "" }, formData).catch(() => ({ error: "" }))
    expect(result.error).not.toBe("EMAIL_NOT_VERIFIED")
  })
})
