import { defineConfig, devices } from "@playwright/test"

/**
 * Configuration Playwright — Place V
 * Doc : https://playwright.dev/docs/test-configuration
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false, // Séquentiel pour éviter les conflits DB de test
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1, // 1 seul worker — la DB de test est partagée
  reporter: [
    ["html", { outputFolder: "playwright-report" }],
    ["list"], // Output console lisible
  ],

  // Timeout global par test (le setup peut prendre du temps au démarrage à froid)
  timeout: 60_000,

  // Timeout pour les assertions expect() — augmenté car les Server Actions peuvent
  // prendre plusieurs secondes lors de la compilation à froid du serveur Next.js dev.
  expect: {
    timeout: 20_000,
  },

  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL || "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
    video: "retain-on-failure",
    // Langue française pour les assertions de texte
    locale: "fr-FR",
    timezoneId: "Europe/Paris",
    // Timeout pour les actions (click, fill, etc.) et les navigations
    actionTimeout: 15_000,
    navigationTimeout: 20_000,
  },

  projects: [
    // ── Setup : créer les utilisateurs de test en DB ──────────────────────
    {
      name: "setup",
      testMatch: /.*\.setup\.ts/,
    },

    // ── Tests desktop Chrome (principal) ─────────────────────────────────
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
      dependencies: ["setup"],
    },

    // ── Tests mobile (vérifier la responsivité du calendrier) ────────────
    {
      name: "mobile-safari",
      use: { ...devices["Pixel 5"] },
      dependencies: ["setup"],
      testMatch: /.*mobile.*\.spec\.ts/,
    },
  ],

  // Démarrer le serveur Next.js automatiquement si pas déjà lancé
  webServer: {
    command: "npm run dev",
    url: "http://localhost:3000",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
