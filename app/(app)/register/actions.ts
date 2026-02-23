/**
 * app/(app)/register/actions.ts
 * Server Action d'inscription — Auth.js v5.
 * Crée le compte, puis connecte l'utilisateur et redirige vers /dashboard.
 */

"use server"

import { z } from "zod"
import { signIn } from "@/lib/auth"
import { AuthError } from "next-auth"
import { prisma } from "@/lib/prisma"
import { createUser } from "@/lib/services/user"

const registerSchema = z.object({
  name: z
    .string()
    .optional()
    .transform((v) => (v && v.length > 0 ? v : undefined)),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  segment: z.enum(["BOULIACAIS", "EXTERNE", "REDUIT"]).default("EXTERNE"),
})

export type RegisterState = { error: string }

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
    segment: formData.get("segment") || "EXTERNE",
  })

  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0]
    return { error: firstError ?? "Données invalides" }
  }

  const { email, name, password, segment } = parsed.data

  // Vérifier si l'email est déjà utilisé
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: "Cet email est déjà utilisé" }
  }

  // Créer l'utilisateur (hash + transaction WELCOME_CREDIT + email Brevo mock)
  try {
    await createUser({ email, name, password, segment })
  } catch {
    return { error: "Erreur lors de la création du compte" }
  }

  // Connecter l'utilisateur et rediriger vers /dashboard
  try {
    await signIn("credentials", { email, password, redirectTo: "/dashboard" })
  } catch (error) {
    if (error instanceof AuthError) {
      return { error: "Compte créé. Veuillez vous connecter." }
    }
    throw error // Re-throw redirect errors pour que Next.js gère la navigation
  }

  return { error: "" }
}
