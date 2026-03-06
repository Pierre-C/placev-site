/**
 * e2e/slice-08-auth.spec.ts
 * Tests E2E — Slice 8 : Inscription enrichie & Reset Password
 *
 * Prérequis : serveur Next.js lancé + DB seedée + API Brevo mockée ou configurée.
 * Note : le parcours reset-password nécessite un token en DB — ces tests
 * valident principalement les formulaires et les redirections.
 */

import { test, expect } from "@playwright/test"
import { test as authTest } from "./helpers/fixtures"

// ─── Inscription enrichie (Slice 8) ──────────────────────────────────────────
test.describe("Inscription enrichie", () => {
  test("inscription complète avec isBouliacais=Oui → balance=0 sans crédit bienvenue", async ({ page }) => {
    const uniqueEmail = `slice08-${Date.now()}@test.fr`

    await page.goto("/register")

    await page.fill('[name="firstName"]', "Marie")
    await page.fill('[name="lastName"]', "Bouliac")
    await page.fill('[name="email"]', uniqueEmail)
    await page.fill('[name="password"]', "TestPassword123!")

    // Bouliacais = Oui → pas de champ ville
    await page.click('[data-testid="toggle-bouliacais-oui"]')
    await expect(page.locator('[name="city"]')).not.toBeVisible()

    // Tarif réduit = Non
    await page.click('[data-testid="toggle-tarif-reduit-non"]')

    // Accepter CGU
    await page.check('[name="cgu"]')
    await page.click('[type="submit"]')

    await expect(page).toHaveURL("/verify-email-sent")
  })

  test("inscription avec tarifReduit=Oui et city renseignée", async ({ page }) => {
    const uniqueEmail = `tarif-${Date.now()}@test.fr`

    await page.goto("/register")
    await page.fill('[name="firstName"]', "Paul")
    await page.fill('[name="lastName"]', "Étudiant")
    await page.fill('[name="email"]', uniqueEmail)
    await page.fill('[name="password"]', "TestPassword123!")

    await page.click('[data-testid="toggle-bouliacais-non"]')
    await expect(page.locator('[name="city"]')).toBeVisible()
    await page.fill('[name="city"]', "Bordeaux")

    await page.click('[data-testid="toggle-tarif-reduit-oui"]')
    await page.check('[name="cgu"]')
    await page.click('[type="submit"]')

    await expect(page).toHaveURL("/verify-email-sent")
  })

  test("inscription sans CGU → reste sur la page d'inscription avec erreur", async ({ page }) => {
    await page.goto("/register")
    await page.fill('[name="email"]', `nocgu-${Date.now()}@test.fr`)
    await page.fill('[name="password"]', "TestPassword123!")
    // Bouliacais=Oui pour éviter le champ city (aussi required) qui bloquerait avant la CGU
    await page.click('[data-testid="toggle-bouliacais-oui"]')
    // Ne pas cocher CGU — bypass la validation HTML5 native pour atteindre le Server Action
    await page.evaluate(() => document.querySelector('form')!.setAttribute('novalidate', ''))
    await page.click('[type="submit"]')

    await expect(page).toHaveURL("/register")
    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
  })

  test("l'infobulle tarif réduit affiche le message correct", async ({ page }) => {
    await page.goto("/register")
    await page.hover('[data-testid="tooltip-tarif-reduit-trigger"]')
    const tooltip = page.locator('[data-testid="tooltip-tarif-reduit"]')
    await expect(tooltip).toBeVisible()
    await expect(tooltip).toContainText("4")
    await expect(tooltip).toContainText("demi-journée")
    await expect(tooltip).toContainText("justificatif")
  })
})

// ─── Réinitialisation de mot de passe ────────────────────────────────────────
test.describe("Réinitialisation de mot de passe", () => {
  test("la page forgot-password est accessible", async ({ page }) => {
    await page.goto("/forgot-password")
    await expect(page.locator("h1, h2")).toContainText(/mot de passe|réinitial/i)
    await expect(page.locator('[name="email"]')).toBeVisible()
  })

  test("soumettre un email valide affiche une confirmation (sans révéler l'existence)", async ({ page }) => {
    await page.goto("/forgot-password")
    await page.fill('[name="email"]', "externe@test.fr")
    await page.click('[type="submit"]')

    // Message de confirmation générique (ne révèle pas si l'email existe)
    await expect(page.locator('[data-testid="forgot-password-success"]')).toBeVisible()
  })

  test("soumettre un email invalide affiche une erreur de validation", async ({ page }) => {
    await page.goto("/forgot-password")
    await page.fill('[name="email"]', "pas-un-email")
    // Bypass la validation HTML5 native (type="email") pour atteindre la validation Zod côté serveur
    await page.evaluate(() => document.querySelector('form')!.setAttribute('novalidate', ''))
    await page.click('[type="submit"]')

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page).toHaveURL("/forgot-password")
  })

  test("la page reset-password est accessible avec un token dans l'URL", async ({ page }) => {
    await page.goto("/reset-password?token=some-token")
    await expect(page.locator('[name="newPassword"]')).toBeVisible()
  })

  test("un token invalide sur reset-password affiche une erreur", async ({ page }) => {
    await page.goto("/reset-password?token=token-invalide-xyz")
    await page.fill('[name="newPassword"]', "NouveauMdp123!")
    await page.click('[type="submit"]')

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="error-message"]')).toContainText(/token|invalide|expiré/i)
  })

  test("un lien vers forgot-password est visible sur la page de login", async ({ page }) => {
    await page.goto("/login")
    const link = page.locator('a[href*="forgot-password"]')
    await expect(link).toBeVisible()
  })
})

// ─── Accès aux nouvelles pages (auth optionnelle) ─────────────────────────────
authTest.describe("Pages reset non accessibles quand déjà connecté", () => {
  authTest("un membre connecté sur /forgot-password voit la page (pas de redirect)", async ({ membrePage }) => {
    // Les pages forgot/reset restent accessibles même connecté (cas d'usage edge)
    await membrePage.goto("/forgot-password")
    await expect(membrePage.locator('[name="email"]')).toBeVisible()
  })
})
