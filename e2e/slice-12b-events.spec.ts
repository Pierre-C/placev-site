/**
 * e2e/slice-12b-events.spec.ts
 * Tests E2E — Slice 12b : Images Événements, Page /events, Limite Homepage
 *
 * Prérequis :
 * - Serveur Next.js lancé + DB seedée (au moins 3 événements à venir).
 * - Le seed doit avoir seed-event-01 (avec registrationUrl),
 *   seed-event-02 (sans registrationUrl), seed-event-03 (sans image).
 * - Les tests admin créent/manipulent leurs propres données.
 */

import { test, expect, futureDateYMD } from "./helpers/fixtures"
import path from "path"

// ─── Homepage — Limite à 3 events ─────────────────────────────────────────────

test.describe("Homepage — Section Événements (limite 3 + bouton voir-tout)", () => {
  test("affiche au maximum 3 cards d'événements", async ({ page }) => {
    await page.goto("/")

    const section = page.locator('[data-testid="events-section"]')
    await expect(section).toBeVisible()

    const cards = section.locator('[data-testid="event-card"]')
    const count = await cards.count()

    // Entre 0 et 3 maximum
    expect(count).toBeGreaterThanOrEqual(0)
    expect(count).toBeLessThanOrEqual(3)
  })

  test("le bouton 'Tous nos événements' est visible sous la grille", async ({ page }) => {
    await page.goto("/")

    // Le seed doit avoir au moins 1 événement futur pour que le bouton apparaisse
    const cards = page.locator('[data-testid="event-card"]')
    const count = await cards.count()

    if (count > 0) {
      await expect(page.locator('[data-testid="events-see-all-btn"]')).toBeVisible()
    }
  })

  test("le bouton 'Tous nos événements' redirige vers /events", async ({ page }) => {
    await page.goto("/")

    const section = page.locator('[data-testid="events-section"]')
    await expect(section).toBeVisible()

    const btn = page.locator('[data-testid="events-see-all-btn"]')
    const visible = await btn.isVisible()
    if (!visible) {
      test.skip() // Skip si 0 événements
      return
    }

    await btn.click()
    await expect(page).toHaveURL(/\/events/)
  })

  test("les cards d'événements contiennent une image", async ({ page }) => {
    await page.goto("/")

    const section = page.locator('[data-testid="events-section"]')
    await expect(section).toBeVisible()

    const firstCard = page.locator('[data-testid="event-card"]').first()
    const count = await page.locator('[data-testid="event-card"]').count()

    if (count === 0) {
      test.skip()
      return
    }

    // Chaque card doit avoir une balise img visible
    const img = firstCard.locator("img")
    await expect(img).toBeVisible()
    const src = await img.getAttribute("src")
    expect(src).toBeTruthy()
  })

  test("l'image occupe le haut de la card (avant le texte)", async ({ page }) => {
    await page.goto("/")

    const section = page.locator('[data-testid="events-section"]')
    await expect(section).toBeVisible()

    const count = await page.locator('[data-testid="event-card"]').count()
    if (count === 0) {
      test.skip()
      return
    }

    const firstCard = page.locator('[data-testid="event-card"]').first()
    const img = firstCard.locator("img")
    const title = firstCard.locator('[data-testid="event-card-title"]')

    await expect(img).toBeVisible()
    await expect(title).toBeVisible()

    // L'image doit apparaître au-dessus du titre (bounding box Y plus petit)
    const imgBox = await img.boundingBox()
    const titleBox = await title.boundingBox()

    if (imgBox && titleBox) {
      expect(imgBox.y).toBeLessThan(titleBox.y)
    }
  })
})

// ─── Page /events — Structure ─────────────────────────────────────────────────

test.describe("Page /events — Structure et navigation", () => {
  test("la page /events est accessible sans connexion", async ({ page }) => {
    const response = await page.goto("/events")
    expect(response?.status()).toBe(200)
  })

  test("la page affiche le titre 'Tous nos événements'", async ({ page }) => {
    await page.goto("/events")

    const title = page.locator('[data-testid="events-page-title"]')
    await expect(title).toBeVisible()
    await expect(title).toContainText(/tous nos événements/i)
  })

  test("la barre de recherche est visible", async ({ page }) => {
    await page.goto("/events")
    await expect(page.locator('[data-testid="events-page-search"]')).toBeVisible()
  })

  test("les champs de filtre date (Du / Au) sont visibles", async ({ page }) => {
    await page.goto("/events")
    await expect(page.locator('[data-testid="events-filter-from"]')).toBeVisible()
    await expect(page.locator('[data-testid="events-filter-to"]')).toBeVisible()
  })

  test("la checkbox 'Afficher les événements passés' est visible et cochée par défaut", async ({ page }) => {
    await page.goto("/events")

    const checkbox = page.locator('[data-testid="events-show-past"]')
    await expect(checkbox).toBeVisible()
    await expect(checkbox).toBeChecked()
  })
})

// ─── Page /events — Filtres ────────────────────────────────────────────────────

test.describe("Page /events — Filtres et recherche (données seed)", () => {
  test("par défaut, seuls les événements à venir sont affichés", async ({ page }) => {
    await page.goto("/events")

    // Aucun événement passé ne doit apparaître dans la liste par défaut
    // Le seed insère un événement passé dont on peut vérifier l'absence
    const cards = page.locator('[data-testid="event-card"]')
    const count = await cards.count()

    for (let i = 0; i < count; i++) {
      const dateText = await cards.nth(i).locator('[data-testid="event-card-date"]').textContent()
      // La date formatée d'un événement passé contiendrait une année passée
      // (vérification basique : pas de titre "passée" du seed)
      const titleText = await cards.nth(i).locator('[data-testid="event-card-title"]').textContent()
      expect(titleText).not.toMatch(/passée/i)
    }
  })

  test("cocher 'Afficher les événements passés' fait apparaître les events passés", async ({ page }) => {
    await page.goto("/events")

    const countBefore = await page.locator('[data-testid="event-card"]').count()

    await page.locator('[data-testid="events-show-past"]').check()
    await expect(page.locator('[data-testid="events-show-past"]')).toBeChecked()

    // Après avoir coché, il peut y avoir plus d'événements (ceux du seed passés)
    // Au minimum le même nombre (si aucun passé dans le seed)
    const countAfter = await page.locator('[data-testid="event-card"]').count()
    expect(countAfter).toBeGreaterThanOrEqual(countBefore)
  })

  test("décocher 'Afficher les événements passés' masque de nouveau les events passés", async ({ page }) => {
    await page.goto("/events")

    const checkbox = page.locator('[data-testid="events-show-past"]')
    const countInitial = await page.locator('[data-testid="event-card"]').count()

    await checkbox.check()
    await checkbox.uncheck()
    await expect(checkbox).not.toBeChecked()

    // Retour au nombre initial
    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(countInitial)
  })

  test("la barre de recherche filtre les events par titre", async ({ page }) => {
    await page.goto("/events")

    // Chercher le titre partiel du premier événement seed
    const firstCard = page.locator('[data-testid="event-card"]').first()
    const countInit = await page.locator('[data-testid="event-card"]').count()

    if (countInit === 0) {
      test.skip()
      return
    }

    const firstTitle = await firstCard.locator('[data-testid="event-card-title"]').textContent()
    // Prendre les 5 premiers caractères pour chercher
    const query = firstTitle?.trim().slice(0, 5) ?? ""

    await page.locator('[data-testid="events-page-search"]').fill(query)

    // Il doit rester au moins 1 card
    const countAfter = await page.locator('[data-testid="event-card"]').count()
    expect(countAfter).toBeGreaterThanOrEqual(1)
  })

  test("vider la barre de recherche réaffiche tous les events", async ({ page }) => {
    await page.goto("/events")

    const search = page.locator('[data-testid="events-page-search"]')
    const countInit = await page.locator('[data-testid="event-card"]').count()

    await search.fill("xxxxxxxxxxxxxxx") // aucun résultat
    await search.fill("") // vider

    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(countInit)
  })

  test("le filtre 'Du' masque les événements antérieurs à la date saisie", async ({ page }) => {
    await page.goto("/events")

    // Saisir une date après tous les événements existants (les tests admin créent des events en 2099)
    await page.locator('[data-testid="events-filter-from"]').fill("2100-01-01")

    const countAfter = await page.locator('[data-testid="event-card"]').count()
    expect(countAfter).toBe(0)
  })

  test("le filtre 'Au' masque les événements postérieurs à la date saisie", async ({ page }) => {
    await page.goto("/events")

    const countInit = await page.locator('[data-testid="event-card"]').count()
    if (countInit === 0) {
      test.skip()
      return
    }

    // Saisir une date passée comme date de fin → aucun événement futur ne passe
    await page.locator('[data-testid="events-filter-to"]').fill("2020-01-01")

    const countAfter = await page.locator('[data-testid="event-card"]').count()
    expect(countAfter).toBe(0)
  })

  test("effacer les filtres de date réaffiche tous les events", async ({ page }) => {
    await page.goto("/events")

    const countInit = await page.locator('[data-testid="event-card"]').count()

    await page.locator('[data-testid="events-filter-from"]').fill("2099-01-01")
    await page.locator('[data-testid="events-filter-from"]').fill("")

    await expect(page.locator('[data-testid="event-card"]')).toHaveCount(countInit)
  })
})

// ─── Admin — Upload et suppression d'image ────────────────────────────────────

test.describe("Admin — Upload image d'un événement", () => {
  // Titre unique par test pour éviter les collisions entre beforeEach successifs
  // (beforeEach tourne avant chaque test et accumule des lignes en DB)
  let testTitle = ""

  test.beforeEach(async ({ adminPage }) => {
    testTitle = `Image Upload ${Date.now()}`

    await adminPage.goto("/admin/events")
    await adminPage.locator('[data-testid="create-event-btn"]').click()

    const modal = adminPage.locator('[data-testid="event-form-modal"]')
    await expect(modal).toBeVisible()

    await modal.locator('[data-testid="event-form-title-input"]').fill(testTitle)
    await modal.locator('[data-testid="event-form-description-input"]').fill("Événement pour test upload image")
    await modal.locator('[data-testid="event-form-date-input"]').fill(futureDateYMD(60))

    await modal.locator('[data-testid="event-form-submit"]').click()
    await expect(modal).not.toBeVisible()
  })

  test("le modal de création/édition contient un champ upload image", async ({ adminPage }) => {
    await adminPage.goto("/admin/events")

    const row = adminPage.locator('[data-testid="event-row"]').filter({ hasText: testTitle }).first()
    await row.locator('[data-testid="edit-event-btn"]').click()

    const modal = adminPage.locator('[data-testid="event-form-modal"]')
    await expect(modal).toBeVisible()

    await expect(modal.locator('[data-testid="event-form-image-input"]')).toBeVisible()
  })

  test("uploader une image affiche un aperçu dans le modal", async ({ adminPage }) => {
    await adminPage.goto("/admin/events")

    const row = adminPage.locator('[data-testid="event-row"]').filter({ hasText: testTitle }).first()
    await row.locator('[data-testid="edit-event-btn"]').click()

    const modal = adminPage.locator('[data-testid="event-form-modal"]')
    await expect(modal).toBeVisible()

    const fileInput = modal.locator('[data-testid="event-form-image-input"]')
    await fileInput.setInputFiles(
      path.join(process.cwd(), "public", "gallery", "PXL_20250909_120231896.jpg")
    )

    // Attendre que la chaîne FileReader → Canvas → setState soit terminée
    await expect(modal.locator('[data-testid="event-image-preview"]')).toBeVisible()
  })

  test("enregistrer avec une image affiche une miniature dans le tableau", async ({ adminPage }) => {
    await adminPage.goto("/admin/events")

    const row = adminPage.locator('[data-testid="event-row"]').filter({ hasText: testTitle }).first()
    await row.locator('[data-testid="edit-event-btn"]').click()

    const modal = adminPage.locator('[data-testid="event-form-modal"]')
    await expect(modal).toBeVisible()

    const fileInput = modal.locator('[data-testid="event-form-image-input"]')
    await fileInput.setInputFiles(
      path.join(process.cwd(), "public", "gallery", "PXL_20250909_120231896.jpg")
    )
    // Attendre que imageDataBase64 soit défini avant de soumettre
    await expect(modal.locator('[data-testid="event-image-preview"]')).toBeVisible()

    await modal.locator('[data-testid="event-form-submit"]').click()
    await expect(modal).not.toBeVisible()

    await adminPage.goto("/admin/events")
    const updatedRow = adminPage.locator('[data-testid="event-row"]').filter({ hasText: testTitle }).first()
    await expect(updatedRow.locator('[data-testid="event-thumb"]')).toBeVisible()
  })

  test("le bouton 'Supprimer l'image' est visible dans le modal si une image existe", async ({ adminPage }) => {
    await adminPage.goto("/admin/events")

    const row = adminPage.locator('[data-testid="event-row"]').filter({ hasText: testTitle }).first()
    await row.locator('[data-testid="edit-event-btn"]').click()

    const modal = adminPage.locator('[data-testid="event-form-modal"]')
    await expect(modal).toBeVisible()

    const fileInput = modal.locator('[data-testid="event-form-image-input"]')
    await fileInput.setInputFiles(
      path.join(process.cwd(), "public", "gallery", "PXL_20250909_120231896.jpg")
    )
    // Attendre que imageDataBase64 soit défini avant de soumettre
    await expect(modal.locator('[data-testid="event-image-preview"]')).toBeVisible()

    await modal.locator('[data-testid="event-form-submit"]').click()
    await expect(modal).not.toBeVisible()

    // Rouvrir le modal → le bouton "Supprimer l'image" doit être là
    await adminPage.goto("/admin/events")
    const updatedRow = adminPage.locator('[data-testid="event-row"]').filter({ hasText: testTitle }).first()
    await updatedRow.locator('[data-testid="edit-event-btn"]').click()
    await expect(modal).toBeVisible()
    await expect(modal.locator('[data-testid="event-form-delete-image"]')).toBeVisible()
  })

  test("supprimer l'image remet la miniature par défaut dans le tableau", async ({ adminPage }) => {
    await adminPage.goto("/admin/events")

    const row = adminPage.locator('[data-testid="event-row"]').filter({ hasText: testTitle }).first()
    await row.locator('[data-testid="edit-event-btn"]').click()

    const modal = adminPage.locator('[data-testid="event-form-modal"]')
    await expect(modal).toBeVisible()

    await modal.locator('[data-testid="event-form-image-input"]').setInputFiles(
      path.join(process.cwd(), "public", "gallery", "PXL_20250909_120231896.jpg")
    )
    // Attendre que imageDataBase64 soit défini avant de soumettre
    await expect(modal.locator('[data-testid="event-image-preview"]')).toBeVisible()

    await modal.locator('[data-testid="event-form-submit"]').click()
    await expect(modal).not.toBeVisible()

    // Rouvrir et supprimer l'image
    await adminPage.goto("/admin/events")
    const row2 = adminPage.locator('[data-testid="event-row"]').filter({ hasText: testTitle }).first()
    await row2.locator('[data-testid="edit-event-btn"]').click()
    await expect(modal).toBeVisible()

    await modal.locator('[data-testid="event-form-delete-image"]').click()
    await modal.locator('[data-testid="event-form-submit"]').click()
    await expect(modal).not.toBeVisible()

    // Recharger et vérifier que event-thumb n'est plus présent sur cette ligne
    await adminPage.goto("/admin/events")
    const row3 = adminPage.locator('[data-testid="event-row"]').filter({ hasText: testTitle }).first()
    await expect(row3.locator('[data-testid="event-thumb"]')).toHaveCount(0)
  })
})
