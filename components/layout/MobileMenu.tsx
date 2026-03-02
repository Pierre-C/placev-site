"use client"
/**
 * components/layout/MobileMenu.tsx
 * Menu burger mobile — Client Component isolé.
 * Extrait du header pour permettre au Header principal de rester un Server Component.
 */

import { useState } from "react"
import Link from "next/link"
import { Menu, X } from "lucide-react"
import type { Session } from "next-auth"
import { LogoutButton } from "@/components/app/LogoutButton"

interface MobileMenuProps {
  session: Session | null
}

export function MobileMenu({ session }: MobileMenuProps) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        className="md:hidden"
        onClick={() => setOpen(!open)}
        aria-label="Menu"
      >
        {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {open && (
        <div className="md:hidden absolute top-full left-0 right-0 border-t border-black/5 px-4 py-3 space-y-3 bg-white/90 backdrop-blur z-40">
          {session ? (
            <>
              <span className="block text-sm text-neutral-600 py-1">
                {session.user?.name?.split(" ")[0]}
              </span>
              <Link
                href="/dashboard"
                className="block py-1 font-medium"
                onClick={() => setOpen(false)}
              >
                Mon espace
              </Link>
              {session.user?.role === "ADMIN" && (
                <Link
                  href="/admin"
                  className="block py-1"
                  onClick={() => setOpen(false)}
                >
                  Administration
                </Link>
              )}
              <div className="py-1">
                <LogoutButton />
              </div>
            </>
          ) : (
            <div className="py-1 flex items-center gap-2">
              <span className="text-sm text-neutral-500">Déjà membre ?</span>
              <Link
                href="/login"
                className="font-medium"
                onClick={() => setOpen(false)}
              >
                Se connecter
              </Link>
            </div>
          )}
        </div>
      )}
    </>
  )
}
