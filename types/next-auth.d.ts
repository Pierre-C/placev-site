/**
 * types/next-auth.d.ts
 * Extension des types Auth.js pour inclure role, segment et credits
 * dans le token JWT et la session.
 */

import type { DefaultSession } from "next-auth"

declare module "next-auth" {
  interface Session {
    user: {
      id: string
      role: string
      segment: string
      credits: number
    } & DefaultSession["user"]
  }

  interface User {
    id: string
    role: string
    segment: string
    credits: number
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string
    role: string
    segment: string
    credits: number
  }
}
