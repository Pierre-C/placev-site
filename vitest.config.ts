import { defineConfig } from "vitest/config";
import path from "path";

export default defineConfig({
  test: {
    environment: "node",
    globals: true,
    setupFiles: ["__tests__/setup.ts"],
    exclude: ["node_modules", ".next", "e2e/**", "**/e2e/**", "**/*.spec.ts"],
    // Variables d'env de base pour que lib/env.ts ne lève pas d'erreur
    env: {
      DATABASE_URL: "postgresql://test:test@localhost:5432/test",
      NEXTAUTH_SECRET: "test-secret-for-vitest-that-is-long-enough",
      BREVO_MOCK: "true",
      STRIPE_MOCK: "true",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "html"],
      exclude: ["node_modules", ".next", "e2e"],
    },
  },
  resolve: {
    alias: [
      { find: "@", replacement: path.resolve(__dirname, ".") },
      // Stubs next-auth — ordre important : sous-chemins avant le chemin de base
      {
        find: "next-auth/providers/credentials",
        replacement: path.resolve(__dirname, "__mocks__/next-auth-credentials.ts"),
      },
      {
        find: "next-auth",
        replacement: path.resolve(__dirname, "__mocks__/next-auth.ts"),
      },
    ],
  },
});
