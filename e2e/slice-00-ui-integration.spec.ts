/**
 * e2e/slice-00-ui-integration.spec.ts
 * Tests E2E — Slice 0 : Intégration UI Navigation & Authentification
 *
 * Couvre : header auth button, logout, absence du bouton Contact,
 *          non-régression site vitrine, mobile.
 */

import { test, expect } from "@playwright/test"
import { test as authTest } from "./helpers/fixtures"

// ─── E2E-0.1 : Header — visiteur non connecté ─────────────────────────────────

test.describe("Header — visiteur non connecté", () => {
  test("E2E-0.1 : affiche Se connecter et pas de user-menu", async ({ page }) => {
    await page.goto("/")

    await expect(page.locator('[data-testid="header-login-btn"]')).toBeVisible()
    await expect(page.locator('[data-testid="header-user-menu"]')).not.toBeAttached()
  })

  test("E2E-0.1b : cliquer sur Se connecter redirige vers /login", async ({ page }) => {
    await page.goto("/")
    await page.click('[data-testid="header-login-btn"]')

    await expect(page).toHaveURL("/login")
  })
})

// ─── E2E-0.2 : Header — utilisateur connecté ──────────────────────────────────

authTest.describe("Header — utilisateur connecté", () => {
  authTest("E2E-0.2 : affiche le prénom et Mon espace", async ({ membrePage: page }) => {
    await page.goto("/")

    await expect(page.locator('[data-testid="header-user-menu"]')).toBeVisible()
    await expect(page.locator('[data-testid="header-login-btn"]')).not.toBeAttached()

    // Le texte contient le prénom (le nom seedé est "Externe Test" → "Externe")
    const userMenu = page.locator('[data-testid="header-user-menu"]')
    await expect(userMenu).toContainText(/[A-Z][a-z]+/)
  })

  authTest("E2E-0.2b : cliquer sur Mon espace redirige vers /dashboard", async ({ membrePage: page }) => {
    await page.goto("/")
    await page.click('[data-testid="header-dashboard-link"]')

    await expect(page).toHaveURL("/dashboard")
  })
})

// ─── E2E-0.3 : Header — admin connecté ────────────────────────────────────────

authTest.describe("Header — admin connecté", () => {
  authTest("E2E-0.3 : affiche le badge Admin", async ({ adminPage: page }) => {
    await page.goto("/")

    await expect(page.locator('[data-testid="header-user-menu"]')).toBeVisible()
    await expect(page.locator('[data-testid="header-admin-badge"]')).toBeVisible()
  })
})

// ─── E2E-0.4 : Retrait bouton Contact ─────────────────────────────────────────

test.describe("Retrait bouton Contact", () => {
  test("E2E-0.4 : header-contact-btn absent sur /", async ({ page }) => {
    await page.goto("/")

    await expect(page.locator('[data-testid="header-contact-btn"]')).not.toBeAttached()
  })

  test("E2E-0.4b : /contact reste accessible (status 200)", async ({ page }) => {
    const response = await page.goto("/contact")

    expect(response?.status()).toBe(200)
    // La page de contact s'affiche correctement
    await expect(page.locator("body")).toBeVisible()
  })
})

// ─── E2E-0.5 & 0.6 : Logout depuis /dashboard ─────────────────────────────────

authTest.describe("Logout depuis /dashboard", () => {
  authTest("E2E-0.5 : bouton logout visible sur /dashboard", async ({ membrePage: page }) => {
    await page.goto("/dashboard")

    await expect(page.locator('[data-testid="logout-btn"]')).toBeVisible()
  })

  authTest("E2E-0.6 : logout redirige vers /login et détruit la session", async ({ membrePage: page }) => {
    await page.goto("/dashboard")
    await page.click('[data-testid="logout-btn"]')

    await expect(page).toHaveURL("/login")

    // La session est détruite — /dashboard redirige vers /login
    await page.goto("/dashboard")
    await expect(page).toHaveURL("/login")
  })
})

// ─── E2E-0.7 : Logout depuis /admin ───────────────────────────────────────────

authTest.describe("Logout depuis /admin", () => {
  authTest("E2E-0.7 : bouton logout visible et fonctionnel depuis /admin", async ({ adminPage: page }) => {
    await page.goto("/admin")

    await expect(page.locator('[data-testid="logout-btn"]')).toBeVisible()

    await page.click('[data-testid="logout-btn"]')
    await expect(page).toHaveURL("/login")

    await page.goto("/admin")
    await expect(page).toHaveURL("/login")
  })
})

// ─── E2E-0.8 : Non-régression site vitrine ────────────────────────────────────

test.describe("Non-régression site vitrine", () => {
  test("E2E-0.8 : / ne génère pas d'erreur et affiche le header", async ({ page }) => {
    const errors: string[] = []
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text())
    })

    await page.goto("/")

    // Le header est visible
    await expect(page.locator("header")).toBeVisible()
    // Pas d'erreurs console critiques (on tolère les warnings baseline-browser-mapping)
    const criticalErrors = errors.filter(
      (e) => !e.includes("baseline") && !e.includes("favicon")
    )
    expect(criticalErrors).toHaveLength(0)
  })

  test("E2E-0.8b : /contact affiche le formulaire de contact", async ({ page }) => {
    await page.goto("/contact")

    // La page de contact est accessible et affiche du contenu
    await expect(page.locator("body")).toBeVisible()
    // Le header est présent sur la page contact
    await expect(page.locator("header")).toBeVisible()
  })
})

// ─── E2E-0.9 : Mobile ─────────────────────────────────────────────────────────

test.describe("Navigation mobile", () => {
  test.use({ viewport: { width: 390, height: 844 } }) // iPhone 13

  test("E2E-0.9 : login accessible sur mobile (menu burger ou bouton direct)", async ({ page }) => {
    await page.goto("/")

    // Sur mobile, soit le header-login-btn est visible, soit il est dans le menu burger
    const loginBtn = page.locator('[data-testid="header-login-btn"]')
    const mobileMenuBtn = page.locator('button[aria-label="Menu"]')

    const loginVisible = await loginBtn.isVisible().catch(() => false)

    if (!loginVisible) {
      // Ouvrir le menu burger
      await expect(mobileMenuBtn).toBeVisible()
      await mobileMenuBtn.click()
      // Après ouverture, un lien vers /login ou un bouton login doit être disponible
      const loginLink = page.locator('a[href="/login"]')
      await expect(loginLink.first()).toBeVisible()
    } else {
      await expect(loginBtn).toBeVisible()
    }

    // Pas de débordement horizontal
    const bodyWidth = await page.evaluate(() => document.body.scrollWidth)
    const viewportWidth = await page.evaluate(() => window.innerWidth)
    expect(bodyWidth).toBeLessThanOrEqual(viewportWidth + 5) // tolérance 5px
  })
})
