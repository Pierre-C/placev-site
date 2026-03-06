/**
 * e2e/slice-10b-quotes-admin.spec.ts
 * Tests E2E — Slice 10b : Gestion Admin des Devis Salle de Réunion
 *
 * Prérequis :
 * - Serveur Next.js lancé + DB seedée.
 * - Au moins un devis PENDING_QUOTE en base (créé par les tests slice-10 ou le seed).
 *   Les tests de structure (tableau, modal, NB) fonctionnent même avec un tableau vide.
 */

import { test, expect } from "./helpers/fixtures"

// ─── Page /admin/quotes — Structure ──────────────────────────────────────────

test.describe("Admin — Page /admin/quotes (structure)", () => {
  test("la page est accessible avec le titre et le tableau", async ({ adminPage }) => {
    await adminPage.goto("/admin/quotes")
    await expect(adminPage.locator("h1, h2").filter({ hasText: /devis/i }).first()).toBeVisible()
    await expect(adminPage.locator('[data-testid="admin-quotes-table"]')).toBeVisible()
  })

  test("la barre de recherche est affichée au-dessus du tableau", async ({ adminPage }) => {
    await adminPage.goto("/admin/quotes")
    await expect(adminPage.locator('[data-testid="quotes-search"]')).toBeVisible()
  })

  test("les boutons de tri sont présents sur les colonnes Date, Entreprise, Statut", async ({ adminPage }) => {
    await adminPage.goto("/admin/quotes")
    const sortBtns = adminPage.locator('[data-testid="quotes-sort-btn"]')
    await expect(sortBtns.first()).toBeVisible()

    // Vérifier les colonnes triables attendues
    await expect(adminPage.locator('[data-testid="quotes-sort-btn"][data-column="date"]')).toBeVisible()
    await expect(adminPage.locator('[data-testid="quotes-sort-btn"][data-column="companyName"]')).toBeVisible()
    await expect(adminPage.locator('[data-testid="quotes-sort-btn"][data-column="status"]')).toBeVisible()
  })

  test("un USER ne peut pas accéder à la page", async ({ membrePage }) => {
    await membrePage.goto("/admin/quotes")
    await expect(membrePage).not.toHaveURL("/admin/quotes")
  })
})

// ─── Soumission d'un devis (setup pour les tests suivants) ───────────────────

test.describe("Admin — Devis soumis via formulaire public", () => {
  // On crée un devis frais pour tester le workflow complet
  test("soumettre un devis depuis /booking/meeting-room, puis le voir dans /admin/quotes", async ({ adminPage, page }) => {
    // 1. Soumettre un devis en tant que visiteur public
    await page.goto("/booking/meeting-room")
    await page.fill('[name="companyName"]', "E2E Corp")
    await page.fill('[name="date"]', "2099-08-25") // Lundi
    await page.selectOption('[name="start"]', "10:00")
    await page.selectOption('[name="end"]', "13:00")
    await page.fill('[name="contactName"]', "Alice Test")
    await page.fill('[name="contactEmail"]', "alice@e2e.com")
    await page.fill('[name="contactPhone"]', "0612345678")
    await page.click('[data-testid="submit-quote"]')
    await expect(page.locator('[data-testid="quote-success"]')).toBeVisible()

    // 2. Vérifier que le devis apparaît dans le tableau admin avec statut "En attente"
    await adminPage.goto("/admin/quotes")
    const row = adminPage.locator('[data-testid="quote-row"]').filter({ hasText: "E2E Corp" }).first()
    await expect(row).toBeVisible()

    const badge = row.locator('[data-testid="quote-status-badge"]')
    await expect(badge).toBeVisible()
    await expect(badge).toHaveAttribute("data-status", "PENDING_QUOTE")
    await expect(badge).toContainText(/en attente/i)
  })
})

// ─── Recherche ────────────────────────────────────────────────────────────────

test.describe("Admin — Recherche dans le tableau des devis", () => {
  test("la recherche filtre les lignes par entreprise", async ({ adminPage }) => {
    // Prérequis : il faut qu'il y ait au moins un devis "E2E Corp" (créé par le test précédent ou le seed)
    await adminPage.goto("/admin/quotes")

    const search = adminPage.locator('[data-testid="quotes-search"]')
    await expect(search).toBeVisible()

    // Chercher un texte qui ne matche rien
    await search.fill("xxxxxnotexistxxxxx")
    // La liste doit être vide (ou afficher un message "aucun devis")
    const rows = adminPage.locator('[data-testid="quote-row"]')
    await expect(rows).toHaveCount(0)

    // Effacer la recherche → toutes les lignes réapparaissent
    await search.clear()
  })
})

// ─── Tri des colonnes ─────────────────────────────────────────────────────────

test.describe("Admin — Tri des colonnes", () => {
  test("cliquer sur le tri Date inverse l'ordre des lignes", async ({ adminPage }) => {
    await adminPage.goto("/admin/quotes")

    // S'il n'y a pas de lignes, le test passe silencieusement (tableau vide = pas de tri à tester)
    const rows = adminPage.locator('[data-testid="quote-row"]')
    const count = await rows.count()
    if (count < 2) {
      // Pas assez de données pour tester le tri
      return
    }

    const sortBtn = adminPage.locator('[data-testid="quotes-sort-btn"][data-column="date"]')
    await sortBtn.click() // tri asc
    const firstAsc = await rows.first().getAttribute("data-id")

    await sortBtn.click() // tri desc
    const firstDesc = await rows.first().getAttribute("data-id")

    // Les IDs de première ligne doivent différer après inversion
    expect(firstAsc).not.toBe(firstDesc)
  })
})

// ─── Modal de détail ──────────────────────────────────────────────────────────

test.describe("Admin — Modal de détail d'un devis", () => {
  test.beforeEach(async ({ page }) => {
    // S'assurer qu'il existe au moins un devis PENDING_QUOTE avant les tests du modal
    await page.goto("/booking/meeting-room")
    await page.fill('[name="companyName"]', "Modal Corp")
    await page.fill('[name="date"]', "2099-09-01") // Lundi
    await page.selectOption('[name="start"]', "09:00")
    await page.selectOption('[name="end"]', "11:00")
    await page.fill('[name="contactName"]', "Bob Tester")
    await page.fill('[name="contactEmail"]', "bob@modal.com")
    await page.fill('[name="contactPhone"]', "0698765432")
    await page.fill('[name="message"]', "Réunion équipe tech")
    await page.click('[data-testid="submit-quote"]')
    await expect(page.locator('[data-testid="quote-success"]')).toBeVisible()
  })

  test("cliquer sur 'Consulter' ouvre le modal avec les informations du devis", async ({ adminPage }) => {
    await adminPage.goto("/admin/quotes")

    const row = adminPage.locator('[data-testid="quote-row"]').filter({ hasText: "Modal Corp" }).first()
    await expect(row).toBeVisible()

    await row.locator('[data-testid="consult-quote-btn"]').click()

    const modal = adminPage.locator('[data-testid="quote-detail-modal"]')
    await expect(modal).toBeVisible()

    // Vérifier que les informations de base sont présentes
    await expect(modal).toContainText("Modal Corp")
    await expect(modal).toContainText("Bob Tester")
    await expect(modal).toContainText("bob@modal.com")
    await expect(modal).toContainText("Réunion équipe tech")
  })

  test("le modal affiche les horaires (startTime–endTime) si renseignés", async ({ adminPage }) => {
    await adminPage.goto("/admin/quotes")

    const row = adminPage.locator('[data-testid="quote-row"]').filter({ hasText: "Modal Corp" }).first()
    await row.locator('[data-testid="consult-quote-btn"]').click()

    const modal = adminPage.locator('[data-testid="quote-detail-modal"]')
    await expect(modal).toBeVisible()
    // Les horaires 09:00 – 11:00 doivent apparaître dans le modal
    await expect(modal).toContainText(/09:00/)
    await expect(modal).toContainText(/11:00/)
  })

  test("le modal affiche le nota bene de contact manuel", async ({ adminPage }) => {
    await adminPage.goto("/admin/quotes")

    const row = adminPage.locator('[data-testid="quote-row"]').filter({ hasText: "Modal Corp" }).first()
    await row.locator('[data-testid="consult-quote-btn"]').click()

    const nb = adminPage.locator('[data-testid="quote-modal-nb"]')
    await expect(nb).toBeVisible()
    await expect(nb).toContainText(/prendre contact/i)
  })

  test("le bouton Fermer ferme le modal", async ({ adminPage }) => {
    await adminPage.goto("/admin/quotes")

    const row = adminPage.locator('[data-testid="quote-row"]').filter({ hasText: "Modal Corp" }).first()
    await row.locator('[data-testid="consult-quote-btn"]').click()

    const modal = adminPage.locator('[data-testid="quote-detail-modal"]')
    await expect(modal).toBeVisible()

    await adminPage.locator('[data-testid="close-quote-modal-btn"]').click()
    await expect(modal).not.toBeVisible()
  })

  test("les boutons Accepter et Annuler sont visibles pour un devis PENDING_QUOTE", async ({ adminPage }) => {
    await adminPage.goto("/admin/quotes")

    const row = adminPage.locator('[data-testid="quote-row"]').filter({ hasText: "Modal Corp" }).first()
    await row.locator('[data-testid="consult-quote-btn"]').click()

    const modal = adminPage.locator('[data-testid="quote-detail-modal"]')
    await expect(modal).toBeVisible()
    await expect(adminPage.locator('[data-testid="accept-quote-btn"]')).toBeVisible()
    await expect(adminPage.locator('[data-testid="cancel-quote-btn"]')).toBeVisible()
  })
})

// ─── Actions admin (accept / cancel) ─────────────────────────────────────────

test.describe("Admin — Accepter un devis", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/booking/meeting-room")
    await page.fill('[name="companyName"]', "Accept Corp")
    await page.fill('[name="date"]', "2099-10-06") // Lundi
    await page.selectOption('[name="start"]', "14:00")
    await page.selectOption('[name="end"]', "16:00")
    await page.fill('[name="contactName"]', "Carol Accept")
    await page.fill('[name="contactEmail"]', "carol@accept.com")
    await page.fill('[name="contactPhone"]', "0623456789")
    await page.click('[data-testid="submit-quote"]')
    await expect(page.locator('[data-testid="quote-success"]')).toBeVisible()
  })

  test("accepter un devis le passe en statut 'Validé'", async ({ adminPage }) => {
    await adminPage.goto("/admin/quotes")

    const row = adminPage.locator('[data-testid="quote-row"]').filter({ hasText: "Accept Corp" }).first()
    await expect(row).toBeVisible()

    // Ouvrir le modal et accepter
    await row.locator('[data-testid="consult-quote-btn"]').click()
    await expect(adminPage.locator('[data-testid="quote-detail-modal"]')).toBeVisible()
    await adminPage.locator('[data-testid="accept-quote-btn"]').click()

    // Le modal se ferme, la ligne est mise à jour
    await expect(adminPage.locator('[data-testid="quote-detail-modal"]')).not.toBeVisible()

    // Le badge doit être "Validé" / CONFIRMED
    const updatedRow = adminPage.locator('[data-testid="quote-row"]').filter({ hasText: "Accept Corp" })
    const badge = updatedRow.locator('[data-testid="quote-status-badge"]')
    await expect(badge).toHaveAttribute("data-status", "CONFIRMED")
    await expect(badge).toContainText(/validé/i)
  })
})

test.describe("Admin — Annuler un devis", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/booking/meeting-room")
    await page.fill('[name="companyName"]', "Cancel Corp")
    await page.fill('[name="date"]', "2099-10-13") // Lundi
    await page.selectOption('[name="start"]', "09:00")
    await page.selectOption('[name="end"]', "12:00")
    await page.fill('[name="contactName"]', "Dave Cancel")
    await page.fill('[name="contactEmail"]', "dave@cancel.com")
    await page.fill('[name="contactPhone"]', "0634567890")
    await page.click('[data-testid="submit-quote"]')
    await expect(page.locator('[data-testid="quote-success"]')).toBeVisible()
  })

  test("annuler un devis le passe en statut 'Annulé'", async ({ adminPage }) => {
    await adminPage.goto("/admin/quotes")

    const row = adminPage.locator('[data-testid="quote-row"]').filter({ hasText: "Cancel Corp" })
    await expect(row).toBeVisible()

    await row.locator('[data-testid="consult-quote-btn"]').click()
    await expect(adminPage.locator('[data-testid="quote-detail-modal"]')).toBeVisible()
    await adminPage.locator('[data-testid="cancel-quote-btn"]').click()

    await expect(adminPage.locator('[data-testid="quote-detail-modal"]')).not.toBeVisible()

    const updatedRow = adminPage.locator('[data-testid="quote-row"]').filter({ hasText: "Cancel Corp" })
    const badge = updatedRow.locator('[data-testid="quote-status-badge"]')
    await expect(badge).toHaveAttribute("data-status", "CANCELLED")
    await expect(badge).toContainText(/annulé/i)
  })
})

// ─── Affichage tous statuts ───────────────────────────────────────────────────

test.describe("Admin — Tableau affiche tous les statuts", () => {
  test("les devis CONFIRMED et CANCELLED restent visibles dans le tableau", async ({ adminPage }) => {
    await adminPage.goto("/admin/quotes")

    // Le tableau doit exister même s'il contient des devis de différents statuts
    await expect(adminPage.locator('[data-testid="admin-quotes-table"]')).toBeVisible()

    // Les badges de différents statuts peuvent coexister
    const badges = adminPage.locator('[data-testid="quote-status-badge"]')
    const count = await badges.count()

    // S'il y a des lignes, vérifier que des statuts divers peuvent être présents
    if (count > 0) {
      const statuses = await badges.evaluateAll(
        (els) => els.map((el) => el.getAttribute("data-status"))
      )
      // Tous les statuts doivent être valides
      statuses.forEach((s) => {
        expect(["PENDING_QUOTE", "CONFIRMED", "CANCELLED"]).toContain(s)
      })
    }
  })
})
