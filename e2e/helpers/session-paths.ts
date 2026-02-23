/**
 * e2e/helpers/session-paths.ts
 * Chemins des fichiers de session Playwright (storageState).
 * Fichier utilitaire pur — pas de code test — importable depuis global.setup.ts et fixtures.ts.
 */

import path from "path"

const authDir = path.join(__dirname, "../.auth")

export const SESSIONS = {
  membre: path.join(authDir, "membre.json"),
  admin: path.join(authDir, "admin.json"),
  membreSansCredits: path.join(authDir, "membre-sans-credits.json"),
}
