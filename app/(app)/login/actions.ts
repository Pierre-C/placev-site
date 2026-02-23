/**
 * app/(app)/login/actions.ts
 * Server Action de connexion — Auth.js v5.
 * Appelé depuis login/page.tsx via useFormState.
 *
 * Avantage sur signIn() côté client (next-auth/react) :
 *   - Pas de problème CSRF / cookie en mode dev
 *   - Compatible Auth.js v5 beta sans contournement
 */

"use server"

import { signIn } from "@/lib/auth"
import { AuthError } from "next-auth"

export type LoginState = { error: string }

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  const email = (formData.get("email") as string) ?? ""
  const password = (formData.get("password") as string) ?? ""

  try {
    // signIn en contexte Server Action : sur succès throw NEXT_REDIRECT → redirection auto
    // Sur échec credentials → throw CredentialsSignin (extends AuthError)
    await signIn("credentials", {
      email,
      password,
      redirectTo: "/dashboard", // Admin redirigé vers /admin depuis le dashboard
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Email ou mot de passe incorrect" }
    }
    throw error // Re-throw redirect errors pour que Next.js gère la navigation
  }

  return { error: "" }
}
