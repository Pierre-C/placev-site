'use client'

import { SystemSetting } from "@prisma/client"
import { useState, useEffect } from "react"
import { updateSettings } from "./actions"

export default function GlobalSettingsForm({ settings }: { settings: SystemSetting[] }) {
  const [deskCapacity, setDeskCapacity] = useState("")
  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    const capacity = settings.find(s => s.key === 'DESK_CAPACITY')?.value
    if (capacity) setDeskCapacity(capacity)
  }, [settings])

  const handleSave = async () => {
    await updateSettings([{ key: 'DESK_CAPACITY', value: deskCapacity }])
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  return (
    <div className="mt-8">
      <h3 className="text-xl font-bold">Paramètres globaux</h3>
      <div className="mt-4 flex items-center space-x-4">
        <div>
          <label htmlFor="desk-capacity">Capacité de l'open-space</label>
          <input
            id="desk-capacity"
            data-testid="setting-DESK_CAPACITY"
            type="number"
            value={deskCapacity}
            onChange={(e) => setDeskCapacity(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
          />
        </div>
        <button data-testid="save-settings" onClick={handleSave} className="rounded-md bg-blue-600 px-4 py-2 text-sm font-semibold text-white shadow-sm">
          Enregistrer
        </button>
      </div>
      {showToast && (
        <div data-testid="settings-saved-toast" className="mt-4 p-2 bg-green-100 text-green-800 rounded-md">
          Paramètres enregistrés.
        </div>
      )}
    </div>
  )
}
