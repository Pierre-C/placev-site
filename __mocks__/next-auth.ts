/**
 * __mocks__/next-auth.ts
 * Stub Vitest de next-auth — évite l'import de next/server qui échoue en Node.js pur.
 * Utilisé via resolve.alias dans vitest.config.ts.
 */

import { vi } from "vitest"

const NextAuth = vi.fn().mockReturnValue({
  handlers: {
    GET: vi.fn(),
    POST: vi.fn(),
  },
  auth: vi.fn().mockResolvedValue(null),
  signIn: vi.fn().mockResolvedValue(undefined),
  signOut: vi.fn().mockResolvedValue(undefined),
})

export default NextAuth
