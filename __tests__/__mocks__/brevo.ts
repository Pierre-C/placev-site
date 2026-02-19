/**
 * __tests__/__mocks__/brevo.ts
 * Mock Vitest de lib/brevo pour les tests unitaires et HTTP.
 *
 * Usage dans un fichier de test :
 *   vi.mock("@/lib/brevo")
 *   import { brevo } from "@/lib/brevo"
 *   // brevo.sendEmail est maintenant un vi.fn() qu'on peut inspecter
 *
 * Exemple d'assertion :
 *   expect(brevo.sendEmail).toHaveBeenCalledWith(
 *     expect.objectContaining({
 *       template: "confirmation-reservation",
 *       to: "jean@test.fr",
 *     })
 *   )
 */

import { vi } from "vitest"
import type { SendEmailParams, SendEmailResult } from "@/lib/brevo-mock"

export const brevo = {
  sendEmail: vi.fn<[SendEmailParams], Promise<SendEmailResult>>().mockResolvedValue({
    success: true,
    messageId: "mock-test-message-id",
    mocked: true,
  }),
}

// ─── Helpers pour les assertions dans les tests ───────────────────────────────
export const brevoTestHelpers = {
  /**
   * Vérifie qu'un email d'un template donné a été envoyé à une adresse.
   */
  expectEmailSent: (template: string, to: string) => {
    expect(brevo.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ template, to })
    )
  },

  /**
   * Vérifie qu'aucun email n'a été envoyé (ex: en cas d'erreur).
   */
  expectNoEmailSent: () => {
    expect(brevo.sendEmail).not.toHaveBeenCalled()
  },

  /**
   * Vérifie les variables injectées dans l'email.
   */
  expectEmailVariables: (template: string, variables: Record<string, unknown>) => {
    expect(brevo.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        template,
        variables: expect.objectContaining(variables),
      })
    )
  },

  /**
   * Réinitialise le mock entre les tests (à appeler dans beforeEach).
   */
  reset: () => {
    vi.clearAllMocks()
  },
}
