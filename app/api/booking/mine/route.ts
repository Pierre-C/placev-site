/**
 * app/api/booking/mine/route.ts
 * GET /api/booking/mine?start=YYYY-MM-DD&end=YYYY-MM-DD
 *
 * Retourne les réservations CONFIRMED OPENSPACE de l'utilisateur connecté
 * dans la plage de dates fournie, avec un flag `canCancel` calculé côté serveur.
 */

import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canCancel } from "@/lib/services/booking"

const querySchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD requis"),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD requis"),
})

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const parse = querySchema.safeParse({
    start: searchParams.get("start"),
    end: searchParams.get("end"),
  })

  if (!parse.success) {
    return NextResponse.json(
      { error: "Paramètres start et end requis (format YYYY-MM-DD)" },
      { status: 400 }
    )
  }

  const { start, end } = parse.data
  const startDate = new Date(start)
  const endDate = new Date(end)

  const reservations = await prisma.reservation.findMany({
    where: {
      userId: session.user.id,
      date: { gte: startDate, lte: endDate },
      status: "CONFIRMED",
      type: "OPENSPACE",
    },
    select: { id: true, date: true, slot: true, creditsCost: true },
    orderBy: { date: "asc" },
  })

  const result = reservations.map((r) => ({
    id: r.id,
    date: r.date.toISOString().slice(0, 10),
    slot: r.slot,
    creditsCost: r.creditsCost ?? 1,
    canCancel: canCancel({ status: "CONFIRMED", date: r.date }),
  }))

  return NextResponse.json(result)
}
