"use client"

/**
 * components/booking/BookingCalendar.tsx
 * Composant calendrier de réservation — adapté depuis BookingCalendarBase.tsx.
 *
 * Changements par rapport à la base :
 * - Supprimé : HALF_DAY_PRICE_EUR, FULL_DAY_PRICE_EUR, DAILY_CAPACITY, quantity, fallback démo
 * - Ajouté : états slot (past/full/closed/available), sélection unique selectedSlot,
 *   panneau booking-summary, POST /api/booking, gestion erreurs, data-testid complets
 */

import React, { useCallback, useEffect, useMemo, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import Link from "next/link"
import { formatYMD, addDays, startOfWeekMonday, getMonthGrid } from "@/lib/calendar-utils"

// ─── Types ────────────────────────────────────────────────────────────────────

type SlotId = "AM" | "PM" | "FULL"

type AvailabilityItem = {
  date: string
  slot: "AM" | "PM"
  remaining: number
  isClosed: boolean
}

type SelectedSlot = {
  date: string
  slot: SlotId
}

type BookingState =
  | "idle"
  | "loading"
  | "success"
  | "error-balance"
  | "error-full"
  | "error-closed"
  | "error-other"

// ─── Constantes ───────────────────────────────────────────────────────────────

const SLOTS: { id: SlotId; label: string; cost: number }[] = [
  { id: "AM", label: "Matin 09h–13h", cost: 1 },
  { id: "PM", label: "Après-midi 14h–18h", cost: 1 },
  { id: "FULL", label: "Journée 09h–18h", cost: 2 },
]

const WEEKDAYS = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"]

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
}

// ─── Composant principal ──────────────────────────────────────────────────────

export default function BookingCalendar({ userId, initialCredits }: BookingCalendarProps) {
  const isAuthenticated = !!userId

  const [monthCursor, setMonthCursor] = useState(() => startOfMonth())
  const [availability, setAvailability] = useState<AvailabilityItem[]>([])
  const [loading, setLoading] = useState(false)
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [selectedSlot, setSelectedSlot] = useState<SelectedSlot | null>(null)
  const [credits, setCredits] = useState(initialCredits ?? 0)
  const [bookingState, setBookingState] = useState<BookingState>("idle")

  const days = useMemo(() => getMonthGrid(monthCursor), [monthCursor])

  const today = useMemo(() => {
    const t = new Date()
    t.setHours(0, 0, 0, 0)
    return t
  }, [])

  // Charge les disponibilités pour le mois affiché
  const fetchAvailability = useCallback(async () => {
    try {
      setLoading(true)
      setFetchError(null)
      const start = formatYMD(days[0])
      const end = formatYMD(addDays(days[41], 1))
      const res = await fetch(`/api/availability?start=${start}&end=${end}`)
      if (!res.ok) throw new Error("Réponse serveur invalide")
      const data: AvailabilityItem[] = await res.json()
      setAvailability(data)
    } catch {
      setFetchError("Impossible de charger les disponibilités. Veuillez réessayer.")
      setAvailability([])
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => {
    fetchAvailability()
  }, [fetchAvailability])

  // availMap : Map<"YYYY-MM-DD|AM"|"YYYY-MM-DD|PM", AvailabilityItem> pour lookup O(1)
  const availMap = useMemo(() => {
    const m = new Map<string, AvailabilityItem>()
    for (const a of availability) {
      m.set(`${a.date}|${a.slot}`, a)
    }
    return m
  }, [availability])

  // ─── Logique état d'une tuile ──────────────────────────────────────────────

  function getSlotState(day: Date, slotId: SlotId): "past" | "closed" | "full" | "available" {
    if (day < today) return "past"
    const dateStr = formatYMD(day)

    if (slotId === "FULL") {
      const am = availMap.get(`${dateStr}|AM`)
      const pm = availMap.get(`${dateStr}|PM`)
      if (am?.isClosed || pm?.isClosed) return "closed"
      const minRemaining = Math.min(am?.remaining ?? 0, pm?.remaining ?? 0)
      return minRemaining === 0 ? "full" : "available"
    }

    const item = availMap.get(`${dateStr}|${slotId}`)
    if (item?.isClosed) return "closed"
    if ((item?.remaining ?? 0) === 0) return "full"
    return "available"
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
    if (getSlotState(day, slotId) !== "available") return
    setSelectedSlot({ date: formatYMD(day), slot: slotId })
    setBookingState("idle")
  }

  function handleClosePanel() {
    setSelectedSlot(null)
    setBookingState("idle")
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
        setBookingState("success")
        await fetchAvailability()
        setTimeout(() => {
          setSelectedSlot(null)
          setBookingState("idle")
        }, 3000)
      } else if (res.status === 403) {
        setBookingState("error-balance")
      } else if (res.status === 409) {
        setBookingState("error-full")
        await fetchAvailability()
      } else if (res.status === 422) {
        const body = await res.json()
        setBookingState(body.error?.includes("fermé") ? "error-closed" : "error-other")
      } else {
        setBookingState("error-other")
      }
    } catch {
      setBookingState("error-other")
    }
  }

  // ─── Valeurs dérivées pour le panneau ──────────────────────────────────────

  const slotCost = selectedSlot ? (selectedSlot.slot === "FULL" ? 2 : 1) : 0
  const balanceAfter = credits - slotCost
  const selectedSlotLabel = selectedSlot
    ? SLOTS.find((s) => s.id === selectedSlot.slot)?.label ?? selectedSlot.slot
    : ""
  const monthLabel = `${MONTHS_FR[monthCursor.getMonth()]} ${monthCursor.getFullYear()}`

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

      {/* En-têtes jours de la semaine */}
      <div className="mb-1 grid grid-cols-7 gap-1 text-center text-xs font-medium text-neutral-400">
        {WEEKDAYS.map((d) => (
          <div key={d}>{d}</div>
        ))}
      </div>

      {/* Erreur de chargement */}
      {fetchError && (
        <div className="mb-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {fetchError}
        </div>
      )}

      {/* Grille calendrier — 42 cases */}
      {loading ? (
        <div className="flex h-64 items-center justify-center text-sm text-neutral-400">
          Chargement des disponibilités…
        </div>
      ) : (
        <div className="grid grid-cols-7 gap-1">
          {days.map((day, i) => {
            const isCurrentMonth = day.getMonth() === monthCursor.getMonth()
            const dateStr = formatYMD(day)
            const isPast = day < today

            return (
              <motion.div
                key={i}
                className={`rounded-lg p-0.5 ${isCurrentMonth ? "" : "opacity-25 pointer-events-none"}`}
                initial={{ opacity: 0 }}
                animate={{ opacity: isCurrentMonth ? 1 : 0.25 }}
                transition={{ duration: 0.1, delay: i * 0.003 }}
              >
                {/* Numéro du jour */}
                <div
                  className={`mb-0.5 text-center text-xs font-medium ${
                    isPast ? "text-neutral-300" : "text-neutral-500"
                  }`}
                >
                  {day.getDate()}
                </div>

                {/* Tuiles AM / PM / FULL */}
                {SLOTS.map((s) => {
                  const state = getSlotState(day, s.id)
                  const remaining = getRemaining(day, s.id)
                  const isSelected =
                    selectedSlot?.date === dateStr && selectedSlot.slot === s.id

                  return (
                    <button
                      key={s.id}
                      data-testid="slot-tile"
                      data-date={dateStr}
                      data-slot={s.id}
                      data-remaining={state === "available" ? remaining : undefined}
                      data-disabled={
                        state === "past" || state === "closed" ? "true" : undefined
                      }
                      data-full={state === "full" ? "true" : undefined}
                      data-closed={state === "closed" ? "true" : undefined}
                      disabled={state !== "available"}
                      onClick={() => handleSlotClick(day, s.id)}
                      className={[
                        "mb-0.5 w-full rounded px-0.5 py-0.5 text-center text-[9px] leading-tight transition-colors",
                        state === "available" && !isSelected
                          ? "cursor-pointer bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          : "",
                        state === "available" && isSelected
                          ? "bg-emerald-600 text-white"
                          : "",
                        state === "full"
                          ? "cursor-not-allowed bg-neutral-100 text-neutral-400"
                          : "",
                        state === "past"
                          ? "cursor-not-allowed bg-neutral-50 text-neutral-300"
                          : "",
                        state === "closed"
                          ? "cursor-not-allowed bg-amber-50 text-amber-400"
                          : "",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {state === "available"
                        ? `${s.id} ${remaining}`
                        : state === "full"
                        ? `${s.id} ●`
                        : state === "closed"
                        ? `${s.id} ✕`
                        : s.id}
                    </button>
                  )
                })}
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Panneau de confirmation — booking-summary */}
      <AnimatePresence>
        {selectedSlot && (
          <motion.div
            data-testid="booking-summary"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.2 }}
            className="mt-6 rounded-2xl bg-white p-6 shadow-lg ring-1 ring-neutral-100"
          >
            {/* En-tête panneau */}
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

            {/* Coût + solde */}
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

            {/* Résultats */}
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

            {/* Bouton action */}
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

            {/* Bouton fermer après succès */}
            {bookingState === "success" && (
              <button
                onClick={handleClosePanel}
                className="mt-3 w-full rounded-xl bg-neutral-100 px-4 py-2 text-sm text-neutral-600 hover:bg-neutral-200"
              >
                Fermer
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
