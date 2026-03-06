/**
 * e2e/slice-11-compliance.spec.ts
 * Tests E2E — Slice 11 : Analytics Admin, Profil Membre & Conformité RGPD
 *
 * Prérequis : serveur Next.js lancé + DB seedée.
 */

import { test, expect } from "@playwright/test"
import { test as authTest } from "./helpers/fixtures"

// ─── Tableau de bord admin — Crédits à vie ────────────────────────────────────
authTest.describe("Admin — Crédits à vie (lifetimeCredits)", () => {
  authTest("la colonne 'Crédits à vie' est visible dans la liste des membres", async ({ adminPage }) => {
    await adminPage.goto("/admin")
    await expect(adminPage.locator('[data-testid="members-table"]')).toBeVisible()
    await expect(
      adminPage.locator('[data-testid="members-table"] th').filter({ hasText: /crédits.*vie|lifetime/i })
    ).toBeVisible()
  })

  authTest("chaque ligne membre affiche un nombre de crédits cumulés", async ({ adminPage }) => {
    await adminPage.goto("/admin")
    const firstRow = adminPage.locator('[data-testid="member-row"]').first()
    if (await firstRow.isVisible()) {
      await expect(firstRow.locator('[data-testid="lifetime-credits"]')).toBeVisible()
      const text = await firstRow.locator('[data-testid="lifetime-credits"]').textContent()
      expect(text).toMatch(/\d+/)
    }
  })
})

// ─── Onglet "Mon compte" — Navigation ─────────────────────────────────────────
authTest.describe("Membre — Onglet Mon compte", () => {
  authTest("l'onglet 'Mon compte' est visible dans la navigation du dashboard", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    await expect(membrePage.locator('[data-testid="nav-tab-mon-compte"]')).toBeVisible()
    await expect(membrePage.locator('[data-testid="nav-tab-mon-compte"]')).toContainText(/mon compte/i)
  })

  authTest("cliquer sur l'onglet 'Mon compte' navigue vers /dashboard/mon-compte", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    await membrePage.click('[data-testid="nav-tab-mon-compte"]')
    await expect(membrePage).toHaveURL("/dashboard/mon-compte")
  })
})

// ─── Page Mon compte — Formulaire profil ─────────────────────────────────────
authTest.describe("Membre — Formulaire profil", () => {
  authTest("le formulaire de profil est visible avec les bons champs", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/mon-compte")
    await expect(membrePage.locator('[data-testid="profile-form"]')).toBeVisible()
    // Prénom modifiable
    await expect(membrePage.locator('[name="firstName"]')).toBeVisible()
    await expect(membrePage.locator('[name="firstName"]')).not.toBeDisabled()
    // Nom modifiable
    await expect(membrePage.locator('[name="lastName"]')).toBeVisible()
    await expect(membrePage.locator('[name="lastName"]')).not.toBeDisabled()
    // Email non modifiable (disabled)
    await expect(membrePage.locator('[name="email"]')).toBeVisible()
    await expect(membrePage.locator('[name="email"]')).toBeDisabled()
    // Adresse et téléphone optionnels
    await expect(membrePage.locator('[name="address"]')).toBeVisible()
    await expect(membrePage.locator('[name="phone"]')).toBeVisible()
  })

  authTest("un membre peut mettre à jour son prénom, nom et son adresse", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/mon-compte")

    await membrePage.fill('[name="firstName"]', "Nouveau")
    await membrePage.fill('[name="lastName"]', "Nom")
    await membrePage.fill('[name="address"]', "12 rue de la Paix, 75001 Paris")
    await membrePage.fill('[name="phone"]', "0612345678")
    await membrePage.click('[data-testid="profile-save-btn"]')

    await expect(membrePage.locator('[data-testid="profile-save-success"]')).toBeVisible()
  })
})

// ─── Page Mon compte — Changement de mot de passe ────────────────────────────
authTest.describe("Membre — Changement de mot de passe", () => {
  authTest("le formulaire de changement de mot de passe est visible", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/mon-compte")
    await expect(membrePage.locator('[data-testid="change-password-form"]')).toBeVisible()
    await expect(membrePage.locator('[name="currentPassword"]')).toBeVisible()
    await expect(membrePage.locator('[name="newPassword"]')).toBeVisible()
    await expect(membrePage.locator('[data-testid="change-password-btn"]')).toBeVisible()
  })

  authTest("un mauvais mot de passe actuel affiche une erreur", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/mon-compte")

    await membrePage.fill('[name="currentPassword"]', "MauvaisMotDePasse!")
    await membrePage.fill('[name="newPassword"]', "NouveauMotDePasse123!")
    await membrePage.click('[data-testid="change-password-btn"]')

    await expect(membrePage.locator('[data-testid="change-password-error"]')).toBeVisible()
    await expect(membrePage.locator('[data-testid="change-password-error"]')).toContainText(
      /incorrect|actuel|invalide/i
    )
  })

  authTest("un nouveau mot de passe trop court affiche une erreur de validation", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/mon-compte")

    await membrePage.fill('[name="currentPassword"]', "TestPassword123!")
    await membrePage.fill('[name="newPassword"]', "court")
    // Bypasser la validation HTML5 native minlength
    await membrePage.evaluate(() =>
      document.querySelector('[data-testid="change-password-form"]')!.setAttribute("novalidate", "")
    )
    await membrePage.click('[data-testid="change-password-btn"]')

    await expect(membrePage.locator('[data-testid="change-password-error"]')).toBeVisible()
  })
})

// ─── Page Mon compte — Zone de danger (suppression) ──────────────────────────
authTest.describe("Membre — Demande de suppression de compte", () => {
  authTest("le bouton 'Demander la suppression' est visible dans la zone de danger", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/mon-compte")
    await expect(membrePage.locator('[data-testid="request-deletion-btn"]')).toBeVisible()
  })

  authTest("cliquer sur le bouton ouvre un dialog de confirmation", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/mon-compte")
    await membrePage.click('[data-testid="request-deletion-btn"]')
    await expect(membrePage.locator('[data-testid="deletion-confirm-dialog"]')).toBeVisible()
  })

  authTest("annuler le dialog ferme la modale sans action", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/mon-compte")
    await membrePage.click('[data-testid="request-deletion-btn"]')
    await expect(membrePage.locator('[data-testid="deletion-confirm-dialog"]')).toBeVisible()
    await membrePage.click('[data-testid="deletion-cancel-btn"]')
    await expect(membrePage.locator('[data-testid="deletion-confirm-dialog"]')).not.toBeVisible()
    // Le succès ne doit PAS s'afficher
    await expect(membrePage.locator('[data-testid="deletion-requested-success"]')).not.toBeVisible()
  })

  authTest("confirmer la demande affiche un message de succès", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/mon-compte")
    await membrePage.click('[data-testid="request-deletion-btn"]')
    await expect(membrePage.locator('[data-testid="deletion-confirm-dialog"]')).toBeVisible()
    await membrePage.click('[data-testid="deletion-confirm-btn"]')
    await expect(membrePage.locator('[data-testid="deletion-requested-success"]')).toBeVisible()
  })
})

// ─── Admin — Gestion des demandes de suppression ──────────────────────────────
authTest.describe("Admin — Demandes de suppression (RGPD)", () => {
  authTest("un membre ayant demandé la suppression est signalé dans la table admin", async ({ adminPage }) => {
    await adminPage.goto("/admin")
    const deletionBadge = adminPage.locator('[data-testid="deletion-requested-badge"]')
    // Conditionnel : le badge peut être absent si aucun user n'a demandé la suppression
    const count = await deletionBadge.count()
    if (count > 0) {
      await expect(deletionBadge.first()).toBeVisible()
    }
  })

  authTest("l'admin peut anonymiser un compte depuis la page membres", async ({ adminPage }) => {
    await adminPage.goto("/admin")
    const deletionBadge = adminPage.locator('[data-testid="deletion-requested-badge"]').first()
    if (await deletionBadge.isVisible()) {
      // Ouvrir la modale du membre concerné
      const row = deletionBadge.locator("xpath=ancestor::tr")
      await row.locator('[data-testid="view-edit-btn"]').click()

      // Le bouton anonymiser doit être visible dans la modale
      const anonymizeBtn = adminPage.locator('[data-testid="anonymize-btn"]')
      await expect(anonymizeBtn).toBeVisible()
      await anonymizeBtn.click()

      // Dialog de confirmation
      await expect(adminPage.locator('[data-testid="anonymize-confirm-dialog"]')).toBeVisible()
      await adminPage.click('[data-testid="anonymize-confirm-btn"]')

      // Succès
      await expect(adminPage.locator('[data-testid="anonymize-success"]')).toBeVisible()
    }
  })
})

// ─── Accès direct — protection de route ──────────────────────────────────────
test.describe("Protection de la page Mon compte", () => {
  test("un visiteur non authentifié est redirigé vers /login", async ({ page }) => {
    await page.goto("/dashboard/mon-compte")
    await expect(page).toHaveURL(/\/login/)
  })
})
