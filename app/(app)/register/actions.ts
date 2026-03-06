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

import { brevo } from "@/lib/brevo"
import crypto from "crypto"

const registerSchema = z.object({
  firstName: z.string().min(1, "Le prénom est requis"),
  lastName: z.string().min(1, "Le nom est requis"),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  isBouliacais: z.enum(["true", "false"]).transform(v => v === "true"),
  city: z.string().optional().transform(v => v && v.length > 0 ? v : undefined),
  tarifReduit: z.enum(["true", "false"]).transform(v => v === "true"),
  cgu: z.string().refine(val => val === "true", "Vous devez accepter les CGU"),
})

export type RegisterState = { error: string; success?: boolean; email?: string }

export async function registerAction(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    firstName: formData.get("firstName") ?? "",
    lastName: formData.get("lastName") ?? "",
    email: formData.get("email") ?? "",
    password: formData.get("password") ?? "",
    isBouliacais: formData.get("isBouliacais") ?? "false",
    city: formData.get("city") ?? undefined,
    tarifReduit: formData.get("tarifReduit") ?? "false",
    cgu: formData.get("cgu") ?? "",
  })

  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0]
    return { error: firstError ?? "Données invalides" }
  }

  const { email, firstName, lastName, password, isBouliacais, city, tarifReduit, cgu } = parsed.data

  // Vérifier si l'email est déjà utilisé
  const existing = await prisma.user.findUnique({ where: { email } })
  if (existing) {
    return { error: "Cet email est déjà utilisé" }
  }

  // Créer l'utilisateur (hash + sauvegarde en DB)
  let createdUserId: string
  try {
    const { user } = await createUser({ email, firstName, lastName, password, isBouliacais, city: city ?? "", tarifReduit, cguAccepted: cgu === "true" })
    createdUserId = user.id
  } catch {
    return { error: "Erreur lors de la création du compte" }
  }

  // 1. Générer le token de vérification
  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // +24h
  await prisma.emailVerificationToken.create({
    data: { token, userId: createdUserId, expiresAt }
  })

  // 2. Envoyer l'email de vérification via Brevo
  const verifyLink = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/auth/verify-email?token=${token}`
  await brevo.sendEmail({
    template: "bienvenue-validation",
    to: email,
    toName: `${firstName} ${lastName}`,
    variables: { verifyLink },
  })

  // 3. Retourner succès — PAS d'auto-login, PAS de signIn()
  return { error: "", success: true, email }
}
