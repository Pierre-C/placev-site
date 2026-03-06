/**
 * app/api/profile/route.ts
 * GET /api/profile — Retourne le profil de l'utilisateur authentifié.
 * PATCH /api/profile — Met à jour le profil de l'utilisateur authentifié.
 * Ne retourne jamais passwordHash.
 */

import { NextResponse } from "next/server"
import { z } from "zod"
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
      firstName: true,
      lastName: true,
      address: true,
      phone: true,
      deletionRequestedAt: true,
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

const profileUpdateSchema = z.object({
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  address: z.string().optional().nullable(),
  phone: z
    .string()
    .regex(/^(?:\+33|0033|0)[1-9](\d{8})$/, "Format téléphone invalide (ex: 0612345678)")
    .optional()
    .nullable(),
})

export async function PATCH(request: Request) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  let body: any
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 })
  }

  const parsed = profileUpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 422 })
  }

  const { firstName, lastName, address, phone } = parsed.data

  const updatedUser = await prisma.user.update({
    where: { id: session.user.id },
    data: {
      firstName,
      lastName,
      address,
      phone,
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      address: true,
      phone: true,
      deletionRequestedAt: true,
      role: true,
      segment: true,
      credits: true,
      isMember: true,
      createdAt: true,
    },
  })

  return NextResponse.json({ user: updatedUser })
}
