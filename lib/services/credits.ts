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

/**
 * Calcule le prix total d'un pack de crédits.
 * Fonction pure — aucun appel DB.
 *
 * @param creditsAmount - Nombre de crédits à acheter
 * @param pricePerCredit - Prix d'un crédit en centimes (ex: 800 pour 8€)
 * @returns Prix total en centimes
 */
export function calculateCreditPrice(
  creditsAmount: number,
  pricePerCredit: number
): number {
  return creditsAmount * pricePerCredit
}

/**
 * Récupère le prix d'un crédit pour un segment donné depuis la DB.
 * Lit SystemSetting `PRICE_CREDIT_{segment}` (valeur en centimes).
 *
 * @param segment - Segment utilisateur (BOULIACAIS, EXTERNE, REDUIT)
 * @param tx - Client Prisma (ou transaction)
 * @returns Prix en centimes par crédit
 */
export async function getCreditPriceForSegment(
  segment: string,
  tx: Prisma.TransactionClient = prisma
): Promise<number> {
  const setting = await tx.systemSetting.findUnique({
    where: { key: `PRICE_CREDIT_${segment}` },
  })
  if (!setting) {
    throw new Error(`Prix non configuré pour le segment ${segment}`)
  }
  return parseInt(setting.value, 10)
}
