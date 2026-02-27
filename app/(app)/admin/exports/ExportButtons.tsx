"use client"

import { exportBookings, exportMembers } from "./actions"

export default function ExportButtons() {
  return (
    <div className="mt-8 flex space-x-4">
      <button
        onClick={async () => {
          const csv = await exportBookings()
          downloadCsv(csv, "reservations.csv")
        }}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
      >
        Exporter les réservations
      </button>
      <button
        onClick={async () => {
          const csv = await exportMembers()
          downloadCsv(csv, "membres.csv")
        }}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-blue-500"
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
