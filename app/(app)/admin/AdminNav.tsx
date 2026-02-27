"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
  { href: "/admin/calendar", label: "Calendrier Coworking" },
  { href: "/admin", label: "Membres" },
  { href: "/admin/exports", label: "Exports" },
  { href: "/admin/settings", label: "Paramètres" },
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
