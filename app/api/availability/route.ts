/**
 * app/api/availability/route.ts
 * GET /api/availability?start=YYYY-MM-DD&end=YYYY-MM-DD
 *
 * Route publique — aucune auth requise.
 * Retourne les créneaux AM et PM pour chaque date de la plage,
 * avec le nombre de places restantes et un flag isClosed pour les ClosedDates.
 */

import { NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { addDays, formatYMD } from "@/lib/calendar-utils"

const querySchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD requis"),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD requis"),
})

export async function GET(request: Request) {
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
  // new Date("YYYY-MM-DD") parse en UTC midnight
  const startDate = new Date(start)
  const endDate = new Date(end)

  // DESK_CAPACITY et OPEN_DAYS depuis SystemSetting (jamais hardcodés)
  const [capacitySetting, openDaysSetting] = await Promise.all([
    prisma.systemSetting.findUnique({ where: { key: "DESK_CAPACITY" } }),
    prisma.systemSetting.findUnique({ where: { key: "OPEN_DAYS" } }),
  ])
  const capacity = capacitySetting ? parseInt(capacitySetting.value, 10) : 15
  const openDays = openDaysSetting?.key === "OPEN_DAYS"
    ? openDaysSetting.value.split(",").map(Number)
    : [1, 2, 3]

  // Dates fermées dans la plage
  const closedDates = await prisma.closedDate.findMany({
    where: { date: { gte: startDate, lte: endDate } },
  })
  // On stocke en ISO pour comparer facilement avec formatYMD
  const closedSet = new Set(
    closedDates.map((cd) => cd.date.toISOString().slice(0, 10))
  )

  // Réservations CONFIRMED de type OPENSPACE dans la plage
  const reservations = await prisma.reservation.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      status: "CONFIRMED",
      type: "OPENSPACE",
    },
    select: { date: true, slot: true },
  })

  // Compte par date|slot (AM ou PM)
  // Une réservation FULL occupe à la fois AM et PM
  const countMap = new Map<string, number>()
  for (const res of reservations) {
    const dateStr = res.date.toISOString().slice(0, 10)
    if (res.slot === "FULL") {
      countMap.set(`${dateStr}|AM`, (countMap.get(`${dateStr}|AM`) ?? 0) + 1)
      countMap.set(`${dateStr}|PM`, (countMap.get(`${dateStr}|PM`) ?? 0) + 1)
    } else {
      const key = `${dateStr}|${res.slot}`
      countMap.set(key, (countMap.get(key) ?? 0) + 1)
    }
  }

  // Construction de la réponse : AM + PM pour chaque jour de la plage
  const result: { date: string; slot: "AM" | "PM"; remaining: number; isClosed: boolean }[] = []
  let current = new Date(startDate)

  while (current <= endDate) {
    // On utilise toISOString pour correspondre aux dates stockées en UTC dans la DB
    const dateStr = current.toISOString().slice(0, 10)
    const isNotOpenDay = !openDays.includes(current.getUTCDay())
    const isClosed = closedSet.has(dateStr) || isNotOpenDay

    for (const slot of ["AM", "PM"] as const) {
      const count = countMap.get(`${dateStr}|${slot}`) ?? 0
      const remaining = isClosed ? 0 : Math.max(0, capacity - count)
      result.push({ date: dateStr, slot, remaining, isClosed })
    }

    current = addDays(current, 1)
  }

  return NextResponse.json(result)
}
