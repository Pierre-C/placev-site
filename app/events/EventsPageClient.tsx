"use client"

import { useState } from "react"
import { motion } from "framer-motion"

type EventItem = {
  id: string
  title: string
  description: string
  date: string
  registrationUrl: string | null
  imageUrl: string
}

export default function EventsPageClient({ initialEvents }: { initialEvents: EventItem[] }) {
  const [showPast, setShowPast] = useState(false)
  const [search, setSearch] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const filteredEvents = initialEvents.filter(event => {
    const eventDate = new Date(event.date)
    const today = new Date()
    today.setHours(0, 0, 0, 0)

    // 1. Filtrer sur showPast
    if (!showPast && eventDate < today) return false

    // 2. Filtrer sur search (case-insensitive, title + description)
    const q = search.toLowerCase()
    if (q && !event.title.toLowerCase().includes(q) && !event.description.toLowerCase().includes(q)) {
      return false
    }

    // 3. Filtrer sur dateFrom
    if (dateFrom && eventDate < new Date(dateFrom)) {
      return false
    }

    // 4. Filtrer sur dateTo
    if (dateTo) {
      const toDate = new Date(dateTo)
      toDate.setHours(23, 59, 59, 999)
      if (eventDate > toDate) return false
    }

    return true
  })

  return (
    <div>
      <div className="mb-8 flex flex-col md:flex-row gap-4 items-center justify-between bg-gray-50 p-4 rounded-lg">
        <div className="w-full md:w-1/3">
          <input
            type="text"
            placeholder="Rechercher un événement..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            data-testid="events-page-search"
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div className="flex gap-4 items-center">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Du</label>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              data-testid="events-filter-from"
              className="border rounded px-2 py-1"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Au</label>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              data-testid="events-filter-to"
              className="border rounded px-2 py-1"
            />
          </div>
        </div>
        <div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showPast}
              onChange={(e) => setShowPast(e.target.checked)}
              data-testid="events-show-past"
              className="rounded"
            />
            <span className="text-sm font-medium">Afficher les événements passés</span>
          </label>
        </div>
      </div>

      {filteredEvents.length === 0 ? (
        <p data-testid="events-page-empty" className="text-center text-neutral-500 py-12">
          Aucun événement trouvé.
        </p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event, i) => (
            <motion.div
              key={event.id}
              data-testid="event-card"
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.04 }}
              className="rounded-2xl border border-black/5 bg-white flex flex-col overflow-hidden"
            >
              <img src={event.imageUrl} alt={event.title} className="w-full h-48 object-cover rounded-t-2xl" />
              <div className="p-5 flex flex-col gap-3 flex-1">
                <p data-testid="event-card-date" className="text-xs font-medium text-blue-600 uppercase">
                  {new Date(event.date).toLocaleDateString("fr-FR", {
                    weekday: "long", day: "numeric", month: "long", year: "numeric"
                  })}
                </p>
                <h3 data-testid="event-card-title" className="text-lg font-semibold">
                  {event.title}
                </h3>
                <p data-testid="event-card-description" className="text-sm text-neutral-700 flex-1">
                  {event.description}
                </p>
                {event.registrationUrl && event.registrationUrl.trim() !== "" && (
                  <a
                    data-testid="event-register-btn"
                    href={event.registrationUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white text-center hover:bg-blue-700 transition mt-2"
                  >
                    S'inscrire
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
