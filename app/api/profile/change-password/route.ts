/**
 * app/api/profile/change-password/route.ts
 * POST /api/profile/change-password
 */

import { NextResponse } from "next/server"
import { z } from "zod"
import bcrypt from "bcryptjs"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8),
})

export async function POST(request: Request) {
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

  // Pre-check for length even before DB call
  if (body.newPassword && body.newPassword.length < 8) {
    return NextResponse.json({ error: "Le nouveau mot de passe doit faire au moins 8 caractères" }, { status: 422 })
  }

  const parsed = changePasswordSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Données invalides", details: parsed.error.flatten() }, { status: 422 })
  }

  const { currentPassword, newPassword } = parsed.data

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, passwordHash: true },
  })

  if (!user) {
    return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 })
  }

  const isCorrect = await bcrypt.compare(currentPassword, user.passwordHash)
  if (!isCorrect) {
    return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 401 })
  }

  const newHash = await bcrypt.hash(newPassword, 12)
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash: newHash },
  })

  return NextResponse.json({ success: true })
}
