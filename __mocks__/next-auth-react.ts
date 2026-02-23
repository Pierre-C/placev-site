/**
 * __mocks__/next-auth-react.ts
 * Stub Vitest de next-auth/react — évite les erreurs d'import en environnement Node.js.
 * Utilisé via resolve.alias dans vitest.config.ts.
 */

import { vi } from "vitest"

export const signOut = vi.fn().mockResolvedValue(undefined)
export const signIn = vi.fn().mockResolvedValue(undefined)
export const useSession = vi.fn().mockReturnValue({ data: null, status: "unauthenticated" })
export const SessionProvider = ({ children }: { children: React.ReactNode }) => children
