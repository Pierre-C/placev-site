const fs = require('fs');
let content = fs.readFileSync('e2e/slice-02-credits.spec.ts', 'utf8');
content = content.replace(/Achat de crÃ©dits/g, "Rechargement");
content = content.replace(/Achat de crédits/g, "Rechargement");
fs.writeFileSync('e2e/slice-02-credits.spec.ts', content);
