'use client'

import { ClosedDate } from "@prisma/client"
import { useState, useMemo } from "react"
import { useRouter } from "next/navigation"
import { removeClosedDate } from "./actions"

export default function ClosedDatesModal({ closedDates }: { closedDates: ClosedDate[] }) {
  const [isOpen, setIsOpen] = useState(false)
  const [localDates, setLocalDates] = useState(closedDates)
  const [date, setDate] = useState("")
  const [reason, setReason] = useState("")
  const [isPreview, setIsPreview] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

  // Mettre à jour l'état local si les props changent
  useMemo(() => setLocalDates(closedDates), [closedDates])

  const handlePreview = () => {
    setIsPreview(true)
  }

  const handleConfirm = async () => {
    setError("")
    try {
      const response = await fetch("/api/admin/close-date", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, reason }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Une erreur est survenue")
      }
      
      const body = await response.json()
      
      if (body.closedDate) {
        setLocalDates(prev => [...prev, body.closedDate])
      }

      setIsPreview(false)
      setIsSuccess(true)
      setDate("")
      setReason("")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    }
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const sortedDates = useMemo(() => {
    return [...localDates].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [localDates])

  const handleDelete = async (id: string) => {
    setLocalDates(prev => prev.filter(d => d.id !== id))
    await removeClosedDate(id)
    router.refresh()
  }

  return (
    <>
      <button 
        data-testid="manage-closed-dates-btn"
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-colors"
      >
        Gérer les dates de fermeture
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div 
            className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
            onClick={() => setIsOpen(false)}
          />
          <div 
            data-testid="closed-dates-modal"
            className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-6 py-4 border-b flex items-center justify-between bg-neutral-50">
              <h2 className="text-xl font-black text-neutral-900">Gestion des dates de fermeture</h2>
              <button 
                data-testid="closed-dates-modal-close"
                onClick={() => setIsOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 text-2xl font-black leading-none px-2"
              >
                ×
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-8">
              {/* Formulaire d'ajout */}
              <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-100">
                <h3 className="font-bold text-neutral-900 mb-4">Ajouter une fermeture</h3>
                {isSuccess && (
                  <div data-testid="closure-success" className="mb-4 text-green-600 font-bold text-sm bg-green-50 p-3 rounded-lg">
                    Date fermée avec succès.
                  </div>
                )}
                {error && <div className="text-red-600 mb-4 text-sm font-bold bg-red-50 p-3 rounded-lg" data-testid="close-date-already-closed">{error}</div>}
                
                <div className="flex flex-col sm:flex-row items-end gap-4">
                  <div className="w-full">
                    <label htmlFor="date" className="block text-xs font-bold text-neutral-500 mb-1 uppercase tracking-wider">Date</label>
                    <input
                      type="date"
                      id="date"
                      data-testid="close-date-input"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                      className="block w-full rounded-lg border-neutral-200 text-sm focus:ring-blue-500"
                    />
                  </div>
                  <div className="w-full">
                    <label htmlFor="reason" className="block text-xs font-bold text-neutral-500 mb-1 uppercase tracking-wider">Raison</label>
                    <input
                      type="text"
                      id="reason"
                      data-testid="close-date-reason"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      className="block w-full rounded-lg border-neutral-200 text-sm focus:ring-blue-500"
                    />
                  </div>
                  <button 
                    data-testid="preview-closure" 
                    onClick={handlePreview} 
                    className="w-full sm:w-auto rounded-lg bg-blue-600 px-6 py-2 text-sm font-bold text-white hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    Fermer
                  </button>
                </div>
                
                {isPreview && (
                  <div data-testid="closure-preview" className="mt-4 p-4 border border-blue-100 bg-blue-50 rounded-lg flex items-center justify-between">
                    <p className="text-sm font-medium text-blue-900">Vous allez fermer la date du <span className="font-bold">{date}</span>.</p>
                    <button 
                      data-testid="confirm-closure" 
                      onClick={handleConfirm} 
                      className="rounded-lg bg-red-600 px-4 py-2 text-sm font-bold text-white hover:bg-red-700 transition-colors"
                    >
                      Confirmer la fermeture
                    </button>
                  </div>
                )}
              </div>

              {/* Liste des dates */}
              <div>
                <h3 className="font-bold text-neutral-900 mb-4">Dates existantes</h3>
                <div data-testid="closed-dates-list" className="bg-white border rounded-xl overflow-hidden">
                  <div className="max-h-[300px] overflow-y-auto">
                    <table className="min-w-full divide-y divide-neutral-200">
                      <thead className="bg-neutral-50 sticky top-0 z-10">
                        <tr className="text-left text-xs font-black text-neutral-400 uppercase tracking-wider">
                          <th className="px-6 py-3">Date</th>
                          <th className="px-6 py-3">Raison</th>
                          <th className="px-6 py-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-100">
                        {sortedDates.length === 0 ? (
                          <tr>
                            <td colSpan={3} className="px-6 py-8 text-center text-sm text-neutral-500 italic">Aucune date de fermeture configurée.</td>
                          </tr>
                        ) : (
                          sortedDates.map((d) => {
                            const dDate = new Date(d.date)
                            const isPast = dDate < today
                            return (
                              <tr 
                                key={d.id} 
                                data-testid="closed-date-row"
                                data-past={isPast ? "true" : "false"}
                                className={`hover:bg-neutral-50 transition-colors ${isPast ? "opacity-50 bg-neutral-50" : ""}`}
                              >
                                <td className={`px-6 py-4 whitespace-nowrap text-sm font-bold text-neutral-900`}>
                                  {dDate.toLocaleDateString('fr-FR')}
                                </td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm text-neutral-600`}>
                                  {d.reason || "-"}
                                </td>
                                <td className="px-6 py-4 whitespace-nowrap text-right">
                                  <button
                                    data-testid="remove-closed-date-btn"
                                    disabled={isPast}
                                    onClick={() => handleDelete(d.id)}
                                    className={`text-sm font-bold px-3 py-1 rounded-lg ${isPast ? 'text-neutral-400 cursor-not-allowed' : 'text-red-600 hover:bg-red-50'}`}
                                  >
                                    Supprimer
                                  </button>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  )
}