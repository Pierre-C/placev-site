/**
 * lib/services/user.ts
 * Logique métier liée aux utilisateurs.
 */

import type { User } from "@prisma/client"
import bcrypt from "bcryptjs"
import { prisma } from "@/lib/prisma"
import { brevo } from "@/lib/brevo"
export type UserWithoutHash = Omit<User, "passwordHash">

export interface CreateUserInput {
  email: string
  firstName: string
  lastName: string
  password: string
  isBouliacais: boolean
  city: string
  tarifReduit: boolean
  cguAccepted: boolean
}

export interface CreateUserResult {
  user: UserWithoutHash
}

/**
 * Crée un nouvel utilisateur.
 * Hash le mot de passe, crée l'utilisateur.
 */
export async function createUser(input: CreateUserInput): Promise<CreateUserResult> {
  const { email, firstName, lastName, password, isBouliacais, city, tarifReduit, cguAccepted } = input

  const passwordHash = await bcrypt.hash(password, 12)
  const segment = isBouliacais ? "BOULIACAIS" : "EXTERNE"

  const user = await prisma.user.create({
    data: {
      email,
      firstName,
      lastName,
      passwordHash,
      segment,
      credits: 0,
      city,
      tarifReduitRequested: tarifReduit,
      cguAccepted,
    },
  })

  const { passwordHash: _, ...userWithoutHash } = user

  return {
    user: userWithoutHash,
  }
}

/**
 * Récupère un utilisateur par son email (avec le hash de mot de passe pour l'auth).
 */
export async function getUserByEmail(email: string): Promise<User | null> {
  return prisma.user.findUnique({ where: { email } })
}
