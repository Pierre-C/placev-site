'use client'

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function AddClosedDateForm() {
  const [date, setDate] = useState("")
  const [reason, setReason] = useState("")
  const [isPreview, setIsPreview] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")
  const router = useRouter()

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

      setIsPreview(false)
      setIsSuccess(true)
      setDate("")
      setReason("")
      router.refresh()
    } catch (err: any) {
      setError(err.message)
    }
  }

  if (isSuccess) {
    return <div data-testid="closure-success">Date fermée avec succès.</div>
  }

  return (
    <div className="mt-4">
      {error && <div className="text-red-600 mb-2" data-testid="close-date-already-closed">{error}</div>}
      <div className="flex items-center space-x-4">
        <div>
          <label htmlFor="date">Date</label>
          <input
            type="date"
            id="date"
            data-testid="close-date-input"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
        <div>
          <label htmlFor="reason">Raison</label>
          <input
            type="text"
            id="reason"
            data-testid="close-date-reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
        <button data-testid="preview-closure" onClick={handlePreview} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm">
          Prévisualiser
        </button>
      </div>
      {isPreview && (
        <div data-testid="closure-preview" className="mt-4 p-4 border rounded-md">
          <p>Vous allez fermer la date du {date}.</p>
          <button data-testid="confirm-closure" onClick={handleConfirm} className="mt-2 rounded-md bg-red-600 px-4 py-2 text-sm font-semibold text-white shadow-sm">
            Confirmer la fermeture
          </button>
        </div>
      )}
    </div>
  )
}
