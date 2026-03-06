/**
 * app/api/profile/request-deletion/route.ts
 * POST /api/profile/request-deletion
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { brevo } from "@/lib/brevo"

export async function POST() {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { deletionRequestedAt: new Date() },
  })

  // Envoyer l'email à l'admin (hardcoded admin@placev.fr or env)
  const adminEmail = process.env.ADMIN_EMAIL || "admin@placev.fr"
  await brevo.sendEmail({
    template: "demande-suppression-compte",
    to: adminEmail,
    toName: "Admin Place V",
    variables: {
      userEmail: session.user.email,
      userId: session.user.id,
    },
  })

  return NextResponse.json({ success: true })
}
