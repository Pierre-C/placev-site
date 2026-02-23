/**
 * lib/auth.ts
 * Configuration Auth.js v5 — provider Credentials email/password, stratégie JWT.
 * JWT inclut id, role, segment et credits pour éviter un appel DB à chaque requête.
 *
 * CRITIQUE : segment et credits dans le token évitent un appel DB à chaque calcul de prix.
 */

import NextAuth from "next-auth"
import Credentials from "next-auth/providers/credentials"
import bcrypt from "bcrypt"
import { z } from "zod"
import { prisma } from "@/lib/prisma"

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
})

/**
 * Construit le payload JWT à partir d'un utilisateur.
 * Exporté pour être testable unitairement.
 */
export function buildJwtPayload(user: {
  id: string
  role: string
  segment: string
  credits: number
}) {
  return {
    id: user.id,
    role: user.role,
    segment: user.segment,
    credits: user.credits,
  }
}

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,

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

  session: { strategy: "jwt" },

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        const payload = buildJwtPayload({
          id: user.id as string,
          role: user.role as string,
          segment: user.segment as string,
          credits: user.credits as number,
        })
        Object.assign(token, payload)
      }
      return token
    },

    session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as string
      session.user.segment = token.segment as string
      session.user.credits = token.credits as number
      return session
    },
  },

  pages: {
    signIn: "/login",
  },
})
