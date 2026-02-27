'use client'

import { SystemSetting } from "@prisma/client"
import { useState, useEffect } from "react"
import { updateSettings } from "./actions"

const DAYS = [
  { id: 1, label: "Lundi" },
  { id: 2, label: "Mardi" },
  { id: 3, label: "Mercredi" },
  { id: 4, label: "Jeudi" },
  { id: 5, label: "Vendredi" },
]

const SEGMENTS = [
  { id: "PRICE_CREDIT_BOULIACAIS", label: "Bouliacais" },
  { id: "PRICE_CREDIT_EXTERNE", label: "Externe" },
  { id: "PRICE_CREDIT_REDUIT", label: "Réduit" },
]

export default function GlobalSettingsForm({ settings }: { settings: SystemSetting[] }) {
  const [deskCapacity, setDeskCapacity] = useState("15")
  const [openDays, setOpenDays] = useState<number[]>([1, 2, 3])
  const [prices, setPrices] = useState<Record<string, string>>({
    PRICE_CREDIT_BOULIACAIS: "7",
    PRICE_CREDIT_EXTERNE: "8",
    PRICE_CREDIT_REDUIT: "4",
  })

  const [showToast, setShowToast] = useState(false)

  useEffect(() => {
    const capacity = settings.find(s => s.key === 'DESK_CAPACITY')?.value
    if (capacity) setDeskCapacity(capacity)

    const od = settings.find(s => s.key === 'OPEN_DAYS')?.value
    if (od) setOpenDays(od.split(',').map(Number))

    const newPrices = { ...prices }
    SEGMENTS.forEach(s => {
      const val = settings.find(set => set.key === s.id)?.value
      if (val) {
        newPrices[s.id] = (parseInt(val, 10) / 100).toString()
      }
    })
    setPrices(newPrices)
  }, [settings])

  const handleSaveCapacity = async () => {
    await updateSettings([{ key: 'DESK_CAPACITY', value: deskCapacity }])
    triggerToast()
  }

  const handleSaveOpenDays = async () => {
    await updateSettings([{ key: 'OPEN_DAYS', value: openDays.sort().join(',') }])
    triggerToast()
  }

  const handleSavePrices = async () => {
    const settingsToUpdate = SEGMENTS.map(s => ({
      key: s.id,
      value: (parseFloat(prices[s.id]) * 100).toString()
    }))
    await updateSettings(settingsToUpdate)
    triggerToast()
  }

  const triggerToast = () => {
    setShowToast(true)
    setTimeout(() => setShowToast(false), 3000)
  }

  const toggleDay = (day: number) => {
    setOpenDays(prev => 
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    )
  }

  return (
    <div className="space-y-12 mt-12">
      {/* CAPACITÉ */}
      <section className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-neutral-100">
        <h3 className="text-xl font-black mb-6">Capacité de l&apos;open-space</h3>
        <div className="flex items-end gap-4">
          <div className="flex-1 max-w-[200px]">
            <label htmlFor="desk-capacity" className="block text-xs font-bold text-neutral-400 uppercase mb-2">Nombre de places</label>
            <input
              id="desk-capacity"
              data-testid="setting-DESK_CAPACITY"
              type="number"
              value={deskCapacity}
              onChange={(e) => setDeskCapacity(e.target.value)}
              className="w-full rounded-xl border-neutral-200 shadow-sm focus:ring-blue-500 focus:border-blue-500 font-bold"
            />
          </div>
          <button data-testid="save-settings" onClick={handleSaveCapacity} className="bg-neutral-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-neutral-800 transition-colors">
            Enregistrer
          </button>
        </div>
      </section>

      {/* JOURS D'OUVERTURE */}
      <section data-testid="setting-OPEN_DAYS" className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-neutral-100">
        <h3 className="text-xl font-black mb-6">Jours d&apos;ouverture</h3>
        <div className="space-y-4">
          <div className="flex flex-wrap gap-4">
            {DAYS.map(day => (
              <label key={day.id} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  data-testid="open-day-checkbox"
                  data-day={day.id}
                  checked={openDays.includes(day.id)}
                  onChange={() => toggleDay(day.id)}
                  className="w-5 h-5 rounded border-neutral-300 text-blue-600 focus:ring-blue-500 transition-all cursor-pointer"
                />
                <span className="text-sm font-bold text-neutral-600 group-hover:text-neutral-900 transition-colors">{day.label}</span>
              </label>
            ))}
          </div>
          <div className="pt-4 border-t">
            <button data-testid="save-settings-open-days" onClick={handleSaveOpenDays} className="bg-neutral-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-neutral-800 transition-colors">
              Enregistrer les jours
            </button>
          </div>
        </div>
      </section>

      {/* TARIFS */}
      <section className="bg-white p-6 rounded-2xl shadow-sm ring-1 ring-neutral-100">
        <h3 className="text-xl font-black mb-6">Tarifs par segment (€)</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {SEGMENTS.map(s => (
            <div key={s.id}>
              <label htmlFor={s.id} className="block text-xs font-bold text-neutral-400 uppercase mb-2">{s.label}</label>
              <div className="relative">
                <input
                  id={s.id}
                  data-testid={`setting-${s.id}`}
                  type="number"
                  step="0.1"
                  value={prices[s.id]}
                  onChange={(e) => setPrices({ ...prices, [s.id]: e.target.value })}
                  className="w-full rounded-xl border-neutral-200 shadow-sm focus:ring-blue-500 focus:border-blue-500 font-bold pr-8"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 font-bold">€</span>
              </div>
            </div>
          ))}
        </div>
        <div className="pt-6 border-t">
          <button data-testid="save-settings-prices" onClick={handleSavePrices} className="bg-neutral-900 text-white px-6 py-2.5 rounded-xl font-bold hover:bg-neutral-800 transition-colors">
            Enregistrer les tarifs
          </button>
        </div>
      </section>

      {showToast && (
        <div data-testid="settings-saved-toast" className="fixed bottom-4 left-1/2 -translate-x-1/2 bg-green-600 text-white px-6 py-3 rounded-xl shadow-xl font-bold z-50">
          ✓ Paramètres enregistrés avec succès
        </div>
      )}
    </div>
  )
}
