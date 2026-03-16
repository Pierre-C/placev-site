/**
 * e2e/slice-07-main-nav-ux.spec.ts
 * Tests E2E — Slice 7 : Refonte Navigation Principale & CTAs Homepage
 *
 * Prérequis : serveur Next.js lancé + DB seedée (via global.setup.ts)
 */

import { test, expect } from "@playwright/test"
import { test as authTest } from "./helpers/fixtures"

// ─── Header — non connecté ───────────────────────────────────────────────────

test.describe("Header — non connecté", () => {
  test("affiche le bouton 'Créer mon compte' (header-register-btn)", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByTestId("header-register-btn")).toBeVisible()
    await expect(page.getByTestId("header-register-btn")).toContainText("Créer mon compte")
  })

  test("header-register-btn pointe vers /register", async ({ page }) => {
    await page.goto("/")
    const href = await page.getByTestId("header-register-btn").getAttribute("href")
    expect(href).toBe("/register")
  })

  test("affiche le bouton 'Se connecter' (header-login-btn)", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByTestId("header-login-btn")).toBeVisible()
  })

  test("n'affiche pas de CTA 'Réserver une visite' dans le header", async ({ page }) => {
    await page.goto("/")
    const header = page.locator("header")
    await expect(header.getByText(/réserver une visite/i)).not.toBeVisible()
  })

  test("clic 'Se connecter' → /login", async ({ page }) => {
    await page.goto("/")
    await page.getByTestId("header-login-btn").click()
    await expect(page).toHaveURL("/login")
  })
})

// ─── Header — connecté ───────────────────────────────────────────────────────

authTest.describe("Header — connecté", () => {
  authTest("affiche 'Bonjour' et le prénom de l'utilisateur", async ({ membrePage }) => {
    await membrePage.goto("/")
    const userMenu = membrePage.getByTestId("header-user-menu")
    await expect(userMenu).toBeVisible()
    await expect(userMenu).toContainText("Bonjour")
  })

  authTest("affiche le lien 'Mon espace' (header-dashboard-link)", async ({ membrePage }) => {
    await membrePage.goto("/")
    await expect(membrePage.getByTestId("header-dashboard-link")).toBeVisible()
  })

  authTest("affiche le bouton 'Se déconnecter' (logout-btn)", async ({ membrePage }) => {
    await membrePage.goto("/")
    await expect(membrePage.getByTestId("logout-btn")).toBeVisible()
  })

  authTest("n'affiche pas de CTA réservation dans le header", async ({ membrePage }) => {
    await membrePage.goto("/")
    const header = membrePage.locator("header")
    await expect(header.getByText(/réserver une visite/i)).not.toBeVisible()
  })

  authTest("clic 'Mon espace' → /dashboard", async ({ membrePage }) => {
    await membrePage.goto("/")
    await membrePage.getByTestId("header-dashboard-link").click()
    await expect(membrePage).toHaveURL("/dashboard")
  })

  authTest("clic 'Se déconnecter' → déconnexion et redirection /", async ({ membrePage }) => {
    await membrePage.goto("/")
    await membrePage.getByTestId("logout-btn").click()
    await expect(membrePage).toHaveURL("/")
    // Vérifier que le header affiche maintenant le mode non connecté
    await expect(membrePage.getByTestId("header-login-btn")).toBeVisible()
  })
})

// ─── Hero — CTAs ─────────────────────────────────────────────────────────────

test.describe("Hero — CTAs (non connecté)", () => {
  test("affiche hero-cta-contact 'Venez tester gratuitement'", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByTestId("hero-cta-contact")).toBeVisible()
    await expect(page.getByTestId("hero-cta-contact")).toContainText("Venez tester gratuitement")
  })

  test("hero-cta-contact pointe vers #contact", async ({ page }) => {
    await page.goto("/")
    const href = await page.getByTestId("hero-cta-contact").getAttribute("href")
    expect(href).toBe("#contact")
  })

  test("affiche hero-cta-login 'Réserver en ligne'", async ({ page }) => {
    await page.goto("/")
    await expect(page.getByTestId("hero-cta-login")).toBeVisible()
    await expect(page.getByTestId("hero-cta-login")).toContainText("Réserver en ligne")
  })

  test("hero-cta-login pointe vers /login quand non connecté", async ({ page }) => {
    await page.goto("/")
    const href = await page.getByTestId("hero-cta-login").getAttribute("href")
    expect(href).toBe("/login")
  })
})

authTest.describe("Hero — CTAs (connecté)", () => {
  authTest("affiche uniquement hero-cta-login 'Réserver en ligne'", async ({ membrePage }) => {
    await membrePage.goto("/")
    await expect(membrePage.getByTestId("hero-cta-login")).toBeVisible()
    await expect(membrePage.getByTestId("hero-cta-login")).toContainText("Réserver en ligne")
  })

  authTest("hero-cta-login pointe vers /dashboard quand connecté", async ({ membrePage }) => {
    await membrePage.goto("/")
    const href = await membrePage.getByTestId("hero-cta-login").getAttribute("href")
    expect(href).toBe("/dashboard")
  })

  authTest("hero-cta-contact absent quand connecté", async ({ membrePage }) => {
    await membrePage.goto("/")
    await expect(membrePage.getByTestId("hero-cta-contact")).not.toBeAttached()
  })
})

// ─── Footer — Newsletter absente ─────────────────────────────────────────────

test.describe("Footer — Newsletter absente", () => {
  test("ne contient pas le texte 'Restez informé'", async ({ page }) => {
    await page.goto("/")
    const footer = page.locator("footer")
    await expect(footer.getByText(/restez informé/i)).not.toBeVisible()
  })

  test("ne contient pas de champ email (newsletter)", async ({ page }) => {
    await page.goto("/")
    const footer = page.locator("footer")
    await expect(footer.locator('input[type="email"]')).not.toBeVisible()
  })
})

// ─── ContactBlock — Newsletter présente ──────────────────────────────────────

test.describe("ContactBlock — Newsletter présente", () => {
  test("affiche le bloc newsletter (contact-newsletter)", async ({ page }) => {
    await page.goto("/")
    await page.evaluate(() => {
      document.getElementById("contact")?.scrollIntoView()
    })
    await expect(page.getByTestId("contact-newsletter")).toBeVisible()
  })

  test("le bloc newsletter contient un champ email", async ({ page }) => {
    await page.goto("/")
    const newsletterBlock = page.getByTestId("contact-newsletter")
    await expect(newsletterBlock.locator('input[type="email"]')).toBeVisible()
  })

  test("le footer et la section contact sont tous les deux visibles sur la page", async ({ page }) => {
    await page.goto("/")
    await expect(page.locator("footer")).toBeVisible()
    await expect(page.locator("#contact")).toBeVisible()
  })
})
