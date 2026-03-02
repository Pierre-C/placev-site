"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { formatYMD, addDays, getMonthGridWeekdays } from "@/lib/calendar-utils"
import { useRouter } from "next/navigation"

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
    name: string | null
    email: string | null
    segment: string | null
  } | null
}

const WEEKDAY_HEADERS = ["Lun", "Mar", "Mer", "Jeu", "Ven"]
const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]

function startOfMonth(d = new Date()): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), 1)
  x.setHours(0, 0, 0, 0)
  return x
}

interface AdminCalendarProps {
  capacity: number
  openDays: number[]
}

export default function AdminCalendar({ capacity, openDays }: AdminCalendarProps) {
  const router = useRouter()
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth())
  const [occupancy, setOccupancy] = useState<OccupancyItem[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState<string | null>(null)
  const [reservations, setReservations] = useState<ReservationDetail[]>([])
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

  const fetchReservations = async (date: string) => {
    try {
      setLoadingReservations(true)
      const res = await fetch(`/api/admin/reservations?date=${date}`)
      if (res.ok) {
        const data = await res.json()
        setReservations(data)
      }
      setLoadingReservations(false)
    } catch (err) {
      console.error("Failed to fetch reservations", err)
      setLoadingReservations(false)
    }
  }

  const handleDateClick = (date: string) => {
    setSelectedDate(date)
    fetchReservations(date)
  }

  const occMap = useMemo(() => {
    const m = new Map<string, OccupancyItem>()
    for (const item of occupancy) {
      m.set(`${item.date}|${item.slot}`, item)
    }
    return m
  }, [occupancy])

  const handleCancelIndividual = async (resId: string) => {
    setConfirmDialog({
      isOpen: true,
      title: "Annuler cette réservation ?",
      message: "L'utilisateur sera remboursé et recevra un email d'annulation.",
      onConfirm: async () => {
        const res = await fetch(`/api/admin/reservations/${resId}/cancel`, { method: "POST" })
        if (res.ok) {
          setSuccessMessage("Réservation annulée avec succès")
          if (selectedDate) fetchReservations(selectedDate)
          fetchOccupancy()
          setTimeout(() => setSuccessMessage(null), 3000)
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  const handleCancelSlot = async (slot: "AM" | "PM") => {
    if (!selectedDate) return
    const count = reservations.filter(r => {
        if (slot === "AM") return r.slot === "AM" || r.slot === "FULL"
        return r.slot === "PM" || r.slot === "FULL"
    }).length

    setConfirmDialog({
      isOpen: true,
      title: `Annuler toutes les réservations ${slot} ?`,
      message: `Cela annulera ${count} réservation(s). Les utilisateurs seront remboursés.`,
      onConfirm: async () => {
        const res = await fetch(`/api/admin/reservations/cancel-slot`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: selectedDate, slot })
        })
        if (res.ok) {
          setSuccessMessage(`${count} réservation(s) annulée(s)`)
          fetchReservations(selectedDate)
          fetchOccupancy()
          setTimeout(() => setSuccessMessage(null), 3000)
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  const handleCloseDate = async () => {
    if (!selectedDate) return
    setConfirmDialog({
      isOpen: true,
      title: "Fermer cette date ?",
      message: "Toutes les réservations seront annulées et remboursées. La date deviendra indisponible.",
      onConfirm: async () => {
        const res = await fetch(`/api/admin/close-date`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: selectedDate, reason: "Fermeture administrative" })
        })
        if (res.ok) {
          setSuccessMessage("Date fermée et réservations annulées")
          fetchReservations(selectedDate)
          fetchOccupancy()
          setTimeout(() => setSuccessMessage(null), 3000)
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  const handleOpenDate = async () => {
    if (!selectedDate) return
    setConfirmDialog({
      isOpen: true,
      title: "Réouvrir cette date ?",
      message: "La date redeviendra disponible pour les réservations.",
      onConfirm: async () => {
        const res = await fetch(`/api/admin/close-date`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: selectedDate })
        })
        if (res.ok) {
          setSuccessMessage("Date réouverte avec succès")
          fetchReservations(selectedDate)
          fetchOccupancy()
          setTimeout(() => setSuccessMessage(null), 3000)
        }
        setConfirmDialog(prev => ({ ...prev, isOpen: false }))
      }
    })
  }

  const monthLabel = `${MONTHS_FR[monthCursor.getMonth()]} ${monthCursor.getFullYear()}`

  // Check if selected date is manually closed
  const isSelectedDateManuallyClosed = useMemo(() => {
    if (!selectedDate) return false
    const am = occMap.get(`${selectedDate}|AM`)
    const pm = occMap.get(`${selectedDate}|PM`)
    return (am?.closedDateId != null) || (pm?.closedDateId != null)
  }, [selectedDate, occMap])

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
      <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm ring-1 ring-neutral-100">
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
      <div data-testid="admin-calendar-grid" style={{ maxHeight: "480px", overflowY: "auto" }}>
        <div className="grid grid-cols-5 gap-2">
          {WEEKDAY_HEADERS.map(h => (
            <div key={h} className="text-center text-xs font-bold text-neutral-400 pb-2">{h}</div>
          ))}
          {days.map((day, i) => {
            const dateStr = formatYMD(day)
            const isCurrentMonth = day.getMonth() === monthCursor.getMonth()
            const am = occMap.get(`${dateStr}|AM`)
            const pm = occMap.get(`${dateStr}|PM`)
            const isClosed = am?.isClosed || pm?.isClosed
            const isSelected = selectedDate === dateStr

            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const isPast = day < today
            const isToday = day.getTime() === today.getTime()

            return (
              <div
                key={i}
                data-past={isPast ? "true" : "false"}
                data-today={isToday ? "true" : "false"}
                className={`relative aspect-square rounded-xl overflow-hidden transition-all ${
                  isCurrentMonth ? "ring-1 ring-neutral-100" : "opacity-30 grayscale"
                } ${isSelected ? "ring-2 ring-blue-500 shadow-md" : ""} ${isPast ? "opacity-40" : ""} ${isToday ? "ring-2 ring-blue-500 rounded-lg" : ""}`}
              >
              <span className="absolute top-1 left-2 z-30 text-xs font-bold text-neutral-400 pointer-events-none">
                {day.getDate()}
              </span>

              {/* TRIANGLES */}
              <div
                className={`absolute inset-0 ${isClosed ? "bg-neutral-50" : "bg-white"}`}
                style={{ pointerEvents: "none" }}
              >
                 {/* AM */}
                 <div
                    className={`absolute inset-0 ${isClosed ? "bg-neutral-100" : "bg-emerald-50"}`}
                    style={{ clipPath: "polygon(0% 0%, 100% 0%, 0% 100%)" }}
                 />
                 {/* PM */}
                 <div
                    className={`absolute inset-0 ${isClosed ? "bg-neutral-100" : "bg-emerald-50"}`}
                    style={{ clipPath: "polygon(100% 0%, 100% 100%, 0% 100%)" }}
                 />
              </div>

              {/* COUNTERS / CLICKABLE TILES */}
              <button
                type="button"
                data-testid="admin-calendar-slot-tile"
                data-date={dateStr}
                data-slot="AM"
                data-count={am?.count ?? 0}
                data-capacity={am?.capacity ?? capacity}
                onClick={(e) => {
                    e.stopPropagation()
                    handleDateClick(dateStr)
                }}
                className="absolute top-0 left-0 w-1/2 h-1/2 z-10 appearance-none bg-transparent border-none p-0 cursor-pointer"
              >
                {!isClosed && am && (
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-700 pointer-events-none">
                    {am.count}/{am.capacity}
                  </span>
                )}
              </button>
              <button
                type="button"
                data-testid="admin-calendar-slot-tile"
                data-date={dateStr}
                data-slot="PM"
                data-count={pm?.count ?? 0}
                data-capacity={pm?.capacity ?? capacity}
                onClick={(e) => {
                    e.stopPropagation()
                    handleDateClick(dateStr)
                }}
                className="absolute bottom-0 right-0 w-1/2 h-1/2 z-10 appearance-none bg-transparent border-none p-0 cursor-pointer"
              >
                {!isClosed && pm && (
                  <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[10px] font-bold text-emerald-700 pointer-events-none">
                    {pm.count}/{pm.capacity}
                  </span>
                )}
              </button>

              {/* FULL BUTTON (CENTER) */}
              {!isClosed && (
                <div
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-white/80 backdrop-blur-sm px-1.5 py-0.5 rounded-full text-[8px] font-black text-neutral-600 shadow-sm border border-neutral-100 pointer-events-none"
                >
                    JOURNÉE
                </div>
              )}
            </div>
          )
        })}
        </div>
      </div>

      {/* DETAIL PANEL */}
      {selectedDate && (
        <div data-testid="admin-calendar-date-panel" className="bg-white rounded-2xl shadow-xl ring-1 ring-neutral-100 p-6 space-y-6">
          <div className="flex items-center justify-between border-b pb-4">
            <div>
              <h4 className="text-2xl font-black text-neutral-900">{selectedDate}</h4>
              <p className="text-neutral-500 font-medium">Gestion des réservations pour cette journée</p>
            </div>
            <div className="flex gap-2">
              <button
                data-testid="admin-cancel-slot-btn"
                onClick={() => handleCancelSlot("AM")}
                className="px-4 py-2 bg-amber-50 text-amber-700 rounded-xl font-bold text-sm hover:bg-amber-100 transition-colors"
              >
                Annuler tout AM
              </button>
              <button
                data-testid="admin-cancel-slot-btn"
                onClick={() => handleCancelSlot("PM")}
                className="px-4 py-2 bg-amber-50 text-amber-700 rounded-xl font-bold text-sm hover:bg-amber-100 transition-colors"
              >
                Annuler tout PM
              </button>
              {isSelectedDateManuallyClosed ? (
                <button
                  data-testid="admin-open-date-btn"
                  onClick={handleOpenDate}
                  className="px-4 py-2 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors"
                >
                  Réouvrir cette date
                </button>
              ) : (
                <button
                  data-testid="admin-close-date-btn"
                  onClick={handleCloseDate}
                  className="px-4 py-2 bg-red-50 text-red-700 rounded-xl font-bold text-sm hover:bg-red-100 transition-colors"
                >
                  Fermer cette date
                </button>
              )}
            </div>
          </div>

          {loadingReservations ? (
            <div className="text-center py-12 text-neutral-400 font-medium italic">Chargement des réservations...</div>
          ) : (
            <div className="overflow-x-auto">
              <table data-testid="admin-reservations-table" className="w-full text-left">
                <thead>
                  <tr className="border-b text-neutral-400 text-xs font-bold uppercase tracking-wider">
                    <th className="px-4 py-3">Membre</th>
                    <th className="px-4 py-3">Email</th>
                    <th className="px-4 py-3">Créneau</th>
                    <th className="px-4 py-3">Statut</th>
                    <th className="px-4 py-3 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {reservations.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-neutral-400 font-medium italic">
                        Aucune réservation pour ce jour.
                      </td>
                    </tr>
                  ) : (
                    reservations.map(res => (
                      <tr key={res.id} data-testid="admin-reservation-row" className="hover:bg-neutral-50 transition-colors">
                        <td className="px-4 py-4 font-bold text-neutral-900">{res.user?.name || "N/A"}</td>
                        <td className="px-4 py-4 text-neutral-500 text-sm font-medium">{res.user?.email || "N/A"}</td>
                        <td className="px-4 py-4">
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase ${
                            res.slot === "FULL" ? "bg-purple-100 text-purple-700" : "bg-blue-100 text-blue-700"
                          }`}>
                            {res.slot}
                          </span>
                        </td>
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
