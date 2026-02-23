/**
 * app/(app)/layout.tsx
 * Layout du module réservation — fournit SessionProvider pour les composants client.
 * Auth.js v5 : on passe la session initiale pour éviter un aller-retour réseau.
 */

import type { ReactNode } from "react"
import { SessionProvider } from "next-auth/react"
import { auth } from "@/lib/auth"
import { LogoutButton } from "@/components/app/LogoutButton"

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth()

  return (
    <SessionProvider session={session}>
      <div className="min-h-screen bg-neutral-50">
        <div className="flex justify-end px-4 py-2 border-b border-neutral-200 bg-white">
          <LogoutButton />
        </div>
        {children}
      </div>
    </SessionProvider>
  )
}
