/**
 * app/(app)/booking/page.tsx
 * Page de réservation — accès public, mais réservation nécessite une auth.
 * Server Component : récupère la session pour passer userId et credits au calendrier.
 */

import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import BookingCalendar from "@/components/booking/BookingCalendar"

export default async function BookingPage() {
  const [session, openDaysSetting] = await Promise.all([
    auth(),
    prisma.systemSetting.findUnique({ where: { key: "OPEN_DAYS" } }),
  ])
  const user = session?.user
  const openDays = openDaysSetting
    ? openDaysSetting.value.split(",").map(Number)
    : [1, 2, 3]

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-neutral-900">Réserver un poste</h1>
        <p className="mt-1 text-neutral-500">
          Sélectionnez un créneau disponible dans le calendrier ci-dessous.
        </p>
        {user && (
          <p className="mt-2 text-sm text-neutral-600">
            Votre solde actuel :{" "}
            <strong>{user.credits} crédit{(user.credits ?? 0) !== 1 ? "s" : ""}</strong>
          </p>
        )}
      </div>

      <BookingCalendar
        userId={user?.id}
        initialCredits={user?.credits ?? undefined}
        openDays={openDays}
      />
    </div>
  )
}
