/**
 * lib/stripe.ts
 * Instance Stripe — bascule automatiquement entre mock et réel selon STRIPE_MOCK.
 *
 * Usage dans le code applicatif :
 *   import { stripe } from "@/lib/stripe"
 *   const session = await stripe.checkout.sessions.create(...)
 *
 * Le code applicatif ne sait jamais s'il utilise le mock ou le vrai Stripe.
 */

import { STRIPE_MOCK_ENABLED, mockStripe } from "./stripe-mock"

function createStripeClient() {
  if (STRIPE_MOCK_ENABLED) {
    console.log("[Stripe] Mode MOCK activé — aucun appel réel à Stripe")
    return mockStripe
  }

  // Vrai Stripe — nécessite STRIPE_SECRET_KEY dans .env
  if (!process.env.STRIPE_SECRET_KEY) {
    throw new Error(
      "STRIPE_SECRET_KEY manquant. Soit définir STRIPE_MOCK=true pour le dev, " +
      "soit fournir une clé Stripe réelle."
    )
  }

  // L'import dynamique évite que le build échoue si stripe n'est pas installé
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const Stripe = require("stripe")
  return new Stripe(process.env.STRIPE_SECRET_KEY, {
    apiVersion: "2024-06-20",
  })
}

// Singleton
export const stripe = createStripeClient()
