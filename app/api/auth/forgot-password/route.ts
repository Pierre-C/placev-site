import { z } from "zod"
import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { brevo } from "@/lib/brevo"
import crypto from "crypto"

const forgotPasswordSchema = z.object({
  email: z.string().email(),
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const parsed = forgotPasswordSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Email invalide" }, { status: 422 })
    }

    const { email } = parsed.data

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

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Forgot password error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}
