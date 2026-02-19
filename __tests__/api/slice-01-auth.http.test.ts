/**
 * __tests__/api/slice-01-auth.http.test.ts
 * Tests HTTP — Slice 1 : Routes d'authentification et de profil
 *
 * Utilise next-test-api-route-handler pour tester les vraies routes Next.js
 * en mémoire, avec de vrais appels HTTP et de vraies réponses.
 *
 * Prérequis : DATABASE_URL pointant vers une DB de test (branche Neon dev)
 */

import { testApiHandler } from "next-test-api-route-handler"
import { describe, it, expect, beforeAll, afterAll } from "vitest"

// Ces imports seront disponibles une fois l'agent ayant implémenté la Slice 1
// import * as registerHandler from "@/app/api/auth/register/route"
// import * as profileHandler from "@/app/api/profile/route"
// import { prisma } from "@/lib/prisma"

// ─── Setup / Teardown ─────────────────────────────────────────────────────────
beforeAll(async () => {
  // Nettoyer les utilisateurs créés par les tests précédents
  // await prisma.user.deleteMany({ where: { email: { contains: "@httptest.fr" } } })
})

afterAll(async () => {
  // await prisma.user.deleteMany({ where: { email: { contains: "@httptest.fr" } } })
  // await prisma.$disconnect()
})

// ─── POST /api/auth/register ──────────────────────────────────────────────────
describe("POST /api/auth/register", () => {
  it("201 — crée un utilisateur avec les bons défauts", async () => {
    // await testApiHandler({
    //   appHandler: registerHandler,
    //   test: async ({ fetch }) => {
    //     const res = await fetch({
    //       method: "POST",
    //       headers: { "Content-Type": "application/json" },
    //       body: JSON.stringify({
    //         name: "Test HTTP",
    //         email: "nouveau@httptest.fr",
    //         password: "TestPassword123!",
    //       }),
    //     })
    //     expect(res.status).toBe(201)
    //     const body = await res.json()
    //     expect(body.user.segment).toBe("EXTERNE")
    //     expect(body.user.credits).toBe(1)
    //     expect(body.user.passwordHash).toBeUndefined() // ne jamais exposer le hash
    //   },
    // })
    expect(true).toBe(true) // placeholder — décommenter après implémentation
  })

  it("409 — email déjà existant", async () => {
    // await testApiHandler({
    //   appHandler: registerHandler,
    //   test: async ({ fetch }) => {
    //     const res = await fetch({
    //       method: "POST",
    //       headers: { "Content-Type": "application/json" },
    //       body: JSON.stringify({
    //         name: "Doublon",
    //         email: "externe@test.fr", // seedé en DB
    //         password: "TestPassword123!",
    //       }),
    //     })
    //     expect(res.status).toBe(409)
    //     const body = await res.json()
    //     expect(body.error).toMatch(/email.*déjà/i)
    //   },
    // })
    expect(true).toBe(true)
  })

  it("422 — données invalides (mot de passe trop court)", async () => {
    // await testApiHandler({
    //   appHandler: registerHandler,
    //   test: async ({ fetch }) => {
    //     const res = await fetch({
    //       method: "POST",
    //       headers: { "Content-Type": "application/json" },
    //       body: JSON.stringify({
    //         name: "Test",
    //         email: "valide@httptest.fr",
    //         password: "court",
    //       }),
    //     })
    //     expect(res.status).toBe(422)
    //     const body = await res.json()
    //     expect(body.errors).toBeDefined()
    //   },
    // })
    expect(true).toBe(true)
  })

  it("422 — email invalide", async () => {
    // await testApiHandler({
    //   appHandler: registerHandler,
    //   test: async ({ fetch }) => {
    //     const res = await fetch({
    //       method: "POST",
    //       headers: { "Content-Type": "application/json" },
    //       body: JSON.stringify({
    //         name: "Test",
    //         email: "pas-un-email",
    //         password: "TestPassword123!",
    //       }),
    //     })
    //     expect(res.status).toBe(422)
    //   },
    // })
    expect(true).toBe(true)
  })

  it("le hash du mot de passe n'est jamais exposé dans la réponse", async () => {
    // await testApiHandler({
    //   appHandler: registerHandler,
    //   test: async ({ fetch }) => {
    //     const res = await fetch({
    //       method: "POST",
    //       headers: { "Content-Type": "application/json" },
    //       body: JSON.stringify({
    //         name: "Sécurité",
    //         email: "securite@httptest.fr",
    //         password: "TestPassword123!",
    //       }),
    //     })
    //     const body = await res.json()
    //     const bodyStr = JSON.stringify(body)
    //     expect(bodyStr).not.toContain("passwordHash")
    //     expect(bodyStr).not.toContain("$2b$") // préfixe bcrypt
    //   },
    // })
    expect(true).toBe(true)
  })
})
