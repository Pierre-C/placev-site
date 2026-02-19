/**
 * e2e/global.setup.ts
 * Exécuté UNE FOIS avant tous les tests Playwright.
 * Crée les utilisateurs de test en DB et sauvegarde les sessions auth.
 */

import { test as setup, expect } from "@playwright/test"
import path from "path"

// Chemins des fichiers de session sauvegardés (réutilisés entre les tests)
export const SESSIONS = {
  membre: path.join(__dirname, ".auth/membre.json"),
  admin: path.join(__dirname, ".auth/admin.json"),
  membreSansCredits: path.join(__dirname, ".auth/membre-sans-credits.json"),
}

setup("créer et authentifier les utilisateurs de test", async ({ page }) => {
  // ── 1. S'assurer que les utilisateurs de test existent (via seeder) ────
  // Le seeder Prisma doit avoir créé ces comptes :
  // - externe@test.fr / TestPassword123! (credits: 5)
  // - admin@placev.fr / TestPassword123! (role: ADMIN)
  // - pauvre@test.fr / TestPassword123! (credits: -2)

  // ── 2. Sauvegarder la session "membre normal" ──────────────────────────
  await page.goto("/login")
  await page.fill('[name="email"]', "externe@test.fr")
  await page.fill('[name="password"]', "TestPassword123!")
  await page.click('[type="submit"]')
  await expect(page).toHaveURL("/dashboard")
  await page.context().storageState({ path: SESSIONS.membre })

  // ── 3. Sauvegarder la session "admin" ─────────────────────────────────
  await page.goto("/login")
  await page.fill('[name="email"]', "admin@placev.fr")
  await page.fill('[name="password"]', "TestPassword123!")
  await page.click('[type="submit"]')
  await expect(page).toHaveURL("/admin")
  await page.context().storageState({ path: SESSIONS.admin })

  // ── 4. Sauvegarder la session "membre avec crédits insuffisants" ───────
  await page.goto("/login")
  await page.fill('[name="email"]', "pauvre@test.fr")
  await page.fill('[name="password"]', "TestPassword123!")
  await page.click('[type="submit"]')
  await expect(page).toHaveURL("/dashboard")
  await page.context().storageState({ path: SESSIONS.membreSansCredits })
})
