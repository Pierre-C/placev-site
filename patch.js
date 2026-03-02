const fs = require('fs');

let content = fs.readFileSync('e2e/slice-02-credits.spec.ts', 'utf8');

content = content.replace(
  /\/\/ Recharger pour lire l'historique depuis la DB[\s\S]+?await page\.goto\("\/dashboard\/recharger"\)/g,
  '// Recharger pour lire l\'historique depuis la DB\n    await page.goto("/dashboard/historique")'
);

fs.writeFileSync('e2e/slice-02-credits.spec.ts', content);

let content3 = fs.readFileSync('e2e/slice-03-booking.spec.ts', 'utf8');

// Replace goto("/dashboard") with goto("/dashboard/historique") where needed if transaction-history is checked
content3 = content3.replace(
  /await page\.goto\("\/dashboard"\)\s+const history = page\.locator\('\[data-testid="transaction-history"\]'\)/g,
  'await page.goto("/dashboard/historique")\n    const history = page.locator(\'[data-testid="transaction-history"]\')'
);

fs.writeFileSync('e2e/slice-03-booking.spec.ts', content3);