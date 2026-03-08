"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

type EventItem = {
  id: string
  title: string
  description: string
  date: string
  registrationUrl: string | null
  createdAt: string
}

export default function EventsTable({ initialEvents }: { initialEvents: EventItem[] }) {
  const router = useRouter()
  const [events, setEvents] = useState<EventItem[]>(initialEvents)
  const [search, setSearch] = useState("")
  const [sortCol, setSortCol] = useState<"title" | "date">("date")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Form State
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    registrationUrl: "",
  })

  // Computed data
  const filteredEvents = events.filter((e) => {
    const q = search.toLowerCase()
    return e.title.toLowerCase().includes(q) || e.description.toLowerCase().includes(q)
  })

  const sortedEvents = [...filteredEvents].sort((a, b) => {
    let result = 0
    if (sortCol === "title") {
      result = a.title.localeCompare(b.title)
    } else {
      result = new Date(a.date).getTime() - new Date(b.date).getTime()
    }
    return sortDir === "asc" ? result : -result
  })

  const handleSort = (col: "title" | "date") => {
    if (sortCol === col) {
      setSortDir(sortDir === "asc" ? "desc" : "asc")
    } else {
      setSortCol(col)
      setSortDir(col === "date" ? "desc" : "asc") // Default desc for date, asc for title
    }
  }

  const openCreateModal = () => {
    setEditingEvent(null)
    setFormData({ title: "", description: "", date: "", registrationUrl: "" })
    setIsDeleting(false)
    setIsModalOpen(true)
  }

  const openEditModal = (event: EventItem) => {
    setEditingEvent(event)
    setFormData({
      title: event.title,
      description: event.description,
      date: event.date.split("T")[0],
      registrationUrl: event.registrationUrl || "",
    })
    setIsDeleting(false)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setIsModalOpen(false)
  }

  const fetchEvents = async () => {
    const res = await fetch("/api/admin/events")
    if (res.ok) {
      const data = await res.json()
      setEvents(data)
    }
    router.refresh()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const url = editingEvent ? `/api/admin/events/${editingEvent.id}` : "/api/admin/events"
    const method = editingEvent ? "PUT" : "POST"

    const payload = {
      title: formData.title,
      description: formData.description,
      date: formData.date,
      registrationUrl: formData.registrationUrl || null,
    }

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    })

    if (res.ok) {
      closeModal()
      await fetchEvents()
    } else {
      console.error("Failed to save event")
    }
  }

  const handleDelete = async () => {
    if (!editingEvent) return
    const res = await fetch(`/api/admin/events/${editingEvent.id}`, { method: "DELETE" })
    if (res.ok) {
      closeModal()
      await fetchEvents()
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <input
          type="text"
          placeholder="Rechercher..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          data-testid="events-search"
          className="border rounded px-3 py-2 w-64"
        />
        <button
          onClick={openCreateModal}
          data-testid="create-event-btn"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Nouvel événement
        </button>
      </div>

      <div className="border rounded-md overflow-hidden max-h-[600px] overflow-y-auto">
        <table className="w-full text-left text-sm" data-testid="events-table">
          <thead className="bg-gray-100 sticky top-0">
            <tr>
              <th className="p-3">
                <button
                  data-testid="events-sort-btn"
                  data-column="title"
                  onClick={() => handleSort("title")}
                  className="font-semibold flex items-center gap-1"
                >
                  Titre {sortCol === "title" && (sortDir === "asc" ? "↑" : "↓")}
                </button>
              </th>
              <th className="p-3 font-semibold">Description</th>
              <th className="p-3">
                <button
                  data-testid="events-sort-btn"
                  data-column="date"
                  onClick={() => handleSort("date")}
                  className="font-semibold flex items-center gap-1"
                >
                  Date {sortCol === "date" && (sortDir === "asc" ? "↑" : "↓")}
                </button>
              </th>
              <th className="p-3 font-semibold">Lien</th>
              <th className="p-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {sortedEvents.map((event) => (
              <tr key={event.id} className="border-t hover:bg-gray-50" data-testid="event-row">
                <td className="p-3" data-testid="event-title-cell">{event.title}</td>
                <td className="p-3">
                  <span className="truncate block max-w-xs" title={event.description}>
                    {event.description.length > 60
                      ? event.description.substring(0, 60) + "..."
                      : event.description}
                  </span>
                </td>
                <td className="p-3" data-testid="event-date-cell">
                  {new Date(event.date).toLocaleDateString("fr-FR")}
                </td>
                <td className="p-3">
                  {event.registrationUrl ? (
                    <a
                      href={event.registrationUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                    >
                      Lien
                    </a>
                  ) : (
                    <span className="text-gray-400">-</span>
                  )}
                </td>
                <td className="p-3">
                  <button
                    onClick={() => openEditModal(event)}
                    data-testid="edit-event-btn"
                    className="text-blue-600 hover:text-blue-800"
                  >
                    Éditer
                  </button>
                </td>
              </tr>
            ))}
            {sortedEvents.length === 0 && (
              <tr>
                <td colSpan={5} className="p-4 text-center text-gray-500">
                  Aucun événement trouvé.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full" data-testid="event-form-modal">
            <h2 className="text-xl font-bold mb-4">
              {editingEvent ? "Éditer l'événement" : "Nouvel événement"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Titre</label>
                <input
                  required
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  data-testid="event-form-title-input"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Description</label>
                <textarea
                  required
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  data-testid="event-form-description-input"
                  className="w-full border rounded px-3 py-2 min-h-[100px]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Date</label>
                <input
                  required
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  data-testid="event-form-date-input"
                  className="w-full border rounded px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Lien d'inscription (optionnel)</label>
                <input
                  type="url"
                  placeholder="https://..."
                  value={formData.registrationUrl}
                  onChange={(e) => setFormData({ ...formData, registrationUrl: e.target.value })}
                  data-testid="event-form-url-input"
                  className="w-full border rounded px-3 py-2"
                />
              </div>

              {isDeleting ? (
                <div className="bg-red-50 border border-red-200 text-red-800 p-3 rounded text-sm">
                  <p className="mb-2 font-medium">Confirmer la suppression ?</p>
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={handleDelete}
                      data-testid="event-form-delete-confirm"
                      className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                    >
                      Oui, supprimer
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsDeleting(false)}
                      className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex justify-between mt-6">
                  {editingEvent ? (
                    <button
                      type="button"
                      onClick={() => setIsDeleting(true)}
                      data-testid="event-form-delete"
                      className="text-red-600 hover:bg-red-50 px-3 py-2 rounded"
                    >
                      Supprimer
                    </button>
                  ) : (
                    <div></div> // spacer
                  )}
                  <div className="flex space-x-2">
                    <button
                      type="button"
                      onClick={closeModal}
                      data-testid="close-event-modal-btn"
                      className="px-4 py-2 border rounded hover:bg-gray-50"
                    >
                      Annuler
                    </button>
                    <button
                      type="submit"
                      data-testid="event-form-submit"
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    >
                      Enregistrer
                    </button>
                  </div>
                </div>
              )}
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
