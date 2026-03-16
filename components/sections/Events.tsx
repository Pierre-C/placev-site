"use client"

import { useEffect, useState } from "react"
import { motion } from "framer-motion"
import Link from "next/link"

type EventItem = {
  id: string
  title: string
  description: string
  date: string
  registrationUrl: string | null
  imageUrl: string
}

export function Events() {
  const [events, setEvents] = useState<EventItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch("/api/events?limit=3")
      .then(r => r.json())
      .then(data => { setEvents(data); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  if (loading) return null

  return (
    <section data-testid="events-section" className="mx-auto max-w-7xl px-4 py-16">
      <h2 className="text-3xl font-semibold md:text-4xl text-center">
        Nos prochains événements
      </h2>

      {events.length === 0 ? (
        <p data-testid="events-empty" className="mt-8 text-center text-neutral-500">
          Aucun événement prévu pour l'instant.
        </p>
      ) : (
        <>
          <div data-testid="events-list" className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {events.map((event, i) => (
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
          <div className="mt-8 text-center">
            <Link
              href="/events"
              data-testid="events-see-all-btn"
              className="inline-block rounded-lg border border-black/10 px-6 py-3 text-sm font-medium hover:bg-neutral-50 transition"
            >
              Tous nos événements
            </Link>
          </div>
        </>
      )}
    </section>
  )
}
