import { prisma } from "@/lib/prisma"
import EventsTable from "./EventsTable"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function AdminEventsPage() {
  const session = await auth()
  if (!session || session.user.role !== "ADMIN") {
    redirect("/")
  }

  const events = await prisma.event.findMany({
    orderBy: { date: "desc" },
    select: {
      id: true,
      title: true,
      description: true,
      date: true,
      registrationUrl: true,
      createdAt: true,
    }
  })

  // Serialize date to ISO string for the client component
  const serializedEvents = events.map(event => ({
    ...event,
    date: event.date.toISOString(),
    createdAt: event.createdAt.toISOString(),
  }))

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold tracking-tight">Événements</h1>
      <EventsTable initialEvents={serializedEvents} />
    </div>
  )
}
