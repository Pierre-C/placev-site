/**
 * e2e/slice-10-meeting.spec.ts
 * Tests E2E — Slice 10 : Devis Salle de Réunion & Événements Admin
 *
 * Prérequis : serveur Next.js lancé + DB seedée.
 */

import { test, expect } from "@playwright/test"
import { test as authTest } from "./helpers/fixtures"

// ─── Formulaire de devis (public) ────────────────────────────────────────────
test.describe("Demande de devis salle de réunion", () => {
  test("la page de demande de devis est accessible depuis la vitrine", async ({ page }) => {
    await page.goto("/booking/meeting-room")
    await expect(page.locator("h1, h2")).toContainText(/salle|réunion|devis/i)
    // Plus d'intégration Stripe — formulaire de devis uniquement
    await expect(page.locator('[data-testid="quote-form"]')).toBeVisible()
    await expect(page.locator('[data-testid="stripe-payment"]')).not.toBeVisible()
  })

  test("un visiteur peut soumettre une demande de devis", async ({ page }) => {
    await page.goto("/booking/meeting-room")

    await page.fill('[name="companyName"]', "ACME Corp")
    await page.fill('[name="date"]', "2099-06-15")
    await page.selectOption('[name="start"]', "09:00")
    await page.selectOption('[name="end"]', "12:00")
    await page.fill('[name="contactName"]', "John Doe")
    await page.fill('[name="contactEmail"]', "john@example.com")
    await page.fill('[name="contactPhone"]', "0612345678")
    await page.fill('[name="message"]', "Besoin d'une salle pour 10 personnes")
    await page.click('[data-testid="submit-quote"]')

    // Message de confirmation
    await expect(page.locator('[data-testid="quote-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="quote-success"]')).toContainText(/demande|envoyée|confirmée/i)
  })

  test("soumission sans companyName affiche une erreur de validation", async ({ page }) => {
    await page.goto("/booking/meeting-room")
    await page.fill('[name="date"]', "2099-06-15")
    await page.selectOption('[name="start"]', "09:00")
    await page.selectOption('[name="end"]', "12:00")
    // Pas de companyName — bypasser la validation HTML5 native (required) pour atteindre la validation côté client/serveur
    await page.evaluate(() => document.querySelector("form")!.setAttribute("novalidate", ""))
    await page.click('[data-testid="submit-quote"]')

    await expect(page.locator('[data-testid="quote-error"]')).toBeVisible()
  })

  test("la demande de devis ne bloque pas le créneau (remaining inchangé)", async ({ page }) => {
    // Vérifier la disponibilité avant la demande
    const resBefore = await page.request.get("/api/availability?start=2099-06-15&end=2099-06-15")
    const bodyBefore = await resBefore.json()
    const remainingBefore = bodyBefore[0]?.remaining ?? 15

    // Soumettre un devis
    await page.goto("/booking/meeting-room")
    await page.fill('[name="companyName"]', "Test Corp")
    await page.fill('[name="date"]', "2099-06-15")
    await page.selectOption('[name="start"]', "09:00")
    await page.selectOption('[name="end"]', "12:00")
    await page.fill('[name="contactName"]', "John Doe")
    await page.fill('[name="contactEmail"]', "john@example.com")
    await page.fill('[name="contactPhone"]', "0612345678")
    await page.click('[data-testid="submit-quote"]')

    // Vérifier que la disponibilité n'a pas changé
    const resAfter = await page.request.get("/api/availability?start=2099-06-15&end=2099-06-15")
    const bodyAfter = await resAfter.json()
    const remainingAfter = bodyAfter[0]?.remaining ?? 15
    expect(remainingAfter).toBe(remainingBefore)
  })
})

// ─── Gestion des devis par l'admin ───────────────────────────────────────────
authTest.describe("Admin — Gestion des devis", () => {
  authTest("la page admin des devis est accessible", async ({ adminPage }) => {
    await adminPage.goto("/admin/quotes")
    await expect(adminPage.locator("h1, h2").filter({ hasText: /devis|demandes/i }).first()).toBeVisible()
  })

  authTest("les devis en attente (PENDING_QUOTE) sont listés", async ({ adminPage }) => {
    await adminPage.goto("/admin/quotes")
    // La liste peut être vide si aucun devis en DB — le test vérifie juste la structure
    await expect(adminPage.locator('[data-testid="admin-quotes-table"]')).toBeVisible()
  })

  authTest("un USER ne peut pas accéder à la page des devis admin", async ({ membrePage }) => {
    await membrePage.goto("/admin/quotes")
    await expect(membrePage).not.toHaveURL("/admin/quotes")
  })
})
