"use client"

import { useState, useMemo } from "react"
import { Button } from "@/components/ui/button"

const OPEN_FROM = 8 * 60 + 30   // 08:30
const OPEN_UNTIL = 18 * 60      // 18:00
const MIN_DURATION = 120
const HOURLY_RATE = 25
const FULL_DAY_PRICE = 200

function toMinutes(t: string): number {
  if (!t) return 0
  const [h, m] = t.split(":").map(Number)
  return h * 60 + m
}

function fromMinutes(m: number): string {
  const h = Math.floor(m / 60)
  const min = m % 60
  return `${h.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`
}

function generateTimeOptions(startMin: number, endMin: number, step = 30) {
  const options = []
  for (let m = startMin; m <= endMin; m += step) {
    options.push(fromMinutes(m))
  }
  return options
}

export function MeetingRoomForm({ openDays }: { openDays: number[] }) {
  const [date, setDate] = useState("")
  // default to full day
  const [start, setStart] = useState(fromMinutes(OPEN_FROM))
  const [end, setEnd] = useState(fromMinutes(OPEN_UNTIL))
  const [companyName, setCompanyName] = useState("")
  const [contactName, setContactName] = useState("")
  const [contactEmail, setContactEmail] = useState("")
  const [contactPhone, setContactPhone] = useState("")
  const [message, setMessage] = useState("")
  
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle")
  const [errorMessage, setErrorMessage] = useState("")

  const startMin = toMinutes(start)
  const endMin = toMinutes(end)
  const durationMinutes = endMin > startMin ? endMin - startMin : 0
  const durationHours = durationMinutes / 60
  const billedHours = Math.ceil(durationHours)

  const isFullDay = startMin === OPEN_FROM && endMin === OPEN_UNTIL
  const indicativePrice = durationHours > 0
    ? (isFullDay ? FULL_DAY_PRICE : billedHours * HOURLY_RATE)
    : null

  const startOptions = useMemo(() => {
    // Start options up to (OPEN_UNTIL - MIN_DURATION)
    return generateTimeOptions(OPEN_FROM, OPEN_UNTIL - MIN_DURATION, 30)
  }, [])

  const endOptions = useMemo(() => {
    // End options from (startMin + MIN_DURATION) to OPEN_UNTIL
    const minEnd = startMin + MIN_DURATION
    if (minEnd > OPEN_UNTIL) return []
    return generateTimeOptions(minEnd, OPEN_UNTIL, 30)
  }, [startMin])

  // Handle start change to ensure end is always valid
  const handleStartChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newStartStr = e.target.value
    setStart(newStartStr)
    const newStartMin = toMinutes(newStartStr)
    const newMinEnd = newStartMin + MIN_DURATION
    
    // If the current end is before the new minimum end, adjust it
    if (endMin < newMinEnd) {
      setEnd(fromMinutes(Math.min(newMinEnd, OPEN_UNTIL)))
    }
  }

  // Handle date change to clear error if valid
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setDate(e.target.value)
    if (status === "error") {
      setStatus("idle")
      setErrorMessage("")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setStatus("loading")
    setErrorMessage("")

    if (!date) {
      setStatus("error")
      setErrorMessage("Veuillez sélectionner une date")
      return
    }

    const requestedDate = new Date(date)
    const dayOfWeek = requestedDate.getDay() // 0 = Sunday, 1 = Monday
    if (!openDays.includes(dayOfWeek)) {
      setStatus("error")
      setErrorMessage("Le coworking n'est pas ouvert ce jour-là.")
      return
    }

    if (startMin % 30 !== 0 || endMin % 30 !== 0) {
      setStatus("error")
      setErrorMessage("Les horaires doivent être à la demi-heure pile (ex: 09:00, 09:30)")
      return
    }
    if (startMin < OPEN_FROM || endMin > OPEN_UNTIL) {
      setStatus("error")
      setErrorMessage("La salle est disponible de 08h30 à 18h00 uniquement")
      return
    }
    if (endMin - startMin < MIN_DURATION) {
      setStatus("error")
      setErrorMessage("La durée minimale de réservation est de 2 heures")
      return
    }

    try {
      const res = await fetch("/api/booking/quote", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          date, 
          start, 
          end, 
          companyName, 
          contactName, 
          contactEmail, 
          contactPhone, 
          message 
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || "Une erreur est survenue")
      }

      setStatus("success")
    } catch (error: any) {
      setStatus("error")
      setErrorMessage(error.message)
    }
  }

  return (
    <>
      {status === "success" ? (
        <div data-testid="quote-success" className="bg-green-50 text-green-700 p-6 rounded-lg text-center font-medium">
          Votre demande a bien été envoyée. Nous reviendrons vers vous rapidement.
        </div>
      ) : (
        <form data-testid="quote-form" onSubmit={handleSubmit} className="space-y-6 bg-white p-8 rounded-lg shadow-sm border border-gray-100">
          {status === "error" && (
            <div data-testid="quote-error" className="bg-red-50 text-red-700 p-4 rounded-md text-sm">
              {errorMessage}
            </div>
          )}

          <div className="bg-amber-50 border border-amber-100 rounded-lg p-4 text-amber-800 text-sm">
            <p className="font-semibold">Tarifs :</p>
            <p>50€ / 2h · 200€ journée complète</p>
          </div>

          <div>
            <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">Date souhaitée <span className="text-red-500">*</span></label>
            <input
              type="date"
              id="date"
              name="date"
              required
              value={date}
              onChange={handleDateChange}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="start" className="block text-sm font-medium text-gray-700 mb-1">Heure de début <span className="text-red-500">*</span></label>
              <select
                id="start"
                name="start"
                required
                value={start}
                onChange={handleStartChange}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {startOptions.map((time) => (
                  <option key={`start-${time}`} value={time}>{time.replace(':', 'h')}</option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="end" className="block text-sm font-medium text-gray-700 mb-1">Heure de fin <span className="text-red-500">*</span></label>
              <select
                id="end"
                name="end"
                required
                value={end}
                onChange={(e) => setEnd(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white"
              >
                {endOptions.map((time) => (
                  <option key={`end-${time}`} value={time}>{time.replace(':', 'h')}</option>
                ))}
              </select>
            </div>
          </div>

          {indicativePrice !== null && durationMinutes >= MIN_DURATION && (
            <div className="bg-blue-50 border border-blue-100 rounded-lg px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-blue-800">Tarif indicatif</p>
                <p className="text-xs text-blue-600 mt-0.5">
                  {isFullDay ? "Journée complète" : `${billedHours}h facturée(s) · ${HOURLY_RATE}€/h`}
                </p>
              </div>
              <p className="text-2xl font-black text-blue-900">~{indicativePrice} €</p>
            </div>
          )}

          <div>
            <label htmlFor="companyName" className="block text-sm font-medium text-gray-700 mb-1">Nom de l'entreprise ou de l'association <span className="text-red-500">*</span></label>
            <input
              type="text"
              id="companyName"
              name="companyName"
              required
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <fieldset className="space-y-4 border border-gray-100 rounded-lg p-5">
            <legend className="text-sm font-semibold text-gray-700 px-1">Vos coordonnées de contact</legend>

            <div>
              <label htmlFor="contactName" className="block text-sm font-medium text-gray-700 mb-1">
                Nom et prénom <span className="text-red-500">*</span>
              </label>
              <input
                type="text" id="contactName" name="contactName" required
                value={contactName} onChange={(e) => setContactName(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="contactEmail" className="block text-sm font-medium text-gray-700 mb-1">
                Email <span className="text-red-500">*</span>
              </label>
              <input
                type="email" id="contactEmail" name="contactEmail" required
                value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>

            <div>
              <label htmlFor="contactPhone" className="block text-sm font-medium text-gray-700 mb-1">
                Téléphone <span className="text-red-500">*</span>
              </label>
              <input
                type="tel" id="contactPhone" name="contactPhone" required
                value={contactPhone} onChange={(e) => setContactPhone(e.target.value)}
                placeholder="06 12 34 56 78"
                className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </fieldset>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">Message (optionnel)</label>
            <textarea
              id="message"
              name="message"
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <Button type="submit" data-testid="submit-quote" className="w-full" disabled={status === "loading"}>
            {status === "loading" ? "Envoi en cours..." : "Envoyer la demande"}
          </Button>
        </form>
      )}
    </>
  )
}
