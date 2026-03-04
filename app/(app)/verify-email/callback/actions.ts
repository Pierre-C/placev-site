"use server"

import { signIn } from "@/lib/auth"
import { AuthError } from "next-auth"

export async function autoLoginAction(verifiedUserToken: string): Promise<{ error?: string }> {
  try {
    await signIn("credentials", { verifiedUserToken, redirectTo: "/dashboard" })
    return {}
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Token invalide ou expiré" }
    }
    throw error // Re-throw redirect errors pour que Next.js gère la navigation
  }
}