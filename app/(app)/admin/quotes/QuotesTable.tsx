"use client"

import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"

type QuoteData = {
  id: string
  date: Date
  slot: "AM" | "PM" | "FULL"
  status: "CONFIRMED" | "CANCELLED" | "PENDING_QUOTE"
  companyName: string | null
  message: string | null
  contactName: string | null
  contactEmail: string | null
  contactPhone: string | null
  startTime: string | null
  endTime: string | null
  createdAt: Date
  cancelledAt: Date | null
  user: {
    firstName: string
    lastName: string
    email: string
  } | null
}

type SortColumn = "date" | "companyName" | "status" | "contactName" | null
type SortDirection = "asc" | "desc" | "none"

export default function QuotesTable({ quotes }: { quotes: QuoteData[] }) {
  const router = useRouter()
  const [searchQuery, setSearchQuery] = useState("")
  const [sortColumn, setSortColumn] = useState<SortColumn>(null)
  const [sortDirection, setSortDirection] = useState<SortDirection>("none")
  const [selectedQuote, setSelectedQuote] = useState<QuoteData | null>(null)
  const [isLoading, setIsLoading] = useState(false)

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      if (sortDirection === "asc") setSortDirection("desc")
      else if (sortDirection === "desc") setSortDirection("none")
      else setSortDirection("asc")
    } else {
      setSortColumn(column)
      setSortDirection("asc")
    }
  }

  const filteredAndSortedQuotes = useMemo(() => {
    let result = quotes

    if (searchQuery) {
      const lowerQuery = searchQuery.toLowerCase()
      result = result.filter(q => {
        const contactName = q.contactName || [q.user?.firstName, q.user?.lastName].filter(Boolean).join(" ") || ""
        const contactEmail = q.contactEmail || q.user?.email || ""
        return (
          (q.companyName || "").toLowerCase().includes(lowerQuery) ||
          contactName.toLowerCase().includes(lowerQuery) ||
          contactEmail.toLowerCase().includes(lowerQuery)
        )
      })
    }

    if (sortColumn && sortDirection !== "none") {
      result = [...result].sort((a, b) => {
        let valA: any = ""
        let valB: any = ""

        if (sortColumn === "date") {
          valA = new Date(a.date).getTime()
          valB = new Date(b.date).getTime()
        } else if (sortColumn === "companyName") {
          valA = (a.companyName || "").toLowerCase()
          valB = (b.companyName || "").toLowerCase()
        } else if (sortColumn === "status") {
          valA = a.status
          valB = b.status
        } else if (sortColumn === "contactName") {
          valA = (a.contactName || [a.user?.firstName, a.user?.lastName].filter(Boolean).join(" ") || "").toLowerCase()
          valB = (b.contactName || [b.user?.firstName, b.user?.lastName].filter(Boolean).join(" ") || "").toLowerCase()
        }

        if (valA < valB) return sortDirection === "asc" ? -1 : 1
        if (valA > valB) return sortDirection === "asc" ? 1 : -1
        return 0
      })
    }

    return result
  }, [quotes, searchQuery, sortColumn, sortDirection])

  const renderSortIndicator = (column: SortColumn) => {
    if (sortColumn !== column || sortDirection === "none") return "⇄"
    return sortDirection === "asc" ? "↑" : "↓"
  }

  const getStatusBadge = (status: string) => {
    if (status === "PENDING_QUOTE") return <span data-testid="quote-status-badge" data-status="PENDING_QUOTE" className="px-2 py-1 text-xs font-bold rounded-full bg-orange-100 text-orange-800">En attente</span>
    if (status === "CONFIRMED") return <span data-testid="quote-status-badge" data-status="CONFIRMED" className="px-2 py-1 text-xs font-bold rounded-full bg-green-100 text-green-800">Validé</span>
    if (status === "CANCELLED") return <span data-testid="quote-status-badge" data-status="CANCELLED" className="px-2 py-1 text-xs font-bold rounded-full bg-red-100 text-red-800">Annulé</span>
    return null
  }

  const getSlotText = (slot: string) => {
    if (slot === "AM") return "Matin"
    if (slot === "PM") return "Après-midi"
    return "Journée complète"
  }

  const handleAction = async (action: "confirm" | "cancel") => {
    if (!selectedQuote) return
    setIsLoading(true)
    try {
      const res = await fetch(`/api/admin/quotes/${selectedQuote.id}/${action}`, {
        method: "POST"
      })
      if (!res.ok) {
        const errorData = await res.json()
        alert(errorData.error || "Une erreur est survenue")
      } else {
        setSelectedQuote(null)
        router.refresh()
      }
    } catch (err) {
      console.error(err)
      alert("Erreur de connexion")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center">
        <input
          data-testid="quotes-search"
          type="text"
          placeholder="Rechercher..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="px-4 py-2 border border-gray-200 rounded-lg text-sm w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      <div data-testid="admin-quotes-table" className="overflow-x-auto overflow-y-auto max-h-[70vh] bg-white border border-gray-200 rounded-lg shadow-sm">
        <table className="min-w-full text-sm text-left">
          <thead className="sticky top-0 z-10 bg-gray-50 text-gray-700 font-medium border-b border-gray-200">
            <tr>
              <th className="px-6 py-4">
                <button data-testid="quotes-sort-btn" data-column="date" onClick={() => handleSort("date")} className="flex items-center gap-1 hover:text-gray-900">
                  Date <span>{renderSortIndicator("date")}</span>
                </button>
              </th>
              <th className="px-6 py-4">
                <button data-testid="quotes-sort-btn" data-column="companyName" onClick={() => handleSort("companyName")} className="flex items-center gap-1 hover:text-gray-900">
                  Entreprise <span>{renderSortIndicator("companyName")}</span>
                </button>
              </th>
              <th className="px-6 py-4">
                <button data-testid="quotes-sort-btn" data-column="status" onClick={() => handleSort("status")} className="flex items-center gap-1 hover:text-gray-900">
                  Statut <span>{renderSortIndicator("status")}</span>
                </button>
              </th>
              <th className="px-6 py-4">
                <button data-testid="quotes-sort-btn" data-column="contactName" onClick={() => handleSort("contactName")} className="flex items-center gap-1 hover:text-gray-900">
                  Contact <span>{renderSortIndicator("contactName")}</span>
                </button>
              </th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {filteredAndSortedQuotes.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                  Aucun devis trouvé.
                </td>
              </tr>
            ) : (
              filteredAndSortedQuotes.map((quote) => {
                const contactName = quote.contactName || [quote.user?.firstName, quote.user?.lastName].filter(Boolean).join(" ") || "—"
                return (
                  <tr key={quote.id} data-testid="quote-row" data-id={quote.id} className="hover:bg-gray-50/50">
                    <td className="px-6 py-4 font-medium whitespace-nowrap">
                      {new Date(quote.date).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="px-6 py-4">
                      {quote.companyName || "—"}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(quote.status)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium">{contactName}</div>
                      <div className="text-xs text-gray-500">{quote.contactEmail || quote.user?.email || "—"}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        data-testid="consult-quote-btn"
                        onClick={() => setSelectedQuote(quote)}
                        className="text-blue-600 font-medium hover:underline text-sm"
                      >
                        Consulter
                      </button>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {selectedQuote && (
        <div data-testid="quote-detail-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden flex flex-col max-h-full">
            <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
              <h3 className="text-lg font-bold">Détails de la demande</h3>
              <button data-testid="close-quote-modal-btn" onClick={() => setSelectedQuote(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">
                &times;
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 space-y-4 text-sm">
              <div className="grid grid-cols-3 gap-2">
                <div className="font-medium text-gray-500">Date</div>
                <div className="col-span-2 font-bold">{new Date(selectedQuote.date).toLocaleDateString("fr-FR", { weekday:"long", day:"numeric", month:"long", year:"numeric" })}</div>
                
                <div className="font-medium text-gray-500">Horaires</div>
                <div className="col-span-2">{selectedQuote.startTime && selectedQuote.endTime ? `${selectedQuote.startTime} – ${selectedQuote.endTime}` : getSlotText(selectedQuote.slot)}</div>
                
                <div className="font-medium text-gray-500">Entreprise</div>
                <div className="col-span-2">{selectedQuote.companyName || "—"}</div>
                
                <div className="font-medium text-gray-500">Statut</div>
                <div className="col-span-2">{getStatusBadge(selectedQuote.status)}</div>
              </div>

              <div className="pt-4 border-t">
                <h4 className="font-bold text-gray-900 mb-2">Contact</h4>
                <div className="grid grid-cols-3 gap-2">
                  <div className="font-medium text-gray-500">Nom</div>
                  <div className="col-span-2">{selectedQuote.contactName || [selectedQuote.user?.firstName, selectedQuote.user?.lastName].filter(Boolean).join(" ") || "—"}</div>
                  
                  <div className="font-medium text-gray-500">Email</div>
                  <div className="col-span-2">{selectedQuote.contactEmail || selectedQuote.user?.email || "—"}</div>
                  
                  <div className="font-medium text-gray-500">Téléphone</div>
                  <div className="col-span-2">{selectedQuote.contactPhone || "—"}</div>
                </div>
              </div>

              {selectedQuote.message && (
                <div className="pt-4 border-t">
                  <h4 className="font-bold text-gray-900 mb-2">Message</h4>
                  <p className="text-gray-700 whitespace-pre-wrap">{selectedQuote.message}</p>
                </div>
              )}
            </div>

            <div className="p-6 border-t bg-gray-50">
              <div data-testid="quote-modal-nb" className="text-xs text-gray-500 italic mb-4 bg-blue-50 p-3 rounded-lg border border-blue-100">
                <strong>Nota bene :</strong> C&apos;est à vous de prendre contact avec la personne ayant fait la demande. Le site ne contacte pas directement.
              </div>

              {selectedQuote.status === "PENDING_QUOTE" ? (
                <div className="flex gap-3">
                  <button
                    data-testid="accept-quote-btn"
                    disabled={isLoading}
                    onClick={() => handleAction("confirm")}
                    className="flex-1 bg-green-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    {isLoading ? "En cours..." : "Valider"}
                  </button>
                  <button
                    data-testid="cancel-quote-btn"
                    disabled={isLoading}
                    onClick={() => handleAction("cancel")}
                    className="flex-1 bg-red-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    {isLoading ? "En cours..." : "Annuler"}
                  </button>
                </div>
              ) : (
                <div className="text-center text-sm font-medium text-gray-600 py-2">
                  Ce devis a déjà été traité.
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
