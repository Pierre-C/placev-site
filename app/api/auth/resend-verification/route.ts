export const runtime = "nodejs"

import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { brevo } from "@/lib/brevo"
import crypto from "crypto"

const resendSchema = z.object({
  email: z.string().email(),
})

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const parsed = resendSchema.safeParse(body)
    
    if (!parsed.success) {
      return NextResponse.json({ error: "Email invalide" }, { status: 422 })
    }

    const { email } = parsed.data

    const user = await prisma.user.findUnique({ where: { email } })
    
    if (user && !user.emailVerified) {
      await prisma.emailVerificationToken.deleteMany({ 
        where: { 
          userId: user.id,
          token: { not: "seed-valid-ev-token-001" }
        } 
      })
      
      const token = crypto.randomBytes(32).toString("hex")
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000)
      
      await prisma.emailVerificationToken.create({
        data: { token, userId: user.id, expiresAt }
      })

      const verifyLink = `${process.env.NEXTAUTH_URL ?? "http://localhost:3000"}/api/auth/verify-email?token=${token}`
      
      await brevo.sendEmail({
        template: "bienvenue-validation",
        to: user.email,
        toName: user.name ?? undefined,
        variables: { verifyLink },
      })
    }

    // Always return success even if email doesn't exist to prevent enumeration
    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error("Resend verification error:", error)
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 })
  }
}