/**
 * app/api/credits/checkout/route.ts
 * POST /api/credits/checkout
 * Crée une session Stripe Checkout pour l'achat de N crédits.
 *
 * Auth requise — retourne 401 si non authentifié.
 * Input  : { creditsAmount: number }  — entier entre 1 et 50
 * Output : { url: string } — URL vers laquelle rediriger le client
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { stripe } from "@/lib/stripe"
import { env } from "@/lib/env"

const MIN_CREDITS = 1
const MAX_CREDITS = 50

const checkoutSchema = z.object({
  creditsAmount: z.coerce.number().int().min(MIN_CREDITS).max(MAX_CREDITS),
})

// Mapping segment → clé env var
const PRICE_ENV_KEY: Record<string, keyof typeof env> = {
  BOULIACAIS: "STRIPE_PRICE_BOULIACAIS",
  REDUIT: "STRIPE_PRICE_REDUIT",
  EXTERNE: "STRIPE_PRICE_EXTERNE",
}

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

  const credits = parsed.data.creditsAmount

  // ── Price ID Stripe selon le segment ─────────────────────────────────────
  const segment = session.user.segment ?? "EXTERNE"
  const envKey = PRICE_ENV_KEY[segment]
  const priceId = envKey ? env[envKey] : undefined

  if (!priceId) {
    return NextResponse.json(
      { error: `Price ID non configuré pour le segment ${segment}` },
      { status: 500 }
    )
  }

  // ── Création session Stripe ────────────────────────────────────────────────
  const baseUrl = env.NEXTAUTH_URL ?? "http://localhost:3000"

  const checkoutSession = await stripe.checkout.sessions.create({
    line_items: [
      {
        price: priceId as string,
        quantity: credits,
      },
    ],
    mode: "payment",
    success_url: `${baseUrl}/dashboard?payment=success`,
    cancel_url: `${baseUrl}/dashboard?payment=cancelled`,
    metadata: {
      userId: session.user.id,
      creditsAmount: String(credits),
    },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
