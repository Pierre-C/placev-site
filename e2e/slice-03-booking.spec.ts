/**
 * e2e/slice-03-booking.spec.ts
 * Tests E2E — Slice 3 : Réservation de postes, annulation, calendrier
 */

import { test, expect, getDisplayedBalance, futureDateYMD } from "./helpers/fixtures"

const FUTURE_DATE = futureDateYMD(7) // dans 7 jours

// ─── Calendrier public ────────────────────────────────────────────────────────
test.describe("Calendrier public", () => {
  test("le calendrier est accessible sans connexion", async ({ page }) => {
    await page.goto("/booking")
    await expect(page.locator('[data-testid="booking-calendar"]')).toBeVisible()
  })

  test("affiche les créneaux disponibles et complets", async ({ page }) => {
    await page.goto("/booking")
    // Des tuiles AM/PM doivent être visibles
    await expect(page.locator('[data-testid="slot-tile"]').first()).toBeVisible()
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
})

// ─── Parcours de réservation complet ─────────────────────────────────────────
test.describe("Réservation d'un poste", () => {
  test("un membre peut réserver un créneau AM et son solde est débité", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    const balanceBefore = await getDisplayedBalance(membrePage)

    await membrePage.goto("/booking")
    await expect(membrePage.locator('[data-testid="booking-calendar"]')).toBeVisible()

    // Sélectionner un créneau AM dans le futur
    const slot = membrePage.locator(`[data-date="${FUTURE_DATE}"][data-slot="AM"]`)
    await slot.click()

    // Confirmer la réservation
    await expect(membrePage.locator('[data-testid="booking-summary"]')).toBeVisible()
    await membrePage.click('[data-testid="confirm-booking"]')

    // Vérifier la confirmation
    await expect(membrePage.locator('[data-testid="booking-success"]')).toBeVisible()

    // Vérifier que le solde a diminué de 1
    await membrePage.goto("/dashboard")
    const balanceAfter = await getDisplayedBalance(membrePage)
    expect(balanceAfter).toBe(balanceBefore - 1)
  })

  test("un membre peut réserver une journée complète (coût 2 crédits)", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    const balanceBefore = await getDisplayedBalance(membrePage)

    await membrePage.goto("/booking")
    const slot = membrePage.locator(`[data-date="${futureDateYMD(8)}"][data-slot="FULL"]`)
    await slot.click()
    await membrePage.click('[data-testid="confirm-booking"]')
    await expect(membrePage.locator('[data-testid="booking-success"]')).toBeVisible()

    await membrePage.goto("/dashboard")
    const balanceAfter = await getDisplayedBalance(membrePage)
    expect(balanceAfter).toBe(balanceBefore - 2)
  })

  test("la réservation apparaît dans le dashboard membre", async ({ membrePage }) => {
    // Réserver d'abord
    await membrePage.goto("/booking")
    await membrePage.locator(`[data-date="${futureDateYMD(9)}"][data-slot="PM"]`).click()
    await membrePage.click('[data-testid="confirm-booking"]')
    await expect(membrePage.locator('[data-testid="booking-success"]')).toBeVisible()

    // Vérifier dans le dashboard
    await membrePage.goto("/dashboard")
    await expect(membrePage.locator('[data-testid="upcoming-reservations"]')).toBeVisible()
    await expect(
      membrePage.locator('[data-testid="upcoming-reservations"]')
    ).toContainText(futureDateYMD(9))
  })

  test("un membre avec solde insuffisant ne peut pas réserver", async ({ pauvreMembrePage }) => {
    // pauvreMembrePage a credits=-2, ne peut pas prendre FULL (coûterait -4)
    await pauvreMembrePage.goto("/booking")
    const slot = pauvreMembrePage.locator(`[data-date="${FUTURE_DATE}"][data-slot="FULL"]`)
    await slot.click()
    await pauvreMembrePage.click('[data-testid="confirm-booking"]')

    await expect(pauvreMembrePage.locator('[data-testid="error-insufficient-balance"]')).toBeVisible()
    await expect(pauvreMembrePage.locator('[data-testid="link-buy-credits"]')).toBeVisible()
  })

  test("un créneau complet affiche 'Complet' et bloque la sélection", async ({ membrePage }) => {
    // Ce test nécessite un créneau réellement complet en DB (créé par le seeder ou un test précédent)
    // L'agent doit implémenter : si remaining = 0 → data-full="true" sur le slot tile
    await membrePage.goto("/booking")
    const fullSlots = membrePage.locator('[data-full="true"]')
    // Si aucun créneau complet en DB de test, ce test sera skippé
    const count = await fullSlots.count()
    if (count > 0) {
      await fullSlots.first().click()
      await expect(membrePage.locator('[data-testid="confirm-booking"]')).not.toBeVisible()
    }
  })
})

// ─── Annulation ───────────────────────────────────────────────────────────────
test.describe("Annulation de réservation", () => {
  test("un membre peut annuler une réservation et récupère ses crédits", async ({ membrePage }) => {
    // Étape 1 : Réserver
    await membrePage.goto("/booking")
    await membrePage.locator(`[data-date="${futureDateYMD(10)}"][data-slot="AM"]`).click()
    await membrePage.click('[data-testid="confirm-booking"]')
    await expect(membrePage.locator('[data-testid="booking-success"]')).toBeVisible()

    // Étape 2 : Noter le solde après réservation
    await membrePage.goto("/dashboard")
    const balanceAfterBooking = await getDisplayedBalance(membrePage)

    // Étape 3 : Annuler depuis le dashboard
    await membrePage.locator('[data-testid="cancel-booking-btn"]').first().click()
    await membrePage.locator('[data-testid="confirm-cancel"]').click()

    // Étape 4 : Vérifier le remboursement
    await expect(membrePage.locator('[data-testid="cancel-success"]')).toBeVisible()
    const balanceAfterCancel = await getDisplayedBalance(membrePage)
    expect(balanceAfterCancel).toBe(balanceAfterBooking + 1)
  })
})
