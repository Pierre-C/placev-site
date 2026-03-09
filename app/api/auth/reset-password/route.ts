import { z } from "zod"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"

const resetPasswordSchema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = resetPasswordSchema.safeParse(body)
    
    if (!parsed.success) {
      const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0]
      return NextResponse.json({ error: firstError ?? "Données invalides" }, { status: 422 })
    }

    const { token, newPassword } = parsed.data

    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!resetToken) {
      return NextResponse.json({ error: "Token invalide" }, { status: 422 })
    }

    if (resetToken.expiresAt.getTime() < Date.now()) {
      return NextResponse.json({ error: "Token expiré" }, { status: 422 })
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    })

    await prisma.passwordResetToken.delete({
      where: { token },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Reset password error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
