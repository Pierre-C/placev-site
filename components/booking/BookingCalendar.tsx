"use client"

/**
 * components/booking/BookingCalendar.tsx
 * Composant calendrier de réservation — design triangle clip-path.
 *
 * Grille 5 colonnes Lun–Ven (6 semaines × 5 jours = 30 cases).
 * Jours ouverts (openDays, ex: Lun/Mar/Mer) : triangles AM (haut-gauche) + PM (bas-droit) + bouton FULL.
 * Jours non-ouverts (Jeu, Ven) : case grisée, pas d'interaction.
 * Sam/Dim : absents de la grille.
 *
 * Fonctionnalités :
 * - Affiche les réservations de l'utilisateur (bleu) vs disponibles (vert)
 * - Affiche le nombre de places restantes sur les créneaux disponibles
 * - Permet l'annulation directe depuis le calendrier en cliquant sur un créneau déjà réservé
 */

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { formatYMD, addDays, getMonthGridWeekdays } from "@/lib/calendar-utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type SlotId = "AM" | "PM" | "FULL"

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
type FullSlotState = "past" | "closed" | "full" | "mine" | "available"

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

const SLOTS: { id: SlotId; label: string; cost: number }[] = [
  { id: "AM", label: "Matin 09h–13h", cost: 1 },
  { id: "PM", label: "Après-midi 14h–18h", cost: 1 },
  { id: "FULL", label: "Journée 09h–18h", cost: 2 },
]

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

// ─── Props ────────────────────────────────────────────────────────────────────

interface BookingCalendarProps {
  /** ID de l'utilisateur connecté (undefined si non authentifié) */
  userId?: string
  /** Solde de crédits initial (depuis le Server Component parent) */
  initialCredits?: number
  /** Jours de la semaine ouverts à la réservation (JS getDay: 1=Lun, 2=Mar, 3=Mer …) */
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

  // Panneau réservation
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null)
  const [bookingState, setBookingState] = useState<BookingState>("idle")

  // Panneau annulation
  const [panelMode, setPanelMode] = useState<PanelMode>("book")
  const [cancelReservation, setCancelReservation] = useState<MyReservation | null>(null)
  const [cancelState, setCancelState] = useState<CancelState>("idle")

  // Solde courant (mis à jour après réservation ou annulation)
  const [credits, setCredits] = useState(initialCredits ?? 0)

  // Grille 5 colonnes : 30 dates (6 sem × 5 jours Lun–Ven)
  const days = useMemo(() => getMonthGridWeekdays(monthCursor), [monthCursor])

  const today = useMemo(() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return t
  }, [])

  // availMap : Map<"YYYY-MM-DD|AM"|"YYYY-MM-DD|PM", AvailabilityItem> pour lookup O(1)
  const availMap = useMemo(() => {
    const m = new Map<string, AvailabilityItem>()
    for (const a of availability) {
      m.set(`${a.date}|${a.slot}`, a)
    }
    return m
  }, [availability])

  // myReservationMap : Map<"YYYY-MM-DD|AM"|...|"YYYY-MM-DD|FULL", MyReservation>
  // Une réservation FULL occupe aussi les clés AM et PM (pour la détection de clic)
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

  // ─── Chargement des données (disponibilités + mes réservations) ────────────

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

  // ─── Logique état d'un créneau ─────────────────────────────────────────────

  function getHalfSlotState(day: Date, slotId: "AM" | "PM"): HalfSlotState {
    if (day < today) return "past"
    const dateStr = formatYMD(day)
    if (userId && myReservationMap.has(`${dateStr}|${slotId}`)) return "mine"
    const item = availMap.get(`${dateStr}|${slotId}`)
    if (item?.isClosed) return "closed"
    if ((item?.remaining ?? 0) === 0) return "full"
    return "available"
  }

  function getFullSlotState(day: Date): FullSlotState {
    if (day < today) return "past"
    const dateStr = formatYMD(day)
    if (userId && myReservationMap.has(`${dateStr}|FULL`)) return "mine"
    const am = availMap.get(`${dateStr}|AM`)
    const pm = availMap.get(`${dateStr}|PM`)
    if (am?.isClosed || pm?.isClosed) return "closed"
    const minRemaining = Math.min(am?.remaining ?? 0, pm?.remaining ?? 0)
    return minRemaining === 0 ? "full" : "available"
  }

  function getRemaining(day: Date, slotId: SlotId): number {
    const dateStr = formatYMD(day)
    if (slotId === "FULL") {
      const am = availMap.get(`${dateStr}|AM`)
      const pm = availMap.get(`${dateStr}|PM`)
      return Math.min(am?.remaining ?? 0, pm?.remaining ?? 0)
    }
    return availMap.get(`${dateStr}|${slotId}`)?.remaining ?? 0
  }

  // ─── Handlers ─────────────────────────────────────────────────────────────

  function handleSlotClick(day: Date, slotId: SlotId) {
    const state = slotId === "FULL" ? getFullSlotState(day) : getHalfSlotState(day, slotId)

    if (state === "mine") {
      // Ouvrir le panneau d'annulation pour ce créneau
      const dateStr = formatYMD(day)
      const myRes = myReservationMap.get(`${dateStr}|${slotId}`)
      if (myRes) {
        setCancelReservation(myRes)
        setPanelMode("cancel")
        setCancelState("idle")
        setSelectedSlot(null)
        setBookingState("idle")
      }
      return
    }

    if (state !== "available") return
    setSelectedSlot({ date: formatYMD(day), slot: slotId })
    setPanelMode("book")
    setBookingState("idle")
    setCancelReservation(null)
    setCancelState("idle")
  }

  function handleClosePanel() {
    setSelectedSlot(null)
    setBookingState("idle")
    setCancelReservation(null)
    setPanelMode("book")
    setCancelState("idle")
  }

  async function handleConfirm() {
    if (!selectedSlot || bookingState === "loading") return
    setBookingState("loading")

    try {
      const res = await fetch("/api/booking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedSlot.date, slot: selectedSlot.slot }),
      })

      if (res.status === 201) {
        const body = await res.json()
        setCredits(body.reservation.newBalance)
        router.refresh()
        setBookingState("success")
        await fetchAllData() // rafraîchit disponibilités + mes réservations
        setTimeout(() => {
          setSelectedSlot(null)
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
        await fetchAllData() // rafraîchit disponibilités + mes réservations
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

  // ─── Valeurs dérivées pour les panneaux ────────────────────────────────────

  const slotCost = selectedSlot ? (selectedSlot.slot === "FULL" ? 2 : 1) : 0
  const balanceAfter = credits - slotCost
  const selectedSlotLabel = selectedSlot
    ? SLOTS.find((s) => s.id === selectedSlot.slot)?.label ?? selectedSlot.slot
    : ""
  const cancelSlotLabel = cancelReservation
    ? SLOTS.find((s) => s.id === cancelReservation.slot)?.label ?? cancelReservation.slot
    : ""
  const monthLabel = `${MONTHS_FR[monthCursor.getMonth()]} ${monthCursor.getFullYear()}`

  const showPanel =
    (panelMode === "book" && !!selectedSlot) ||
    (panelMode === "cancel" && !!cancelReservation)

  // ─── Rendu d'une cellule jour ouvert (triangle AM + PM + bouton FULL) ──────

  function renderOpenDayCell(day: Date) {
    const dateStr = formatYMD(day)
    const isPast = day < today
    const amState = getHalfSlotState(day, "AM")
    const pmState = getHalfSlotState(day, "PM")
    const fullState = getFullSlotState(day)
    const isFullSelected = selectedSlot?.date === dateStr && selectedSlot.slot === "FULL"
    const isAmSelected = selectedSlot?.date === dateStr && selectedSlot.slot === "AM"
    const isPmSelected = selectedSlot?.date === dateStr && selectedSlot.slot === "PM"

    const amRemaining = getRemaining(day, "AM")
    const pmRemaining = getRemaining(day, "PM")

    // Couleur triangle AM
    function amBg() {
      if (isPast || amState === "closed") return "bg-neutral-100"
      if (amState === "full") return "bg-neutral-200"
      if (amState === "mine") return "bg-blue-200 hover:bg-blue-300"
      if (isAmSelected) return "bg-emerald-500"
      if (isFullSelected) return "bg-neutral-200"
      return "bg-emerald-100 hover:bg-emerald-200"
    }

    // Couleur triangle PM
    function pmBg() {
      if (isPast || pmState === "closed") return "bg-neutral-100"
      if (pmState === "full") return "bg-neutral-200"
      if (pmState === "mine") return "bg-blue-200 hover:bg-blue-300"
      if (isPmSelected) return "bg-emerald-500"
      if (isFullSelected) return "bg-neutral-200"
      return "bg-emerald-100 hover:bg-emerald-200"
    }

    // Couleur bouton FULL
    function fullBg() {
      if (isPast || fullState === "closed" || fullState === "full") return "bg-neutral-300 text-neutral-400 cursor-not-allowed"
      if (fullState === "mine") return "bg-blue-400 text-white hover:bg-blue-500"
      if (isFullSelected) return "bg-emerald-600 text-white"
      return "bg-white text-neutral-600 hover:bg-emerald-50 hover:text-emerald-700 shadow"
    }

    const isToday = formatYMD(day) === formatYMD(today)
    return (
      <div
        className={`relative aspect-square rounded-lg overflow-hidden
          ${isPast ? "opacity-40" : ""}`}
        data-past={isPast ? "true" : "false"}
        data-today={isToday ? "true" : "false"}
      >        {/* Numéro du jour — z-30, toujours lisible */}
        <span
          className={`absolute top-0.5 left-1 z-30 text-[10px] font-semibold leading-none pointer-events-none select-none ${
            isPast ? "text-neutral-300" : "text-neutral-500"
          }`}
        >
          {day.getDate()}
        </span>

        {/* Indicateur aujourd'hui — bordure bleue permanente */}
        {isToday && (
          <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none z-40" />
        )}

        {/* Triangle AM visuel — haut-gauche, aucun événement souris */}
        <div
          className={`absolute inset-0 transition-colors ${amBg()}`}
          style={{ clipPath: "polygon(0% 0%, 100% 0%, 0% 100%)", pointerEvents: "none" }}
        />

        {/* Triangle PM visuel — bas-droit, aucun événement souris */}
        <div
          className={`absolute inset-0 transition-colors ${pmBg()}`}
          style={{ clipPath: "polygon(100% 0%, 100% 100%, 0% 100%)", pointerEvents: "none" }}
        />

        {/* Compteur places disponibles AM (à l'intérieur du triangle AM) */}
        {amState === "available" && !isAmSelected && !isFullSelected && (
          <span
            className="absolute pointer-events-none select-none text-[9px] font-bold text-emerald-700"
            style={{ top: "8%", right: "18%", zIndex: 5 }}
          >
            {amRemaining}
          </span>
        )}

        {/* Compteur places disponibles PM (à l'intérieur du triangle PM) */}
        {pmState === "available" && !isPmSelected && !isFullSelected && (
          <span
            className="absolute pointer-events-none select-none text-[9px] font-bold text-emerald-700"
            style={{ bottom: "8%", left: "18%", zIndex: 5 }}
          >
            {pmRemaining}
          </span>
        )}

        {/*
         * Zones de clic AM / PM : boutons transparents au bounding-box réduit.
         * AM occupe le quadrant haut-gauche (50%×50%) → Playwright clique à (25%, 25%).
         * PM occupe le quadrant bas-droit (50%×50%) → Playwright clique à (75%, 75%).
         * Le bouton FULL (au centre, z-20) ne couvre pas ces points → pas d'interception.
         */}
        <button
          data-testid="slot-tile"
          data-date={dateStr}
          data-slot="AM"
          data-remaining={amState === "available" ? amRemaining : undefined}
          data-disabled={amState === "past" || amState === "closed" ? "true" : undefined}
          data-full={amState === "full" ? "true" : undefined}
          disabled={amState !== "available" && amState !== "mine"}
          onClick={() => handleSlotClick(day, "AM")}
          className="absolute z-10"
          style={{ top: 0, left: 0, width: "50%", height: "50%", background: "transparent", border: "none", padding: 0 }}
          aria-label={`Matin ${dateStr}`}
        />

        <button
          data-testid="slot-tile"
          data-date={dateStr}
          data-slot="PM"
          data-remaining={pmState === "available" ? pmRemaining : undefined}
          data-disabled={pmState === "past" || pmState === "closed" ? "true" : undefined}
          data-full={pmState === "full" ? "true" : undefined}
          disabled={pmState !== "available" && pmState !== "mine"}
          onClick={() => handleSlotClick(day, "PM")}
          className="absolute z-10"
          style={{ bottom: 0, right: 0, width: "50%", height: "50%", background: "transparent", border: "none", padding: 0 }}
          aria-label={`Après-midi ${dateStr}`}
        />

        {/* Bouton FULL — centre, z-20, visible */}
        <button
          data-testid="slot-tile"
          data-date={dateStr}
          data-slot="FULL"
          data-remaining={fullState === "available" ? getRemaining(day, "FULL") : undefined}
          data-disabled={fullState === "past" || fullState === "closed" ? "true" : undefined}
          data-full={fullState === "full" ? "true" : undefined}
          disabled={fullState !== "available" && fullState !== "mine"}
          onClick={() => handleSlotClick(day, "FULL")}
          className={`absolute z-20 rounded-full px-1.5 py-0.5 text-[8px] font-semibold transition-colors ${fullBg()}`}
          style={{ top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}
          aria-label={`Journée ${dateStr}`}
        >
          Journée
        </button>
      </div>
    )
  }

  // ─── Rendu d'une cellule jour non-ouvert (Jeu, Ven) ──────────────────────

  function renderClosedDayCell(day: Date) {
    const isCurrentMonth = day.getMonth() === monthCursor.getMonth()
    const isPastClosed = day < today
    const isToday = formatYMD(day) === formatYMD(today)
    return (
      <div
        className={`relative aspect-square rounded-lg bg-neutral-50 flex flex-col items-start justify-start p-1 ${
          isCurrentMonth ? "" : "opacity-25"
        } ${isPastClosed ? "opacity-40" : ""}`}
        data-past={isPastClosed ? "true" : "false"}
        data-today={isToday ? "true" : "false"}
      >
        <span className="text-[10px] font-semibold text-neutral-300 leading-none">
          {day.getDate()}
        </span>

        {/* Indicateur aujourd'hui — bordure bleue permanente */}
        {isToday && (
          <div className="absolute inset-0 border-2 border-blue-500 pointer-events-none z-40" />
        )}
      </div>
    )
  }

  // ─── Rendu ────────────────────────────────────────────────────────────────

  return (
    <div data-testid="booking-calendar" className="mx-auto max-w-4xl">

      {/* Navigation mois */}
      <div className="mb-4 flex items-center justify-between">
        <button
          data-testid="calendar-prev-month"
          onClick={() => {
            setMonthCursor((m) => startOfMonth(new Date(m.getFullYear(), m.getMonth() - 1, 1)))
            handleClosePanel()
          }}
          className="rounded-lg px-3 py-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
          aria-label="Mois précédent"
        >
          ←
        </button>
        <h2
          data-testid="calendar-month-label"
          className="text-lg font-semibold capitalize text-neutral-900"
        >
          {monthLabel}
        </h2>
        <button
          data-testid="calendar-next-month"
          onClick={() => {
            setMonthCursor((m) => startOfMonth(new Date(m.getFullYear(), m.getMonth() + 1, 1)))
            handleClosePanel()
          }}
          className="rounded-lg px-3 py-2 text-neutral-500 hover:bg-neutral-100 hover:text-neutral-900"
          aria-label="Mois suivant"
        >
          →
        </button>
      </div>

      {/* En-têtes — 5 colonnes Lun–Ven */}
      <div className="mb-1 grid grid-cols-5 gap-1 text-center text-xs font-medium text-neutral-400">
        {WEEKDAY_HEADERS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Erreur de chargement */}
      {fetchError && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {fetchError}
        </div>
      )}

      {/* Légende */}
      <div className="mb-3 flex flex-wrap gap-3 text-xs text-neutral-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-emerald-100" />
          Disponible
        </span>
        {isAuthenticated && (
          <span className="flex items-center gap-1">
            <span className="inline-block h-3 w-3 rounded-sm bg-blue-200" />
            Ma réservation
          </span>
        )}
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-neutral-200" />
          Complet
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-3 w-3 rounded-sm bg-neutral-50 border border-neutral-200" />
          Fermé
        </span>
      </div>

      {/* Grille calendrier — 5 colonnes, 30 cases */}
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
              <div
                key={i}
                className={isCurrentMonth ? "" : "opacity-25"}
              >
                {isOpen ? renderOpenDayCell(day) : renderClosedDayCell(day)}
              </div>
            )
          })}
        </div>
      )}

      {/* Panneau de résumé (réservation ou annulation) */}
      <AnimatePresence>
        {showPanel && (
          <motion.div
            data-testid="booking-summary"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="mt-6 rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-100"
          >
            {/* ── Panneau réservation ── */}
            {panelMode === "book" && selectedSlot && (
              <>
                <div className="mb-4 flex items-start justify-between">
                  <div>
                    <p className="text-sm text-neutral-500">Créneau sélectionné</p>
                    <p className="mt-0.5 text-lg font-semibold text-neutral-900">
                      {formatDateFR(selectedSlot.date)}
                    </p>
                    <p className="text-sm text-neutral-600">{selectedSlotLabel}</p>
                  </div>
                  <button
                    onClick={handleClosePanel}
                    className="rounded-lg p-1 text-neutral-400 hover:text-neutral-600"
                    aria-label="Fermer"
                  >
                    ✕
                  </button>
                </div>

                <div className="mb-4 flex flex-wrap items-center gap-3">
                  <span className="inline-flex items-center rounded-full bg-neutral-100 px-3 py-1 text-sm font-medium text-neutral-700">
                    Coût : {slotCost} crédit{slotCost > 1 ? "s" : ""}
                  </span>
                  {isAuthenticated && (
                    <span className="text-sm text-neutral-500">
                      Solde : {credits} → <strong>{balanceAfter}</strong> crédit
                      {Math.abs(balanceAfter) !== 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {bookingState === "success" && (
                  <div
                    data-testid="booking-success"
                    className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700"
                  >
                    ✓ Réservation confirmée ! Votre nouveau solde est de{" "}
                    <strong>{credits}</strong> crédit{credits !== 1 ? "s" : ""}.
                  </div>
                )}

                {bookingState === "error-balance" && (
                  <div
                    data-testid="error-insufficient-balance"
                    className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700"
                  >
                    Solde insuffisant pour cette réservation.{" "}
                    <Link
                      href="/credits"
                      data-testid="link-buy-credits"
                      className="font-medium underline"
                    >
                      Acheter des crédits
                    </Link>
                  </div>
                )}

                {bookingState === "error-full" && (
                  <div
                    data-testid="error-slot-full"
                    className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700"
                  >
                    Ce créneau vient d&apos;être complet. Les disponibilités ont été mises à jour.
                  </div>
                )}

                {bookingState === "error-closed" && (
                  <div className="rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-700">
                    Ce jour est fermé.
                  </div>
                )}

                {bookingState === "error-other" && (
                  <div className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
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
                        className="w-full rounded-xl bg-neutral-900 px-4 py-3 text-sm font-medium text-white hover:bg-neutral-800 disabled:opacity-50"
                      >
                        {bookingState === "loading"
                          ? "Confirmation en cours…"
                          : "Confirmer la réservation"}
                      </button>
                    ) : (
                      <div className="rounded-xl bg-neutral-50 px-4 py-3 text-sm text-neutral-600">
                        <Link href="/login" className="font-medium text-neutral-900 underline">
                          Connectez-vous
                        </Link>{" "}
                        pour réserver ce créneau.
                      </div>
                    )}
                  </div>
                )}

                {bookingState === "success" && (
                  <button
                    onClick={handleClosePanel}
                    className="mt-3 w-full rounded-xl bg-neutral-100 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-200"
                  >
                    Fermer
                  </button>
                )}
              </>
            )}

            {/* ── Panneau annulation ── */}
            {panelMode === "cancel" && cancelReservation && (
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
                  <div
                    data-testid="cancel-success"
                    className="rounded-xl bg-green-50 px-4 py-3 text-sm font-medium text-green-700"
                  >
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
                      Confirmer l&apos;annulation ? Vous récupérerez{" "}
                      {cancelReservation.creditsCost} crédit{cancelReservation.creditsCost > 1 ? "s" : ""}.
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
                  <button
                    onClick={handleClosePanel}
                    className="mt-3 w-full rounded-xl bg-neutral-100 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-200"
                  >
                    Fermer
                  </button>
                )}
              </>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
