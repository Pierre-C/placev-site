"use client"

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatYMD, addDays, getMonthGridWeekdays } from "@/lib/calendar-utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type SlotId = "AM" | "PM"

type AvailabilityItem = {
  date: string
  slot: "AM" | "PM"
  remaining: number
  isClosed: boolean
}

type MyReservation = {
  id: string
  date: string
  slot: "AM" | "PM" | "FULL"
  creditsCost: number
  canCancel: boolean
}

type SelectedSlot = {
  date: string
  slot: SlotId
}

type HalfSlotState = "past" | "closed" | "full" | "mine" | "available"

type BookingState =
  | "idle"
  | "loading"
  | "success"
  | "error-balance"
  | "error-full"
  | "error-closed"
  | "error-other"

type CancelState = "idle" | "loading" | "success" | "error"
type PanelMode = "book" | "cancel"

// ─── Constantes ───────────────────────────────────────────────────────────────

const WEEKDAY_HEADERS = ["Lun", "Mar", "Mer", "Jeu", "Ven"]

const MONTHS_FR = [
  "Janvier", "Février", "Mars", "Avril", "Mai", "Juin",
  "Juillet", "Août", "Septembre", "Octobre", "Novembre", "Décembre",
]

const WEEKDAYS_FR = [
  "Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi",
]

// ─── Helpers locaux ───────────────────────────────────────────────────────────

function startOfMonth(d = new Date()): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), 1)
  x.setHours(0, 0, 0, 0)
  return x
}

function formatDateFR(dateStr: string): string {
  const d = new Date(dateStr + "T00:00:00")
  return `${WEEKDAYS_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]} ${d.getFullYear()}`
}

function formatDayShort(d: Date): string {
  const dayName = WEEKDAYS_FR[d.getDay()].substring(0, 3).toLowerCase()
  return `${dayName}. ${d.getDate()}`
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface BookingCalendarProps {
  userId?: string
  initialCredits?: number
  openDays?: number[]
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function BookingCalendar({
  userId,
  initialCredits,
  openDays = [1, 2, 3],
}: BookingCalendarProps) {
  const isAuthenticated = !!userId
  const router = useRouter()

  const [monthCursor, setMonthCursor] = useState(() => startOfMonth())
  const [availability, setAvailability] = useState<AvailabilityItem[]>([])
  const [myReservations, setMyReservations] = useState<MyReservation[]>([])
  const [loading, setLoading] = useState(true)
  const [fetchError, setFetchError] = useState<string | null>(null)

  // Panneau réservation (multi-sélection)
  const [selectedSlots, setSelectedSlots] = useState<SelectedSlot[]>([])
  const [bookingState, setBookingState] = useState<BookingState>("idle")

  // Panneau annulation
  const [panelMode, setPanelMode] = useState<PanelMode>("book")
  const [cancelReservation, setCancelReservation] = useState<MyReservation | null>(null)
  const [cancelState, setCancelState] = useState<CancelState>("idle")

  // Solde courant
  const [credits, setCredits] = useState(initialCredits ?? 0)

  const days = useMemo(() => getMonthGridWeekdays(monthCursor), [monthCursor])

  const today = useMemo(() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return t
  }, [])

  const availMap = useMemo(() => {
    const m = new Map<string, AvailabilityItem>()
    for (const a of availability) {
      m.set(`${a.date}|${a.slot}`, a)
    }
    return m
  }, [availability])

  const myReservationMap = useMemo(() => {
    const m = new Map<string, MyReservation>()
    for (const r of myReservations) {
      if (r.slot === "FULL") {
        m.set(`${r.date}|AM`, r)
        m.set(`${r.date}|PM`, r)
        m.set(`${r.date}|FULL`, r)
      } else {
        m.set(`${r.date}|${r.slot}`, r)
      }
    }
    return m
  }, [myReservations])

  const fetchAllData = useCallback(async (signal?: AbortSignal) => {
    try {
      setLoading(true)
      setFetchError(null)
      const start = formatYMD(days[0])
      const end = formatYMD(addDays(days[29], 1))

      const fetchAvail = fetch(
        `/api/availability?start=${start}&end=${end}`,
        signal ? { signal } : undefined,
      )
      const fetchMine = userId
        ? fetch(`/api/booking/mine?start=${start}&end=${end}`, signal ? { signal } : undefined)
        : Promise.resolve(null)

      const [availRes, mineRes] = await Promise.all([fetchAvail, fetchMine])

      if (!availRes.ok) throw new Error("Réponse serveur invalide")
      const availData: AvailabilityItem[] = await availRes.json()
      setAvailability(availData)

      if (mineRes?.ok) {
        const mineData: MyReservation[] = await mineRes.json()
        setMyReservations(mineData)
      }

      setLoading(false)
    } catch (err) {
      if (signal?.aborted) return
      if (err instanceof DOMException && err.name === "AbortError") return
      setFetchError("Impossible de charger les disponibilités. Veuillez réessayer.")
      setAvailability([])
      setLoading(false)
    }
  }, [days, userId])

  useEffect(() => {
    const controller = new AbortController()
    fetchAllData(controller.signal)
    return () => controller.abort()
  }, [fetchAllData])

  function getHalfSlotState(day: Date, slotId: "AM" | "PM"): HalfSlotState {
    if (day < today) return "past"
    const dateStr = formatYMD(day)
    if (userId && myReservationMap.has(`${dateStr}|${slotId}`)) return "mine"
    const item = availMap.get(`${dateStr}|${slotId}`)
    if (item?.isClosed) return "closed"
    if ((item?.remaining ?? 0) === 0) return "full"
    return "available"
  }

  function getRemaining(day: Date, slotId: "AM" | "PM"): number {
    const dateStr = formatYMD(day)
    return availMap.get(`${dateStr}|${slotId}`)?.remaining ?? 0
  }

  const totalCostBasket = selectedSlots.length
  const balanceAfter = credits - totalCostBasket

  function handleSlotClick(day: Date, slotId: "AM" | "PM") {
    const state = getHalfSlotState(day, slotId)
    const dateStr = formatYMD(day)

    if (state === "mine") {
      const myRes = myReservationMap.get(`${dateStr}|${slotId}`)
      if (myRes) {
        setCancelReservation(myRes)
        setPanelMode("cancel")
        setCancelState("idle")
        setBookingState("idle")
      }
      return
    }

    if (state !== "available") return

    const isAlreadySelected = selectedSlots.some(s => s.date === dateStr && s.slot === slotId)

    if (isAlreadySelected) {
      setSelectedSlots(prev => prev.filter(s => !(s.date === dateStr && s.slot === slotId)))
    } else {
      setSelectedSlots(prev => [...prev, { date: dateStr, slot: slotId }])
    }
    
    setPanelMode("book")
    setCancelReservation(null)
    setCancelState("idle")
    setBookingState("idle")
  }

  function handleClosePanel() {
    setBookingState("idle")
    setCancelReservation(null)
    setPanelMode("book")
    setCancelState("idle")
  }

  async function handleConfirm() {
    if (selectedSlots.length === 0 || bookingState === "loading") return
    setBookingState("loading")

    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ bookings: selectedSlots.map(s => ({ date: s.date, slot: s.slot })) }),
      })

      if (res.status === 201) {
        const body = await res.json()
        setCredits(prev => prev - body.totalCost)
        router.refresh()
        setBookingState("success")
        await fetchAllData()
        setTimeout(() => {
          setSelectedSlots([])
          setBookingState("idle")
        }, 3000)
      } else if (res.status === 403) {
        setBookingState("error-balance")
      } else if (res.status === 409) {
        setBookingState("error-full")
        await fetchAllData()
      } else if (res.status === 422) {
        const body = await res.json()
        setBookingState(body.error?.includes("fermé") || body.error?.includes("ouvert") ? "error-closed" : "error-other")
      } else {
        setBookingState("error-other")
      }
    } catch {
      setBookingState("error-other")
    }
  }

  async function handleCancelConfirm() {
    if (!cancelReservation || cancelState === "loading") return
    setCancelState("loading")

    try {
      const res = await fetch(`/api/booking/${cancelReservation.id}/cancel`, {
        method: "POST",
      })

      if (res.ok) {
        const body = await res.json()
        setCredits(body.newBalance)
        router.refresh()
        setCancelState("success")
        await fetchAllData()
        setTimeout(() => {
          setCancelReservation(null)
          setPanelMode("book")
          setCancelState("idle")
        }, 3000)
      } else {
        setCancelState("error")
      }
    } catch {
      setCancelState("error")
    }
  }

  function renderOpenDayCell(day: Date) {
    const dateStr = formatYMD(day)
    const amState = getHalfSlotState(day, "AM")
    const pmState = getHalfSlotState(day, "PM")
    const isAmSelected = selectedSlots.some(s => s.date === dateStr && s.slot === "AM")
    const isPmSelected = selectedSlots.some(s => s.date === dateStr && s.slot === "PM")

    const amRemaining = getRemaining(day, "AM")
    const pmRemaining = getRemaining(day, "PM")

    const amDisabled =
      amState === "past" || amState === "closed" || amState === "full" ||
      (!isAuthenticated && amState === "available") ||
      (amState === "available" && totalCostBasket >= credits)

    const pmDisabled =
      pmState === "past" || pmState === "closed" || pmState === "full" ||
      (!isAuthenticated && pmState === "available") ||
      (pmState === "available" && totalCostBasket >= credits)

    function getClasses(state: HalfSlotState, isSelected: boolean) {
      if (state === "past" || state === "closed") return "bg-neutral-100 text-neutral-400 cursor-not-allowed"
      if (state === "full") return "bg-red-100 text-red-800 cursor-not-allowed"
      if (state === "mine") return "bg-blue-200 text-blue-800 hover:bg-blue-300"
      if (isSelected) return "bg-blue-600 text-white"
      return "bg-green-100 text-green-800 hover:bg-green-200"
    }

    const isToday = formatYMD(day) === formatYMD(today)
    return (
      <div 
        className={`flex flex-col rounded-lg overflow-hidden border ${isToday ? "border-blue-500" : "border-neutral-100"}`}
        data-today={isToday ? "true" : "false"}
      >
        <div className="px-1 py-0.5 text-center text-[10px] font-semibold text-neutral-500 bg-white border-b border-neutral-100">
          {formatDayShort(day)}
        </div>
        
        <button
          data-testid="slot-am"
          data-date={dateStr}
          data-disabled={amDisabled ? "true" : undefined}
          data-full={amState === "full" ? "true" : undefined}
          disabled={amState !== "available" && amState !== "mine"}
          onClick={() => handleSlotClick(day, "AM")}
          className={`flex-1 px-1 py-1.5 text-center text-[10px] leading-tight transition-colors ${getClasses(amState, isAmSelected)}`}
        >
          AM<br/>
          {amState === "available" && `${amRemaining}/15`}
          {amState === "full" && "Complet"}
          {amState === "mine" && "Réservé"}
          {(amState === "past" || amState === "closed") && "—"}
        </button>

        <div className="h-[1px] bg-white opacity-50" />

        <button
          data-testid="slot-pm"
          data-date={dateStr}
          data-disabled={pmDisabled ? "true" : undefined}
          data-full={pmState === "full" ? "true" : undefined}
          disabled={pmState !== "available" && pmState !== "mine"}
          onClick={() => handleSlotClick(day, "PM")}
          className={`flex-1 px-1 py-1.5 text-center text-[10px] leading-tight transition-colors ${getClasses(pmState, isPmSelected)}`}
        >
          PM<br/>
          {pmState === "available" && `${pmRemaining}/15`}
          {pmState === "full" && "Complet"}
          {pmState === "mine" && "Réservé"}
          {(pmState === "past" || pmState === "closed") && "—"}
        </button>
      </div>
    )
  }

  function renderClosedDayCell(day: Date) {
    const isToday = formatYMD(day) === formatYMD(today)
    return (
      <div 
        className={`flex flex-col rounded-lg overflow-hidden border ${isToday ? "border-blue-500" : "border-neutral-100"} bg-neutral-50`}
        data-today={isToday ? "true" : "false"}
        style={{ height: "100%" }}
      >
        <div className="px-1 py-0.5 text-center text-[10px] font-semibold text-neutral-400 bg-neutral-100 border-b border-neutral-200">
          {formatDayShort(day)}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <span className="text-neutral-300 text-xs">—</span>
        </div>
      </div>
    )
  }

  const cancelSlotLabel = cancelReservation
    ? (cancelReservation.slot === "AM" ? "Matin 09h–13h" : cancelReservation.slot === "PM" ? "Après-midi 14h–18h" : "Journée 09h–18h")
    : ""
  const monthLabel = `${MONTHS_FR[monthCursor.getMonth()]} ${monthCursor.getFullYear()}`

  return (
    <div data-testid="booking-calendar" className="mx-auto max-w-4xl relative">
      <div className="mb-4 flex items-center justify-between">
        <button
          data-testid="calendar-prev-month"
          onClick={() => {
            setMonthCursor((m) => startOfMonth(new Date(m.getFullYear(), m.getMonth() - 1, 1)))
          }}
          className="rounded-lg px-3 py-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
          aria-label="Mois précédent"
        >
          ←
        </button>
        <h2 data-testid="calendar-month-label" className="text-lg font-semibold capitalize text-neutral-900">
          {monthLabel}
        </h2>
        <button
          data-testid="calendar-next-month"
          onClick={() => {
            setMonthCursor((m) => startOfMonth(new Date(m.getFullYear(), m.getMonth() + 1, 1)))
          }}
          className="rounded-lg px-3 py-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
          aria-label="Mois suivant"
        >
          →
        </button>
      </div>

      <div className="mb-1 grid grid-cols-5 gap-1 text-center text-xs font-medium text-neutral-400">
        {WEEKDAY_HEADERS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {fetchError && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {fetchError}
        </div>
      )}

      <div className="mb-3 flex flex-wrap gap-3 text-xs text-neutral-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-green-100" />
          Disponible
        </span>
        {isAuthenticated && (
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm bg-blue-200" />
            Ma réservation
          </span>
        )}
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-red-100" />
          Complet
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-neutral-100" />
          Fermé
        </span>
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center text-sm text-neutral-400">
          Chargement des disponibilités…
        </div>
      ) : (
        <div className="grid grid-cols-5 gap-1">
          {days.map((day, i) => {
            const isCurrentMonth = day.getMonth() === monthCursor.getMonth()
            const isOpen = openDays.includes(day.getDay())

            return (
              <div key={i} className={isCurrentMonth ? "" : "opacity-25"}>
                {isOpen ? renderOpenDayCell(day) : renderClosedDayCell(day)}
              </div>
            )
          })}
        </div>
      )}

      {/* Panneau de résumé TOUJOURS visible et sticky */}
      <div 
        data-testid="booking-summary"
        className="sticky bottom-4 mt-6 rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-100 z-50"
      >
        {panelMode === "cancel" && cancelReservation ? (
          <>
            <div className="mb-4 flex items-start justify-between">
              <div>
                <p className="text-sm text-neutral-500">Réservation à annuler</p>
                <p className="mt-0.5 text-lg font-semibold text-neutral-900">
                  {formatDateFR(cancelReservation.date)}
                </p>
                <p className="text-sm text-neutral-600">{cancelSlotLabel}</p>
              </div>
              <button
                onClick={handleClosePanel}
                className="rounded-lg p-1 text-neutral-400 hover:text-neutral-600"
                aria-label="Fermer"
              >
                ✕
              </button>
            </div>

            <div className="mb-4">
              <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-700">
                Remboursement : {cancelReservation.creditsCost} crédit{cancelReservation.creditsCost > 1 ? "s" : ""}
              </span>
            </div>

            {cancelState === "success" && (
              <div data-testid="cancel-success" className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700">
                ✓ Réservation annulée — vos crédits ont été remboursés.
              </div>
            )}

            {cancelState === "error" && (
              <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
                Une erreur est survenue. Veuillez réessayer.
              </div>
            )}

            {cancelState !== "success" && !cancelReservation.canCancel && (
              <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                Annulation impossible : moins de 12h avant le début du créneau.
              </div>
            )}

            {cancelState !== "success" && cancelReservation.canCancel && (
              <div className="mt-2 rounded-xl bg-neutral-50 p-4">
                <p className="mb-3 text-sm text-neutral-700">
                  Confirmer l&apos;annulation ? Vous récupérerez {cancelReservation.creditsCost} crédit{cancelReservation.creditsCost > 1 ? "s" : ""}.
                </p>
                <div className="flex gap-2">
                  <button
                    data-testid="confirm-cancel"
                    onClick={handleCancelConfirm}
                    disabled={cancelState === "loading"}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {cancelState === "loading" ? "Annulation…" : "Oui, annuler"}
                  </button>
                  <button
                    onClick={handleClosePanel}
                    className="rounded-lg bg-white px-4 py-2 text-sm font-medium text-neutral-700 ring-1 ring-neutral-200 hover:bg-neutral-50"
                  >
                    Garder la réservation
                  </button>
                </div>
              </div>
            )}
            {cancelState === "success" && (
              <button onClick={handleClosePanel} className="mt-3 w-full rounded-xl bg-neutral-100 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-200">
                Fermer
              </button>
            )}
          </>
        ) : (
          <>
            {selectedSlots.length === 0 ? (
              <div className="text-center text-neutral-500 py-2">
                Sélectionnez des créneaux pour réserver
              </div>
            ) : (
              <>
                <div className="mb-4">
                  <p className="text-sm font-semibold text-neutral-900 mb-2">Créneaux sélectionnés :</p>
                  <ul className="text-sm text-neutral-600 mb-4 max-h-32 overflow-y-auto pr-2">
                    {selectedSlots.map((s, i) => (
                      <li key={i}>• {formatDateFR(s.date)} ({s.slot === "AM" ? "Matin" : "Après-midi"})</li>
                    ))}
                  </ul>
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-700">
                    Coût total : {totalCostBasket} crédit{totalCostBasket > 1 ? "s" : ""}
                  </span>
                  {isAuthenticated && (
                    <span className="text-sm text-neutral-500">
                      Solde après : <strong>{balanceAfter}</strong> crédit{Math.abs(balanceAfter) !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {bookingState === "success" && (
                  <div data-testid="booking-success" className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700 mb-3">
                    ✓ Réservation confirmée !
                  </div>
                )}
                {bookingState === "error-balance" && (
                  <div data-testid="error-insufficient-balance" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 mb-3">
                    Solde insuffisant pour cette réservation. <Link href="/dashboard/recharger" data-testid="link-buy-credits" className="font-medium underline">Acheter des crédits</Link>
                  </div>
                )}
                {bookingState === "error-full" && (
                  <div data-testid="error-slot-full" className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700 mb-3">
                    Un ou plusieurs créneaux sont complets. Les disponibilités ont été mises à jour.
                  </div>
                )}
                {bookingState === "error-closed" && (
                  <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700 mb-3">
                    Un jour sélectionné est fermé.
                  </div>
                )}
                {bookingState === "error-other" && (
                  <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700 mb-3">
                    Une erreur est survenue. Veuillez réessayer.
                  </div>
                )}

                {bookingState !== "success" && (
                  <div className="mt-4">
                    {isAuthenticated ? (
                      <button
                        data-testid="confirm-booking"
                        onClick={handleConfirm}
                        disabled={bookingState === "loading"}
                        className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50 transition-colors"
                      >
                        {bookingState === "loading" ? "Confirmation en cours…" : `Confirmer la réservation (${totalCostBasket} crédit${totalCostBasket > 1 ? "s" : ""})`}
                      </button>
                    ) : (
                      <div className="rounded-xl bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                        <Link href="/login" className="font-medium text-neutral-900 underline">
                          Connectez-vous
                        </Link> pour réserver.
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
          </>
        )}
      </div>
    </div>
  )
}
