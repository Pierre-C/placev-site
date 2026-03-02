/**
 * e2e/slice-05-admin.spec.ts
 * Tests E2E — Slice 5 : Administration
 */

import { test, expect, futureDateYMD } from "./helpers/fixtures"

// ─── Gestion des membres ──────────────────────────────────────────────────────
test.describe("Dashboard admin — Membres", () => {
  test("l'admin voit la liste des membres", async ({ adminPage }) => {
    await adminPage.goto("/admin")
    await expect(adminPage.locator('[data-testid="members-table"]')).toBeVisible()   
    // Au moins les utilisateurs seedés doivent apparaître
    await expect(adminPage.locator('[data-testid="member-row"]').first()).toBeVisible()
  })

  test("les membres non-adhérents avec > 3 résas apparaissent en rouge", async ({ adminPage }) => {
    await adminPage.goto("/admin")
    // Ce test nécessite que le seeder ait créé un tel utilisateur
    const alertRow = adminPage.locator('[data-testid="member-row"][data-alert="true"]')
    const count = await alertRow.count()
    if (count > 0) {
      await expect(alertRow.first()).toHaveCSS("color", /red|rgb\(220/)
    }
  })

  test("l'admin peut modifier le solde de crédits d'un membre", async ({ adminPage }) => {
    await adminPage.goto("/admin")

    // Ouvrir la modale d'ajustement du premier membre
    await adminPage.locator('[data-testid="member-row"]').first()
      .locator('[data-testid="view-edit-btn"]').click()

    await expect(adminPage.locator('[data-testid="member-detail-modal"]')).toBeVisible()

    // Ajouter 5 crédits avec une description
    await adminPage.fill('[data-testid="credits-delta"]', "5")
    await adminPage.fill('[data-testid="credits-reason"]', "Correction manuelle test E2E")
    await adminPage.click('[data-testid="save-credits"]')

    await expect(adminPage.locator('[data-testid="member-detail-modal"]')).not.toBeVisible()
    await expect(adminPage.locator('[data-testid="success-toast"]')).toBeVisible()   
  })

  test("l'admin peut changer le statut adhérent d'un membre", async ({ adminPage }) => {
    await adminPage.goto("/admin")

    const firstRow = adminPage.locator('[data-testid="member-row"]').first()
    const badge = firstRow.locator('[data-testid="member-is-member-badge"]')
    const initialState = await badge.getAttribute("data-value")

    // Ouvrir le modal
    await firstRow.locator('[data-testid="view-edit-btn"]').click()
    const modal = adminPage.locator('[data-testid="member-detail-modal"]')
    await expect(modal).toBeVisible()

    // Cliquer sur le toggle
    await modal.locator('[data-testid="member-toggle"]').click()
    await modal.locator('[data-testid="save-credits"]').click()

    // Attendre la disparition du modal
    await expect(modal).not.toBeVisible()

    // L'état doit avoir changé
    await expect(badge).toHaveAttribute("data-value", initialState === "true" ? "false" : "true")
  })
})

// ─── Réservation proxy ────────────────────────────────────────────────────────
test.describe("Réservation proxy", () => {
  test("l'admin peut réserver pour le compte d'un membre", async ({ adminPage }) => {
    await adminPage.goto("/admin/bookings/proxy")

    // Sélectionner l'utilisateur cible
    await adminPage.fill('[data-testid="proxy-user-search"]', "externe@test.fr")     
    await adminPage.locator('[data-testid="proxy-user-option"]').first().click()     

    // Sélectionner la date et le créneau
    await adminPage.fill('[data-testid="proxy-date"]', futureDateYMD(14))
    await adminPage.click('[data-value="AM"]')
    await adminPage.click('[data-testid="confirm-proxy"]')

    await expect(adminPage.locator('[data-testid="proxy-success"]')).toBeVisible()   
  })
})

// ─── Fermeture de date ────────────────────────────────────────────────────────
test.describe("Fermeture de date", () => {
  test("l'admin peut fermer une date et voit le nombre de réservations impactées", async ({ adminPage }) => {
    await adminPage.goto("/admin/settings")

    await adminPage.click('[data-testid="manage-closed-dates-btn"]')
    await expect(adminPage.locator('[data-testid="closed-dates-modal"]')).toBeVisible()

    await adminPage.fill('[data-testid="close-date-input"]', futureDateYMD(30))      
    await adminPage.fill('[data-testid="close-date-reason"]', "Fermeture test E2E")  

    // Vérifier la preview avant confirmation
    await adminPage.click('[data-testid="preview-closure"]')
    await expect(adminPage.locator('[data-testid="closure-preview"]')).toBeVisible() 

    // Confirmer
    await adminPage.click('[data-testid="confirm-closure"]')
    await expect(adminPage.locator('[data-testid="closure-success"]')).toBeVisible() 
  })
})

// ─── Paramétrage global ───────────────────────────────────────────────────────
test.describe("Paramétrage global", () => {
  test("l'admin peut modifier la capacité de l'open-space", async ({ adminPage }) => {
    await adminPage.goto("/admin/settings")

    await adminPage.fill('[data-testid="setting-DESK_CAPACITY"]', "12")
    await adminPage.click('[data-testid="save-settings"]')

    await expect(adminPage.locator('[data-testid="settings-saved-toast"]')).toBeVisible()

    // Remettre à 15 pour ne pas casser les autres tests
    await adminPage.fill('[data-testid="setting-DESK_CAPACITY"]', "15")
    await adminPage.click('[data-testid="save-settings"]')
  })
})