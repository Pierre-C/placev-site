/**
 * __tests__/__mocks__/stripe.ts
 * Mock Vitest de la lib Stripe pour les tests unitaires et HTTP.
 *
 * Vitest utilise automatiquement ce fichier quand le code importe @/lib/stripe
 * grâce à la directive vi.mock() dans les fichiers de test.
 *
 * Usage dans un fichier de test :
 *   vi.mock("@/lib/stripe")
 *   import { stripe } from "@/lib/stripe"
 *   // stripe est maintenant le mock ci-dessous
 */

import { vi } from "vitest"

export const stripe = {
  checkout: {
    sessions: {
      create: vi.fn().mockResolvedValue({
        id: "cs_mock_test_123",
        url: "http://localhost:3000/api/stripe-mock/checkout?session_id=cs_mock_test_123",
        metadata: {},
        payment_status: "unpaid",
      }),
    },
  },

  paymentIntents: {
    create: vi.fn().mockResolvedValue({
      id: "pi_mock_test_123",
      client_secret: "pi_mock_test_123_secret_mock",
      amount: 5000,
      status: "requires_payment_method",
      metadata: {},
    }),
  },

  webhooks: {
    constructEvent: vi.fn().mockImplementation((payload: string) => {
      return JSON.parse(payload)
    }),
  },
}

// Helper pour simuler différents scénarios dans les tests
export const stripeTestHelpers = {
  /**
   * Simule un checkout.session.completed payload
   */
  mockCheckoutCompleted: (metadata: Record<string, string>) => ({
    type: "checkout.session.completed",
    data: {
      object: {
        id: "cs_mock_test_123",
        payment_status: "paid",
        metadata,
      },
    },
  }),

  /**
   * Simule un payment_intent.succeeded payload
   */
  mockPaymentIntentSucceeded: (metadata: Record<string, string>) => ({
    type: "payment_intent.succeeded",
    data: {
      object: {
        id: "pi_mock_test_123",
        status: "succeeded",
        metadata,
      },
    },
  }),

  /**
   * Réinitialise tous les mocks entre les tests
   */
  resetAll: () => {
    vi.clearAllMocks()
  },
}
