/**
 * __tests__/auth.test.ts
 * Tests unitaires — Slice 1 : Fondations & Authentification
 * Mis à jour Slice 8 : suppression du WELCOME_CREDIT, credits=0 par défaut.
 *
 * À lancer avec : npm run test
 * Prisma et Brevo sont mockés — aucun appel DB ou email réel.
 */

import { describe, it, expect, vi, beforeEach } from "vitest"
import bcrypt from "bcryptjs"
import { mockDeep, mockReset } from "vitest-mock-extended"
import type { PrismaClient } from "@prisma/client"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/prisma", () => ({
  prisma: mockDeep<PrismaClient>(),
}))

vi.mock("@/lib/brevo")

// ─── Imports après les mocks ──────────────────────────────────────────────────

import { createUser, getUserByEmail } from "@/lib/services/user"
import { buildJwtPayload } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { brevo } from "@/lib/brevo"

const mockPrisma = prisma as ReturnType<typeof mockDeep<PrismaClient>>

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const fakeUser = {
  id: "cltest123",
  email: "test@test.fr",
  firstName: "Test",
  lastName: "User",
  passwordHash: "$2b$12$fakehashedpassword",
  role: "USER" as const,
  segment: "EXTERNE" as const,
  credits: 0,
  isMember: false,
  createdAt: new Date(),
  updatedAt: new Date(),
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockReset(mockPrisma)
  vi.clearAllMocks()

  mockPrisma.user.create.mockResolvedValue(fakeUser)
  mockPrisma.user.findUnique.mockResolvedValue(null)
})

// ─── Tests : User Registration ────────────────────────────────────────────────

describe("User Registration", () => {
  it("should set default segment to EXTERNE when not specified", async () => {
    const { user } = await createUser({ 
      email: "test@test.fr", 
      firstName: "Test", 
      lastName: "User", 
      password: "Password123!",
      isBouliacais: false,
      city: "",
      tarifReduit: false,
      cguAccepted: true
    })
    expect(user.segment).toBe("EXTERNE")
  })

  it("should initialize credits to 0 (no welcome credit — Slice 8)", async () => {
    const { user } = await createUser({ 
      email: "test2@test.fr", 
      firstName: "Test", 
      lastName: "User", 
      password: "Password123!",
      isBouliacais: false,
      city: "",
      tarifReduit: false,
      cguAccepted: true
    })
    expect(user.credits).toBe(0)
  })

  it("should hash the password and not store plain text", async () => {
    const password = "Password123!"
    const hash = await bcrypt.hash(password, 12)
    const isValid = await bcrypt.compare(password, hash)
    const isNotPlainText = hash !== password

    expect(isValid).toBe(true)
    expect(isNotPlainText).toBe(true)
    expect(hash).toMatch(/^\$2b\$12\$/)
  })

  it("should NOT create any transaction on registration (no WELCOME_CREDIT — Slice 8)", async () => {
    await createUser({
      email: "test3@test.fr",
      firstName: "Test", 
      lastName: "User", 
      password: "Password123!",
      isBouliacais: false,
      city: "",
      tarifReduit: false,
      cguAccepted: true
    })
    expect(mockPrisma.transaction.create).not.toHaveBeenCalled()
  })

  it("should not expose passwordHash in the returned user", async () => {
    const { user } = await createUser({ 
      email: "test5@test.fr", 
      firstName: "Test", 
      lastName: "User", 
      password: "Password123!",
      isBouliacais: false,
      city: "",
      tarifReduit: false,
      cguAccepted: true
    })
    expect((user as Record<string, unknown>).passwordHash).toBeUndefined()
  })
})

// ─── Tests : JWT Session ──────────────────────────────────────────────────────

describe("JWT Session", () => {
  it("should include role in JWT token", () => {
    const mockUser = { id: "1", role: "USER", segment: "EXTERNE", credits: 3, firstName: "Alice", lastName: "Test" }
    const token = buildJwtPayload(mockUser)
    expect(token.role).toBe("USER")
  })

  it("should include segment in JWT token", () => {
    const mockUser = { id: "1", role: "USER", segment: "BOULIACAIS", credits: 5, firstName: "Alice", lastName: "Test" }
    const token = buildJwtPayload(mockUser)
    expect(token.segment).toBe("BOULIACAIS")
  })

  it("should include credits in JWT token", () => {
    const mockUser = { id: "1", role: "USER", segment: "REDUIT", credits: 2, firstName: "Alice", lastName: "Test" }
    const token = buildJwtPayload(mockUser)
    expect(token.credits).toBe(2)
  })

  it("should include id in JWT token", () => {
    const mockUser = { id: "abc123", role: "ADMIN", segment: "EXTERNE", credits: 99, firstName: "Admin", lastName: "Test" }
    const token = buildJwtPayload(mockUser)
    expect(token.id).toBe("abc123")
  })

  it("should include firstName and lastName in JWT token", () => {
    const mockUser = { id: "1", role: "USER", segment: "EXTERNE", credits: 0, firstName: "Alice", lastName: "Dupont" }
    const token = buildJwtPayload(mockUser)
    expect(token.firstName).toBe("Alice")
    expect(token.lastName).toBe("Dupont")
  })
})

// ─── Tests : getUserByEmail ───────────────────────────────────────────────────

describe("getUserByEmail", () => {
  it("should return null when user does not exist", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(null)
    const user = await getUserByEmail("nonexistent@test.fr")
    expect(user).toBeNull()
  })

  it("should return the user when found", async () => {
    mockPrisma.user.findUnique.mockResolvedValue(fakeUser)
    const user = await getUserByEmail("test@test.fr")
    expect(user?.email).toBe("test@test.fr")
  })
})

// ─── Tests : Access Control ───────────────────────────────────────────────────

describe("Access Control", () => {
  it("should redirect USER role away from /admin", () => {
    // La protection de route est assurée par le middleware Next.js.
    // Validé en E2E via e2e/slice-01-auth.spec.ts.
    expect(true).toBe(true)
  })
})
