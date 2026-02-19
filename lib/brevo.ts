/**
 * lib/brevo.ts
 * Client Brevo — bascule automatiquement entre mock et réel selon BREVO_MOCK.
 *
 * Usage dans le code applicatif :
 *   import { brevo } from "@/lib/brevo"
 *   await brevo.sendEmail({ template: "confirmation-reservation", to: user.email, ... })
 *
 * Le code applicatif ne sait jamais s'il utilise le mock ou le vrai Brevo.
 *
 * NOTE : Ce fichier remplace/étend le client Brevo existant dans le site vitrine.
 * L'intégration newsletter existante (app/api/newsletter) n'est pas impactée.
 */

import {
  BREVO_MOCK_ENABLED,
  brevoMock,
  type SendEmailParams,
  type SendEmailResult,
} from "./brevo-mock"

// ─── IDs des templates Brevo (à renseigner lors de la migration vers le vrai Brevo) ──
// Créer ces templates dans le dashboard Brevo avant de désactiver le mock.
const TEMPLATE_IDS: Record<string, number> = {
  "bienvenue-validation": 0,         // TODO: remplacer par l'ID réel
  "confirmation-achat-credits": 0,   // TODO: remplacer par l'ID réel
  "confirmation-reservation": 0,     // TODO: remplacer par l'ID réel
  "confirmation-annulation": 0,      // TODO: remplacer par l'ID réel
  "annulation-par-admin": 0,         // TODO: remplacer par l'ID réel
}

// ─── Client réel (appel API Brevo) ────────────────────────────────────────────
async function sendEmailReal(params: SendEmailParams): Promise<SendEmailResult> {
  if (!process.env.BREVO_API_KEY) {
    throw new Error("BREVO_API_KEY manquant. Définir BREVO_MOCK=true pour le dev.")
  }

  const templateId = TEMPLATE_IDS[params.template]
  if (!templateId) {
    throw new Error(
      `Template Brevo "${params.template}" non configuré. ` +
      "Renseigner l'ID dans lib/brevo.ts ou activer BREVO_MOCK=true."
    )
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": process.env.BREVO_API_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      to: [{ email: params.to, name: params.toName }],
      templateId,
      params: params.variables,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Brevo API error ${response.status}: ${error}`)
  }

  const data = await response.json()
  return { success: true, messageId: data.messageId }
}

// ─── Interface publique ───────────────────────────────────────────────────────
export const brevo = {
  sendEmail: async (params: SendEmailParams): Promise<SendEmailResult> => {
    if (BREVO_MOCK_ENABLED) {
      return brevoMock.sendEmail(params)
    }
    return sendEmailReal(params)
  },
}

// Re-exporter les types pour les consommateurs
export type { SendEmailParams, SendEmailResult, BrevoTemplate } from "./brevo-mock"
