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
    select: { name: true, email: true, credits: true },
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
          Bonjour, {user.name ?? user.email}
        </h1>
        <span
          data-testid="header-credit-balance"
          data-level={balanceLevel}
          className={`text-lg font-semibold ${balanceClass}`}
        >
          {user.credits} crédit{user.credits !== 1 ? "s" : ""}
        </span>
      </div>

      <DashboardNav />

      <div className="mt-8">{children}</div>
    </div>
  )
}
