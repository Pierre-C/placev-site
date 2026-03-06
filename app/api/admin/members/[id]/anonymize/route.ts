/**
 * app/api/admin/members/[id]/anonymize/route.ts
 * POST /api/admin/members/:id/anonymize
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const { id } = params

  const user = await prisma.user.findUnique({ where: { id } })
  if (!user) {
    return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
  }

  if (user.role === "ADMIN") {
    return NextResponse.json({ error: "Impossible d'anonymiser un administrateur" }, { status: 400 })
  }

  await prisma.user.update({
    where: { id },
    data: {
      email: `deleted_${id}@anonymized.local`,
      firstName: "Utilisateur",
      lastName: "Supprimé",
      passwordHash: "",
      address: null,
      phone: null,
      city: null,
      tarifReduitRequested: false,
      deletionRequestedAt: new Date(), // Just to be sure it's marked
    },
  })

  return NextResponse.json({ success: true })
}
