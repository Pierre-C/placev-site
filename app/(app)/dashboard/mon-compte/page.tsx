/**
 * app/(app)/dashboard/mon-compte/page.tsx
 * Espace "Mon compte" membre : profil, mot de passe, suppression.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import ProfileClientPage from "./ProfileClientPage"

export default async function MonComptePage() {
  const session = await auth()
  if (!session?.user?.id) redirect("/login")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      firstName: true,
      lastName: true,
      email: true,
      address: true,
      phone: true,
      deletionRequestedAt: true,
    },
  })

  if (!user) redirect("/login")

  return <ProfileClientPage initialUser={user} />
}
