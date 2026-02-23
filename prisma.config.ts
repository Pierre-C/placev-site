/**
 * prisma.config.ts
 * Configuration Prisma 7 — requise pour les commandes CLI (migrate, generate, introspect).
 * Le client runtime utilise l'adapter Neon dans lib/prisma.ts.
 *
 * DATABASE_URL : branche Neon `develop` en local/preview, `main` en production.
 */

import dotenv from "dotenv"
import { defineConfig } from "prisma/config"

// Charger .env.local (convention Next.js) puis .env en fallback
dotenv.config({ path: ".env.local" })
dotenv.config()

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx --env-file=.env.local prisma/seed.ts",
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
})
