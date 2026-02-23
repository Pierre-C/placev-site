/**
 * app/api/profile/route.ts
 * GET /api/profile — Retourne le profil de l'utilisateur authentifié.
 * Ne retourne jamais passwordHash.
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      segment: true,
      credits: true,
      isMember: true,
      createdAt: true,
    },
  })

  if (!user) {
    return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
  }

  return NextResponse.json({ user })
}
