/**
 * e2e/slice-13-stripe.spec.ts
 * Tests E2E — Slice 13 : Achat de crédits à quantité libre via Stripe
 *
 * Valide :
 *   1. L'affichage du sélecteur de quantité (remplace les packs fixes)
 *   2. Le comportement des boutons +/- avec les bornes min/max
 *   3. La mise à jour dynamique du prix affiché
 *   4. Le flux d'achat complet (mock Stripe) → succès + solde mis à jour
 *
 * Prérequis : serveur Next.js lancé + STRIPE_MOCK=true + DB seedée
 */

import { test, expect } from "./helpers/fixtures"

// ─── Sélecteur de quantité — affichage ───────────────────────────────────────

test.describe("Sélecteur de quantité — affichage", () => {
  test("le sélecteur de quantité est visible sur la page de recharge", async ({
    membrePage: page,
  }) => {
    await page.goto("/dashboard/recharger")
    await expect(page.locator('[data-testid="credit-quantity-section"]')).toBeVisible()
  })

  test("la quantité par défaut est 5", async ({ membrePage: page }) => {
    await page.goto("/dashboard/recharger")
    const display = page.locator('[data-testid="credit-quantity-display"]')
    await expect(display).toBeVisible()
    await expect(display).toContainText("5")
  })

  test("les boutons + et - sont présents", async ({ membrePage: page }) => {
    await page.goto("/dashboard/recharger")
    await expect(page.locator('[data-testid="credit-quantity-minus"]')).toBeVisible()
    await expect(page.locator('[data-testid="credit-quantity-plus"]')).toBeVisible()
  })

  test("le prix total est affiché", async ({ membrePage: page }) => {
    await page.goto("/dashboard/recharger")
    await expect(page.locator('[data-testid="credit-quantity-price"]')).toBeVisible()
  })

  test("le bouton Acheter est présent", async ({ membrePage: page }) => {
    await page.goto("/dashboard/recharger")
    await expect(page.locator('[data-testid="credit-quantity-buy-btn"]')).toBeVisible()
  })
})

// ─── Sélecteur de quantité — interactions ────────────────────────────────────

test.describe("Sélecteur de quantité — boutons +/-", () => {
  test("le bouton + augmente la quantité de 1", async ({ membrePage: page }) => {
    await page.goto("/dashboard/recharger")

    const display = page.locator('[data-testid="credit-quantity-display"]')
    // Quantité par défaut : 5
    await expect(display).toContainText("5")

    await page.locator('[data-testid="credit-quantity-plus"]').click()
    await expect(display).toContainText("6")
  })

  test("le bouton - diminue la quantité de 1", async ({ membrePage: page }) => {
    await page.goto("/dashboard/recharger")

    const display = page.locator('[data-testid="credit-quantity-display"]')
    // Quantité par défaut : 5
    await expect(display).toContainText("5")

    await page.locator('[data-testid="credit-quantity-minus"]').click()
    await expect(display).toContainText("4")
  })

  test("le bouton - est désactivé quand quantity === 1 (minimum)", async ({
    membrePage: page,
  }) => {
    await page.goto("/dashboard/recharger")

    const minusBtn = page.locator('[data-testid="credit-quantity-minus"]')
    // Descendre jusqu'à 1
    for (let i = 0; i < 4; i++) {
      await minusBtn.click()
    }

    const display = page.locator('[data-testid="credit-quantity-display"]')
    await expect(display).toContainText("1")
    await expect(minusBtn).toBeDisabled()
  })

  test("le bouton - ne peut pas descendre en dessous de 1", async ({ membrePage: page }) => {
    await page.goto("/dashboard/recharger")

    const minusBtn = page.locator('[data-testid="credit-quantity-minus"]')
    // Tenter de descendre en dessous de 1 en cliquant 10 fois
    for (let i = 0; i < 10; i++) {
      const isDisabled = await minusBtn.isDisabled()
      if (isDisabled) break
      await minusBtn.click()
    }

    const display = page.locator('[data-testid="credit-quantity-display"]')
    const text = await display.textContent()
    const quantity = parseInt(text ?? "0")
    expect(quantity).toBeGreaterThanOrEqual(1)
  })

  test("le bouton + est désactivé quand quantity === 50 (maximum)", async ({
    membrePage: page,
  }) => {
    await page.goto("/dashboard/recharger")

    const plusBtn = page.locator('[data-testid="credit-quantity-plus"]')
    // Monter jusqu'à 50 (depuis 5, il faut cliquer 45 fois)
    for (let i = 0; i < 45; i++) {
      const isDisabled = await plusBtn.isDisabled()
      if (isDisabled) break
      await plusBtn.click()
    }

    const display = page.locator('[data-testid="credit-quantity-display"]')
    await expect(display).toContainText("50")
    await expect(plusBtn).toBeDisabled()
  })

  test("le prix total se met à jour quand la quantité change", async ({
    membrePage: page,
  }) => {
    await page.goto("/dashboard/recharger")

    const priceDisplay = page.locator('[data-testid="credit-quantity-price"]')
    const priceBefore = await priceDisplay.textContent()

    // Augmenter la quantité
    await page.locator('[data-testid="credit-quantity-plus"]').click()
    await page.locator('[data-testid="credit-quantity-plus"]').click()

    const priceAfter = await priceDisplay.textContent()
    // Le prix affiché doit avoir changé
    expect(priceAfter).not.toBe(priceBefore)
  })
})

// ─── Flux d'achat (mock Stripe) ───────────────────────────────────────────────

test.describe("Flux d'achat à quantité libre (mock Stripe)", () => {
  test("clic Acheter avec quantité 5 → redirect mock → dashboard payment=success", async ({
    membrePage: page,
  }) => {
    await page.goto("/dashboard/recharger")

    // S'assurer que la quantité est à 5 (par défaut)
    await expect(page.locator('[data-testid="credit-quantity-display"]')).toContainText("5")

    await page.locator('[data-testid="credit-quantity-buy-btn"]').click()

    // Le mock Stripe redirige vers /dashboard?payment=success
    await expect(page).toHaveURL(/dashboard.*payment=success/, { timeout: 10_000 })
  })

  test("le banner de succès est visible après paiement mock", async ({
    membrePage: page,
  }) => {
    await page.goto("/dashboard/recharger")
    await page.locator('[data-testid="credit-quantity-buy-btn"]').click()
    await expect(page).toHaveURL(/dashboard.*payment=success/, { timeout: 10_000 })

    await expect(page.locator('[data-testid="payment-success-toast"]')).toBeVisible()
  })

  test("le solde de crédits est incrémenté de la quantité achetée", async ({
    membrePage: page,
  }) => {
    await page.goto("/dashboard/recharger")

    const balanceBefore = parseInt(
      (await page.locator('[data-testid="header-credit-balance"]').textContent()) ?? "0"
    )

    // Quantité par défaut : 5
    await page.locator('[data-testid="credit-quantity-buy-btn"]').click()
    await expect(page).toHaveURL(/dashboard.*payment=success/, { timeout: 10_000 })

    // Recharger pour lire le nouveau solde depuis la DB
    await page.goto("/dashboard/recharger")

    const balanceAfter = parseInt(
      (await page.locator('[data-testid="header-credit-balance"]').textContent()) ?? "0"
    )

    expect(balanceAfter).toBe(balanceBefore + 5)
  })

  test("achat avec quantité personnalisée (3 crédits) → solde +3", async ({
    membrePage: page,
  }) => {
    await page.goto("/dashboard/recharger")

    const balanceBefore = parseInt(
      (await page.locator('[data-testid="header-credit-balance"]').textContent()) ?? "0"
    )

    // Descendre à 3 crédits (depuis 5 : 2 clics sur -)
    await page.locator('[data-testid="credit-quantity-minus"]').click()
    await page.locator('[data-testid="credit-quantity-minus"]').click()
    await expect(page.locator('[data-testid="credit-quantity-display"]')).toContainText("3")

    await page.locator('[data-testid="credit-quantity-buy-btn"]').click()
    await expect(page).toHaveURL(/dashboard.*payment=success/, { timeout: 10_000 })

    await page.goto("/dashboard/recharger")

    const balanceAfter = parseInt(
      (await page.locator('[data-testid="header-credit-balance"]').textContent()) ?? "0"
    )

    expect(balanceAfter).toBe(balanceBefore + 3)
  })

  test("transaction CREDIT_PURCHASE créée dans l'historique", async ({
    membrePage: page,
  }) => {
    await page.goto("/dashboard/recharger")
    await page.locator('[data-testid="credit-quantity-buy-btn"]').click()
    await expect(page).toHaveURL(/dashboard.*payment=success/, { timeout: 10_000 })

    await page.goto("/dashboard/historique")

    const history = page.locator('[data-testid="transaction-history"]')
    await expect(history).toContainText("Rechargement")
  })

  test("bannière annulation visible si payment=cancelled", async ({
    membrePage: page,
  }) => {
    await page.goto("/dashboard/recharger?payment=cancelled")
    await expect(page.locator('[data-testid="payment-cancelled-banner"]')).toBeVisible()
  })
})

// ─── Accès non authentifié ────────────────────────────────────────────────────

test.describe("Sélecteur de quantité — accès", () => {
  test("la page /dashboard/recharger redirige si non connecté", async ({ page }) => {
    // Navigateur sans session membre
    await page.goto("/dashboard/recharger")
    // Doit rediriger vers /login (ou /) — pas rester sur /dashboard
    await expect(page).not.toHaveURL("/dashboard/recharger")
  })
})
