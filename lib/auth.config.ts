/**
 * lib/auth.config.ts
 * Configuration Auth.js v5 compatible Edge runtime (middleware).
 * Pas de bcrypt, pas de Prisma — uniquement JWT + callbacks.
 *
 * Importé par :
 *   - middleware.ts (Edge runtime via NextAuth(authConfig).auth)
 *   - lib/auth.ts   (Node.js runtime — étendu avec Credentials provider + Prisma)
 */

import type { NextAuthConfig } from "next-auth"

export type AuthUser = {
  id: string
  role: string
  segment: string
  credits: number
  firstName: string
  lastName: string
}

export function buildJwtPayload(user: AuthUser) {
  return {
    id: user.id,
    role: user.role,
    segment: user.segment,
    credits: user.credits,
    firstName: user.firstName,
    lastName: user.lastName,
  }
}

export const authConfig: NextAuthConfig = {
  // Secret lu depuis NEXTAUTH_SECRET (v4 compat) ou AUTH_SECRET (v5)
  secret: process.env.NEXTAUTH_SECRET ?? process.env.AUTH_SECRET,

  session: { strategy: "jwt" },

  pages: {
    signIn: "/login",
  },

  callbacks: {
    jwt({ token, user }) {
      if (user) {
        Object.assign(token, buildJwtPayload({
          id: user.id as string,
          role: (user as unknown as AuthUser).role,
          segment: (user as unknown as AuthUser).segment,
          credits: (user as unknown as AuthUser).credits,
          firstName: (user as unknown as AuthUser).firstName,
          lastName: (user as unknown as AuthUser).lastName,
        }))
      }
      return token
    },

    session({ session, token }) {
      session.user.id = token.id as string
      session.user.role = token.role as string
      session.user.segment = token.segment as string
      session.user.credits = token.credits as number
      session.user.firstName = token.firstName as string
      session.user.lastName = token.lastName as string
      session.user.name = `${token.firstName} ${token.lastName}`
      return session
    },
  },

  providers: [], // Les providers avec bcrypt sont dans lib/auth.ts uniquement
}
