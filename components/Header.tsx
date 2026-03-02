/**
 * components/Header.tsx
 * Header principal du site vitrine — Server Component.
 * Lit la session via auth() et la passe en prop aux sous-composants client.
 * Ne pas ajouter 'use client' ici : la session est lue côté serveur.
 */

import Link from "next/link"
import { auth } from "@/lib/auth"
import { HeaderAuthButton } from "@/components/layout/HeaderAuthButton"
import { MobileMenu } from "@/components/layout/MobileMenu"

export async function Header() {
  const session = await auth()

  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-white/70 border-b border-black/5">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/logo-placev.png"
            alt="Place V Coworking"
            className="h-10 w-auto"
          />
        </Link>

        <div role="navigation" className="hidden md:flex items-center gap-4 text-sm">
          <HeaderAuthButton session={session} />
        </div>

        <div className="relative md:hidden">
          <MobileMenu session={session} />
        </div>
      </div>
    </header>
  )
}
