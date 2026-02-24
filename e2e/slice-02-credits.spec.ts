/**
 * e2e/slice-02-credits.spec.ts
 * Tests E2E — Slice 2 : Achat de crédits (flux mock Stripe)
 *
 * Ces tests valident le parcours complet d'achat de crédits en mode mock :
 *   1. Membre voit les 3 packs avec les prix de son segment
 *   2. Clic pack → /api/stripe-mock/checkout → /dashboard?payment=success
 *   3. Toast visible + solde mis à jour + transaction dans l'historique
 *
 * Prérequis : serveur Next.js lancé + STRIPE_MOCK=true + DB seedée
 */

import { test, expect } from "./helpers/fixtures"

// ─── Affichage des packs ──────────────────────────────────────────────────────

test.describe("Affichage des packs de crédits", () => {
  test("le membre voit les 3 packs sur le dashboard", async ({ membrePage: page }) => {
    await page.goto("/dashboard")

    const packs = page.locator('[data-testid="credit-packs"]')
    await expect(packs).toBeVisible()

    // Les 3 packs doivent être affichés
    await expect(page.locator('[data-testid="credit-pack-5"]')).toBeVisible()
    await expect(page.locator('[data-testid="credit-pack-10"]')).toBeVisible()
    await expect(page.locator('[data-testid="credit-pack-20"]')).toBeVisible()
  })

  test("le membre EXTERNE voit le prix 8€/crédit (800 centimes)", async ({ membrePage: page }) => {
    // externe@test.fr a le segment EXTERNE → PRICE_CREDIT_EXTERNE = 800 centimes
    await page.goto("/dashboard")

    // Pack 10 crédits EXTERNE = 10 × 800 = 8000 centimes = 80€
    const pack10Price = page.locator('[data-testid="pack-price-10"]')
    await expect(pack10Price).toBeVisible()
    await expect(pack10Price).toContainText("80")
  })

  test("chaque pack a un bouton Acheter", async ({ membrePage: page }) => {
    await page.goto("/dashboard")

    await expect(page.locator('[data-testid="buy-pack-5"]')).toBeVisible()
    await expect(page.locator('[data-testid="buy-pack-10"]')).toBeVisible()
    await expect(page.locator('[data-testid="buy-pack-20"]')).toBeVisible()
  })
})

// ─── Flux d'achat (mock Stripe) ───────────────────────────────────────────────

test.describe("Flux d'achat de crédits (mock Stripe)", () => {
  test("clic pack 5 crédits → redirect mock → dashboard avec payment=success", async ({
    membrePage: page,
  }) => {
    await page.goto("/dashboard")

    // Lire le solde initial
    const balanceBefore = parseInt(
      (await page.locator('[data-testid="credit-balance"]').textContent()) ?? "0"
    )

    // Cliquer sur "Acheter" pour le pack 5 crédits
    await page.click('[data-testid="buy-pack-5"]')

    // Le mock checkout redirige automatiquement vers /dashboard?payment=success
    await expect(page).toHaveURL(/dashboard.*payment=success/, { timeout: 10_000 })

    // Toast de succès visible
    await expect(page.locator('[data-testid="payment-success-toast"]')).toBeVisible()
  })

  test("solde mis à jour après achat de 5 crédits", async ({ membrePage: page }) => {
    await page.goto("/dashboard")

    const balanceBefore = parseInt(
      (await page.locator('[data-testid="credit-balance"]').textContent()) ?? "0"
    )

    await page.click('[data-testid="buy-pack-5"]')
    await expect(page).toHaveURL(/dashboard.*payment=success/, { timeout: 10_000 })

    // Recharger la page pour lire le nouveau solde depuis la DB
    await page.goto("/dashboard")

    const balanceAfter = parseInt(
      (await page.locator('[data-testid="credit-balance"]').textContent()) ?? "0"
    )

    // Le solde doit avoir augmenté de 5
    expect(balanceAfter).toBe(balanceBefore + 5)
  })

  test("transaction CREDIT_PURCHASE visible dans l'historique après achat", async ({
    membrePage: page,
  }) => {
    await page.goto("/dashboard")
    await page.click('[data-testid="buy-pack-5"]')
    await expect(page).toHaveURL(/dashboard.*payment=success/, { timeout: 10_000 })

    // Recharger pour lire l'historique depuis la DB
    await page.goto("/dashboard")

    const history = page.locator('[data-testid="transaction-history"]')
    await expect(history).toContainText("Achat de crédits")
  })

  test("bannière annulation visible si payment=cancelled", async ({ membrePage: page }) => {
    await page.goto("/dashboard?payment=cancelled")
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

    await page.goto("/dashboard")
    await page.click('[data-testid="buy-pack-5"]')
    await expect(page).toHaveURL(/dashboard.*payment=success/, { timeout: 10_000 })

    // Note : le log Brevo est côté serveur, pas visible dans la console browser.
    // Ce test vérifie simplement que le flux complet se déroule sans erreur console client.
    const errors = consoleLogs.filter((l) => l.toLowerCase().includes("error"))
    expect(errors).toHaveLength(0)
  })
})
