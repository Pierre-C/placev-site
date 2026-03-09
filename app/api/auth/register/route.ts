/**
 * app/api/auth/register/route.ts
 * POST /api/auth/register — Inscription d'un nouvel utilisateur.
 *
 * Validation Zod → hash bcrypt → User + Transaction en DB → email Brevo mock → 201
 */

import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { createUser } from "@/lib/services/user"

const registerSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  email: z.string().email("Email invalide"),
  password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
  segment: z.enum(["BOULIACAIS", "EXTERNE", "REDUIT"]).default("EXTERNE"),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()

    const parsed = registerSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { errors: parsed.error.flatten().fieldErrors },
        { status: 422 }
      )
    }

    const { email, firstName, lastName, password, segment } = parsed.data

    // Vérifier si l'email est déjà utilisé
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 409 }
      )
    }

    // Créer l'utilisateur (hash password + email Brevo)
    const { user } = await createUser({
      email,
      firstName: firstName ?? "",
      lastName: lastName ?? "",
      password,
      isBouliacais: segment === "BOULIACAIS",
      city: "",
      tarifReduit: segment === "REDUIT",
      cguAccepted: true
    })

    return NextResponse.json({ user }, { status: 201 })
  } catch {
    return NextResponse.json({ error: "Erreur interne du serveur" }, { status: 500 })
  }
}
