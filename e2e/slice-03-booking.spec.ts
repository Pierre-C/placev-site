/**
 * e2e/slice-03-booking.spec.ts
 * Tests E2E — Slice 3 : Réservation de postes, annulation, calendrier
 * Mis à jour Slice 9 : multi-sélection, AM/PM séparés (FULL retiré de l'UI),
 * pauvreMembrePage credits=0, sticky panel, email unique multi-booking.
 */

import { test, expect, getDisplayedBalance, futureOpenDateYMD } from "./helpers/fixtures"

const FUTURE_DATE = futureOpenDateYMD(1) // 1er Lun/Mar/Mer à partir de demain

// ─── Calendrier public ────────────────────────────────────────────────────────
test.describe("Calendrier public", () => {
  test("le calendrier est accessible sans connexion", async ({ page }) => {
    await page.goto("/booking")
    await expect(page.locator('[data-testid="booking-calendar"]')).toBeVisible()
  })

  test("affiche les zones AM et PM pour chaque jour ouvert", async ({ page }) => {
    await page.goto("/booking")
    // La nouvelle UI affiche des zones AM et PM (rectangulaires)
    await expect(page.locator('[data-testid="slot-am"]').first()).toBeVisible()
    await expect(page.locator('[data-testid="slot-pm"]').first()).toBeVisible()
  })

  test("les dates passées sont désactivées", async ({ page }) => {
    await page.goto("/booking")
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    const ymd = yesterday.toISOString().slice(0, 10)
    const pastSlot = page.locator(`[data-date="${ymd}"]`).first()
    if (await pastSlot.isVisible()) {
      await expect(pastSlot).toHaveAttribute("data-disabled", "true")
    }
  })

  test("le panneau récapitulatif est sticky (reste visible au scroll)", async ({ page }) => {
    await page.goto("/booking")
    const summary = page.locator('[data-testid="booking-summary"]')
    await expect(summary).toBeVisible()
    // Vérifier la présence de la classe sticky dans le style
    const classes = await summary.getAttribute("class")
    expect(classes).toMatch(/sticky/)
  })
})

// ─── Parcours de réservation multi-sélection ──────────────────────────────────
test.describe("Réservation d'un poste (multi-sélection)", () => {
  test("un membre peut sélectionner un créneau AM et son solde est débité", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    const balanceBefore = await getDisplayedBalance(membrePage)

    await membrePage.goto("/booking")
    await expect(membrePage.locator('[data-testid="booking-calendar"]')).toBeVisible()

    // Sélectionner la zone AM du futur créneau
    const slotAM = membrePage.locator(`[data-date="${FUTURE_DATE}"][data-testid="slot-am"]`)
    await slotAM.click()

    // Le récapitulatif doit être visible et afficher 1 créneau
    await expect(membrePage.locator('[data-testid="booking-summary"]')).toBeVisible()
    await expect(membrePage.locator('[data-testid="booking-summary"]')).toContainText("1")

    await membrePage.click('[data-testid="confirm-booking"]')

    // Vérifier la confirmation
    await expect(membrePage.locator('[data-testid="booking-success"]')).toBeVisible()

    // Vérifier que le solde a diminué de 1
    await membrePage.goto("/dashboard")
    const balanceAfter = await getDisplayedBalance(membrePage)
    expect(balanceAfter).toBe(balanceBefore - 1)
  })

  test("sélectionner AM + PM du même jour = 2 réservations séparées, coût 2 crédits", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    const balanceBefore = await getDisplayedBalance(membrePage)

    await membrePage.goto("/booking")
    const date2 = futureOpenDateYMD(2)

    // Cliquer AM
    await membrePage.locator(`[data-date="${date2}"][data-testid="slot-am"]`).click()
    // Cliquer PM du même jour
    await membrePage.locator(`[data-date="${date2}"][data-testid="slot-pm"]`).click()

    // Le récapitulatif doit afficher 2 créneaux
    await expect(membrePage.locator('[data-testid="booking-summary"]')).toContainText("2")

    await membrePage.click('[data-testid="confirm-booking"]')
    await expect(membrePage.locator('[data-testid="booking-success"]')).toBeVisible()

    await membrePage.goto("/dashboard")
    const balanceAfter = await getDisplayedBalance(membrePage)
    expect(balanceAfter).toBe(balanceBefore - 2)
  })

  test("la réservation apparaît dans le dashboard membre", async ({ membrePage }) => {
    await membrePage.goto("/booking")
    const date3 = futureOpenDateYMD(3)
    await membrePage.locator(`[data-date="${date3}"][data-testid="slot-pm"]`).click()
    await membrePage.click('[data-testid="confirm-booking"]')
    await expect(membrePage.locator('[data-testid="booking-success"]')).toBeVisible()

    await membrePage.goto("/dashboard")
    await expect(membrePage.locator('[data-testid="upcoming-reservations"]')).toBeVisible()
    await expect(
      membrePage.locator('[data-testid="upcoming-reservations"]')
    ).toContainText(date3)
  })

  test("un membre avec solde=0 ne peut pas sélectionner de créneau (bloqué client)", async ({ pauvreMembrePage }) => {
    // pauvreMembrePage a credits=0 (Slice 8) → toutes les zones disponibles sont désactivées
    await pauvreMembrePage.goto("/booking")

    // Les zones AM/PM disponibles doivent être désactivées (data-disabled="true")
    const slotAM = pauvreMembrePage.locator(`[data-date="${FUTURE_DATE}"][data-testid="slot-am"]`)
    if (await slotAM.isVisible()) {
      await expect(slotAM).toHaveAttribute("data-disabled", "true")
    }
  })

  test("tentative de réservation avec solde insuffisant affiche l'erreur côté serveur", async ({ pauvreMembrePage }) => {
    // Si la UI ne bloque pas le clic (cas de test défensif), l'API renvoie 403
    await pauvreMembrePage.goto("/booking")
    const slotAM = pauvreMembrePage.locator(`[data-date="${FUTURE_DATE}"][data-testid="slot-am"]`)
    if (await slotAM.isVisible()) {
      const isDisabled = await slotAM.getAttribute("data-disabled")
      if (isDisabled !== "true") {
        await slotAM.click()
        await pauvreMembrePage.click('[data-testid="confirm-booking"]')
        await expect(pauvreMembrePage.locator('[data-testid="error-insufficient-balance"]')).toBeVisible()
        await expect(pauvreMembrePage.locator('[data-testid="link-buy-credits"]')).toBeVisible()
      }
    }
  })

  test("un créneau complet affiche 'Complet' et bloque la sélection", async ({ membrePage }) => {
    await membrePage.goto("/booking")
    const fullSlots = membrePage.locator('[data-full="true"]')
    const count = await fullSlots.count()
    if (count > 0) {
      await fullSlots.first().click()
      await expect(membrePage.locator('[data-testid="confirm-booking"]')).not.toBeVisible()
    }
  })

  test("re-cliquer sur un créneau sélectionné le retire du panier", async ({ membrePage }) => {
    await membrePage.goto("/booking")
    const slotAM = membrePage.locator(`[data-date="${FUTURE_DATE}"][data-testid="slot-am"]`)
    // Premier clic : ajoute
    await slotAM.click()
    await expect(membrePage.locator('[data-testid="booking-summary"]')).toContainText("1")
    // Deuxième clic : retire
    await slotAM.click()
    // Le panier doit être vide (ou afficher 0)
    const summaryText = await membrePage.locator('[data-testid="booking-summary"]').textContent()
    expect(summaryText).not.toContain("1 créneau")
  })
})

// ─── Annulation ───────────────────────────────────────────────────────────────
test.describe("Annulation de réservation", () => {
  test("un membre peut annuler une réservation et récupère ses crédits", async ({ membrePage }) => {
    const date3 = futureOpenDateYMD(3)

    // Étape 1 : Réserver un créneau AM
    await membrePage.goto("/booking")
    await membrePage.locator(`[data-date="${date3}"][data-testid="slot-am"]`).click()
    await membrePage.click('[data-testid="confirm-booking"]')
    await expect(membrePage.locator('[data-testid="booking-success"]')).toBeVisible()

    // Étape 2 : Noter le solde après réservation
    await membrePage.goto("/dashboard")
    const balanceAfterBooking = await getDisplayedBalance(membrePage)

    // Étape 3 : Annuler depuis le calendrier — cliquer sur le créneau réservé ouvre le panneau d'annulation
    await membrePage.goto("/booking")
    await membrePage.locator(`[data-date="${date3}"][data-testid="slot-am"]`).click()
    await membrePage.locator('[data-testid="confirm-cancel"]').click()

    // Étape 4 : Vérifier le remboursement
    await expect(membrePage.locator('[data-testid="cancel-success"]')).toBeVisible()
    await membrePage.goto("/dashboard")
    const balanceAfterCancel = await getDisplayedBalance(membrePage)
    expect(balanceAfterCancel).toBe(balanceAfterBooking + 1)
  })
})
