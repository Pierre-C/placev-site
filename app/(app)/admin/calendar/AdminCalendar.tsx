"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { formatYMD, addDays, getMonthGridWeekdays } from "@/lib/calendar-utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type OccupancyItem = {
  date: string
  slot: "AM" | "PM"
  count: number
  capacity: number
  isClosed: boolean
  closedDateId: string | null
}

type ReservationDetail = {
  id: string
  slot: "AM" | "PM" | "FULL"
  status: string
  isProxy: boolean
  creditsCost: number | null
  user: {
    id: string
    firstName: string
    lastName: string
    email: string | null
    segment: string | null
  } | null
}

type SelectedAdminSlot = {
  date: string
  slot: "AM" | "PM"
}

const WEEKDAY_HEADERS = ["Lun", "Mar", "Mer", "Jeu", "Ven"]
const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]

const WEEKDAYS_FR = [
  "Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi",
]

function startOfMonth(d = new Date()): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), 1)
  x.setHours(0, 0, 0, 0)
  return x
}

function formatDayShort(d: Date): string {
  const dayName = WEEKDAYS_FR[d.getDay()].substring(0, 3).toLowerCase()
  return `${dayName}. ${d.getDate()}`
}

interface AdminCalendarProps {
  capacity: number
  openDays: number[]
}

export default function AdminCalendar({ capacity, openDays }: AdminCalendarProps) {
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth())
  const [occupancy, setOccupancy] = useState<OccupancyItem[]>([])
  const [loading, setLoading] = useState(true)
  
  const [selectedSlots, setSelectedSlots] = useState<SelectedAdminSlot[]>([])
  const [reservationsByDate, setReservationsByDate] = useState<Map<string, ReservationDetail[]>>(new Map())
  const [loadingReservations, setLoadingReservations] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Confirmation Dialog State
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean
    title: string
    message: string
    onConfirm: () => Promise<void>
  }>({
    isOpen: false,
    title: "",
    message: "",
    onConfirm: async () => {},
  })

  const days = useMemo(() => getMonthGridWeekdays(monthCursor), [monthCursor])

  const fetchOccupancy = useCallback(async () => {
    try {
      setLoading(true)
      const start = formatYMD(days[0])
      const end = formatYMD(days[29])
      const res = await fetch(`/api/admin/calendar?start=${start}&end=${end}`)
      if (res.ok) {
        const data = await res.json()
        setOccupancy(data)
      }
      setLoading(false)
    } catch (err) {
      console.error("Failed to fetch occupancy", err)
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    fetchOccupancy()
  }, [fetchOccupancy])

  const fetchReservationsForSlots = useCallback(async (slots: SelectedAdminSlot[]) => {
    if (slots.length === 0) {
      setReservationsByDate(new Map())
      return
    }
    
    try {
      setLoadingReservations(true)
      const dates = [...new Set(slots.map(s => s.date))]
      const newMap = new Map<string, ReservationDetail[]>()
      
      await Promise.all(dates.map(async (d) => {
        const res = await fetch(`/api/admin/reservations?date=${d}`)
        if (res.ok) {
          const data = await res.json()
          newMap.set(d, data)
        }
      }))
      
      setReservationsByDate(newMap)
      setLoadingReservations(false)
    } catch (err) {
      console.error("Failed to fetch reservations", err)
      setLoadingReservations(false)
    }
  }, [])

  // When selectedSlots changes, fetch reservations
  useEffect(() => {
    fetchReservationsForSlots(selectedSlots)
  }, [selectedSlots, fetchReservationsForSlots])

  const occMap = useMemo(() => {
    const m = new Map<string, OccupancyItem>()
    for (const item of occupancy) {
      m.set(`${item.date}|${item.slot}`, item)
    }
    return m
  }, [occupancy])

  function handleSlotToggle(date: string, slot: "AM" | "PM") {
    const exists = selectedSlots.some(s => s.date === date && s.slot === slot)
    if (exists) {
      setSelectedSlots(prev => prev.filter(s => !(s.date === date && s.slot === slot)))
    } else {
      setSelectedSlots(prev => [...prev, { date, slot }])
    }
  }

  const handleCancelIndividual = async (resId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Annuler cette réservation ?",
      message: "L'utilisateur sera remboursé et recevra un email d'annulation.",
      onConfirm: async () => {
        const res = await fetch(`/api/admin/reservations/${resId}/cancel`, { method: "POST" })
        if (res.ok) {
          setSuccessMessage("Réservation annulée avec succès")
          await fetchReservationsForSlots(selectedSlots)
          await fetchOccupancy()
          setTimeout(() => setSuccessMessage(null), 3000)
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  const handleCancelSlotForDate = async (date: string, slot: "AM" | "PM", count: number) => {
    setConfirmDialog({
      isOpen: true,
      title: `Annuler toutes les réservations ${slot} du ${date} ?`,
      message: `Cela annulera ${count} réservation(s). Les utilisateurs seront remboursés.`,
      onConfirm: async () => {
        const res = await fetch(`/api/admin/reservations/cancel-slot`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date, slot })
        })
        if (res.ok) {
          setSuccessMessage(`${count} réservation(s) annulée(s)`)
          await fetchReservationsForSlots(selectedSlots)
          await fetchOccupancy()
          setTimeout(() => setSuccessMessage(null), 3000)
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  const handleCloseDate = async (date: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Fermer cette date ?",
      message: "Toutes les réservations seront annulées et remboursées. La date deviendra indisponible.",
      onConfirm: async () => {
        const res = await fetch(`/api/admin/close-date`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date, reason: "Fermeture administrative" })
        })
        if (res.ok) {
          setSuccessMessage("Date fermée et réservations annulées")
          // Retirer les créneaux de cette date de la sélection
          setSelectedSlots(prev => prev.filter(s => s.date !== date))
          await fetchOccupancy()
          setTimeout(() => setSuccessMessage(null), 3000)
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  const handleOpenDate = async (date: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Réouvrir cette date ?",
      message: "La date redeviendra disponible pour les réservations.",
      onConfirm: async () => {
        const res = await fetch(`/api/admin/close-date`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date })
        })
        if (res.ok) {
          setSuccessMessage("Date réouverte avec succès")
          await fetchReservationsForSlots(selectedSlots)
          await fetchOccupancy()
          setTimeout(() => setSuccessMessage(null), 3000)
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  const monthLabel = `${MONTHS_FR[monthCursor.getMonth()]} ${monthCursor.getFullYear()}`

  const filteredReservations = useMemo(() => {
    const merged: (ReservationDetail & { _date: string })[] = []
    
    for (const { date, slot } of selectedSlots) {
      const resForDate = reservationsByDate.get(date) || []
      const matching = resForDate.filter(r => 
        r.slot === slot || (r.slot === "FULL" && (slot === "AM" || slot === "PM"))
      )
      for (const r of matching) {
        if (!merged.some(m => m.id === r.id)) {
          merged.push({ ...r, _date: date })
        }
      }
    }
    
    return merged.sort((a, b) => {
      if (a._date !== b._date) return a._date.localeCompare(b._date)
      const order = { AM: 1, FULL: 2, PM: 3 }
      return order[a.slot] - order[b.slot]
    })
  }, [selectedSlots, reservationsByDate])

  const today = useMemo(() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return t
  }, [])

  function getAdminClasses(item: OccupancyItem | undefined, isSelected: boolean, isPast: boolean, isClosed: boolean) {
    if (isPast || isClosed) return "bg-neutral-200 text-neutral-400 cursor-default"
    if (isSelected) return "bg-placev-blue text-white ring-2 ring-placev-blue z-10"
    if (!item) return "bg-green-50 text-green-600 hover:bg-green-100"
    if (item.count >= item.capacity) return "bg-red-100 text-red-800 hover:bg-red-200"
    if (item.count === 0) return "bg-green-50 text-green-600 hover:bg-green-100"
    return "bg-green-100 text-green-800 hover:bg-green-200"
  }

  return (
    <div data-testid="admin-calendar" className="space-y-8">
      {/* SUCCESS TOAST */}
      <AnimatePresence>
        {successMessage && (
          <motion.div
            data-testid="admin-action-success"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-4 right-4 z-50 bg-green-600 text-white px-6 py-3 rounded-lg shadow-xl font-bold"
          >
            {successMessage}
          </motion.div>
        )}
      </AnimatePresence>

      {/* NAVIGATION */}
      <div className="flex items-center justify-between bg-white p-3 rounded-xl shadow-sm ring-1 ring-neutral-100">
        <button
          data-testid="calendar-prev-month"
          onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1))}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          ←
        </button>
        <h3 data-testid="calendar-month-label" className="text-xl font-bold capitalize">
          {monthLabel}
        </h3>
        <button
          data-testid="calendar-next-month"
          onClick={() => setMonthCursor(new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1))}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          →
        </button>
      </div>

      {/* GRILLE */}
      <div data-testid="admin-calendar-grid" style={{ maxHeight: "480px", overflowY: "auto" }} className="pr-2">
        <div className="grid grid-cols-5 gap-2">
          {WEEKDAY_HEADERS.map(h => (
            <div key={h} className="text-center text-xs font-bold text-neutral-400 pb-2">{h}</div>
          ))}
          {loading ? (
            <div className="col-span-5 flex h-64 items-center justify-center text-sm text-neutral-400">
              Chargement du calendrier...
            </div>
          ) : (
            days.map((day, i) => {
              const dateStr = formatYMD(day)
              const isCurrentMonth = day.getMonth() === monthCursor.getMonth()
              
              const isPast = day < today
              const isToday = formatYMD(day) === formatYMD(today)

              if (!openDays.includes(day.getDay()) || (!isCurrentMonth)) {
                return (
                  <div key={i} className={`flex flex-col rounded-lg overflow-hidden border border-neutral-100 bg-neutral-50 ${isPast ? "opacity-30" : (isCurrentMonth ? "opacity-50" : "opacity-30")}`}>
                    <div className="px-1 py-0.5 text-center text-[10px] text-neutral-400 bg-neutral-100 border-b border-neutral-200">
                      {formatDayShort(day)}
                    </div>
                    <div className="flex-1 flex items-center justify-center"><span className="text-neutral-300 text-xs">—</span></div>
                  </div>
                )
              }

              const am = occMap.get(`${dateStr}|AM`)
              const pm = occMap.get(`${dateStr}|PM`)
              const isClosed = am?.isClosed || pm?.isClosed
              const isAmSelected = selectedSlots.some(s => s.date === dateStr && s.slot === "AM")
              const isPmSelected = selectedSlots.some(s => s.date === dateStr && s.slot === "PM")

              const amDisabled = isPast
              const pmDisabled = isPast

              return (
                <div
                  key={i}
                  data-today={isToday ? "true" : "false"}
                  data-past={isPast ? "true" : "false"}
                  className={`flex flex-col rounded-lg overflow-hidden border ${isToday ? "border-blue-500" : "border-neutral-100"} ${isPast ? "opacity-50" : ""}`}
                >
                  <div className="px-1 py-0.5 text-center text-[10px] font-semibold text-neutral-500 bg-white border-b border-neutral-100">
                    {formatDayShort(day)}
                  </div>

                  <button
                    type="button"
                    data-testid="admin-slot-am"
                    data-date={dateStr}
                    data-count={am?.count ?? 0}
                    data-capacity={am?.capacity ?? capacity}
                    data-disabled={amDisabled ? "true" : "false"}
                    data-selected={isAmSelected ? "true" : "false"}
                    disabled={amDisabled}
                    onClick={() => !amDisabled && handleSlotToggle(dateStr, "AM")}
                    className={`flex-1 px-1 py-2 sm:py-1.5 text-center text-[10px] leading-tight transition-colors ${getAdminClasses(am, isAmSelected, isPast, !!isClosed)}`}
                  >
                    AM<br/>
                    {am && !isClosed && !isPast ? `${am.count}/${am.capacity}` : "—"}
                  </button>

                  <div className="h-[1px] bg-neutral-100" />

                  <button
                    type="button"
                    data-testid="admin-slot-pm"
                    data-date={dateStr}
                    data-count={pm?.count ?? 0}
                    data-capacity={pm?.capacity ?? capacity}
                    data-disabled={pmDisabled ? "true" : "false"}
                    data-selected={isPmSelected ? "true" : "false"}
                    disabled={pmDisabled}
                    onClick={() => !pmDisabled && handleSlotToggle(dateStr, "PM")}
                    className={`flex-1 px-1 py-1.5 text-center text-[10px] leading-tight transition-colors ${getAdminClasses(pm, isPmSelected, isPast, !!isClosed)}`}
                  >
                    PM<br/>
                    {pm && !isClosed && !isPast ? `${pm.count}/${pm.capacity}` : "—"}
                  </button>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* DETAIL PANEL */}
      {selectedSlots.length > 0 && (
        <div data-testid="admin-slots-panel" className="bg-white rounded-2xl shadow-xl ring-1 ring-neutral-100 p-4 sm:p-6 space-y-6">
          {/* EN-TÊTE */}
          <div className="border-b pb-4">
            <p className="text-neutral-500 font-medium mb-3">
              Gestion des réservations pour les créneaux sélectionnés
            </p>
            {/* Chips des créneaux sélectionnés */}
            <div className="flex flex-wrap gap-2">
              {selectedSlots.map(({ date, slot }) => (
                <span
                  key={`${date}|${slot}`}
                  data-testid="admin-selected-slot-chip"
                  data-date={date}
                  data-slot={slot}
                  className="flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-bold"
                >
                  {formatDayShort(new Date(date + "T00:00:00"))} {slot}
                  <button
                    onClick={() => handleSlotToggle(date, slot)}
                    className="ml-1 hover:text-blue-600 font-black"
                    aria-label={`Retirer ${date} ${slot}`}
                  >×</button>
                </span>
              ))}
            </div>
          </div>

          {/* ACTIONS PAR CRÉNEAU */}
          <div className="space-y-2">
            {selectedSlots.map(({ date, slot }) => {
              const isDateClosed = occMap.get(`${date}|AM`)?.closedDateId != null || occMap.get(`${date}|PM`)?.closedDateId != null
              const slotReservations = (reservationsByDate.get(date) ?? []).filter(r =>
                r.slot === slot || (r.slot === "FULL" && (slot === "AM" || slot === "PM"))
              )
              const count = slotReservations.length
              return (
                <div key={`${date}|${slot}`} className="flex items-center gap-3 p-3 bg-neutral-50 rounded-xl">
                  <span className="text-sm font-bold text-neutral-700 flex-1">
                    {formatDayShort(new Date(date + "T00:00:00"))} — {slot}
                  </span>
                  <button
                    data-testid="admin-cancel-slot-btn"
                    onClick={() => handleCancelSlotForDate(date, slot, count)}
                    className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg font-bold text-xs hover:bg-amber-100 transition-colors"
                  >
                    Annuler tout ({count})
                  </button>
                  {isDateClosed ? (
                    <button
                      data-testid="admin-open-date-btn"
                      onClick={() => handleOpenDate(date)}
                      className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg font-bold text-xs hover:bg-blue-100 transition-colors"
                    >
                      Réouvrir
                    </button>
                  ) : (
                    <button
                      data-testid="admin-close-date-btn"
                      onClick={() => handleCloseDate(date)}
                      className="px-3 py-1.5 bg-red-50 text-red-700 rounded-lg font-bold text-xs hover:bg-red-100 transition-colors"
                    >
                      Fermer la journée
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* TABLEAU FUSIONNÉ */}
          {loadingReservations ? (
            <div className="text-center py-8 text-neutral-400 italic">Chargement...</div>
          ) : (
            <div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
              <table data-testid="admin-reservations-table" className="w-full text-left">
                <thead>
                  <tr className="border-b text-neutral-400 text-xs font-bold uppercase tracking-wider">
                    <th className="px-4 py-3">Créneau</th>
                    <th className="px-4 py-3">Membre</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {filteredReservations.length === 0 ? (
                    <tr><td colSpan={5} className="py-12 text-center text-neutral-400 italic">Aucune réservation pour les créneaux sélectionnés.</td></tr>
                  ) : (
                    filteredReservations.map(res => (
                      <tr key={res.id} data-testid="admin-reservation-row" className="hover:bg-neutral-50 transition-colors">
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                            res.slot === "FULL" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                          }`}>
                            {res.slot === "FULL" ? "FULL" : res.slot} – {formatDayShort(new Date(res._date + "T00:00:00"))}
                          </span>
                        </td>
                        <td className="px-4 py-4 font-bold text-neutral-900">{res.user ? `${res.user.firstName} ${res.user.lastName}` : "N/A"}</td>
                        <td className="px-4 py-4 text-neutral-500 text-sm font-medium">{res.user?.email || "N/A"}</td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                            res.status === "CONFIRMED" ? "bg-green-100 text-green-700" : "bg-neutral-100 text-neutral-700"
                          }`}>
                            {res.status}
                          </span>
                        </td>
                        <td className="px-4 py-4 text-right">
                          {res.status === "CONFIRMED" && (
                            <button
                              data-testid="admin-cancel-btn"
                              onClick={() => handleCancelIndividual(res.id)}
                              className="text-red-600 font-bold text-xs hover:underline decoration-2 underline-offset-4"
                            >
                              Annuler
                            </button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* CONFIRMATION DIALOG */}
      <AnimatePresence>
        {confirmDialog.isOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
              className="absolute inset-0 bg-neutral-900/40 backdrop-blur-sm"
            />
            <motion.div
              data-testid="admin-confirm-dialog"
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full"
            >
              <h4 className="text-xl font-black text-neutral-900 mb-2">{confirmDialog.title}</h4>
              <p className="text-neutral-500 font-medium mb-8 leading-relaxed">{confirmDialog.message}</p>
              <div className="flex gap-4">
                <button
                  data-testid="admin-confirm-yes"
                  onClick={confirmDialog.onConfirm}
                  className="flex-1 bg-red-600 text-white font-black py-3 rounded-xl hover:bg-red-700 transition-colors shadow-lg shadow-red-200"
                >
                  Confirmer
                </button>
                <button
                  data-testid="admin-confirm-no"
                  onClick={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
                  className="flex-1 bg-neutral-100 text-neutral-600 font-black py-3 rounded-xl hover:bg-neutral-200 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
