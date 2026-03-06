/**
 * app/api/booking/route.ts
 * POST /api/booking
 *
 * Crée une ou plusieurs réservations de postes open-space pour l'utilisateur connecté.
 * Auth requise. Valide le solde global, les dates, la capacité, puis débite les crédits.
 *
 * Note : Le Neon HTTP adapter ne supporte pas les transactions interactives
 * ($transaction callback). On utilise des opérations séquentielles avec un
 * pre-check de capacité (légère fenêtre de race condition acceptable en contexte PME).
 */

import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { brevo } from "@/lib/brevo"
import { calculateCost, canBook } from "@/lib/services/booking"

const bookingItemSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD requis"),
  slot: z.enum(["AM", "PM", "FULL"]),
})

const bodySchema = z.object({
  bookings: z.array(bookingItemSchema).min(1, "Panier vide"),
})

export async function POST(request: Request) {
  // Auth
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  // Validation du body
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 400 })
  }

  const parse = bodySchema.safeParse(body)
  if (!parse.success) {
    return NextResponse.json({ error: "Données invalides", details: parse.error.flatten() }, { status: 422 })
  }

  const { bookings } = parse.data

  // PRE-CHECKS

  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)

  let totalCost = 0

  const openDaysSetting = await prisma.systemSetting.findUnique({
    where: { key: "OPEN_DAYS" },
  })
  const openDays = openDaysSetting?.key === "OPEN_DAYS"
    ? openDaysSetting.value.split(",").map(Number)
    : [1, 2, 3]

  const capacitySetting = await prisma.systemSetting.findUnique({
    where: { key: "DESK_CAPACITY" },
  })
  const capacity = capacitySetting ? parseInt(capacitySetting.value, 10) : 15

  // Valider chaque date du panier
  for (const item of bookings) {
    const reservationDate = new Date(item.date)

    if (reservationDate < today) {
      return NextResponse.json({ error: "Une date de réservation est dans le passé" }, { status: 422 })
    }

    if (!openDays.includes(reservationDate.getUTCDay())) {
      return NextResponse.json(
        { error: "Un jour n'est pas ouvert à la réservation" },
        { status: 422 }
      )
    }

    const closedDate = await prisma.closedDate.findFirst({
      where: { date: reservationDate },
    })
    if (closedDate) {
      return NextResponse.json({ error: "Un jour est fermé" }, { status: 422 })
    }

    // Capacity check
    const slotsToCheck = item.slot === "FULL" ? (["AM", "PM"] as const) : ([item.slot] as const)

    for (const halfSlot of slotsToCheck) {
      const conflictingSlots = halfSlot === "AM"
        ? { in: ["AM", "FULL"] as import("@prisma/client").Slot[] }
        : { in: ["PM", "FULL"] as import("@prisma/client").Slot[] }

      const count = await prisma.reservation.count({
        where: {
          date: reservationDate,
          status: "CONFIRMED",
          type: "OPENSPACE",
          slot: conflictingSlots,
        },
      })

      if (count >= capacity) {
        return NextResponse.json(
          { error: `Créneau ${halfSlot} complet pour la date ${item.date}` },
          { status: 409 }
        )
      }
    }

    totalCost += calculateCost(item.slot)
  }

  // Vérifier le solde
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
  }

  if (!canBook({ credits: user.credits, cost: totalCost })) {
    return NextResponse.json(
      { error: "Solde insuffisant pour effectuer cette réservation" },
      { status: 403 }
    )
  }

  // EXECUTION DES RESERVATIONS
  const createdReservations = []
  
  for (const item of bookings) {
    const reservationDate = new Date(item.date)
    const cost = calculateCost(item.slot)

    const reservation = await prisma.reservation.create({
      data: {
        userId: user.id,
        date: reservationDate,
        slot: item.slot,
        type: "OPENSPACE",
        status: "CONFIRMED",
        creditsCost: cost,
      },
    })
    
    createdReservations.push({
      id: reservation.id,
      status: reservation.status,
      date: reservation.date.toISOString().slice(0, 10),
      slot: reservation.slot,
      costCredits: cost,
    })
  }

  // Debit and transaction
  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { credits: { decrement: totalCost } },
  })

  await prisma.transaction.create({
    data: {
      userId: user.id,
      type: "DEBIT_RESERVATION",
      creditsAdd: -totalCost,
      creditsBefore: user.credits,
    },
  })

  // Send single email for the whole cart
  await brevo.sendEmail({
    template: "confirmation-reservation-multiple",
    to: user.email,
    toName: user.firstName ? `${user.firstName} ${user.lastName}` : undefined,
    variables: {
      totalCost,
      newBalance: updatedUser.credits,
      bookings: createdReservations.map(r => ({ date: r.date, slot: r.slot })),
    },
  })

  return NextResponse.json(
    {
      reservations: createdReservations,
      totalCost,
    },
    { status: 201 }
  )
}
