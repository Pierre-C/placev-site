import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"

const transactionLabels: Record<string, string> = {
  WELCOME_CREDIT:      "Crédit de bienvenue",
  CREDIT_PURCHASE:     "Rechargement",
  DEBIT_RESERVATION:   "Réservation",
  REFUND_CANCELLATION: "Remboursement",
  MANUAL_ADJUSTMENT:   "Ajustement manuel",
}

export default async function HistoriquePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role === "ADMIN") redirect("/admin")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      transactions: { orderBy: { createdAt: "desc" }, take: 50 },
    },
  })
  if (!user) redirect("/login")

  return (
    <section data-testid="transaction-history">
      <h2 className="mb-3 text-lg font-semibold text-neutral-900">Historique des transactions</h2>
      <div
        data-testid="transaction-list-scroll"
        style={{ maxHeight: "480px", overflowY: "auto" }}
        className="space-y-2"
      >
        {user.transactions.length === 0 ? (
          <p data-testid="transaction-empty" className="text-sm text-neutral-400">
            Aucune transaction pour le moment.
          </p>
        ) : (
          user.transactions.map((t) => (
            <div
              key={t.id}
              data-testid="transaction-item"
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
                data-testid="transaction-amount"
                data-sign={t.creditsAdd >= 0 ? "positive" : "negative"}
                className={`text-sm font-semibold ${t.creditsAdd >= 0 ? "text-green-600" : "text-red-600"}`}
              >
                {t.creditsAdd >= 0 ? "+" : ""}{t.creditsAdd} crédit(s)
              </span>
            </div>
          ))
        )}
      </div>
    </section>
  )
}
