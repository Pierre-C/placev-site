/**
 * __tests__/api/slice-02-credits.http.test.ts
 * Tests HTTP — Slice 2 : Achat de crédits via Stripe
 *
 * Utilise next-test-api-route-handler pour tester les vraies routes Next.js.
 * Prisma, Stripe et Brevo sont mockés — aucun appel réel.
 */

import { testApiHandler } from "next-test-api-route-handler"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockDeep, mockReset } from "vitest-mock-extended"
import type { PrismaClient } from "@prisma/client"

// ─── Mocks (avant tout import de module) ─────────────────────────────────────

vi.mock("@/lib/prisma", () => ({
  prisma: mockDeep<PrismaClient>(),
}))

vi.mock("@/lib/stripe")
vi.mock("@/lib/brevo")

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

vi.mock("@/lib/env", () => ({
  env: {
    NEXTAUTH_URL: "http://localhost:3000",
    STRIPE_PRICE_BOULIACAIS: "price_test_bouliacais",
    STRIPE_PRICE_REDUIT: "price_test_reduit",
    STRIPE_PRICE_EXTERNE: "price_test_externe",
  },
}))

// ─── Imports après les mocks ──────────────────────────────────────────────────

import * as checkoutHandler from "@/app/api/credits/checkout/route"
import * as webhookHandler from "@/app/api/webhooks/stripe/route"
import { stripe, stripeTestHelpers } from "@/lib/stripe"
import { brevo } from "@/lib/brevo"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

const mockPrisma = prisma as ReturnType<typeof mockDeep<PrismaClient>>

// ─── Fixtures ─────────────────────────────────────────────────────────────────

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

const fakePriceSetting = {
  key: "PRICE_CREDIT_EXTERNE",
  value: "800",
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

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockReset(mockPrisma)
  vi.clearAllMocks()

  // Defaults
  vi.mocked(auth).mockResolvedValue(fakeSession as Awaited<ReturnType<typeof auth>>)
  mockPrisma.systemSetting.findUnique.mockResolvedValue(fakePriceSetting)
  mockPrisma.user.findUnique.mockResolvedValue(fakeUser)
  mockPrisma.transaction.findFirst.mockResolvedValue(null)
  mockPrisma.user.update.mockResolvedValue({ ...fakeUser, credits: 15 })
  mockPrisma.transaction.create.mockResolvedValue({
    id: "tx-123",
    userId: fakeUser.id,
    type: "CREDIT_PURCHASE" as const,
    creditsAdd: 10,
    creditsBefore: 5,
    stripeId: "cs_mock_test_123",
    createdAt: new Date(),
  })
})

// ─── POST /api/credits/checkout ───────────────────────────────────────────────

describe("POST /api/credits/checkout", () => {
  it("200 — Pack valide retourne une URL", async () => {
    await testApiHandler({
      appHandler: checkoutHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creditsAmount: "10" }),
        })
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(typeof body.url).toBe("string")
        expect(body.url).toContain("stripe-mock")
      },
    })
  })

  it("200 — stripe.checkout.sessions.create appelé avec les bons paramètres", async () => {
    await testApiHandler({
      appHandler: checkoutHandler,
      test: async ({ fetch }) => {
        await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creditsAmount: "10" }),
        })
        expect(vi.mocked(stripe.checkout.sessions.create)).toHaveBeenCalledWith(
          expect.objectContaining({
            mode: "payment",
            metadata: expect.objectContaining({
              userId: fakeSession.user.id,
              creditsAmount: "10",
            }),
          })
        )
      },
    })
  })

  it("401 — non authentifié", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null)

    await testApiHandler({
      appHandler: checkoutHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creditsAmount: "10" }),
        })
        expect(res.status).toBe(401)
      },
    })
  })

  it("422 — pack invalide (999)", async () => {
    await testApiHandler({
      appHandler: checkoutHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ creditsAmount: "999" }),
        })
        expect(res.status).toBe(422)
      },
    })
  })

  it("422 — creditsAmount manquant", async () => {
    await testApiHandler({
      appHandler: checkoutHandler,
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

// ─── POST /api/webhooks/stripe ────────────────────────────────────────────────

describe("POST /api/webhooks/stripe", () => {
  it("200 — checkout.session.completed incrémente les crédits", async () => {
    const payload = stripeTestHelpers.mockCheckoutCompleted({
      userId: fakeUser.id,
      creditsAmount: "10",
    })

    await testApiHandler({
      appHandler: webhookHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "stripe-signature": "mock_signature",
          },
          body: JSON.stringify(payload),
        })
        expect(res.status).toBe(200)

        // Vérifier l'incrément crédits
        expect(mockPrisma.user.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: fakeUser.id },
            data: { credits: { increment: 10 } },
          })
        )

        // Vérifier la Transaction créée
        expect(mockPrisma.transaction.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              type: "CREDIT_PURCHASE",
              creditsAdd: 10,
              creditsBefore: 5,
              stripeId: "cs_mock_test_123",
            }),
          })
        )
      },
    })
  })

  it("200 — brevo.sendEmail appelé avec confirmation-achat-credits", async () => {
    const payload = stripeTestHelpers.mockCheckoutCompleted({
      userId: fakeUser.id,
      creditsAmount: "10",
    })

    await testApiHandler({
      appHandler: webhookHandler,
      test: async ({ fetch }) => {
        await fetch({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "stripe-signature": "mock_signature",
          },
          body: JSON.stringify(payload),
        })

        expect(vi.mocked(brevo.sendEmail)).toHaveBeenCalledWith(
          expect.objectContaining({
            template: "confirmation-achat-credits",
            to: fakeUser.email,
          })
        )
      },
    })
  })

  it("200 — idempotence : même stripeId deux fois n'incrémente qu'une fois", async () => {
    const payload = stripeTestHelpers.mockCheckoutCompleted({
      userId: fakeUser.id,
      creditsAmount: "10",
    })

    // Premier appel : pas d'existant → traite normalement
    mockPrisma.transaction.findFirst.mockResolvedValueOnce(null)

    await testApiHandler({
      appHandler: webhookHandler,
      test: async ({ fetch }) => {
        const res1 = await fetch({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "stripe-signature": "mock_signature",
          },
          body: JSON.stringify(payload),
        })
        expect(res1.status).toBe(200)
        const body1 = await res1.json()
        expect(body1.skipped).toBeUndefined()
      },
    })

    // Deuxième appel : transaction existante → skip
    mockPrisma.transaction.findFirst.mockResolvedValueOnce({
      id: "tx-123",
      userId: fakeUser.id,
      type: "CREDIT_PURCHASE" as const,
      creditsAdd: 10,
      creditsBefore: 5,
      stripeId: "cs_mock_test_123",
      createdAt: new Date(),
    })

    await testApiHandler({
      appHandler: webhookHandler,
      test: async ({ fetch }) => {
        const res2 = await fetch({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "stripe-signature": "mock_signature",
          },
          body: JSON.stringify(payload),
        })
        expect(res2.status).toBe(200)
        const body2 = await res2.json()
        expect(body2.skipped).toBe(true)
      },
    })

    // update appelé une seule fois au total
    expect(mockPrisma.user.update).toHaveBeenCalledTimes(1)
    // brevo appelé une seule fois
    expect(vi.mocked(brevo.sendEmail)).toHaveBeenCalledTimes(1)
  })

  it("400 — signature invalide (constructEvent jette une erreur)", async () => {
    vi.mocked(stripe.webhooks.constructEvent).mockImplementationOnce(() => {
      throw new Error("No signatures found matching the expected signature for payload")
    })

    await testApiHandler({
      appHandler: webhookHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "stripe-signature": "signature_invalide",
          },
          body: JSON.stringify({ type: "checkout.session.completed" }),
        })
        expect(res.status).toBe(400)
        const body = await res.json()
        expect(body.error).toMatch(/signature/i)
      },
    })
  })
})
