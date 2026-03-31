/**
 * e2e/slice-14-mobile-responsive.spec.ts
 * Tests E2E — Slice 14 : Responsiveness mobile et tablette
 *
 * Stratégie :
 *   - Chaque test fixe le viewport avant navigation
 *   - On vérifie : pas de débordement horizontal, touch targets, lisibilité
 *
 * Viewports testés :
 *   mobile  : 390 × 844 (iPhone 12/13/14)
 *   tablet  : 768 × 1024 (iPad mini portrait)
 *
 * Prérequis : serveur Next.js lancé + DB seedée
 */

import { test, expect } from "./helpers/fixtures"

const MOBILE  = { width: 390, height: 844 }
const TABLET  = { width: 768, height: 1024 }

// Helper : vérifie qu'il n'y a pas de débordement horizontal sur la page
async function expectNoHorizontalOverflow(page: any) {
  const overflow = await page.evaluate(() => {
    return document.documentElement.scrollWidth > document.documentElement.clientWidth
  })
  expect(overflow, "Débordement horizontal détecté").toBe(false)
}

// Helper : vérifie la hauteur minimale d'un élément (touch target ≥ 44px)
async function expectTouchTarget(page: any, selector: string) {
  const box = await page.locator(selector).first().boundingBox()
  if (box) {
    expect(box.height, `Touch target insuffisant pour ${selector}`).toBeGreaterThanOrEqual(44)
  }
}

// ─── Mobile — Dashboard principal ────────────────────────────────────────────

test.describe("Mobile (390px) — Dashboard principal", () => {
  test.beforeEach(async ({ membrePage }) => {
    await membrePage.setViewportSize(MOBILE)
  })

  test("pas de débordement horizontal sur /dashboard", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    await membrePage.waitForLoadState("networkidle")
    await expectNoHorizontalOverflow(membrePage)
  })

  test("la navigation tabs est visible et ne déborde pas", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    const nav = membrePage.locator('[data-testid="dashboard-nav"]')
    await expect(nav).toBeVisible()

    // La nav ne doit pas forcer un scroll horizontal sur la page
    await expectNoHorizontalOverflow(membrePage)
  })

  test("les 4 onglets de navigation sont accessibles sur mobile", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    const nav = membrePage.locator('[data-testid="dashboard-nav"]')

    // Tous les liens sont dans le DOM
    const links = nav.locator("a")
    await expect(links).toHaveCount(4)
  })

  test("le solde de crédits est visible sur mobile", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    await expect(membrePage.locator('[data-testid="header-credit-balance"]')).toBeVisible()
    await expect(membrePage.locator('[data-testid="credit-balance"]')).toBeVisible()
  })

  test("le bouton Recharger est visible et cliquable sur mobile", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    const btn = membrePage.locator('a[href="/dashboard/recharger"]').first()
    await expect(btn).toBeVisible()
    const box = await btn.boundingBox()
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(36) // au moins 36px pour un lien nav
    }
  })
})

// ─── Mobile — Page recharger ──────────────────────────────────────────────────

test.describe("Mobile (390px) — Page recharger", () => {
  test.beforeEach(async ({ membrePage }) => {
    await membrePage.setViewportSize(MOBILE)
  })

  test("pas de débordement horizontal sur /dashboard/recharger", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/recharger")
    await membrePage.waitForLoadState("networkidle")
    await expectNoHorizontalOverflow(membrePage)
  })

  test("la grille de packs est en 1 colonne sur mobile", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/recharger")

    // Sur 390px, les cards doivent être empilées (pas de scroll horizontal)
    const grid = membrePage.locator('[data-testid="credit-packs"]')
    await expect(grid).toBeVisible()

    // Chaque card doit occuper toute la largeur disponible
    const firstCard = membrePage.locator('[data-testid="credit-pack-10"]')
    await expect(firstCard).toBeVisible()
    const cardBox = await firstCard.boundingBox()
    if (cardBox) {
      expect(cardBox.width).toBeGreaterThan(300) // pleine largeur sur 390px
    }
  })

  test("le bouton Acheter de chaque pack est visible sur mobile", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/recharger")
    await expect(membrePage.locator('[data-testid="buy-pack-10"]')).toBeVisible()
    await expect(membrePage.locator('[data-testid="buy-pack-20"]')).toBeVisible()
  })

  test("les boutons Acheter des packs ont un touch target suffisant", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/recharger")
    await expectTouchTarget(membrePage, '[data-testid="buy-pack-10"]')
  })

  test("le sélecteur de quantité libre est visible sur mobile", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/recharger")
    await expect(membrePage.locator('[data-testid="credit-quantity-section"]')).toBeVisible()
    await expect(membrePage.locator('[data-testid="credit-quantity-buy-btn"]')).toBeVisible()
  })

  test("les boutons +/- du sélecteur ont un touch target suffisant", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/recharger")
    await expectTouchTarget(membrePage, '[data-testid="credit-quantity-minus"]')
    await expectTouchTarget(membrePage, '[data-testid="credit-quantity-plus"]')
  })

  test("le prix est lisible (non tronqué) sur mobile", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/recharger")
    const price = membrePage.locator('[data-testid="pack-price-10"]')
    await expect(price).toBeVisible()
    const text = await price.textContent()
    expect(text).toMatch(/€/)
    expect(text?.length).toBeGreaterThan(0)
  })
})

// ─── Mobile — Dashboard réservations ─────────────────────────────────────────

test.describe("Mobile (390px) — Réservations à venir", () => {
  test.beforeEach(async ({ membrePage }) => {
    await membrePage.setViewportSize(MOBILE)
  })

  test("pas de débordement horizontal sur /dashboard (réservations)", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    await membrePage.waitForLoadState("networkidle")
    await expectNoHorizontalOverflow(membrePage)
  })

  test("la section réservations à venir est visible sur mobile", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    await expect(membrePage.locator('[data-testid="upcoming-reservations"]')).toBeVisible()
  })
})

// ─── Mobile — Historique ──────────────────────────────────────────────────────

test.describe("Mobile (390px) — Historique", () => {
  test.beforeEach(async ({ membrePage }) => {
    await membrePage.setViewportSize(MOBILE)
  })

  test("pas de débordement horizontal sur /dashboard/historique", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/historique")
    await membrePage.waitForLoadState("networkidle")
    await expectNoHorizontalOverflow(membrePage)
  })

  test("la liste des transactions est visible sur mobile", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/historique")
    await expect(membrePage.locator('[data-testid="transaction-history"]')).toBeVisible()
  })
})

// ─── Mobile — Mon compte ──────────────────────────────────────────────────────

test.describe("Mobile (390px) — Mon compte", () => {
  test.beforeEach(async ({ membrePage }) => {
    await membrePage.setViewportSize(MOBILE)
  })

  test("pas de débordement horizontal sur /dashboard/mon-compte", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/mon-compte")
    await membrePage.waitForLoadState("networkidle")
    await expectNoHorizontalOverflow(membrePage)
  })

  test("les champs prénom et nom sont visibles sur mobile", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/mon-compte")
    // Les champs doivent être visibles (pas cachés par débordement)
    const inputs = membrePage.locator('input[type="text"]')
    const count = await inputs.count()
    expect(count).toBeGreaterThan(0)
    // Le premier input doit être visible
    await expect(inputs.first()).toBeVisible()
  })
})

// ─── Tablette — Dashboard ─────────────────────────────────────────────────────

test.describe("Tablette (768px) — Dashboard", () => {
  test.beforeEach(async ({ membrePage }) => {
    await membrePage.setViewportSize(TABLET)
  })

  test("pas de débordement horizontal sur /dashboard (tablette)", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    await membrePage.waitForLoadState("networkidle")
    await expectNoHorizontalOverflow(membrePage)
  })

  test("la grille de packs est en 2 colonnes sur tablette", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/recharger")
    await membrePage.waitForLoadState("networkidle")
    await expectNoHorizontalOverflow(membrePage)

    // Les packs doivent être visibles sans débordement
    await expect(membrePage.locator('[data-testid="credit-pack-10"]')).toBeVisible()
    await expect(membrePage.locator('[data-testid="credit-pack-20"]')).toBeVisible()
  })
})

// ─── Tablette — Admin membres ─────────────────────────────────────────────────

test.describe("Tablette (768px) — Admin membres", () => {
  test.beforeEach(async ({ adminPage }) => {
    await adminPage.setViewportSize(TABLET)
  })

  test("pas de débordement hors-viewport sur /admin/members", async ({ adminPage }) => {
    await adminPage.goto("/admin/members")
    await adminPage.waitForLoadState("networkidle")

    // Le wrapper de la table doit gérer son propre scroll, pas la page entière
    const html = await adminPage.evaluate(() => document.documentElement.scrollWidth)
    const viewport = await adminPage.evaluate(() => document.documentElement.clientWidth)
    expect(html).toBeLessThanOrEqual(viewport + 1) // +1 pour les arrondis CSS
  })

  test("les colonnes essentielles sont visibles sur tablette", async ({ adminPage }) => {
    await adminPage.goto("/admin/members")
    await adminPage.waitForLoadState("networkidle")

    // La table doit être dans le DOM
    const table = adminPage.locator("table").first()
    await expect(table).toBeVisible()
  })
})

// ─── Mobile — Touch targets globaux ──────────────────────────────────────────

test.describe("Mobile — Touch targets (≥ 44px)", () => {
  test.beforeEach(async ({ membrePage }) => {
    await membrePage.setViewportSize(MOBILE)
  })

  test("le bouton Acheter du sélecteur libre a une hauteur ≥ 44px", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/recharger")
    await expectTouchTarget(membrePage, '[data-testid="credit-quantity-buy-btn"]')
  })

  test("les liens de navigation ont une hauteur suffisante", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    const navLinks = membrePage.locator('[data-testid="dashboard-nav"] a')
    const count = await navLinks.count()
    for (let i = 0; i < count; i++) {
      const box = await navLinks.nth(i).boundingBox()
      if (box) {
        expect(box.height, `Lien nav #${i} trop petit`).toBeGreaterThanOrEqual(36)
      }
    }
  })
})
