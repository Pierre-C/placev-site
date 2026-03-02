import { Suspense } from "react"
import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canCancel } from "@/lib/services/booking"
import { PaymentStatusBanner } from "./PaymentStatusBanner"
import { UpcomingReservations } from "./UpcomingReservations"
import { BalanceBadge } from "./BalanceBadge"
import BookingCalendar from "@/components/booking/BookingCalendar"

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role === "ADMIN") redirect("/admin")

  const [user, openDaysSetting] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        reservations: {
          where: { status: "CONFIRMED", date: { gte: new Date() } },
          orderBy: { date: "asc" },
          take: 10,
        },
      },
    }),
    prisma.systemSetting.findUnique({ where: { key: "OPEN_DAYS" } }),
  ])

  if (!user) redirect("/login")

  const openDays = openDaysSetting
    ? openDaysSetting.value.split(",").map(Number)
    : [1, 2, 3]

  const reservationsWithCancel = user.reservations.map((r) => ({
    ...r,
    canCancel: canCancel({ status: r.status, date: r.date }),
  }))

  return (
    <div>
      <Suspense fallback={null}>
        <PaymentStatusBanner />
      </Suspense>

      {/* Solde réactif (mis à jour après annulation sans router.refresh) */}
      <div className="mb-6 rounded-2xl bg-neutral-900 p-6 text-white">
        <p className="text-sm font-medium text-neutral-400">Solde de crédits</p>
        <BalanceBadge initialCredits={user.credits} />
        <p className="mt-1 text-sm text-neutral-400">
          {user.credits >= 0 ? "crédit(s) disponible(s)" : "crédit(s) en débit"}
        </p>
      </div>

      {/* Calendrier de réservation dans un container scrollable */}
      <div
        data-testid="booking-calendar-container"
        style={{ maxHeight: "520px", overflowY: "auto" }}
        className="mb-6"
      >
        <BookingCalendar
          userId={user.id}
          initialCredits={user.credits}
          openDays={openDays}
        />
      </div>

      {/* Réservations à venir */}
      <UpcomingReservations reservations={reservationsWithCancel} />
    </div>
  )
}
