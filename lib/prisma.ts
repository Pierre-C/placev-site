/**
 * lib/prisma.ts
 * Singleton Prisma 7 avec adapter Neon — toujours importer depuis @/lib/prisma.
 * Prisma 7 requiert un driver adapter pour la connexion runtime.
 *
 * Utilise PrismaNeon (WebSocket Pool) pour supporter prisma.$transaction.
 * En environnement Node.js (non-edge), le constructeur WebSocket (ws) est configuré.
 */

import { PrismaClient } from "@prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import { Pool, neonConfig } from "@neondatabase/serverless"

// Configurer WebSocket pour Node.js (pas nécessaire dans les Edge runtimes)
if (typeof WebSocket === "undefined") {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  neonConfig.webSocketConstructor = require("ws")
}

function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL
  if (!connectionString) {
    throw new Error("DATABASE_URL est requis pour initialiser le client Prisma")
  }
  const pool = new Pool({ connectionString })
  const adapter = new PrismaNeon(pool)
  return new PrismaClient({ adapter })
}

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient }

export const prisma = globalForPrisma.prisma || createPrismaClient()

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma
}
