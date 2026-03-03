/**
 * e2e/helpers/fixtures.ts
 * Fixtures Playwright réutilisables entre les tests.
 * Chaque fixture charge une session pré-authentifiée → pas de re-login à chaque test.
 */

import { test as base, Page } from "@playwright/test"
import { SESSIONS } from "./session-paths"

// Types des fixtures custom
type PlaceVFixtures = {
  membrePage: Page // Page connectée en tant que membre
  adminPage: Page  // Page connectée en tant qu'admin
  pauvreMembrePage: Page // Page membre avec crédits insuffisants
}

export const test = base.extend<PlaceVFixtures>({
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
 * Retourne la N-ième date future (à partir de demain) correspondant à un jour ouvert
 * (Lun=1, Mar=2, Mer=3). Garantit N dates distinctes dans la grille du mois courant.
 * Exemples : futureOpenDateYMD(1) → 1er prochain Lun/Mar/Mer, (2) → 2ème, etc.
 */
export function futureOpenDateYMD(nthOpenDay = 1): string {
  const d = new Date()
  d.setDate(d.getDate() + 1) // commencer à demain (en heure locale)
  let count = 0
  while (true) {
    if ([1, 2, 3].includes(d.getDay())) {
      count++
      if (count === nthOpenDay) break
    }
    d.setDate(d.getDate() + 1)
  }
  // Utiliser les composantes locales (pas toISOString/UTC) pour éviter le décalage de timezone
  // (identique à formatYMD dans lib/calendar-utils.ts)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, "0")
  const day = String(d.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/**
 * Lit le solde de crédits affiché sur le dashboard.
 */
export async function getDisplayedBalance(page: Page): Promise<number> {
  const text = await page.locator('[data-testid="credit-balance"]').textContent()
  const match = text?.match(/(-?\d+)/)
  return match ? parseInt(match[1]) : 0
}
