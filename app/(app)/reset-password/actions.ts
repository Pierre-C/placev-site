"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import bcrypt from "bcryptjs"
import { redirect } from "next/navigation"

const schema = z.object({
  token: z.string().min(1),
  newPassword: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères"),
})

export type ResetPasswordState = { error: string }

export async function resetPasswordAction(
  _prevState: ResetPasswordState,
  formData: FormData
): Promise<ResetPasswordState> {
  const parsed = schema.safeParse({
    token: formData.get("token"),
    newPassword: formData.get("newPassword"),
  })

  if (!parsed.success) {
    const firstError = Object.values(parsed.error.flatten().fieldErrors)[0]?.[0]
    return { error: firstError ?? "Données invalides" }
  }

  const { token, newPassword } = parsed.data

  try {
    const resetToken = await prisma.passwordResetToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!resetToken) {
      return { error: "Token invalide" }
    }

    if (resetToken.expiresAt.getTime() < Date.now()) {
      return { error: "Token expiré" }
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id: resetToken.userId },
      data: { passwordHash },
    })

    await prisma.passwordResetToken.delete({
      where: { token },
    })

  } catch (error) {
    console.error("Reset password action error:", error)
    return { error: "Erreur lors de la réinitialisation" }
  }

  redirect("/login")
}
