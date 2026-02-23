/**
 * lib/__mocks__/brevo.ts
 * Mock Vitest de lib/brevo — utilisé automatiquement par vi.mock('@/lib/brevo').
 * Ce fichier est adjacent à lib/brevo.ts pour que Vitest le trouve automatiquement.
 *
 * Usage dans un fichier de test :
 *   vi.mock("@/lib/brevo")
 *   import { brevo } from "@/lib/brevo"
 *   // brevo.sendEmail est maintenant un vi.fn()
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

export const brevoTestHelpers = {
  expectEmailSent: (template: string, to: string) => {
    expect(brevo.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({ template, to })
    )
  },
  expectNoEmailSent: () => {
    expect(brevo.sendEmail).not.toHaveBeenCalled()
  },
  expectEmailVariables: (template: string, variables: Record<string, unknown>) => {
    expect(brevo.sendEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        template,
        variables: expect.objectContaining(variables),
      })
    )
  },
  reset: () => {
    vi.clearAllMocks()
  },
}

// Re-exporter les types
export type { SendEmailParams, SendEmailResult, BrevoTemplate } from "@/lib/brevo-mock"
