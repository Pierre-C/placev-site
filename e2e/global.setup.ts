/**
 * e2e/global.setup.ts
 * Exécuté UNE FOIS avant tous les tests Playwright.
 * Crée les utilisateurs de test en DB et sauvegarde les sessions auth.
 */

import { test as setup, expect } from "@playwright/test"
import { execSync } from "child_process"
import { SESSIONS } from "./helpers/session-paths"

setup("créer et authentifier les utilisateurs de test", async ({ page }) => {
  // ── 0. Seeder la DB ────────────────────────────────────────────────────
  // Réinitialise les crédits des comptes de test et supprime leurs
  // réservations futures — garantit un état propre quel que soit le mode
  // d'exécution (npm script, VS Code, CI).
  execSync("npx prisma db seed", { stdio: "inherit" })

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
