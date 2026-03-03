/**
 * app/api/webhooks/stripe/route.ts
 * POST /api/webhooks/stripe
 * Gère les événements Stripe — utilisé en mode mock ET en production.
 *
 * En mode STRIPE_MOCK=true : la vérification de signature est transparente
 *   (le mock client retourne JSON.parse(payload) sans vérifier la signature).
 * En mode production : vérification stricte avec STRIPE_WEBHOOK_SECRET.
 *
 * Événements gérés :
 *   - checkout.session.completed → incrémente les crédits + Transaction
 */

import { NextRequest, NextResponse } from "next/server"
import { stripe } from "@/lib/stripe"
import { brevo } from "@/lib/brevo"
import { prisma } from "@/lib/prisma"
import { env } from "@/lib/env"

type StripeEvent = {
  type: string
  data: {
    object: {
      id: string
      payment_status: string
      metadata: Record<string, string>
    }
  }
}

export async function POST(request: NextRequest) {
  const body = await request.text()
  const sig = request.headers.get("stripe-signature") ?? ""
  // En mock : la clé est ignorée. En prod : STRIPE_WEBHOOK_SECRET est requis.
  const secret = env.STRIPE_WEBHOOK_SECRET ?? "mock_secret"

  // ── Vérification signature ────────────────────────────────────────────────
  let event: StripeEvent
  try {
    event = stripe.webhooks.constructEvent(body, sig, secret) as StripeEvent
  } catch {
    return NextResponse.json({ error: "Signature invalide" }, { status: 400 })
  }

  // ── checkout.session.completed ────────────────────────────────────────────
  if (event.type === "checkout.session.completed") {
    const session = event.data.object
    const { userId, creditsAmount } = session.metadata ?? {}
    const stripeId = session.id

    if (!userId || !creditsAmount) {
      return NextResponse.json({ error: "Metadata manquante" }, { status: 400 })
    }

    const credits = parseInt(creditsAmount, 10)

    // Idempotence : si ce stripeId est déjà en base → ignorer silencieusement
    const existing = await prisma.transaction.findFirst({
      where: { stripeId },
    })
    if (existing) {
      return NextResponse.json({ ok: true, skipped: true })
    }

    // Récupérer le solde courant de l'utilisateur pour creditsBefore
    const user = await prisma.user.findUnique({ where: { id: userId } })
    if (!user) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
    }

    // Opérations séquentielles (Neon HTTP n'accepte pas $transaction callback)
    await prisma.user.update({
      where: { id: userId },
      data: { credits: { increment: credits } },
    })

    await prisma.transaction.create({
      data: {
        userId,
        type: "CREDIT_PURCHASE",
        creditsAdd: credits,
        creditsBefore: user.credits,
        stripeId,
      },
    })

    // Email de confirmation (loggé en mock, envoyé en prod)
    await brevo.sendEmail({
      template: "confirmation-achat-credits",
      to: user.email,
      toName: user.name ?? undefined,
      variables: {
        credits,
        name: user.name ?? user.email,
      },
    })
  }

  return NextResponse.json({ ok: true })
}
