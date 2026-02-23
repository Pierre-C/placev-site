/**
 * lib/auth.ts
 * Configuration Auth.js v5 complète — Node.js runtime uniquement.
 * Étend authConfig (edge-safe) avec le provider Credentials (bcrypt + Prisma).
 *
 * Ne pas importer depuis middleware.ts (bcrypt n'est pas compatible Edge).
 * Le middleware utilise NextAuth(authConfig) depuis lib/auth.config.ts.
 */

import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcrypt"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { authConfig } from "./auth.config"

export { buildJwtPayload } from "./auth.config"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

export const { handlers, signIn, signOut, auth } = NextAuth({
  ...authConfig,

  providers: [
    Credentials({
      async authorize(credentials) {
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) return null

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        })
        if (!user) return null

        const isValid = await bcrypt.compare(parsed.data.password, user.passwordHash)
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          segment: user.segment,
          credits: user.credits,
        }
      },
    }),
  ],
})
