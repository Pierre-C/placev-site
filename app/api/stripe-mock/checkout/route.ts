/**
 * app/api/stripe-mock/checkout/route.ts
 * Route de simulation du paiement Stripe en mode mock.
 *
 * En mode STRIPE_MOCK=true, le client est redirigé ici au lieu de stripe.com.
 * Cette page déclenche automatiquement le webhook mock puis redirige vers success_url.
 *
 * ⚠️ Cette route ne doit JAMAIS être accessible en production.
 */

import { NextRequest, NextResponse } from "next/server"

export async function GET(request: NextRequest) {
  // Bloquer en production
  if (process.env.STRIPE_MOCK !== "true") {
    return NextResponse.json({ error: "Non disponible en production" }, { status: 404 })
  }

  const { searchParams } = new URL(request.url)
  const sessionId = searchParams.get("session_id")
  const successUrl = searchParams.get("success_url")
  const metadataRaw = searchParams.get("metadata")

  if (!sessionId || !successUrl) {
    return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 })
  }

  let metadata: Record<string, string> = {}
  try {
    metadata = JSON.parse(decodeURIComponent(metadataRaw || "{}"))
  } catch {
    // metadata invalide, continuer avec un objet vide
  }

  // Déclencher le webhook mock (checkout.session.completed)
  const webhookPayload = {
    type: "checkout.session.completed",
    data: {
      object: {
        id: sessionId,
        payment_status: "paid",
        metadata,
      },
    },
  }

  try {
    // Appeler le webhook local (même serveur)
    const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000"
    await fetch(`${baseUrl}/api/webhooks/stripe`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "stripe-signature": "mock_signature", // ignoré en mode mock
      },
      body: JSON.stringify(webhookPayload),
    })
  } catch (err) {
    console.error("[Stripe Mock] Erreur appel webhook:", err)
  }

  // Rediriger vers la page de succès
  const decodedSuccessUrl = decodeURIComponent(successUrl)
  return NextResponse.redirect(new URL(decodedSuccessUrl, request.url))
}
