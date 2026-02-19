/**
 * app/api/stripe-mock/confirm-payment/route.ts
 * Simule la confirmation d'un Payment Intent (flux salle de réunion).
 *
 * En mode réel, c'est Stripe Elements côté client qui confirme le paiement.
 * En mode mock, ce endpoint POST simule cette confirmation.
 *
 * ⚠️ Cette route ne doit JAMAIS être accessible en production.
 */

import { NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  if (process.env.STRIPE_MOCK !== "true") {
    return NextResponse.json({ error: "Non disponible en production" }, { status: 404 })
  }

  const { paymentIntentId, reservationId } = await request.json()

  if (!paymentIntentId || !reservationId) {
    return NextResponse.json({ error: "paymentIntentId et reservationId requis" }, { status: 400 })
  }

  // Simuler le webhook payment_intent.succeeded
  const webhookPayload = {
    type: "payment_intent.succeeded",
    data: {
      object: {
        id: paymentIntentId,
        status: "succeeded",
        metadata: { reservationId },
      },
    },
  }

  try {
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    await fetch(`${baseUrl}/api/webhooks/stripe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "mock_signature",
      },
      body: JSON.stringify(webhookPayload),
    })
  } catch (err) {
    console.error("[Stripe Mock] Erreur confirm-payment:", err)
    return NextResponse.json({ error: "Webhook mock échoué" }, { status: 500 })
  }

  return NextResponse.json({ success: true, paymentIntentId })
}
