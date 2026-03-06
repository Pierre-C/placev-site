import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import QuotesTable from "./QuotesTable"

export const dynamic = "force-dynamic"

export default async function AdminQuotesPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login")
  }

  const quotes = await prisma.reservation.findMany({
    where: {
      type: "MEETING_ROOM",
    },
    select: {
      id: true,
      date: true,
      slot: true,
      status: true,
      companyName: true,
      message: true,
      contactName: true,
      contactEmail: true,
      contactPhone: true,
      startTime: true,
      endTime: true,
      createdAt: true,
      cancelledAt: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
          email: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Devis en attente</h1>
        <p className="text-gray-500 mt-2">Gérez les demandes de devis pour la salle de réunion.</p>
      </div>

      <QuotesTable quotes={quotes} />
    </div>
  )
}
