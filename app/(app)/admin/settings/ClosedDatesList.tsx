"use client"

import { ClosedDate } from "@prisma/client"
import { removeClosedDate } from "./actions"

export default function ClosedDatesList({ closedDates }: { closedDates: ClosedDate[] }) {
  return (
    <div className="mt-8">
      <h4 className="text-lg font-bold">Dates de fermeture existantes</h4>
      <ul className="mt-4 space-y-2">
        {closedDates.map((d) => (
          <li key={d.id} className="flex items-center justify-between rounded-md border p-2">
            <div>
              <p className="font-semibold">{new Date(d.date).toLocaleDateString()}</p>
              <p className="text-sm text-gray-500">{d.reason}</p>
            </div>
            <button
              onClick={async () => {
                await removeClosedDate(d.id)
              }}
              className="rounded-md bg-red-600 px-3 py-1 text-sm font-semibold text-white shadow-sm hover:bg-red-500"
            >
              Supprimer
            </button>
          </li>
        ))}
      </ul>
    </div>
  )
}
