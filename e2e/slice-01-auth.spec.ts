/**
 * e2e/slice-01-auth.spec.ts
 * Tests E2E — Slice 1 : Inscription, connexion, dashboard membre
 *
 * Ces tests valident les parcours utilisateur complets dans un vrai navigateur.
 * Prérequis : serveur Next.js lancé + DB seedée (via global.setup.ts)
 */

import { test, expect } from "@playwright/test"
import { test as authTest } from "./helpers/fixtures"

// ─── Inscription ──────────────────────────────────────────────────────────────
test.describe("Inscription", () => {
  test("un nouvel utilisateur peut créer un compte", async ({ page }) => {
    const uniqueEmail = `test-${Date.now()}@test.fr`

    await page.goto("/register")
    await expect(page.locator("h1")).toContainText("Créer un compte")

    await page.fill('[name="name"]', "Jean Test")
    await page.fill('[name="email"]', uniqueEmail)
    await page.fill('[name="password"]', "TestPassword123!")
    await page.selectOption('[name="segment"]', "EXTERNE")
    await page.click('[type="submit"]')

    // Redirigé vers le dashboard après inscription
    await expect(page).toHaveURL("/dashboard")
    await expect(page.locator('[data-testid="credit-balance"]')).toContainText("1")
    await expect(page.locator('[data-testid="welcome-message"]')).toContainText("Jean Test")
  })

  test("un email déjà utilisé affiche une erreur", async ({ page }) => {
    await page.goto("/register")
    await page.fill('[name="name"]', "Doublon")
    await page.fill('[name="email"]', "externe@test.fr") // email déjà seedé
    await page.fill('[name="password"]', "TestPassword123!")
    await page.click('[type="submit"]')

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page).toHaveURL("/register") // reste sur la page
  })

  test("un mot de passe trop court affiche une erreur de validation", async ({ page }) => {
    await page.goto("/register")
    await page.fill('[name="email"]', "nouveau@test.fr")
    await page.fill('[name="password"]', "court") // trop court
    await page.click('[type="submit"]')

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
    await expect(page).toHaveURL("/register")
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
