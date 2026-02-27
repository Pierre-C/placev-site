"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
  { href: "/admin", label: "Tableau de bord" },
  { href: "/admin/members", label: "Membres" },
  { href: "/admin/bookings", label: "Réservations" },
  { href: "/admin/exports", label: "Exports" },
  { href: "/admin/settings", label: "Réglages" },
]

export default function AdminNav() {
  const pathname = usePathname()

  return (
    <nav className="flex space-x-4 border-b">
      {links.map(link => (
        <Link
          key={link.href}
          href={link.href}
          className={`px-3 py-2 ${pathname === link.href ? "border-b-2 border-blue-500" : ""}`}>
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
