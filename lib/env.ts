/**
 * lib/env.ts
 * Validation Zod des variables d'environnement.
 * Importer depuis @/lib/env — ne jamais lire process.env.X directement dans le code applicatif.
 */

import { z } from "zod"

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL est requis"),
  NEXTAUTH_SECRET: z.string().min(1, "NEXTAUTH_SECRET est requis"),
  NEXTAUTH_URL: z.string().optional(),
  BREVO_MOCK: z.string().optional(),
  BREVO_API_KEY: z.string().optional(),
  STRIPE_MOCK: z.string().optional(),
  NEXT_PUBLIC_STRIPE_MOCK: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  NODE_ENV: z.enum(["development", "production", "test"]).optional(),
})

export const env = envSchema.parse(process.env)
