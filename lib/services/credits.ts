/**
 * lib/services/credits.ts
 * Logique métier liée aux crédits.
 */

import type { Prisma, Transaction } from "@prisma/client"
import { prisma } from "@/lib/prisma"

/**
 * Crée la transaction de crédit de bienvenue pour un nouvel utilisateur.
 * À appeler dans une transaction Prisma lors de l'inscription.
 */
export async function createWelcomeCredit(
  userId: string,
  tx: Prisma.TransactionClient = prisma
): Promise<Transaction> {
  return tx.transaction.create({
    data: {
      userId,
      type: "WELCOME_CREDIT",
      creditsAdd: 1,
      creditsBefore: 0,
    },
  })
}
