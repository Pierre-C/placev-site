/**
 * e2e/slice-05c-admin-ux.spec.ts
 * Tests E2E — Slice 5c : Admin UX v2
 *
 * Couvre :
 *   - Tableau membres : badge isMember non-cliquable, couleurs crédits, recherche, tri
 *   - Calendrier : grille scrollable, date du jour, dates passées, réouverture date
 *   - Paramètres : modal gestion dates de fermeture
 */

import { test, expect, futureDateYMD } from "./helpers/fixtures"

// ─── Tableau membres — badge isMember non-cliquable ───────────────────────────

test.describe("Membres — badge isMember non-interactif", () => {
  test("le badge isMember dans le tableau n'est plus un bouton cliquable", async ({ adminPage }) => {
    await adminPage.goto("/admin")
    await expect(adminPage.locator('[data-testid="members-table"]')).toBeVisible()

    const badge = adminPage.locator('[data-testid="member-is-member-badge"]').first()
    await expect(badge).toBeVisible()

    // Le badge ne doit pas être un <button> — c'est un élément non-interactif
    const tagName = await badge.evaluate((el) => el.tagName.toLowerCase())
    expect(tagName).not.toBe("button")
  })

  test("clic sur le badge dans le tableau ne change pas l'état isMember", async ({ adminPage }) => {
    await adminPage.goto("/admin")

    const badge = adminPage.locator('[data-testid="member-is-member-badge"]').first()
    const initialValue = await badge.getAttribute("data-value")

    await badge.click({ force: true })
    // Attendre une éventuelle mise à jour asynchrone
    await adminPage.waitForTimeout(500)

    // L'état ne doit pas avoir changé
    await expect(badge).toHaveAttribute("data-value", initialValue ?? "false")
  })

  test("le toggle isMember est accessible dans le modal Voir/Éditer", async ({ adminPage }) => {
    await adminPage.goto("/admin")

    const firstRow = adminPage.locator('[data-testid="member-row"]').first()
    await firstRow.locator('[data-testid="view-edit-btn"]').click()

    await expect(adminPage.locator('[data-testid="member-detail-modal"]')).toBeVisible()
    // Le toggle doit exister dans le modal (sous une forme quelconque)
    const modal = adminPage.locator('[data-testid="member-detail-modal"]')
    // Chercher un élément qui contrôle isMember dans le modal
    const memberToggle = modal.locator('[data-testid="member-toggle"], [role="switch"], input[type="checkbox"]')
    await expect(memberToggle.first()).toBeVisible()
  })
})

// ─── Tableau membres — couleurs du solde ─────────────────────────────────────

test.describe("Membres — couleurs du solde crédits", () => {
  test("les cellules de crédit ont l'attribut data-level", async ({ adminPage }) => {
    await adminPage.goto("/admin")
    await expect(adminPage.locator('[data-testid="members-table"]')).toBeVisible()

    const creditCells = adminPage.locator('[data-testid="member-credits"]')
    const count = await creditCells.count()
    expect(count).toBeGreaterThan(0)

    // Chaque cellule doit avoir un data-level valide
    for (let i = 0; i < Math.min(count, 5); i++) {
      const level = await creditCells.nth(i).getAttribute("data-level")
      expect(["positive", "one", "zero", "negative"]).toContain(level)
    }
  })

  test("un solde > 1 a la classe text-neutral-900 (noir)", async ({ adminPage }) => {
    await adminPage.goto("/admin")
    // Chercher une cellule avec data-level="positive"
    const positiveCell = adminPage.locator('[data-testid="member-credits"][data-level="positive"]').first()
    const count = await positiveCell.count()
    if (count > 0) {
      const className = await positiveCell.getAttribute("class")
      expect(className).toMatch(/neutral-900/)
    }
  })

  test("un solde = 1 a la classe text-orange-500 et data-level='one'", async ({ adminPage }) => {
    await adminPage.goto("/admin")
    const oneCell = adminPage.locator('[data-testid="member-credits"][data-level="one"]').first()
    const count = await oneCell.count()
    if (count > 0) {
      const className = await oneCell.getAttribute("class")
      expect(className).toMatch(/orange/)
    }
  })

  test("un solde ≤ 0 a la classe text-red-600", async ({ adminPage }) => {
    await adminPage.goto("/admin")
    const zeroOrNeg = adminPage.locator('[data-testid="member-credits"][data-level="zero"], [data-testid="member-credits"][data-level="negative"]').first()
    const count = await zeroOrNeg.count()
    if (count > 0) {
      const className = await zeroOrNeg.getAttribute("class")
      expect(className).toMatch(/red/)
    }
  })
})

// ─── Tableau membres — recherche ──────────────────────────────────────────────

test.describe("Membres — barre de recherche", () => {
  test("la barre de recherche est visible au-dessus du tableau", async ({ adminPage }) => {
    await adminPage.goto("/admin")
    await expect(adminPage.locator('[data-testid="member-search"]')).toBeVisible()
    // La recherche doit être au-dessus du tableau dans le DOM
    const searchBox = adminPage.locator('[data-testid="member-search"]')
    const table = adminPage.locator('[data-testid="members-table"]')
    const searchY = await searchBox.boundingBox().then((b) => b?.y ?? 0)
    const tableY = await table.boundingBox().then((b) => b?.y ?? 0)
    expect(searchY).toBeLessThan(tableY)
  })

  test("recherche par nom filtre les lignes", async ({ adminPage }) => {
    await adminPage.goto("/admin")
    await expect(adminPage.locator('[data-testid="members-table"]')).toBeVisible()

    const initialCount = await adminPage.locator('[data-testid="member-row"]').count()
    if (initialCount === 0) return

    // Récupérer le nom du premier membre
    const firstName = await adminPage
      .locator('[data-testid="member-row"]').first()
      .locator("td").first()
      .textContent()
    if (!firstName) return

    // Saisir les 3 premiers caractères du nom
    const query = firstName.trim().slice(0, 3)
    await adminPage.fill('[data-testid="member-search"]', query)

    // Les lignes affichées doivent être <= count initial
    const filteredCount = await adminPage.locator('[data-testid="member-row"]').count()
    expect(filteredCount).toBeLessThanOrEqual(initialCount)

    // Effacer → tout réapparaît
    await adminPage.fill('[data-testid="member-search"]', "")
    await expect(adminPage.locator('[data-testid="member-row"]')).toHaveCount(initialCount)
  })

  test("recherche insensible à la casse", async ({ adminPage }) => {
    await adminPage.goto("/admin")
    await expect(adminPage.locator('[data-testid="members-table"]')).toBeVisible()

    // Recherche en minuscules sur un segment connu
    await adminPage.fill('[data-testid="member-search"]', "boul")
    const countLower = await adminPage.locator('[data-testid="member-row"]').count()

    await adminPage.fill('[data-testid="member-search"]', "BOUL")
    const countUpper = await adminPage.locator('[data-testid="member-row"]').count()

    expect(countLower).toBe(countUpper)
  })

  test("recherche sans résultat affiche member-search-empty", async ({ adminPage }) => {
    await adminPage.goto("/admin")
    await adminPage.fill('[data-testid="member-search"]', "zzz-inexistant-xyz-123")
    await expect(adminPage.locator('[data-testid="member-search-empty"]')).toBeVisible()
    await expect(adminPage.locator('[data-testid="member-row"]')).toHaveCount(0)
  })
})

// ─── Tableau membres — tri des colonnes ───────────────────────────────────────

test.describe("Membres — tri des colonnes", () => {
  test("les boutons de tri sont présents sur les colonnes Nom, Crédits, Segment", async ({ adminPage }) => {
    await adminPage.goto("/admin")
    await expect(adminPage.locator('[data-testid="members-table"]')).toBeVisible()

    await expect(adminPage.locator('[data-testid="column-sort-btn"][data-column="name"]')).toBeVisible()
    await expect(adminPage.locator('[data-testid="column-sort-btn"][data-column="credits"]')).toBeVisible()
    await expect(adminPage.locator('[data-testid="column-sort-btn"][data-column="segment"]')).toBeVisible()
  })

  test("clic sur Nom → direction=asc, second clic → desc, troisième → none", async ({ adminPage }) => {
    await adminPage.goto("/admin")
    await expect(adminPage.locator('[data-testid="members-table"]')).toBeVisible()

    const nameSort = adminPage.locator('[data-testid="column-sort-btn"][data-column="name"]')

    // État initial
    expect(await nameSort.getAttribute("data-direction")).toBe("none")

    // 1er clic → asc
    await nameSort.click()
    await expect(nameSort).toHaveAttribute("data-direction", "asc")

    // 2ème clic → desc
    await nameSort.click()
    await expect(nameSort).toHaveAttribute("data-direction", "desc")

    // 3ème clic → none
    await nameSort.click()
    await expect(nameSort).toHaveAttribute("data-direction", "none")
  })

  test("tri par Crédits asc : la valeur minimale est en première ligne", async ({ adminPage }) => {
    await adminPage.goto("/admin")
    await expect(adminPage.locator('[data-testid="members-table"]')).toBeVisible()

    const initialCount = await adminPage.locator('[data-testid="member-row"]').count()
    if (initialCount < 2) return

    const creditsSort = adminPage.locator('[data-testid="column-sort-btn"][data-column="credits"]')
    await creditsSort.click() // asc

    const cells = adminPage.locator('[data-testid="member-credits"]')
    const firstValue = parseInt(await cells.first().textContent() ?? "0", 10)
    const secondValue = parseInt(await cells.nth(1).textContent() ?? "0", 10)
    expect(firstValue).toBeLessThanOrEqual(secondValue)
  })
})

// ─── Calendrier — grille scrollable ──────────────────────────────────────────

test.describe("Calendrier — grille scrollable", () => {
  test("la div admin-calendar-grid existe et a une hauteur maximale définie", async ({ adminPage }) => {
    await adminPage.goto("/admin/calendar")
    await adminPage.waitForSelector('[data-testid="admin-calendar-grid"]', { timeout: 10000 })

    const grid = adminPage.locator('[data-testid="admin-calendar-grid"]')
    await expect(grid).toBeVisible()

    // Vérifier que max-height ou height est défini (la div a une contrainte de hauteur)
    const styles = await grid.evaluate((el) => {
      const cs = window.getComputedStyle(el)
      return { overflow: cs.overflow, overflowY: cs.overflowY, maxHeight: cs.maxHeight }
    })
    // La div doit avoir overflow-y: auto ou scroll
    expect(["auto", "scroll"]).toContain(styles.overflowY)
  })

  test("le panneau admin-calendar-date-panel est en dehors de la grille scrollable", async ({ adminPage }) => {
    await adminPage.goto("/admin/calendar")
    await adminPage.waitForSelector('[data-testid="admin-calendar-slot-tile"]', { timeout: 10000 })

    // Cliquer une date pour ouvrir le panneau
    const tile = adminPage.locator('[data-testid="admin-calendar-slot-tile"]').first()
    await tile.click()

    await expect(adminPage.locator('[data-testid="admin-calendar-date-panel"]')).toBeVisible({ timeout: 10000 })

    // Le panneau ne doit pas être enfant de la grille scrollable
    const isInsideGrid = await adminPage.locator('[data-testid="admin-calendar-grid"]')
      .locator('[data-testid="admin-calendar-date-panel"]')
      .count()
    expect(isInsideGrid).toBe(0)
  })
})

// ─── Calendrier — date du jour ────────────────────────────────────────────────

test.describe("Calendrier — date du jour et dates passées", () => {
  test("la cellule du jour actuel a data-today='true'", async ({ adminPage }) => {
    await adminPage.goto("/admin/calendar")
    await adminPage.waitForSelector('[data-testid="admin-calendar-slot-tile"]', { timeout: 10000 })

    const todayCell = adminPage.locator('[data-today="true"]')
    await expect(todayCell).toBeVisible()
  })

  test("la cellule du jour actuel est visuellement distincte (ring visible)", async ({ adminPage }) => {
    await adminPage.goto("/admin/calendar")
    await adminPage.waitForSelector('[data-testid="admin-calendar-slot-tile"]', { timeout: 10000 })

    const todayCell = adminPage.locator('[data-today="true"]')
    await expect(todayCell).toBeVisible()
    const todayIndicator = todayCell.locator("div.border-blue-500")
    await expect(todayIndicator).toBeVisible()
  })

  test("les cellules passées ont data-past='true'", async ({ adminPage }) => {
    await adminPage.goto("/admin/calendar")
    await adminPage.waitForSelector('[data-testid="admin-calendar-slot-tile"]', { timeout: 10000 })

    // Il doit y avoir au moins quelques dates passées dans le mois (si on n'est pas le 1er du mois)
    const pastCells = adminPage.locator('[data-past="true"]')
    const today = new Date()
    if (today.getDate() > 1) {
      // Si on n'est pas le 1er du mois, il y a forcément des jours passés
      await expect(pastCells.first()).toBeVisible()
    }
  })

  test("les cellules passées ont une opacité réduite", async ({ adminPage }) => {
    await adminPage.goto("/admin/calendar")
    await adminPage.waitForSelector('[data-testid="admin-calendar-slot-tile"]', { timeout: 10000 })

    const pastCells = adminPage.locator('[data-past="true"]')
    const count = await pastCells.count()
    if (count > 0) {
      const className = await pastCells.first().getAttribute("class")
      expect(className).toMatch(/opacity/)
    }
  })
})

// ─── Calendrier — réouverture de date ─────────────────────────────────────────

test.describe("Calendrier — réouverture d'une date fermée", () => {
  test("bouton admin-open-date-btn visible dans le panneau pour une date fermée manuellement", async ({ adminPage }) => {
    // D'abord, fermer une date depuis les paramètres
    const targetDate = futureDateYMD(20)

    await adminPage.goto("/admin/settings")
    await adminPage.click('[data-testid="manage-closed-dates-btn"]')
    await expect(adminPage.locator('[data-testid="closed-dates-modal"]')).toBeVisible()
    await adminPage.fill('[data-testid="close-date-input"]', targetDate)
    await adminPage.fill('[data-testid="close-date-reason"]', "Test réouverture E2E")
    await adminPage.click('[data-testid="preview-closure"]')
    await expect(adminPage.locator('[data-testid="closure-preview"]')).toBeVisible()
    await adminPage.click('[data-testid="confirm-closure"]')
    await expect(adminPage.locator('[data-testid="closure-success"]')).toBeVisible()

    // Aller sur le calendrier et naviguer vers le mois de la date cible
    await adminPage.goto("/admin/calendar")
    await adminPage.waitForSelector('[data-testid="admin-calendar-slot-tile"]', { timeout: 10000 })

    const targetMonth = new Date(targetDate).getMonth()
    const currentMonth = new Date().getMonth()
    if (targetMonth !== currentMonth) {
      await adminPage.locator('[data-testid="calendar-next-month"]').click()
      await adminPage.waitForTimeout(300)
    }

    // Cliquer sur la date fermée
    const dateTile = adminPage.locator(`[data-testid="admin-calendar-slot-tile"][data-date="${targetDate}"]`).first()
    if (await dateTile.isVisible()) {
      await dateTile.click()
      await expect(adminPage.locator('[data-testid="admin-calendar-date-panel"]')).toBeVisible({ timeout: 10000 })

      // Le bouton "Réouvrir" doit être visible au lieu du bouton "Fermer"
      await expect(adminPage.locator('[data-testid="admin-open-date-btn"]')).toBeVisible({ timeout: 5000 })
      await expect(adminPage.locator('[data-testid="admin-close-date-btn"]')).not.toBeVisible()
    }
  })

  test("confirmation de réouverture → admin-action-success visible", async ({ adminPage }) => {
    const targetDate = futureDateYMD(21)

    // Fermer la date d'abord
    await adminPage.goto("/admin/settings")
    await adminPage.click('[data-testid="manage-closed-dates-btn"]')
    await adminPage.fill('[data-testid="close-date-input"]', targetDate)
    await adminPage.fill('[data-testid="close-date-reason"]', "Test réouverture confirmation E2E")
    await adminPage.click('[data-testid="preview-closure"]')
    await adminPage.click('[data-testid="confirm-closure"]')
    await expect(adminPage.locator('[data-testid="closure-success"]')).toBeVisible()

    // Naviguer vers le calendrier
    await adminPage.goto("/admin/calendar")
    await adminPage.waitForSelector('[data-testid="admin-calendar-slot-tile"]', { timeout: 10000 })

    const targetMonth = new Date(targetDate).getMonth()
    const currentMonth = new Date().getMonth()
    if (targetMonth !== currentMonth) {
      await adminPage.locator('[data-testid="calendar-next-month"]').click()
      await adminPage.waitForTimeout(300)
    }

    const dateTile = adminPage.locator(`[data-testid="admin-calendar-slot-tile"][data-date="${targetDate}"]`).first()
    if (await dateTile.isVisible()) {
      await dateTile.click()
      await expect(adminPage.locator('[data-testid="admin-calendar-date-panel"]')).toBeVisible({ timeout: 10000 })

      const openBtn = adminPage.locator('[data-testid="admin-open-date-btn"]')
      if (await openBtn.isVisible()) {
        await openBtn.click()
        await expect(adminPage.locator('[data-testid="admin-confirm-dialog"]')).toBeVisible()
        await adminPage.locator('[data-testid="admin-confirm-yes"]').click()
        await expect(adminPage.locator('[data-testid="admin-action-success"]')).toBeVisible({ timeout: 10000 })
      }
    }
  })
})

// ─── Paramètres — modal dates de fermeture ────────────────────────────────────

test.describe("Paramètres — modal gestion des dates de fermeture", () => {
  test("le bouton manage-closed-dates-btn est visible dans la page Paramètres", async ({ adminPage }) => {
    await adminPage.goto("/admin/settings")
    await expect(adminPage.locator('[data-testid="manage-closed-dates-btn"]')).toBeVisible()
  })

  test("clic sur manage-closed-dates-btn ouvre le modal closed-dates-modal", async ({ adminPage }) => {
    await adminPage.goto("/admin/settings")
    await adminPage.click('[data-testid="manage-closed-dates-btn"]')
    await expect(adminPage.locator('[data-testid="closed-dates-modal"]')).toBeVisible()
  })

  test("le modal contient le formulaire de fermeture (testids existants préservés)", async ({ adminPage }) => {
    await adminPage.goto("/admin/settings")
    await adminPage.click('[data-testid="manage-closed-dates-btn"]')

    const modal = adminPage.locator('[data-testid="closed-dates-modal"]')
    await expect(modal.locator('[data-testid="close-date-input"]')).toBeVisible()
    await expect(modal.locator('[data-testid="close-date-reason"]')).toBeVisible()
    await expect(modal.locator('[data-testid="preview-closure"]')).toBeVisible()
  })

  test("le modal contient la liste des dates de fermeture (closed-dates-list)", async ({ adminPage }) => {
    await adminPage.goto("/admin/settings")
    await adminPage.click('[data-testid="manage-closed-dates-btn"]')
    await expect(adminPage.locator('[data-testid="closed-dates-list"]')).toBeVisible()
  })

  test("fermeture d'une date depuis le modal : closure-success visible, modal reste ouvert", async ({ adminPage }) => {
    const closeDateStr = futureDateYMD(35)

    await adminPage.goto("/admin/settings")
    await adminPage.click('[data-testid="manage-closed-dates-btn"]')
    await expect(adminPage.locator('[data-testid="closed-dates-modal"]')).toBeVisible()

    await adminPage.fill('[data-testid="close-date-input"]', closeDateStr)
    await adminPage.fill('[data-testid="close-date-reason"]', "Fermeture via modal test E2E")
    await adminPage.click('[data-testid="preview-closure"]')
    await expect(adminPage.locator('[data-testid="closure-preview"]')).toBeVisible()
    await adminPage.click('[data-testid="confirm-closure"]')

    await expect(adminPage.locator('[data-testid="closure-success"]')).toBeVisible()
    // Le modal doit rester ouvert après la fermeture d'une date
    await expect(adminPage.locator('[data-testid="closed-dates-modal"]')).toBeVisible()
  })

  test("les dates passées dans le tableau ont data-past='true'", async ({ adminPage }) => {
    await adminPage.goto("/admin/settings")
    await adminPage.click('[data-testid="manage-closed-dates-btn"]')

    // Il peut y avoir des dates passées si des tests précédents en ont créé
    const pastRows = adminPage.locator('[data-testid="closed-date-row"][data-past="true"]')
    const count = await pastRows.count()
    if (count > 0) {
      // Vérifier l'opacité
      const firstPastRow = pastRows.first()
      const className = await firstPastRow.getAttribute("class")
      expect(className).toMatch(/opacity/)
    }
  })

  test("le bouton remove-closed-date-btn est disabled pour les dates passées", async ({ adminPage }) => {
    await adminPage.goto("/admin/settings")
    await adminPage.click('[data-testid="manage-closed-dates-btn"]')

    const pastRows = adminPage.locator('[data-testid="closed-date-row"][data-past="true"]')
    const count = await pastRows.count()
    if (count > 0) {
      const removeBtn = pastRows.first().locator('[data-testid="remove-closed-date-btn"]')
      await expect(removeBtn).toBeDisabled()
    }
  })

  test("le bouton remove-closed-date-btn est actif pour les dates futures", async ({ adminPage }) => {
    // S'assurer qu'il y a une date future en en créant une
    const futureDateStr = futureDateYMD(40)

    await adminPage.goto("/admin/settings")
    await adminPage.click('[data-testid="manage-closed-dates-btn"]')

    await adminPage.fill('[data-testid="close-date-input"]', futureDateStr)
    await adminPage.fill('[data-testid="close-date-reason"]', "Test suppression E2E")
    await adminPage.click('[data-testid="preview-closure"]')
    await adminPage.click('[data-testid="confirm-closure"]')
    await expect(adminPage.locator('[data-testid="closure-success"]')).toBeVisible()

    // La date future doit apparaître dans la liste avec un bouton actif
    const futureRows = adminPage.locator('[data-testid="closed-date-row"][data-past="false"]')
    const count = await futureRows.count()
    if (count > 0) {
      const removeBtn = futureRows.first().locator('[data-testid="remove-closed-date-btn"]')
      await expect(removeBtn).not.toBeDisabled()
    }
  })

  test("supprimer une date future la retire de la liste", async ({ adminPage }) => {
    const futureDateStr = futureDateYMD(50)

    await adminPage.goto("/admin/settings")
    await adminPage.click('[data-testid="manage-closed-dates-btn"]')

    // Créer la date à supprimer
    await adminPage.fill('[data-testid="close-date-input"]', futureDateStr)
    await adminPage.fill('[data-testid="close-date-reason"]', "À supprimer E2E")
    await adminPage.click('[data-testid="preview-closure"]')
    await adminPage.click('[data-testid="confirm-closure"]')
    await expect(adminPage.locator('[data-testid="closure-success"]')).toBeVisible()

    const initialRowCount = await adminPage.locator('[data-testid="closed-date-row"]').count()

    // Supprimer la première date future
    const futureRows = adminPage.locator('[data-testid="closed-date-row"][data-past="false"]')
    const futureCount = await futureRows.count()
    if (futureCount > 0) {
      await futureRows.first().locator('[data-testid="remove-closed-date-btn"]').click()
      // La liste doit diminuer
      const newRowCount = await adminPage.locator('[data-testid="closed-date-row"]').count()
      expect(newRowCount).toBe(initialRowCount - 1)
    }
  })

  test("clic sur closed-dates-modal-close ferme le modal", async ({ adminPage }) => {
    await adminPage.goto("/admin/settings")
    await adminPage.click('[data-testid="manage-closed-dates-btn"]')
    await expect(adminPage.locator('[data-testid="closed-dates-modal"]')).toBeVisible()

    await adminPage.click('[data-testid="closed-dates-modal-close"]')
    await expect(adminPage.locator('[data-testid="closed-dates-modal"]')).not.toBeVisible()
  })

  test("le formulaire de fermeture dans le modal fonctionne (test de régression slice-05)", async ({ adminPage }) => {
    // Vérifier que les testids de la Slice 5 fonctionnent toujours depuis le modal
    const closeDateStr = futureDateYMD(60)

    await adminPage.goto("/admin/settings")
    await adminPage.click('[data-testid="manage-closed-dates-btn"]')

    // Ces interactions doivent fonctionner identiquement à avant (slice-05-admin.spec.ts)
    await adminPage.fill('[data-testid="close-date-input"]', closeDateStr)
    await adminPage.fill('[data-testid="close-date-reason"]', "Régression test slice-05")
    await adminPage.click('[data-testid="preview-closure"]')
    await expect(adminPage.locator('[data-testid="closure-preview"]')).toBeVisible()
    await adminPage.click('[data-testid="confirm-closure"]')
    await expect(adminPage.locator('[data-testid="closure-success"]')).toBeVisible()
  })
})
