export const runtime = "nodejs"

import { NextRequest } from "next/server"
import { redirect } from "next/navigation"
import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { brevo } from "@/lib/brevo"

export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token")

  if (!token) {
    redirect("/verify-email-error?reason=invalid")
  }

  const evToken = await prisma.emailVerificationToken.findUnique({
    where: { token },
    include: { user: true },
  })

  if (!evToken) {
    redirect("/verify-email-error?reason=invalid")
  }

  if (evToken.expiresAt < new Date()) {
    await prisma.emailVerificationToken.delete({ where: { id: evToken.id } })
    redirect("/verify-email-error?reason=expired")
  }

  // Valider le compte
  await prisma.user.update({
    where: { id: evToken.userId },
    data: { emailVerified: new Date() },
  })
  await prisma.emailVerificationToken.delete({ where: { id: evToken.id } })

  // Email de bienvenue complet (fire & forget — ne bloque pas le redirect)
  brevo.sendEmail({
    template: "bienvenue-complet",
    to: evToken.user.email,
    toName: evToken.user.firstName,
    variables: { firstName: evToken.user.firstName },
  }).catch(() => {})

  // Créer un VerifiedUserToken court-vécu pour l'auto-login
  const autoLoginToken = crypto.randomBytes(16).toString("hex")
  await prisma.verifiedUserToken.create({
    data: {
      token: autoLoginToken,
      userId: evToken.userId,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5 min
    },
  })

  redirect(`/verify-email/callback?vt=${autoLoginToken}`)
}