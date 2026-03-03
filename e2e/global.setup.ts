/**
 * e2e/global.setup.ts
 * Exécuté UNE FOIS avant tous les tests Playwright.
 * Crée les utilisateurs de test en DB et sauvegarde les sessions auth.
 */

import { test as setup, expect } from "@playwright/test"
import { exec } from "child_process"
import { promisify } from "util"
import { SESSIONS } from "./helpers/session-paths"

const execAsync = promisify(exec)

setup("créer et authentifier les utilisateurs de test", async ({ page }) => {
  // ── 0. Seeder la DB ────────────────────────────────────────────────────
  // Réinitialise les crédits des comptes de test et supprime leurs
  // réservations futures — garantit un état propre quel que soit le mode
  // d'exécution (npm script, VS Code, CI).
  // Note : on utilise exec async (pas execSync) pour ne pas bloquer le
  // thread Node.js — execSync couperait le keepalive WebSocket de
  // Playwright vers le browser et ferait crasher la connexion.
  const { stdout } = await execAsync("npx prisma db seed")
  if (stdout) console.log(stdout)

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

  // ── 5. Warm-up de /api/availability ────────────────────────────────────
  // En cold start (premier lancement, serveur dev fraîchement démarré par
  // Playwright), la compilation de la route /api/availability peut prendre
  // 30–60 s. On la déclenche ici avec un timeout généreux pour qu'elle soit
  // prête quand les tests commencent (sinon l'expect(slot).toBeVisible()
  // à 20 s time out systématiquement).
  await page.goto("/booking")
  // Slice 9 : la nouvelle UI utilise data-testid="slot-am" (plus "slot-tile")
  await page.waitForSelector('[data-testid="slot-am"], [data-testid="booking-calendar"]', { timeout: 60_000 })
})
