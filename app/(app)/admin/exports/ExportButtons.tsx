"use client"

import { exportMembers } from "./actions"

export default function ExportButtons() {
  const downloadFromApi = async (url: string, filename: string) => {
    const res = await fetch(url)
    if (res.ok) {
        const blob = await res.blob()
        const downloadUrl = window.URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.setAttribute("href", downloadUrl)
        a.setAttribute("download", filename)
        a.click()
    }
  }

  return (
    <div className="mt-8 flex space-x-4">
      <button
        data-testid="export-bookings-btn"
        onClick={() => downloadFromApi("/api/admin/export/reservations", "reservations.csv")}
        className="rounded-2xl bg-neutral-900 px-6 py-3 text-sm font-black text-white shadow-lg hover:bg-neutral-800 transition-all"
      >
        Exporter les réservations
      </button>
      <button
        data-testid="export-members-btn"
        onClick={async () => {
          const csv = await exportMembers()
          downloadCsv(csv, "membres.csv")
        }}
        className="rounded-2xl bg-neutral-100 px-6 py-3 text-sm font-black text-neutral-600 hover:bg-neutral-200 transition-all"
      >
        Exporter les membres
      </button>
    </div>
  )
}

function downloadCsv(csv: string, filename: string) {
  const blob = new Blob([csv], { type: "text/csv" })
  const url = window.URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.setAttribute("href", url)
  a.setAttribute("download", filename)
  a.click()
}
