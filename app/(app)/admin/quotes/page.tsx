import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import QuoteConfirmButton from "./QuoteConfirmButton"

export const dynamic = "force-dynamic"

export default async function AdminQuotesPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login")
  }

  const quotes = await prisma.reservation.findMany({
    where: {
      status: "PENDING_QUOTE",
      type: "MEETING_ROOM",
    },
    orderBy: {
      createdAt: "desc",
    },
    include: {
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Devis en attente</h1>
        <p className="text-gray-500 mt-2">Gérez les demandes de devis pour la salle de réunion.</p>
      </div>

      <div data-testid="admin-quotes-table" className="bg-white rounded-lg border shadow-sm overflow-hidden">
        {quotes.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Aucun devis en attente.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-gray-50 text-gray-700 font-medium border-b">
                <tr>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Entreprise</th>
                  <th className="px-6 py-4">Message</th>
                  <th className="px-6 py-4">Contact</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {quotes.map((quote) => (
                  <tr key={quote.id} data-testid="quote-row" data-id={quote.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium">
                      {quote.date.toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-6 py-4">
                      {quote.companyName || "—"}
                    </td>
                    <td className="px-6 py-4 max-w-xs truncate" title={quote.message || ""}>
                      {quote.message || "—"}
                    </td>
                    <td className="px-6 py-4 text-gray-600">
                      <div>
                        <div className="font-medium text-gray-900">
                          {quote.contactName || [quote.user?.firstName, quote.user?.lastName].filter(Boolean).join(" ") || "—"}
                        </div>
                        <div className="text-xs text-gray-500">{quote.contactEmail || quote.user?.email || "—"}</div>
                        {quote.contactPhone && (
                          <div className="text-xs text-gray-500">{quote.contactPhone}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <QuoteConfirmButton quoteId={quote.id} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
