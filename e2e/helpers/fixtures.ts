/**
 * e2e/helpers/fixtures.ts
 * Fixtures Playwright réutilisables entre les tests.
 * Chaque fixture charge une session pré-authentifiée → pas de re-login à chaque test.
 */

import { test as base } from "@playwright/test"
import { SESSIONS } from "../global.setup"

// Types des fixtures custom
type PlaceVFixtures = {
  membrePage: ReturnType<typeof base.extend> // Page connectée en tant que membre
  adminPage: ReturnType<typeof base.extend>  // Page connectée en tant qu'admin
  pauvreMembrePage: ReturnType<typeof base.extend> // Page membre avec crédits insuffisants
}

export const test = base.extend({
  // Page pré-authentifiée en tant que membre normal
  membrePage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: SESSIONS.membre })
    const page = await context.newPage()
    await use(page)
    await context.close()
  },

  // Page pré-authentifiée en tant qu'admin
  adminPage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: SESSIONS.admin })
    const page = await context.newPage()
    await use(page)
    await context.close()
  },

  // Page pré-authentifiée avec un membre au solde très bas
  pauvreMembrePage: async ({ browser }, use) => {
    const context = await browser.newContext({ storageState: SESSIONS.membreSansCredits })
    const page = await context.newPage()
    await use(page)
    await context.close()
  },
})

export { expect } from "@playwright/test"

// ─── Helpers réutilisables ────────────────────────────────────────────────────

/**
 * Retourne une date future formatée YYYY-MM-DD.
 * daysFromNow=1 → demain, évite les problèmes de timezone.
 */
export function futureDateYMD(daysFromNow = 7): string {
  const d = new Date()
  d.setDate(d.getDate() + daysFromNow)
  return d.toISOString().slice(0, 10)
}

/**
 * Lit le solde de crédits affiché sur le dashboard.
 */
export async function getDisplayedBalance(page: Parameters<typeof base>[0]): Promise<number> {
  const text = await page.locator('[data-testid="credit-balance"]').textContent()
  const match = text?.match(/(-?\d+)/)
  return match ? parseInt(match[1]) : 0
}
