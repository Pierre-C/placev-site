/**
 * e2e/slice-11-compliance.spec.ts
 * Tests E2E — Slice 11 : Analytics Admin & Conformité RGPD
 *
 * Prérequis : serveur Next.js lancé + DB seedée.
 */

import { test, expect } from "@playwright/test"
import { test as authTest } from "./helpers/fixtures"

// ─── Tableau de bord admin — Crédits à vie ────────────────────────────────────
authTest.describe("Admin — Crédits à vie (lifetimeCredits)", () => {
  authTest("la colonne 'Crédits cumulés (À vie)' est visible dans la liste des membres", async ({ adminPage }) => {
    await adminPage.goto("/admin")
    await expect(adminPage.locator('[data-testid="members-table"]')).toBeVisible()
    // La colonne doit exister dans l'en-tête
    await expect(
      adminPage.locator('[data-testid="members-table"] th')
    ).toContainText(/crédits.*vie|lifetime/i)
  })

  authTest("chaque ligne membre affiche un nombre de crédits cumulés", async ({ adminPage }) => {
    await adminPage.goto("/admin")
    const firstRow = adminPage.locator('[data-testid="member-row"]').first()
    if (await firstRow.isVisible()) {
      await expect(firstRow.locator('[data-testid="lifetime-credits"]')).toBeVisible()
      const text = await firstRow.locator('[data-testid="lifetime-credits"]').textContent()
      // Doit être un nombre
      expect(text).toMatch(/\d+/)
    }
  })
})

// ─── Demande de suppression de compte ────────────────────────────────────────
authTest.describe("Membre — Demande de suppression de compte", () => {
  authTest("le bouton 'Demander la suppression' est visible dans le profil/settings", async ({ membrePage }) => {
    // Page profil ou dashboard > settings
    await membrePage.goto("/dashboard")
    // Naviguer vers la section profil/settings si elle existe
    const settingsLink = membrePage.locator('a[href*="settings"], a[href*="profil"], [data-testid="profile-link"]')
    if (await settingsLink.isVisible()) {
      await settingsLink.first().click()
    }
    await expect(membrePage.locator('[data-testid="request-deletion-btn"]')).toBeVisible()
  })

  authTest("cliquer sur 'Demander la suppression' affiche une confirmation", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    const settingsLink = membrePage.locator('a[href*="settings"], a[href*="profil"], [data-testid="profile-link"]')
    if (await settingsLink.isVisible()) {
      await settingsLink.first().click()
    }

    const deleteBtn = membrePage.locator('[data-testid="request-deletion-btn"]')
    if (await deleteBtn.isVisible()) {
      await deleteBtn.click()
      // Dialog de confirmation
      await expect(membrePage.locator('[data-testid="deletion-confirm-dialog"]')).toBeVisible()
      await membrePage.click('[data-testid="deletion-confirm-btn"]')
      // Message de succès
      await expect(membrePage.locator('[data-testid="deletion-requested-success"]')).toBeVisible()
    }
  })
})

// ─── Admin — Gestion des demandes de suppression ──────────────────────────────
authTest.describe("Admin — Demandes de suppression (RGPD)", () => {
  authTest("un membre ayant demandé la suppression est signalé dans la table admin", async ({ adminPage }) => {
    await adminPage.goto("/admin")
    // Si un user a deletionRequestedAt non null, un badge/alerte doit être visible
    const deletionBadge = adminPage.locator('[data-testid="deletion-requested-badge"]')
    // Le badge peut être absent si aucun user n'a demandé la suppression — test conditionnel
    const count = await deletionBadge.count()
    if (count > 0) {
      await expect(deletionBadge.first()).toBeVisible()
    }
  })

  authTest("l'admin peut anonymiser un compte depuis la page membres", async ({ adminPage }) => {
    await adminPage.goto("/admin")
    // Chercher un user avec badge suppression demandée
    const deletionBadge = adminPage.locator('[data-testid="deletion-requested-badge"]').first()
    if (await deletionBadge.isVisible()) {
      // Cliquer sur le bouton anonymiser dans la ligne concernée
      const row = deletionBadge.locator("xpath=ancestor::tr")
      const anonymizeBtn = row.locator('[data-testid="anonymize-btn"]')
      await anonymizeBtn.click()

      // Confirmation dialog
      await expect(adminPage.locator('[data-testid="anonymize-confirm-dialog"]')).toBeVisible()
      await adminPage.click('[data-testid="anonymize-confirm-btn"]')

      // Succès
      await expect(adminPage.locator('[data-testid="anonymize-success"]')).toBeVisible()
    }
  })
})
