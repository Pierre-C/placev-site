/**
 * __tests__/credits.test.ts
 * Tests unitaires — Slice 2 : Paiement & Recharge de Crédits
 *
 * À lancer avec : npm run test
 * Prisma, Stripe et Brevo sont mockés — aucun appel DB, réseau ou email réel.
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockDeep, mockReset } from "vitest-mock-extended"
import type { PrismaClient } from "@prisma/client"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/prisma", () => ({
  prisma: mockDeep<PrismaClient>(),
}))

vi.mock("@/lib/brevo")
vi.mock("@/lib/stripe")

// ─── Imports après les mocks ──────────────────────────────────────────────────

import { calculateCreditPrice, getCreditPriceForSegment } from "@/lib/services/credits"
import { prisma } from "@/lib/prisma"

const mockPrisma = prisma as ReturnType<typeof mockDeep<PrismaClient>>

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockReset(mockPrisma)
  vi.clearAllMocks()
})

// ─── Tests : calculateCreditPrice ─────────────────────────────────────────────

describe("calculateCreditPrice", () => {
  it("Prix BOULIACAIS = 700 cents/crédit", () => {
    expect(calculateCreditPrice(1, 700)).toBe(700)
  })

  it("Prix EXTERNE = 800 cents/crédit", () => {
    expect(calculateCreditPrice(1, 800)).toBe(800)
  })

  it("Prix REDUIT = 400 cents/crédit", () => {
    expect(calculateCreditPrice(1, 400)).toBe(400)
  })

  it("10 crédits EXTERNE = 8000 cents", () => {
    expect(calculateCreditPrice(10, 800)).toBe(8000)
  })

  it("5 crédits BOULIACAIS = 3500 cents", () => {
    expect(calculateCreditPrice(5, 700)).toBe(3500)
  })

  it("20 crédits REDUIT = 8000 cents", () => {
    expect(calculateCreditPrice(20, 400)).toBe(8000)
  })
})

// ─── Tests : getCreditPriceForSegment ─────────────────────────────────────────

describe("getCreditPriceForSegment", () => {
  it("retourne 800 pour le segment EXTERNE", async () => {
    mockPrisma.systemSetting.findUnique.mockResolvedValue({
      key: "PRICE_CREDIT_EXTERNE",
      value: "800",
    })
    const price = await getCreditPriceForSegment("EXTERNE")
    expect(price).toBe(800)
  })

  it("retourne 700 pour le segment BOULIACAIS", async () => {
    mockPrisma.systemSetting.findUnique.mockResolvedValue({
      key: "PRICE_CREDIT_BOULIACAIS",
      value: "700",
    })
    const price = await getCreditPriceForSegment("BOULIACAIS")
    expect(price).toBe(700)
  })

  it("retourne 400 pour le segment REDUIT", async () => {
    mockPrisma.systemSetting.findUnique.mockResolvedValue({
      key: "PRICE_CREDIT_REDUIT",
      value: "400",
    })
    const price = await getCreditPriceForSegment("REDUIT")
    expect(price).toBe(400)
  })

  it("lève une erreur si le setting n'existe pas", async () => {
    mockPrisma.systemSetting.findUnique.mockResolvedValue(null)
    await expect(getCreditPriceForSegment("INCONNU")).rejects.toThrow()
  })

  it("appelle prisma avec la bonne clé pour EXTERNE", async () => {
    mockPrisma.systemSetting.findUnique.mockResolvedValue({
      key: "PRICE_CREDIT_EXTERNE",
      value: "800",
    })
    await getCreditPriceForSegment("EXTERNE")
    expect(mockPrisma.systemSetting.findUnique).toHaveBeenCalledWith({
      where: { key: "PRICE_CREDIT_EXTERNE" },
    })
  })
})
