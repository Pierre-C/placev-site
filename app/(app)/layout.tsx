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
        {children}
      </div>
    </SessionProvider>
  )
}
