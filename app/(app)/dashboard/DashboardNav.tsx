"use client"
import Link from "next/link"
import { usePathname } from "next/navigation"

const links = [
  { href: "/dashboard",            label: "Réserver",  testid: "nav-tab-reserver"  },
  { href: "/dashboard/recharger",  label: "Recharger", testid: "nav-tab-recharger" },
  { href: "/dashboard/historique", label: "Historique",testid: "nav-tab-historique"},
  { href: "/dashboard/mon-compte", label: "Mon compte", testid: "nav-tab-mon-compte" },
]

export default function DashboardNav() {
  const pathname = usePathname()
  return (
    <nav data-testid="dashboard-nav" className="flex space-x-4 border-b">
      {links.map(link => (
        <Link
          key={link.href}
          href={link.href}
          data-testid={link.testid}
          className={`px-3 py-2 ${pathname === link.href ? "border-b-2 border-blue-500 font-semibold" : "text-neutral-500 hover:text-neutral-900"}`}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  )
}
