/**
 * e2e/slice-08b-email-verification.spec.ts
 * Tests E2E — Slice 8b : Vérification d'adresse email
 *
 * Prérequis : serveur Next.js lancé + DB seedée.
 * Le seed doit inclure :
 *   - Les users existants avec emailVerified: new Date() (pour ne pas les bloquer)
 *   - Un user "unverified@test.fr" avec emailVerified: null (pour tester le blocage)
 *   - Un EmailVerificationToken valide lié à unverified@test.fr (pour tester l'auto-login)
 *
 * IMPACT SUR LES TESTS EXISTANTS :
 *   Quand slice-08b est implémentée, les tests d'inscription dans e2e/slice-01-auth.spec.ts
 *   doivent être mis à jour : le redirect post-inscription passe de /dashboard → /verify-email-sent.
 *   → Modifier les tests "un nouvel utilisateur peut créer un compte" et "tarifReduit=Oui..."
 *     pour attendre /verify-email-sent au lieu de /dashboard.
 */

import { test, expect } from "@playwright/test"
import { test as authTest } from "./helpers/fixtures"

// ─── Inscription → redirige vers /verify-email-sent ───────────────────────────

test.describe("Inscription — redirection vers verify-email-sent", () => {
  test("une inscription réussie redirige vers /verify-email-sent (PAS /dashboard)", async ({ page }) => {
    const uniqueEmail = `veriftest-${Date.now()}@test.fr`

    await page.goto("/register")
    await page.fill('[name="firstName"]', "Claire")
    await page.fill('[name="lastName"]', "Vérif")
    await page.fill('[name="email"]', uniqueEmail)
    await page.fill('[name="password"]', "TestPassword123!")
    await page.click('[data-testid="toggle-bouliacais-oui"]')
    await page.click('[data-testid="toggle-tarif-reduit-non"]')
    await page.check('[name="cgu"]')
    await page.click('[type="submit"]')

    // Slice 8b : plus d'auto-login → redirect vers la page d'attente
    await expect(page).toHaveURL("/verify-email-sent")
    await expect(page.locator('[data-testid="verify-email-sent-message"]')).toBeVisible()
  })

  test("la page /verify-email-sent affiche le message et le bouton de renvoi", async ({ page }) => {
    await page.goto("/verify-email-sent")

    await expect(page.locator('[data-testid="verify-email-sent-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="resend-btn"]')).toBeVisible()
  })

  test("le bouton 'Renvoyer' sur /verify-email-sent affiche une confirmation", async ({ page }) => {
    // Naviguer directement (pas besoin d'inscrire un vrai user pour tester l'UI)
    await page.goto("/verify-email-sent?email=unverified@test.fr")

    await page.click('[data-testid="resend-btn"]')

    // Message de confirmation visible (même si l'email n'arrive pas vraiment en test)
    await expect(page.locator('[data-testid="resend-success"]')).toBeVisible()
  })
})

// ─── Login bloqué pour email non vérifié ─────────────────────────────────────

test.describe("Login — blocage si email non vérifié", () => {
  test("connexion avec un email non vérifié affiche un message spécifique", async ({ page }) => {
    // unverified@test.fr doit être seedé avec emailVerified: null et password: TestPassword123!
    await page.goto("/login")
    await page.fill('[name="email"]', "unverified@test.fr")
    await page.fill('[name="password"]', "TestPassword123!")
    await page.click('[type="submit"]')

    // Reste sur /login avec message spécifique (pas "Email ou mot de passe incorrect")
    await expect(page).toHaveURL("/login")
    await expect(page.locator('[data-testid="email-not-verified-msg"]')).toBeVisible()
    await expect(page.locator('[data-testid="email-not-verified-msg"]')).toContainText(/vérif/i)
  })

  test("le lien 'Renvoyer l'email' sur la page login affiche une confirmation", async ({ page }) => {
    await page.goto("/login")
    await page.fill('[name="email"]', "unverified@test.fr")
    await page.fill('[name="password"]', "TestPassword123!")
    await page.click('[type="submit"]')

    // Cliquer sur le lien/bouton de renvoi
    const resendBtn = page.locator('[data-testid="resend-from-login-btn"]')
    await expect(resendBtn).toBeVisible()
    await resendBtn.click()

    // Confirmation de renvoi
    await expect(page.locator('[data-testid="resend-success"]')).toBeVisible()
  })
})

// ─── Page d'erreur de vérification ───────────────────────────────────────────

test.describe("Page d'erreur /verify-email-error", () => {
  test("token invalide → message d'erreur 'lien invalide'", async ({ page }) => {
    // Accéder directement à la route avec un token inexistant
    // La route API redirige vers /verify-email-error?reason=invalid
    await page.goto("/api/auth/verify-email?token=token-totalement-invalide-xyz")

    await expect(page).toHaveURL(/\/verify-email-error.*reason=invalid/)
    await expect(page.locator('[data-testid="verify-error-message"]')).toBeVisible()
    await expect(page.locator('[data-testid="verify-error-message"]')).toContainText(/invalide/i)
  })

  test("page /verify-email-error?reason=expired affiche le bon message et le bouton renvoi", async ({ page }) => {
    await page.goto("/verify-email-error?reason=expired")

    await expect(page.locator('[data-testid="verify-error-message"]')).toContainText(/expir/i)
    await expect(page.locator('[data-testid="resend-from-error-btn"]')).toBeVisible()
  })

  test("page /verify-email-error?reason=invalid affiche le bon message sans bouton renvoi", async ({ page }) => {
    await page.goto("/verify-email-error?reason=invalid")

    await expect(page.locator('[data-testid="verify-error-message"]')).toContainText(/invalide/i)
    // Pour un token invalide (potentiellement falsifié), pas de bouton renvoi → contacter le support
    await expect(page.locator('[data-testid="resend-from-error-btn"]')).not.toBeVisible()
  })
})

// ─── Auto-login après vérification réussie ────────────────────────────────────

test.describe("Auto-login post-vérification (nécessite token seedé en DB)", () => {
  test("token valide seedé → auto-login → /dashboard", async ({ page }) => {
    // Ce test nécessite que global.setup.ts seed :
    //   1. Un EmailVerificationToken valide pour unverified@test.fr
    //   2. Ou un VerifiedUserToken valide pour le callback
    //
    // Le SEED_VALID_VERIFY_TOKEN est l'env var ou la valeur hardcodée dans le seed.
    // Exemple de seed :
    //   await prisma.emailVerificationToken.create({
    //     data: { token: "seed-valid-ev-token-001", userId: unverifiedUser.id, expiresAt: ... }
    //   })

    const SEED_TOKEN = process.env.E2E_SEED_VERIFY_TOKEN ?? "seed-valid-ev-token-001"

    await page.goto(`/api/auth/verify-email?token=${SEED_TOKEN}`)

    // La route valide le token, crée un VerifiedUserToken, redirige vers /verify-email/callback
    // Le callback auto-login et redirige vers /dashboard
    await expect(page).toHaveURL("/dashboard", { timeout: 15_000 })
    await expect(page.locator('[data-testid="credit-balance"]')).toBeVisible()
  })

  test("VerifiedUserToken est single-use : reutiliser le même lien → erreur", async ({ page }) => {
    // Après que le test précédent a consommé le token, un second accès doit échouer
    // Ce test est conditionnel sur l'exécution du test précédent
    const SEED_TOKEN = process.env.E2E_SEED_VERIFY_TOKEN ?? "seed-valid-ev-token-001"

    // Tenter un second accès au même token (déjà consommé par le test précédent)
    await page.goto(`/api/auth/verify-email?token=${SEED_TOKEN}`)

    // Le token n'existe plus → redirect vers /verify-email-error?reason=invalid
    await expect(page).toHaveURL(/\/verify-email-error.*reason=invalid/)
  })
})

// ─── Pages accessible quand déjà connecté ────────────────────────────────────

authTest.describe("Pages vérification accessibles pour membres connectés", () => {
  authTest("/verify-email-sent accessible même si déjà connecté", async ({ membrePage }) => {
    // Edge case : un membre connecté qui accède à cette page (lien bookmark, etc.)
    await membrePage.goto("/verify-email-sent")
    // La page est accessible (pas de redirect forcé)
    await expect(membrePage.locator('[data-testid="verify-email-sent-message"]')).toBeVisible()
  })
})
