const fs = require('fs');

let content = fs.readFileSync('e2e/slice-01-auth.spec.ts', 'utf8');

content = content.replace(
  /authTest\("affiche l'historique des transactions", async \(\{ membrePage \}\) => \{\s*await membrePage\.goto\("\/dashboard"\)\s*await expect\(membrePage\.locator\('\[data-testid="transaction-history"\]'\)\)\.toBeVisible\(\)\s*\}\)/,
  `authTest("affiche l'historique des transactions", async ({ membrePage }) => {
    await membrePage.goto("/dashboard/historique")
    await expect(membrePage.locator('[data-testid="transaction-history"]')).toBeVisible()
  })`
);

content = content.replace(
  /authTest\("affiche le lien vers la page de rÃ©servation", async \(\{ membrePage \}\) => \{\s*await membrePage\.goto\("\/dashboard"\)\s*await expect\(membrePage\.locator\('\[data-testid="link-booking"\]'\)\)\.toBeVisible\(\)\s*\}\)/,
  `authTest("affiche le calendrier de réservation", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    await expect(membrePage.locator('[data-testid="booking-calendar"]')).toBeVisible()
  })`
);

content = content.replace(
  /authTest\("affiche le lien vers la page de réservation", async \(\{ membrePage \}\) => \{\s*await membrePage\.goto\("\/dashboard"\)\s*await expect\(membrePage\.locator\('\[data-testid="link-booking"\]'\)\)\.toBeVisible\(\)\s*\}\)/,
  `authTest("affiche le calendrier de réservation", async ({ membrePage }) => {
    await membrePage.goto("/dashboard")
    await expect(membrePage.locator('[data-testid="booking-calendar"]')).toBeVisible()
  })`
);

fs.writeFileSync('e2e/slice-01-auth.spec.ts', content);