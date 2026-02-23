/**
 * lib/services/user.ts
 * Logique métier liée aux utilisateurs.
 */

import type { User } from "@prisma/client"
import bcrypt from "bcrypt"
import { prisma } from "@/lib/prisma"
import { brevo } from "@/lib/brevo"
import { createWelcomeCredit } from "@/lib/services/credits"

export type UserWithoutHash = Omit<User, "passwordHash">

export interface CreateUserInput {
  email: string
  name?: string
  password: string
  segment?: "BOULIACAIS" | "EXTERNE" | "REDUIT"
}

export interface CreateUserResult {
  user: UserWithoutHash
  transaction: {
    id: string
    userId: string
    type: string
    creditsAdd: number
    creditsBefore: number
    createdAt: Date
  }
}

/**
 * Crée un nouvel utilisateur avec son crédit de bienvenue.
 * Hash le mot de passe, crée l'utilisateur et la transaction en DB atomiquement,
 * puis envoie l'email de bienvenue via Brevo.
 */
export async function createUser(input: CreateUserInput): Promise<CreateUserResult> {
  const { email, name, password, segment = "EXTERNE" } = input

  const passwordHash = await bcrypt.hash(password, 12)

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email,
        name,
        passwordHash,
        segment,
        credits: 1,
      },
    })

    const transaction = await createWelcomeCredit(user.id, tx)

    return { user, transaction }
  })

  await brevo.sendEmail({
    template: "bienvenue-validation",
    to: result.user.email,
    toName: result.user.name ?? undefined,
    variables: {
      name: result.user.name ?? email,
      credits: 1,
    },
  })

  const { passwordHash: _, ...userWithoutHash } = result.user

  return {
    user: userWithoutHash,
    transaction: result.transaction,
  }
}

/**
 * Récupère un utilisateur par son email (avec le hash de mot de passe pour l'auth).
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } })
}
