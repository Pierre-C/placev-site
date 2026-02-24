/**
 * app/(app)/dashboard/page.tsx
 * Dashboard membre — Server Component protégé.
 * Affiche : solde de crédits, packs de recharge, transactions, réservations à venir.
 */

import { Suspense } from "react"
import { redirect } from "next/navigation"
import Link from "next/link"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canCancel } from "@/lib/services/booking"
import { CreditPackSection } from "./CreditPackSection"
import { PaymentStatusBanner } from "./PaymentStatusBanner"
import { UpcomingReservations } from "./UpcomingReservations"
import { BalanceBadge } from "./BalanceBadge"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  // Les admins sont redirigés vers le back-office
  if (session.user.role === "ADMIN") redirect("/admin")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      transactions: {
        orderBy: { createdAt: "desc" },
        take: 20,
      },
      reservations: {
        where: {
          status: "CONFIRMED",
          date: { gte: new Date() },
        },
        orderBy: { date: "asc" },
        take: 10,
      },
    },
  })

  if (!user) redirect("/login")

  const transactionLabels: Record<string, string> = {
    WELCOME_CREDIT: "Crédit de bienvenue",
    CREDIT_PURCHASE: "Achat de crédits",
    DEBIT_RESERVATION: "Réservation",
    REFUND_CANCELLATION: "Remboursement annulation",
    MANUAL_ADJUSTMENT: "Ajustement manuel",
  }

  // Annoter les réservations avec la fenêtre d'annulation
  const reservationsWithCancel = user.reservations.map((r) => ({
    ...r,
    canCancel: canCancel({ status: r.status, date: r.date }),
  }))

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Bannière paiement (success / cancelled) — Client Component avec Suspense */}
      <Suspense fallback={null}>
        <PaymentStatusBanner />
      </Suspense>

      {/* En-tête */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900" data-testid="welcome-message">
          Bonjour, {user.name ?? user.email}
        </h1>
        <p className="mt-1 text-neutral-500">Bienvenue sur votre espace Place V</p>
      </div>

      {/* Solde de crédits */}
      <div className="mb-6 rounded-2xl bg-neutral-900 p-6 text-white">
        <p className="text-sm font-medium text-neutral-400">Solde de crédits</p>
        <BalanceBadge initialCredits={user.credits} />
        <p className="mt-1 text-sm text-neutral-400">
          {user.credits >= 0 ? "crédit(s) disponible(s)" : "crédit(s) en débit"}
        </p>
      </div>

      {/* Packs de recharge — Server Component */}
      <CreditPackSection segment={user.segment} />

      {/* Lien réservation */}
      <div className="mb-6">
        <Link
          href="/booking"
          data-testid="link-booking"
          className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-medium text-neutral-900 shadow-sm ring-1 ring-neutral-200 hover:bg-neutral-50"
        >
          Faire une réservation
        </Link>
      </div>

      {/* Réservations à venir — Client Component avec annulation */}
      <UpcomingReservations reservations={reservationsWithCancel} />

      {/* Historique des transactions */}
      <section>
        <h2 className="mb-3 text-lg font-semibold text-neutral-900">
          Historique des transactions
        </h2>
        <div data-testid="transaction-history" className="space-y-2">
          {user.transactions.length === 0 ? (
            <p className="text-sm text-neutral-400">Aucune transaction pour le moment.</p>
          ) : (
            user.transactions.map((t) => (
              <div
                key={t.id}
                className="flex items-center justify-between rounded-xl bg-white p-4 shadow-sm ring-1 ring-neutral-100"
              >
                <div>
                  <p className="font-medium text-neutral-900">
                    {transactionLabels[t.type] ?? t.type}
                  </p>
                  <p className="text-sm text-neutral-400">
                    {t.createdAt.toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <span
                  className={`text-sm font-semibold ${t.creditsAdd >= 0 ? "text-green-600" : "text-red-600"}`}
                >
                  {t.creditsAdd >= 0 ? "+" : ""}
                  {t.creditsAdd} crédit(s)
                </span>
              </div>
            ))
          )}
        </div>
      </section>
    </div>
  )
}
