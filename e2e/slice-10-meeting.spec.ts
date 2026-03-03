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
    await page.fill('[name="start"]', "09:00")
    await page.fill('[name="end"]', "12:00")
    await page.fill('[name="message"]', "Besoin d'une salle pour 10 personnes")
    await page.click('[data-testid="submit-quote"]')

    // Message de confirmation
    await expect(page.locator('[data-testid="quote-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="quote-success"]')).toContainText(/demande|envoyée|confirmée/i)
  })

  test("soumission sans companyName affiche une erreur de validation", async ({ page }) => {
    await page.goto("/booking/meeting-room")
    await page.fill('[name="date"]', "2099-06-15")
    await page.fill('[name="start"]', "09:00")
    await page.fill('[name="end"]', "12:00")
    // Pas de companyName
    await page.click('[data-testid="submit-quote"]')

    await expect(page.locator('[data-testid="error-message"]')).toBeVisible()
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
    await page.fill('[name="start"]', "09:00")
    await page.fill('[name="end"]', "12:00")
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
    await expect(adminPage.locator("h1, h2")).toContainText(/devis|demandes/i)
  })

  authTest("les devis en attente (PENDING_QUOTE) sont listés", async ({ adminPage }) => {
    await adminPage.goto("/admin/quotes")
    // La liste peut être vide si aucun devis en DB — le test vérifie juste la structure
    await expect(adminPage.locator('[data-testid="quotes-list"]')).toBeVisible()
  })

  authTest("un USER ne peut pas accéder à la page des devis admin", async ({ membrePage }) => {
    await membrePage.goto("/admin/quotes")
    await expect(membrePage).not.toHaveURL("/admin/quotes")
  })
})

// ─── Événements Admin (bloquer des places) ────────────────────────────────────
authTest.describe("Admin — Créer un événement (bloquer des places)", () => {
  authTest("l'admin peut bloquer N places pour un événement", async ({ adminPage }) => {
    await adminPage.goto("/admin/calendar")

    // Accéder au formulaire de création d'événement
    await adminPage.click('[data-testid="create-event-btn"]')
    await expect(adminPage.locator('[data-testid="event-form"]')).toBeVisible()

    await adminPage.fill('[name="date"]', "2099-06-20")
    await adminPage.selectOption('[name="slot"]', "AM")
    await adminPage.fill('[name="label"]', "Conférence annuelle")
    await adminPage.fill('[name="seatsBlocked"]', "5")
    await adminPage.click('[data-testid="submit-event"]')

    await expect(adminPage.locator('[data-testid="event-success"]')).toBeVisible()
  })
})
