"use client"
/**
 * components/layout/HeaderAuthButton.tsx
 * Bouton d'authentification dans le header principal — Client Component léger.
 * Reçoit la session en prop depuis le Server Component parent (Header).
 * Pas de useSession() pour ne pas forcer 'use client' sur tout le header.
 */

import Link from "next/link"
import type { Session } from "next-auth"
import { LogoutButton } from "@/components/app/LogoutButton"

interface HeaderAuthButtonProps {
  session: Session | null
}

export function HeaderAuthButton({ session }: HeaderAuthButtonProps) {
  if (!session) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          data-testid="header-login-btn"
          className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition"
        >
          Se connecter
        </Link>
        <Link
          href="/register"
          data-testid="header-register-btn"
          className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium bg-gradient-to-r from-placev-blue to-placev-mint text-white hover:opacity-90 transition"
        >
          Créer mon compte
        </Link>
      </div>
    )
  }

  const firstName = session.user?.firstName ?? session.user?.email

  return (
    <div
      data-testid="header-user-menu"
      className="flex items-center gap-3"
    >
      <span className="text-sm text-neutral-700">Bonjour {firstName}</span>
      <Link
        href="/dashboard"
        data-testid="header-dashboard-link"
        className="inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium bg-gradient-to-r from-placev-blue to-placev-mint text-white hover:opacity-90 transition"
      >
        Mon espace
      </Link>
      {session.user?.role === "ADMIN" && (
        <span
          data-testid="header-admin-badge"
          className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-800"     
        >
          Admin
        </span>
      )}
      <LogoutButton />
    </div>
  )
}
