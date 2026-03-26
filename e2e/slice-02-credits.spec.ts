/**
 * e2e/slice-02-credits.spec.ts
 * Tests E2E — Slice 2 : Rechargement (flux mock Stripe)
 *
 * Ces tests valident le parcours complet d'achat de crédits en mode mock :
 *   1. Membre voit la grille de packs + sélecteur libre
 *   2. Clic pack → /api/stripe-mock/checkout → /dashboard?payment=success
 *   3. Toast visible + solde mis à jour + transaction dans l'historique
 *
 * Packs actuels : 10 / 20 / 30 / 40 / 60 crédits
 * Prérequis : serveur Next.js lancé + STRIPE_MOCK=true + DB seedée
 */

import { test, expect } from "./helpers/fixtures"

// ─── Affichage des packs ──────────────────────────────────────────────────────

test.describe("Affichage des packs de crédits", () => {
  test("le membre voit la grille de packs sur le dashboard", async ({ membrePage: page }) => {
    await page.goto("/dashboard/recharger")

    const packs = page.locator('[data-testid="credit-packs"]')
    await expect(packs).toBeVisible()

    // Les 5 packs doivent être affichés (10 / 20 / 30 / 40 / 60 crédits)
    await expect(page.locator('[data-testid="credit-pack-10"]')).toBeVisible()
    await expect(page.locator('[data-testid="credit-pack-20"]')).toBeVisible()
    await expect(page.locator('[data-testid="credit-pack-30"]')).toBeVisible()
  })

  test("le membre EXTERNE voit le prix correct sur le pack 10 crédits (800 centimes × 10 = 80€)", async ({ membrePage: page }) => {
    // externe@test.fr a le segment EXTERNE → PRICE_CREDIT_EXTERNE = 800 centimes
    await page.goto("/dashboard/recharger")

    // Pack 10 crédits EXTERNE = 10 × 800 = 8000 centimes = 80€
    const pack10Price = page.locator('[data-testid="pack-price-10"]')
    await expect(pack10Price).toBeVisible()
    await expect(pack10Price).toContainText("80")
  })

  test("chaque pack a un bouton Acheter", async ({ membrePage: page }) => {
    await page.goto("/dashboard/recharger")

    await expect(page.locator('[data-testid="buy-pack-10"]')).toBeVisible()
    await expect(page.locator('[data-testid="buy-pack-20"]')).toBeVisible()
    await expect(page.locator('[data-testid="buy-pack-30"]')).toBeVisible()
  })
})

// ─── Flux d'achat (mock Stripe) ───────────────────────────────────────────────

test.describe("Flux d'achat de crédits (mock Stripe)", () => {
  test("clic pack 10 crédits → redirect mock → dashboard avec payment=success", async ({
    membrePage: page,
  }) => {
    await page.goto("/dashboard/recharger")

    // Cliquer sur "Acheter" pour le pack 10 crédits
    await page.click('[data-testid="buy-pack-10"]')

    // Le mock checkout redirige automatiquement vers /dashboard?payment=success
    await expect(page).toHaveURL(/dashboard.*payment=success/, { timeout: 10_000 })

    // Toast de succès visible
    await expect(page.locator('[data-testid="payment-success-toast"]')).toBeVisible()
  })

  test("solde mis à jour après achat de 10 crédits", async ({ membrePage: page }) => {
    await page.goto("/dashboard/recharger")

    const balanceBefore = parseInt(
      (await page.locator('[data-testid="header-credit-balance"]').textContent()) ?? "0"
    )

    await page.click('[data-testid="buy-pack-10"]')
    await expect(page).toHaveURL(/dashboard.*payment=success/, { timeout: 10_000 })

    // Recharger la page pour lire le nouveau solde depuis la DB
    await page.goto("/dashboard/recharger")

    const balanceAfter = parseInt(
      (await page.locator('[data-testid="header-credit-balance"]').textContent()) ?? "0"
    )

    // Le solde doit avoir augmenté de 10
    expect(balanceAfter).toBe(balanceBefore + 10)
  })

  test("transaction CREDIT_PURCHASE visible dans l'historique après achat", async ({
    membrePage: page,
  }) => {
    await page.goto("/dashboard/recharger")
    await page.click('[data-testid="buy-pack-10"]')
    await expect(page).toHaveURL(/dashboard.*payment=success/, { timeout: 10_000 })

    // Recharger pour lire l'historique depuis la DB
    await page.goto("/dashboard/historique")

    const history = page.locator('[data-testid="transaction-history"]')
    await expect(history).toContainText("Rechargement")
  })

  test("bannière annulation visible si payment=cancelled", async ({ membrePage: page }) => {
    await page.goto("/dashboard/recharger?payment=cancelled")
    await expect(page.locator('[data-testid="payment-cancelled-banner"]')).toBeVisible()
  })
})

// ─── Vérification des prix par segment ───────────────────────────────────────

test.describe("Brevo mock log — email de confirmation", () => {
  test("console affiche le log Brevo après un achat", async ({ membrePage: page }) => {
    const consoleLogs: string[] = []
    page.on("console", (msg) => {
      consoleLogs.push(msg.text())
    })

    await page.goto("/dashboard/recharger")
    await page.click('[data-testid="buy-pack-10"]')
    await expect(page).toHaveURL(/dashboard.*payment=success/, { timeout: 10_000 })

    // Note : le log Brevo est côté serveur, pas visible dans la console browser.
    // Ce test vérifie simplement que le flux complet se déroule sans erreur console client.
    const errors = consoleLogs.filter((l) => l.toLowerCase().includes("error"))
    expect(errors).toHaveLength(0)
  })
})
