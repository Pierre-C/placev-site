/**
 * __tests__/setup.ts
 * Configuration globale pour Vitest.
 * Les variables d'environnement sont définies ici pour que lib/env.ts
 * ne lève pas d'erreur lors de l'exécution des tests.
 */

import { beforeAll, afterAll } from "vitest"

// Définir les variables d'env AVANT tout import de module qui les consomme
process.env.DATABASE_URL =
  process.env.DATABASE_URL || "postgresql://test:test@localhost:5432/test"
process.env.NEXTAUTH_SECRET =
  process.env.NEXTAUTH_SECRET || "test-secret-for-vitest-that-is-long-enough"
process.env.BREVO_MOCK = "true"
process.env.STRIPE_MOCK = "true"
process.env.NODE_ENV = process.env.NODE_ENV || "test"

beforeAll(async () => {
  // Rien à faire globalement — chaque test file mock ce dont il a besoin
})

afterAll(async () => {
  // Cleanup global si nécessaire
})
