import { prisma } from "@/lib/prisma"
import EventsPageClient from "./EventsPageClient"

export const dynamic = "force-dynamic"

export default async function EventsPage() {
  const events = await prisma.event.findMany({
    orderBy: { date: "asc" },
    select: {
      id: true,
      title: true,
      description: true,
      date: true,
      registrationUrl: true,
      image: { select: { mimeType: true } }
    }
  })

  const serializedEvents = events.map(event => {
    const { image, ...rest } = event;
    return {
      ...rest,
      date: event.date.toISOString(),
      imageUrl: image ? `/api/events/${event.id}/image` : "/gallery/PXL_20250909_120231896.jpg"
    }
  })

  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <h1 data-testid="events-page-title" className="text-3xl font-semibold md:text-4xl text-center mb-8">
        Tous nos événements
      </h1>
      <EventsPageClient initialEvents={serializedEvents} />
    </div>
  )
}
