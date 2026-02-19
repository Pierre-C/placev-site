/**
 * lib/stripe-mock.ts
 * Mock Stripe complet pour le développement sans compte Stripe.
 *
 * ─── UTILISATION ─────────────────────────────────────────────────────────────
 * Ce fichier remplace l'appel réel à Stripe tant que STRIPE_MOCK=true dans .env.local.
 * La vraie intégration Stripe sera activée en définissant STRIPE_SECRET_KEY et
 * en passant STRIPE_MOCK=false (ou en supprimant la variable).
 *
 * ─── QUAND PASSER AU VRAI STRIPE ────────────────────────────────────────────
 * 1. Créer un compte sur stripe.com
 * 2. Récupérer STRIPE_SECRET_KEY (sk_test_...) et STRIPE_PUBLISHABLE_KEY (pk_test_...)
 * 3. Créer un webhook endpoint dans le dashboard Stripe → récupérer STRIPE_WEBHOOK_SECRET
 * 4. Lancer : stripe listen --forward-to localhost:3000/api/webhooks/stripe
 * 5. Passer STRIPE_MOCK=false dans .env.local
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const STRIPE_MOCK_ENABLED = process.env.STRIPE_MOCK === "true"

// ─── Types miroir du SDK Stripe ───────────────────────────────────────────────
export interface MockCheckoutSession {
  id: string
  url: string
  metadata: Record<string, string>
  payment_status: "paid" | "unpaid"
}

export interface MockPaymentIntent {
  id: string
  client_secret: string
  amount: number
  status: "requires_payment_method" | "succeeded" | "canceled"
  metadata: Record<string, string>
}

// ─── Générateurs d'IDs mock ───────────────────────────────────────────────────
function mockId(prefix: string): string {
  return `${prefix}_mock_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

// ─── Mock Stripe Checkout Session ────────────────────────────────────────────
export const mockStripe = {
  checkout: {
    sessions: {
      /**
       * Simule stripe.checkout.sessions.create()
       * Retourne une URL mock qui pointe vers une page de paiement simulée.
       */
      create: async (params: {
        line_items: unknown[]
        mode: string
        success_url: string
        cancel_url: string
        metadata?: Record<string, string>
      }): Promise<MockCheckoutSession> => {
        const sessionId = mockId("cs")
        return {
          id: sessionId,
          // Redirige vers une page locale qui simule le succès Stripe
          url: `/api/stripe-mock/checkout?session_id=${sessionId}&success_url=${encodeURIComponent(params.success_url)}&metadata=${encodeURIComponent(JSON.stringify(params.metadata || {}))}`,
          metadata: params.metadata || {},
          payment_status: "unpaid",
        }
      },
    },
  },

  paymentIntents: {
    /**
     * Simule stripe.paymentIntents.create()
     */
    create: async (params: {
      amount: number
      currency: string
      metadata?: Record<string, string>
    }): Promise<MockPaymentIntent> => {
      const intentId = mockId("pi")
      return {
        id: intentId,
        client_secret: `${intentId}_secret_mock`,
        amount: params.amount,
        status: "requires_payment_method",
        metadata: params.metadata || {},
      }
    },
  },

  /**
   * Simule stripe.webhooks.constructEvent()
   * En mode mock, on bypass la vérification de signature.
   */
  webhooks: {
    constructEvent: (payload: string, _sig: string, _secret: string) => {
      if (!STRIPE_MOCK_ENABLED) {
        throw new Error("Ne pas appeler constructEvent en dehors du mock")
      }
      return JSON.parse(payload)
    },
  },
}
