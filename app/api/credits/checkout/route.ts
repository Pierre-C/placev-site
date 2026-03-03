/**
 * app/api/credits/checkout/route.ts
 * POST /api/credits/checkout
 * Crée une session Stripe Checkout pour l'achat d'un pack de crédits.
 *
 * Auth requise — retourne 401 si non authentifié.
 * Input : { creditsAmount: '5' | '10' | '20' }
 * Output : { url: string } — URL vers laquelle rediriger le client
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { stripe } from "@/lib/stripe"
import { prisma } from "@/lib/prisma"
import { calculateCreditPrice } from "@/lib/services/credits"
import { env } from "@/lib/env"

const checkoutSchema = z.object({
  creditsAmount: z.enum(["5", "10", "20"]),
})

export async function POST(request: NextRequest) {
  // ── Authentification ──────────────────────────────────────────────────────
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  // ── Validation input ──────────────────────────────────────────────────────
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 422 })
  }

  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.issues }, { status: 422 })
  }

  const { creditsAmount } = parsed.data
  const credits = parseInt(creditsAmount, 10)

  // ── Prix depuis SystemSetting ─────────────────────────────────────────────
  const segment = session.user.segment
  const setting = await prisma.systemSetting.findUnique({
    where: { key: `PRICE_CREDIT_${segment}` },
  })

  if (!setting) {
    return NextResponse.json(
      { error: `Prix non configuré pour le segment ${segment}` },
      { status: 500 }
    )
  }

  const pricePerCredit = parseInt(setting.value, 10)
  const totalAmount = calculateCreditPrice(credits, pricePerCredit)

  // ── Création session Stripe ────────────────────────────────────────────────
  const baseUrl = env.NEXTAUTH_URL ?? "http://localhost:3000"

  const checkoutSession = await stripe.checkout.sessions.create({
    line_items: [
      {
        price_data: {
          currency: "eur",
          product_data: { name: `${credits} crédits Place V` },
          unit_amount: totalAmount,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${baseUrl}/dashboard?payment=success`,
    cancel_url: `${baseUrl}/dashboard?payment=cancelled`,
    metadata: {
      userId: session.user.id,
      creditsAmount: creditsAmount,
    },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
