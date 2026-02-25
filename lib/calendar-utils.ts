/**
 * lib/calendar-utils.ts
 * Helpers de date pour le calendrier de réservation.
 * Fonctions pures — aucun appel réseau ni DB.
 *
 * Extraites du composant BookingCalendarBase.tsx pour être testées indépendamment.
 * Important : formatYMD utilise les composantes locales (pas toISOString) pour éviter
 * les décalages de timezone en client-side.
 */

/**
 * Formate une Date en "YYYY-MM-DD" en utilisant les composantes de date locales.
 * N'utilise PAS toISOString() pour éviter les décalages timezone (ex: UTC+1 minuit local
 * → veille en UTC).
 */
export function formatYMD(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, "0")
  const day = String(date.getDate()).padStart(2, "0")
  return `${year}-${month}-${day}`
}

/** Ajoute n jours à une date (retourne une nouvelle Date, n'affecte pas l'original). */
export function addDays(date: Date, n: number): Date {
  const d = new Date(date)
  d.setDate(d.getDate() + n)
  return d
}

/** Retourne le lundi de la semaine contenant d (0=lundi … 6=dimanche). */
export function startOfWeekMonday(d: Date): Date {
  const date = new Date(d)
  const day = (date.getDay() + 6) % 7
  date.setDate(date.getDate() - day)
  date.setHours(0, 0, 0, 0)
  return date
}

function startOfMonth(d = new Date()): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), 1)
  x.setHours(0, 0, 0, 0)
  return x
}

/**
 * Retourne un tableau de 42 Date couvrant 6 semaines entières à partir du premier lundi
 * précédant (ou égal au) premier jour du mois donné.
 */
export function getMonthGrid(currentMonth: Date): Date[] {
  const start = startOfWeekMonday(startOfMonth(currentMonth))
  return Array.from({ length: 42 }, (_, i) => addDays(start, i))
}

/**
 * Retourne un tableau de 30 Date couvrant 6 semaines × 5 jours (Lun–Ven).
 * Utilisé pour le calendrier 5 colonnes sans Samedi/Dimanche.
 */
export function getMonthGridWeekdays(currentMonth: Date): Date[] {
  const start = startOfWeekMonday(startOfMonth(currentMonth))
  const days: Date[] = []
  for (let week = 0; week < 6; week++) {
    for (let d = 0; d < 5; d++) {
      days.push(addDays(start, week * 7 + d))
    }
  }
  return days
}
