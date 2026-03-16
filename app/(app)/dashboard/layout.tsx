import Link from "next/link"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import DashboardNav from "./DashboardNav"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role === "ADMIN") redirect("/admin")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { firstName: true, email: true, credits: true },
  })
  if (!user) redirect("/login")

  const balanceLevel =
    user.credits > 1  ? "normal"  :
    user.credits === 1 ? "warning" : "danger"

  const balanceClass =
    balanceLevel === "normal"  ? "text-neutral-900" :
    balanceLevel === "warning" ? "text-orange-500"  : "text-red-600"

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div data-testid="dashboard-header" className="mb-4 flex items-center justify-between">
        <h1 data-testid="welcome-message" className="text-3xl font-bold text-neutral-900">
          Bonjour, {user.firstName ?? user.email}
        </h1>
      </div>

      <div
        className={`mb-4 rounded-xl border-2 bg-white px-4 py-3 flex items-center justify-between ${
          balanceLevel === "normal"  ? "border-green-500"  :
          balanceLevel === "warning" ? "border-orange-400" : "border-red-500"
        }`}
      >
        <span className="text-sm font-medium text-neutral-600">Solde de crédits</span>
        <span className="flex items-center gap-3">
          <span
            className={`text-xl font-bold ${balanceClass}`}
            data-testid="header-credit-balance"
            data-level={balanceLevel}
          >
            <span data-testid="credit-balance">{user.credits}</span> crédit{user.credits !== 1 ? "s" : ""}
          </span>
          {user.credits === 0 ? (
            <Link
              href="/dashboard/recharger"
              className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Recharger mes crédits
            </Link>
          ) : (
            <Link
              href="/dashboard/recharger"
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              Recharger
            </Link>
          )}
        </span>
      </div>

      <DashboardNav />

      <div className="mt-8">{children}</div>
    </div>
  )
}
