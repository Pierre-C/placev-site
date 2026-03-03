/**
 * lib/prisma.ts
 * Singleton Prisma 7 avec adapter Neon HTTP — toujours importer depuis @/lib/prisma.
 *
 * Utilise PrismaNeonHttp (HTTP fetch) — compatible Next.js App Router, Edge runtime
 * et environnements sans WebSocket natif.
 * Note : l'adaptateur HTTP ne supporte pas les transactions interactives ($transaction callback).
 */

import { PrismaClient } from "@prisma/client"
import { PrismaNeonHttp } from "@prisma/adapter-neon"

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL est requis pour initialiser le client Prisma")
  }
  const adapter = new PrismaNeonHttp(connectionString, {} as any)
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
