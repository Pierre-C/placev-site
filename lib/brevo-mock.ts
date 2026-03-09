/**
 * lib/brevo-mock.ts
 * Mock Brevo complet pour le développement sans envoi réel d'emails.
 *
 * ─── UTILISATION ─────────────────────────────────────────────────────────────
 * Activé par BREVO_MOCK=true dans .env.local.
 * Tous les emails sont loggés en console avec leurs variables — aucun email
 * réel n'est envoyé, même vers de vraies adresses.
 *
 * ─── AVANTAGE vs SEND_EMAILS=false ──────────────────────────────────────────
 * Contrairement à un simple flag, le mock LOGGE les emails qui partiraient.
 * Tu vois exactement ce qui serait envoyé, avec quelles variables, à qui.
 * Les tests peuvent asserter que le bon email a été déclenché.
 *
 * ─── QUAND PASSER AU VRAI BREVO ─────────────────────────────────────────────
 * 1. S'assurer que BREVO_API_KEY est renseigné dans .env.local
 * 2. Passer BREVO_MOCK=false (ou supprimer la variable)
 * 3. Vérifier les templates dans le dashboard Brevo (IDs dans lib/brevo-templates.ts)
 * ─────────────────────────────────────────────────────────────────────────────
 */

export const BREVO_MOCK_ENABLED = process.env.BREVO_MOCK === "true"

// ─── Types des emails supportés ───────────────────────────────────────────────
export type BrevoTemplate =
  | "bienvenue-validation"
  | "confirmation-achat-credits"
  | "confirmation-reservation"
  | "confirmation-annulation"
  | "annulation-par-admin"
  | "reset-password"
  | "confirmation-reservation-multiple"
  | "nouvelle-demande-devis"
  | "demande-suppression-compte"

export interface SendEmailParams {
  template: BrevoTemplate
  to: string
  toName?: string
  variables: Record<string, any>
}

export interface SendEmailResult {
  success: boolean
  messageId?: string
  mocked?: boolean
}

// ─── Historique des emails mockés (accessible dans les tests) ─────────────────
export const mockEmailLog: SendEmailParams[] = []

export function clearMockEmailLog() {
  mockEmailLog.length = 0
}

// ─── Client mock ─────────────────────────────────────────────────────────────
export const brevoMock = {
  sendEmail: async (params: SendEmailParams): Promise<SendEmailResult> => {
    // Logger dans la console avec un format lisible
    console.log([
      "",
      "┌─ [Brevo Mock] Email simulé ───────────────────────────────",
      `│  Template  : ${params.template}`,
      `│  Destinataire : ${params.toName ? `${params.toName} <${params.to}>` : params.to}`,
      `│  Variables :`,
      ...Object.entries(params.variables).map(
        ([k, v]) => `│    ${k}: ${v}`
      ),
      "└───────────────────────────────────────────────────────────",
      "",
    ].join("\n"))

    // Stocker dans le log pour les assertions de test
    mockEmailLog.push(params)

    return {
      success: true,
      messageId: `mock-${Date.now()}`,
      mocked: true,
    }
  },
}
