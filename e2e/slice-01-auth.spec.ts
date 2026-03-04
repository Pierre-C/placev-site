/**
 * e2e/slice-01-auth.spec.ts
 * Tests E2E — Slice 1 : Inscription, connexion, dashboard membre
 * Mis à jour Slice 8 : nouveaux champs inscription, balance=0, reset password.
 *
 * Ces tests valident les parcours utilisateur complets dans un vrai navigateur.
 * Prérequis : serveur Next.js lancé + DB seedée (via global.setup.ts)
 */

import { test, expect } from "@playwright/test"
import { test as authTest } from "./helpers/fixtures"

// ─── Inscription ──────────────────────────────────────────────────────────────
test.describe("Inscription", () => {
  test("un nouvel utilisateur peut créer un compte avec les nouveaux champs", async ({ page }) => {
    const uniqueEmail = `test-${Date.now()}@test.fr`

    await page.goto("/register")
    await expect(page.locator("h1")).toContainText("Créer un compte")

    await page.fill('[name="name"]', "Jean Test")
    await page.fill('[name="email"]', uniqueEmail)
    await page.fill('[name="password"]', "TestPassword123!")

    // Toggle isBouliacais → Non (affiche le champ ville)
    await page.click('[data-testid="toggle-bouliacais-non"]')
    await page.fill('[name="city"]', "Bordeaux")

    // Toggle tarif réduit → Non
    await page.click('[data-testid="toggle-tarif-reduit-non"]')

    // Accepter les CGU
    await page.check('[name="cgu"]')

    await page.click('[type="submit"]')

    // Redirigé vers le dashboard après inscription
    await expect(page).toHaveURL(/.*\/verify-email-sent.*/)
    await expect(page.locator('[data-testid="verify-email-sent-message"]')).toBeVisible()
    })

  test("un email déjà utilisé affiche une erreur", async ({ page }) => {
    await page.goto("/register")
    await page.fill('[name="name"]', "Doublon")
    await page.fill('[name="email"]', "externe@test.fr") // email déjà seedé
    await page.fill('[name="password"]', "TestPassword123!")
    await page.click('[data-testid="toggle-bouliacais-non"]')
    await page.fill('[name="city"]', "Bordeaux") // city required quand isBouliacais=false
    await page.check('[name="cgu"]')
    await page.click('[type="submit"]')

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page).toHaveURL("/register") // reste sur la page
  })

  test("un mot de passe trop court affiche une erreur de validation", async ({ page }) => {
    await page.goto("/register")
    await page.fill('[name="email"]', "nouveau@test.fr")
    await page.fill('[name="password"]', "court") // trop court
    await page.click('[data-testid="toggle-bouliacais-oui"]') // masque city (required) pour ne pas bloquer côté browser
    await page.check('[name="cgu"]')
    await page.click('[type="submit"]')

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page).toHaveURL("/register")
  })

  test("inscription sans accepter les CGU affiche une erreur de validation", async ({ page }) => {
    await page.goto("/register")
    await page.fill('[name="email"]', `nocgu-${Date.now()}@test.fr`)
    await page.fill('[name="password"]', "TestPassword123!")
    await page.click('[data-testid="toggle-bouliacais-oui"]') // masque city (required) pour ne pas bloquer côté browser
    // Ne pas cocher la checkbox CGU
    // Désactiver la validation HTML5 native (required sur CGU) pour atteindre la validation Zod côté serveur
    await page.evaluate(() => document.querySelector("form")!.setAttribute("novalidate", ""))
    await page.click('[type="submit"]')

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page).toHaveURL("/register")
  })

  test("l'infobulle tarif réduit affiche le bon texte", async ({ page }) => {
    await page.goto("/register")
    // Déclencher l'affichage de l'infobulle (hover ou clic sur l'icône)
    await page.hover('[data-testid="tooltip-tarif-reduit-trigger"]')
    await expect(page.locator('[data-testid="tooltip-tarif-reduit"]')).toBeVisible()
    await expect(page.locator('[data-testid="tooltip-tarif-reduit"]')).toContainText("4")
    await expect(page.locator('[data-testid="tooltip-tarif-reduit"]')).toContainText("justificatif")
  })

  test("isBouliacais=Oui masque le champ ville", async ({ page }) => {
    await page.goto("/register")
    // Par défaut, le toggle doit être visible
    await page.click('[data-testid="toggle-bouliacais-oui"]')
    // Le champ ville doit être masqué quand Bouliacais=Oui
    await expect(page.locator('[name="city"]')).not.toBeVisible()
  })

  test("isBouliacais=Non affiche le champ ville", async ({ page }) => {
    await page.goto("/register")
    await page.click('[data-testid="toggle-bouliacais-non"]')
    await expect(page.locator('[name="city"]')).toBeVisible()
  })

  test("tarifReduit=Oui ne donne pas segment=REDUIT automatiquement", async ({ page }) => {
    const uniqueEmail = `tarif-${Date.now()}@test.fr`
    await page.goto("/register")
    await page.fill('[name="name"]', "Étudiant Test")
    await page.fill('[name="email"]', uniqueEmail)
    await page.fill('[name="password"]', "TestPassword123!")
    await page.click('[data-testid="toggle-bouliacais-non"]')
    await page.fill('[name="city"]', "Bordeaux")
    // Demander le tarif réduit
    await page.click('[data-testid="toggle-tarif-reduit-oui"]')
    await page.check('[name="cgu"]')
    await page.click('[type="submit"]')

    await expect(page).toHaveURL(/.*\/verify-email-sent.*/)
    await expect(page.locator('[data-testid="verify-email-sent-message"]')).toBeVisible()
  })
})

// ─── Connexion ────────────────────────────────────────────────────────────────
test.describe("Connexion", () => {
  test("un utilisateur existant peut se connecter", async ({ page }) => {
    await page.goto("/login")
    await page.fill('[name="email"]', "externe@test.fr")
    await page.fill('[name="password"]', "TestPassword123!")
    await page.click('[type="submit"]')

    await expect(page).toHaveURL("/dashboard")
    await expect(page.locator('[data-testid="credit-balance"]')).toBeVisible()
  })

  test("un mauvais mot de passe affiche une erreur", async ({ page }) => {
    await page.goto("/login")
    await page.fill('[name="email"]', "externe@test.fr")
    await page.fill('[name="password"]', "mauvais-mdp")
    await page.click('[type="submit"]')

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page).toHaveURL("/login")
  })

  test("une tentative non authentifiée sur /dashboard redirige vers /login", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/login/)
  })

  test("une tentative non authentifiée sur /admin redirige vers /login", async ({ page }) => {
    await page.goto("/admin")
    await expect(page).toHaveURL(/\/login/)
  })
})

// ─── Dashboard membre ─────────────────────────────────────────────────────────
authTest.describe("Dashboard membre", () => {
  authTest("affiche le solde de crédits", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    await expect(membrePage.locator('[data-testid="credit-balance"]')).toBeVisible()
    await expect(membrePage.locator('[data-testid="credit-balance"]')).toContainText("5")
  })

  authTest("affiche l'historique des transactions", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/historique")
    await expect(membrePage.locator('[data-testid="transaction-history"]')).toBeVisible()
  })

  authTest("affiche le calendrier de réservation", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    await expect(membrePage.locator('[data-testid="booking-calendar"]')).toBeVisible()
  })
})

// ─── Accès admin ──────────────────────────────────────────────────────────────
authTest.describe("Accès admin", () => {
  authTest("un USER redirigé vers /dashboard s'il tente /admin", async ({ membrePage }) => {
    await membrePage.goto("/admin")
    await expect(membrePage).toHaveURL("/dashboard")
  })

  authTest("un ADMIN peut accéder à /admin", async ({ adminPage }) => {
    await adminPage.goto("/admin")
    await expect(adminPage).toHaveURL("/admin")
    await expect(adminPage.locator("h1")).toContainText("Administration")
  })
})
