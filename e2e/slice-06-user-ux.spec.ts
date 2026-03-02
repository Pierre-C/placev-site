/**
 * e2e/slice-06-user-ux.spec.ts
 * Tests E2E — Slice 6 : Dashboard Membre UX
 *
 * Couvre :
 *   - Navigation tabulaire (3 onglets : Réserver, Recharger, Historique)
 *   - Header : message de bienvenue + solde coloré (orange=1, rouge≤0)
 *   - Onglet Réserver : calendrier scrollable + dates passées grisées + border today
 *   - Onglet Recharger : packs de crédits
 *   - Onglet Historique : transactions scrollable avec labels et couleurs
 *   - Non-régression : testids existants préservés
 */

import { test, expect } from "./helpers/fixtures"

// ─── Navigation — 3 onglets ───────────────────────────────────────────────────

test.describe("Navigation membre — 3 onglets", () => {
  test("le dashboard affiche une nav avec exactement 3 onglets", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")

    const nav = membrePage.locator('[data-testid="dashboard-nav"]')
    await expect(nav).toBeVisible()

    const tabs = nav.locator("a")
    await expect(tabs).toHaveCount(3)
  })

  test("le premier onglet est 'Réserver' et pointe vers /dashboard", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")

    const tab = membrePage.locator('[data-testid="nav-tab-reserver"]')
    await expect(tab).toBeVisible()
    await expect(tab).toHaveText("Réserver")
    await expect(tab).toHaveAttribute("href", "/dashboard")
  })

  test("le deuxième onglet est 'Recharger' et pointe vers /dashboard/recharger", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")

    const tab = membrePage.locator('[data-testid="nav-tab-recharger"]')
    await expect(tab).toBeVisible()
    await expect(tab).toHaveText("Recharger")
    await expect(tab).toHaveAttribute("href", "/dashboard/recharger")
  })

  test("le troisième onglet est 'Historique' et pointe vers /dashboard/historique", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")

    const tab = membrePage.locator('[data-testid="nav-tab-historique"]')
    await expect(tab).toBeVisible()
    await expect(tab).toHaveText("Historique")
    await expect(tab).toHaveAttribute("href", "/dashboard/historique")
  })

  test("clic sur 'Recharger' → navigation vers /dashboard/recharger", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    await membrePage.locator('[data-testid="nav-tab-recharger"]').click()
    await expect(membrePage).toHaveURL(/\/dashboard\/recharger$/)
  })

  test("clic sur 'Historique' → navigation vers /dashboard/historique", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    await membrePage.locator('[data-testid="nav-tab-historique"]').click()
    await expect(membrePage).toHaveURL(/\/dashboard\/historique$/)
  })

  test("clic sur 'Réserver' depuis Recharger → retour sur /dashboard", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/recharger")
    await membrePage.locator('[data-testid="nav-tab-reserver"]').click()
    await expect(membrePage).toHaveURL(/\/dashboard$/)
  })

  test("clic sur 'Réserver' depuis Historique → retour sur /dashboard", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/historique")
    await membrePage.locator('[data-testid="nav-tab-reserver"]').click()
    await expect(membrePage).toHaveURL(/\/dashboard$/)
  })

  test("l'onglet actif a une classe CSS différente des onglets inactifs", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")

    const activeTab   = membrePage.locator('[data-testid="nav-tab-reserver"]')
    const inactiveTab = membrePage.locator('[data-testid="nav-tab-recharger"]')

    const activeClass   = await activeTab.getAttribute("class")
    const inactiveClass = await inactiveTab.getAttribute("class")

    // L'onglet actif doit avoir un style distinct (border, couleur, poids…)
    expect(activeClass).not.toBe(inactiveClass)
  })

  test("la nav reste visible après navigation vers Recharger", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/recharger")
    await expect(membrePage.locator('[data-testid="dashboard-nav"]')).toBeVisible()
  })

  test("la nav reste visible après navigation vers Historique", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/historique")
    await expect(membrePage.locator('[data-testid="dashboard-nav"]')).toBeVisible()
  })
})

// ─── Header — solde coloré ────────────────────────────────────────────────────

test.describe("Header membre — solde coloré au-dessus des onglets", () => {
  test("le message de bienvenue contient 'Bonjour'", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")

    const heading = membrePage.locator('[data-testid="welcome-message"]')
    await expect(heading).toBeVisible()
    await expect(heading).toContainText("Bonjour")
  })

  test("header-credit-balance est visible sur /dashboard", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    await expect(membrePage.locator('[data-testid="header-credit-balance"]')).toBeVisible()
  })

  test("header-credit-balance a un attribut data-level parmi normal|warning|danger", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")

    const badge = membrePage.locator('[data-testid="header-credit-balance"]')
    await expect(badge).toBeVisible()

    const level = await badge.getAttribute("data-level")
    expect(["normal", "warning", "danger"]).toContain(level)
  })

  test("le header affiche un nombre suivi de 'crédit'", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")

    const badge = membrePage.locator('[data-testid="header-credit-balance"]')
    const text = await badge.textContent()
    expect(text).toMatch(/-?\d+\s*crédit/)
  })

  test("le header est au-dessus de la nav dans le DOM", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")

    const header = membrePage.locator('[data-testid="dashboard-header"]')
    const nav    = membrePage.locator('[data-testid="dashboard-nav"]')

    const headerY = await header.boundingBox().then((b) => b?.y ?? 0)
    const navY    = await nav.boundingBox().then((b) => b?.y ?? 0)

    expect(headerY).toBeLessThan(navY)
  })

  test("header-credit-balance visible sur /dashboard/recharger (layout partagé)", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/recharger")
    await expect(membrePage.locator('[data-testid="header-credit-balance"]')).toBeVisible()
  })

  test("header-credit-balance visible sur /dashboard/historique (layout partagé)", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/historique")
    await expect(membrePage.locator('[data-testid="header-credit-balance"]')).toBeVisible()
  })

  test("solde > 1 → data-level='normal', pas de rouge ni d'orange", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")

    const badge = membrePage.locator('[data-testid="header-credit-balance"]')
    const text  = await badge.textContent()
    const credits = parseInt(text?.match(/-?\d+/)?.[0] ?? "0", 10)

    if (credits > 1) {
      await expect(badge).toHaveAttribute("data-level", "normal")
      const className = await badge.getAttribute("class")
      expect(className).not.toMatch(/red|orange/)
    }
  })

  test("solde = 1 → data-level='warning', classe orange", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")

    const badge = membrePage.locator('[data-testid="header-credit-balance"]')
    const text  = await badge.textContent()
    const credits = parseInt(text?.match(/-?\d+/)?.[0] ?? "5", 10)

    if (credits === 1) {
      await expect(badge).toHaveAttribute("data-level", "warning")
      const className = await badge.getAttribute("class")
      expect(className).toMatch(/orange/)
    }
  })

  test("solde ≤ 0 → data-level='danger', classe rouge", async ({ pauvreMembrePage }) => {
    await pauvreMembrePage.goto("/dashboard")

    const badge = pauvreMembrePage.locator('[data-testid="header-credit-balance"]')
    const text  = await badge.textContent()
    const credits = parseInt(text?.match(/-?\d+/)?.[0] ?? "5", 10)

    if (credits <= 0) {
      await expect(badge).toHaveAttribute("data-level", "danger")
      const className = await badge.getAttribute("class")
      expect(className).toMatch(/red/)
    }
  })
})

// ─── Onglet Réserver — calendrier dans div scrollable ────────────────────────

test.describe("Onglet Réserver — calendrier dans div scrollable", () => {
  test("booking-calendar-container est présent sur /dashboard", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    await expect(membrePage.locator('[data-testid="booking-calendar-container"]')).toBeVisible()
  })

  test("booking-calendar-container a overflow-y: auto ou scroll", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    await membrePage.waitForSelector('[data-testid="booking-calendar"]', { timeout: 10000 })

    const container = membrePage.locator('[data-testid="booking-calendar-container"]')
    const overflowY = await container.evaluate(
      (el) => window.getComputedStyle(el).overflowY
    )
    expect(["auto", "scroll"]).toContain(overflowY)
  })

  test("booking-calendar-container a une max-height définie", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    await membrePage.waitForSelector('[data-testid="booking-calendar"]', { timeout: 10000 })

    const container = membrePage.locator('[data-testid="booking-calendar-container"]')
    const maxHeight = await container.evaluate(
      (el) => window.getComputedStyle(el).maxHeight
    )
    // La max-height ne doit pas être "none"
    expect(maxHeight).not.toBe("none")
    expect(maxHeight).not.toBe("")
  })

  test("booking-calendar est à l'intérieur du container scrollable", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    await membrePage.waitForSelector('[data-testid="booking-calendar"]', { timeout: 10000 })

    const calendar = membrePage
      .locator('[data-testid="booking-calendar-container"]')
      .locator('[data-testid="booking-calendar"]')
    await expect(calendar).toBeVisible()
  })

  test("le calendrier affiche des tuiles de créneaux (slot-tile)", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    await membrePage.waitForSelector('[data-testid="slot-tile"]', { timeout: 10000 })
    await expect(membrePage.locator('[data-testid="slot-tile"]').first()).toBeVisible()
  })

  test("la section 'Réservations à venir' est visible sous le calendrier", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    await expect(membrePage.locator('[data-testid="upcoming-reservations"]')).toBeVisible()
  })
})

// ─── Onglet Réserver — dates passées et today ────────────────────────────────

test.describe("Onglet Réserver — BookingCalendar : dates passées et today", () => {
  test("les cellules de dates passées ont l'attribut data-past='true'", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    await membrePage.waitForSelector('[data-testid="slot-tile"]', { timeout: 10000 })

    const today = new Date()
    if (today.getDate() > 1) {
      // Il doit exister au moins une cellule passée dans le mois
      const pastCells = membrePage.locator('[data-past="true"]')
      await expect(pastCells.first()).toBeVisible()
    }
  })

  test("les cellules passées ont une opacité réduite (classe opacity-*)", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    await membrePage.waitForSelector('[data-testid="slot-tile"]', { timeout: 10000 })

    const today = new Date()
    if (today.getDate() > 1) {
      const pastCells = membrePage.locator('[data-past="true"]')
      const count = await pastCells.count()
      if (count > 0) {
        const className = await pastCells.first().getAttribute("class")
        expect(className).toMatch(/opacity/)
      }
    }
  })

  test("la cellule du jour actuel a l'attribut data-today='true' (si jour ouvert)", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    await membrePage.waitForSelector('[data-testid="slot-tile"]', { timeout: 10000 })

    const dayOfWeek = new Date().getDay()
    if ([1, 2, 3].includes(dayOfWeek)) {
      // Aujourd'hui est un jour ouvert → la cellule doit avoir data-today="true"
      const todayCell = membrePage.locator('[data-today="true"]')
      await expect(todayCell).toBeVisible()
    }
  })

  test("la cellule du jour actuel a un ring visible (si jour ouvert)", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    await membrePage.waitForSelector('[data-testid="slot-tile"]', { timeout: 10000 })

    const dayOfWeek = new Date().getDay()
    if ([1, 2, 3].includes(dayOfWeek)) {
      const todayCell = membrePage.locator('[data-today="true"]')
      await expect(todayCell).toBeVisible()
      const todayIndicator = todayCell.locator("div.border-blue-500")
      await expect(todayIndicator).toBeVisible()
    }
  })

  test("cliquer sur une tuile passée n'ouvre pas le panneau de réservation", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    await membrePage.waitForSelector('[data-testid="slot-tile"]', { timeout: 10000 })

    const today = new Date()
    if (today.getDate() > 1) {
      const yesterday = new Date(today)
      yesterday.setDate(yesterday.getDate() - 1)
      const ymd = [
        yesterday.getFullYear(),
        String(yesterday.getMonth() + 1).padStart(2, "0"),
        String(yesterday.getDate()).padStart(2, "0"),
      ].join("-")

      const pastTile = membrePage.locator(`[data-testid="slot-tile"][data-date="${ymd}"]`).first()
      if (await pastTile.isVisible()) {
        await pastTile.click({ force: true })
        await membrePage.waitForTimeout(400)
        await expect(membrePage.locator('[data-testid="booking-summary"]')).not.toBeVisible()
      }
    }
  })
})

// ─── Onglet Recharger — packs de crédits ─────────────────────────────────────

test.describe("Onglet Recharger — packs de crédits", () => {
  test("la page /dashboard/recharger affiche les packs de crédits", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/recharger")
    await expect(membrePage.locator('[data-testid="credit-packs"]')).toBeVisible()
  })

  test("les 3 packs (5, 10, 20 crédits) sont affichés", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/recharger")

    await expect(membrePage.locator('[data-testid="credit-pack-5"]')).toBeVisible()
    await expect(membrePage.locator('[data-testid="credit-pack-10"]')).toBeVisible()
    await expect(membrePage.locator('[data-testid="credit-pack-20"]')).toBeVisible()
  })

  test("chaque pack affiche un prix en euros", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/recharger")

    const price = membrePage.locator('[data-testid="pack-price-5"]')
    await expect(price).toBeVisible()
    const text = await price.textContent()
    expect(text).toMatch(/€/)
  })

  test("le calendrier de réservation n'est PAS visible sur /dashboard/recharger", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/recharger")
    // Attendre que la page soit chargée
    await membrePage.waitForLoadState("networkidle")
    await expect(membrePage.locator('[data-testid="booking-calendar"]')).not.toBeVisible()
  })

  test("les réservations à venir ne sont PAS sur /dashboard/recharger", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/recharger")
    await membrePage.waitForLoadState("networkidle")
    await expect(membrePage.locator('[data-testid="upcoming-reservations"]')).not.toBeVisible()
  })
})

// ─── Onglet Historique — transactions scrollable ──────────────────────────────

test.describe("Onglet Historique — liste des transactions avec scroll", () => {
  test("la page /dashboard/historique affiche transaction-list-scroll", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/historique")
    await expect(membrePage.locator('[data-testid="transaction-list-scroll"]')).toBeVisible()
  })

  test("transaction-list-scroll a overflow-y: auto ou scroll", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/historique")

    const scroll = membrePage.locator('[data-testid="transaction-list-scroll"]')
    await expect(scroll).toBeVisible()

    const overflowY = await scroll.evaluate(
      (el) => window.getComputedStyle(el).overflowY
    )
    expect(["auto", "scroll"]).toContain(overflowY)
  })

  test("transaction-list-scroll a une max-height définie", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/historique")

    const scroll = membrePage.locator('[data-testid="transaction-list-scroll"]')
    const maxHeight = await scroll.evaluate(
      (el) => window.getComputedStyle(el).maxHeight
    )
    expect(maxHeight).not.toBe("none")
    expect(maxHeight).not.toBe("")
  })

  test("transaction-history est accessible (non-régression slice-02)", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/historique")
    await expect(membrePage.locator('[data-testid="transaction-history"]')).toBeVisible()
  })

  test("les transactions sont listées avec un label lisible", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/historique")

    const items = membrePage.locator('[data-testid="transaction-item"]')
    const count = await items.count()

    if (count > 0) {
      const text = await items.first().textContent()
      expect(text).toMatch(
        /Réservation|Rechargement|Remboursement|Crédit de bienvenue|Ajustement/
      )
    }
  })

  test("les montants positifs ont data-sign='positive' et une classe verte", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/historique")

    const positives = membrePage.locator('[data-testid="transaction-amount"][data-sign="positive"]')
    const count = await positives.count()
    if (count > 0) {
      const className = await positives.first().getAttribute("class")
      expect(className).toMatch(/green/)
    }
  })

  test("les montants négatifs ont data-sign='negative' et une classe rouge", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/historique")

    const negatives = membrePage.locator('[data-testid="transaction-amount"][data-sign="negative"]')
    const count = await negatives.count()
    if (count > 0) {
      const className = await negatives.first().getAttribute("class")
      expect(className).toMatch(/red/)
    }
  })

  test("les montants positifs affichent un signe '+'", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/historique")

    const positives = membrePage.locator('[data-testid="transaction-amount"][data-sign="positive"]')
    const count = await positives.count()
    if (count > 0) {
      const text = await positives.first().textContent()
      expect(text).toMatch(/^\+/)
    }
  })

  test("absence de transactions → transaction-empty visible", async ({ pauvreMembrePage }) => {
    await pauvreMembrePage.goto("/dashboard/historique")

    const scroll = pauvreMembrePage.locator('[data-testid="transaction-list-scroll"]')
    await expect(scroll).toBeVisible()

    const items = pauvreMembrePage.locator('[data-testid="transaction-item"]')
    const count = await items.count()

    if (count === 0) {
      await expect(pauvreMembrePage.locator('[data-testid="transaction-empty"]')).toBeVisible()
    }
  })

  test("le calendrier n'est PAS visible sur /dashboard/historique", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/historique")
    await membrePage.waitForLoadState("networkidle")
    await expect(membrePage.locator('[data-testid="booking-calendar"]')).not.toBeVisible()
  })

  test("les réservations à venir ne sont PAS sur /dashboard/historique", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/historique")
    await membrePage.waitForLoadState("networkidle")
    await expect(membrePage.locator('[data-testid="upcoming-reservations"]')).not.toBeVisible()
  })
})

// ─── Non-régression — testids et comportements existants ──────────────────────

test.describe("Non-régression — slice-02 et slice-03", () => {
  test("credit-balance (BalanceBadge réactif) reste sur /dashboard", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    await expect(membrePage.locator('[data-testid="credit-balance"]')).toBeVisible()
  })

  test("upcoming-reservations reste sur /dashboard", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    await expect(membrePage.locator('[data-testid="upcoming-reservations"]')).toBeVisible()
  })

  test("les packs de crédits ne sont plus sur /dashboard (déplacés vers /recharger)", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    await membrePage.waitForLoadState("networkidle")
    await expect(membrePage.locator('[data-testid="credit-packs"]')).not.toBeVisible()
  })

  test("l'historique des transactions n'est plus sur /dashboard (déplacé vers /historique)", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    await membrePage.waitForLoadState("networkidle")
    // transaction-history est sur /historique, pas sur /dashboard
    await expect(membrePage.locator('[data-testid="transaction-history"]')).not.toBeVisible()
  })

  test("un admin est redirigé vers /admin s'il accède à /dashboard", async ({ adminPage }) => {
    await adminPage.goto("/dashboard")
    await expect(adminPage).toHaveURL(/\/admin/)
  })

  test("un utilisateur non connecté est redirigé vers /login depuis /dashboard", async ({ page }) => {
    await page.goto("/dashboard")
    await expect(page).toHaveURL(/\/login/)
  })
})
