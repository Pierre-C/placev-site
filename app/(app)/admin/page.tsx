/**
 * app/(app)/admin/page.tsx
 * Back-office admin — Server Component, accessible ADMIN uniquement (protégé par middleware).
 * Placeholder pour Slice 5 — affiche juste l'en-tête requis par les tests E2E.
 */

import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"

export default async function AdminPage() {
  const session = await auth()

  // Double protection (le middleware gère déjà ça, mais defense-in-depth)
  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold text-neutral-900">Administration</h1>
      <p className="mt-2 text-neutral-500">
        Panneau d&apos;administration Place V — Slice 5 à venir.
      </p>

      <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100">
        <p className="text-sm text-neutral-400">
          Connecté en tant qu&apos;admin : {session.user.email}
        </p>
      </div>
    </div>
  )
}
