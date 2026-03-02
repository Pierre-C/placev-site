"use client"
/**
 * components/app/LogoutButton.tsx
 * Bouton de déconnexion — Client Component isolé.
 * Utilise signOut de next-auth/react pour ne pas forcer 'use client' sur tout le layout.
 */

import { signOut } from "next-auth/react"
import { LogOut } from "lucide-react"

export function LogoutButton() {
  return (
    <button
      data-testid="logout-btn"
      onClick={() => signOut({ callbackUrl: "/" })}
      className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900 transition"
    >
      <LogOut className="h-4 w-4" />
      Se déconnecter
    </button>
  )
}
