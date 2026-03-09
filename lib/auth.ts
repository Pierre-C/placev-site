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
import bcrypt from "bcryptjs"
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
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Mot de passe", type: "password" },
        verifiedUserToken: { label: "Token", type: "text" },
      },
      async authorize(credentials) {
        console.log("[AUTH] Authorize called with credentials:", credentials);
        // CAS 1 : Auto-login post-vérification email (via VerifiedUserToken)
        if (credentials?.verifiedUserToken) {
          console.log("[AUTH] CAS 1: VerifiedUserToken found");
          const vut = await prisma.verifiedUserToken.findUnique({
            where: { token: credentials.verifiedUserToken as string },
            include: { user: true },
          })
          console.log("[AUTH] vut query result:", vut);
          if (!vut || vut.expiresAt < new Date()) {
             console.log("[AUTH] Invalid or expired vut");
             return null
          }
          await prisma.verifiedUserToken.delete({ where: { id: vut.id } }) // single-use
          const u = vut.user
          return { 
            id: u.id, 
            email: u.email, 
            firstName: u.firstName, 
            lastName: u.lastName, 
            name: `${u.firstName} ${u.lastName}`, 
            role: u.role, 
            segment: u.segment, 
            credits: u.credits 
          }
        }

        // CAS 2 : Login normal email + password
        console.log("[AUTH] CAS 2: Normal login");
        const parsed = loginSchema.safeParse(credentials)
        if (!parsed.success) {
           console.log("[AUTH] CAS 2: loginSchema parse failed", parsed.error);
           return null
        }

        const user = await prisma.user.findUnique({
          where: { email: parsed.data.email },
        })
        if (!user) return null
        if (!user.emailVerified) return null  // filet de sécurité (déjà détecté dans loginAction)

        const isValid = await bcrypt.compare(parsed.data.password, user.passwordHash)
        if (!isValid) return null

        return {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          name: `${user.firstName} ${user.lastName}`,
          role: user.role,
          segment: user.segment,
          credits: user.credits,
        }
      },
    }),
  ],
})
