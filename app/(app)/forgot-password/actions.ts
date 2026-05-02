"use server"

import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { brevo } from "@/lib/brevo"
import crypto from "crypto"

const schema = z.object({
  email: z.string().email("Email invalide"),
})

export type ForgotPasswordState = { error: string; success: boolean }

export async function forgotPasswordAction(
  _prevState: ForgotPasswordState,
  formData: FormData
): Promise<ForgotPasswordState> {
  const parsed = schema.safeParse({ email: formData.get("email") })

  if (!parsed.success) {
    return { error: "Email invalide", success: false }
  }

  const { email } = parsed.data

  try {
    const user = await prisma.user.findUnique({ where: { email } })
    if (user) {
      const token = crypto.randomBytes(32).toString("hex")
      
      await prisma.passwordResetToken.create({
        data: {
          token,
          userId: user.id,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        }
      })

      await brevo.sendEmail({
        template: "reset-password",
        to: user.email,
        variables: {
          resetLink: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`,
        }
      })
    }
  } catch (error) {
    console.error("Forgot password action error:", error)
  }

  // Always return success even if email doesn't exist
  return { error: "", success: true }
}
