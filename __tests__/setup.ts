/**
 * __tests__/setup.ts
 * Configuration globale pour Vitest
 */

import { beforeAll, afterAll } from "vitest"

// Setup global avant tous les tests
beforeAll(async () => {
  // L'agent devra configurer ici :
  // - La connexion à une DB SQLite en mémoire pour les tests d'intégration
  // - ou un mock Prisma via vitest-mock-extended
  // Exemple avec prisma mock :
  // vi.mock("@/lib/prisma", () => ({ default: mockDeep<PrismaClient>() }))
})

afterAll(async () => {
  // Cleanup
})
