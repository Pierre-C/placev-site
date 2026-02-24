/**
 * app/api/booking/route.ts
 * POST /api/booking
 *
 * Crée une réservation de poste open-space pour l'utilisateur connecté.
 * Auth requise. Valide le solde, la date, la capacité, puis débite les crédits.
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

const bodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD requis"),
  slot: z.enum(["AM", "PM", "FULL"]),
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
    return NextResponse.json({ error: "Données invalides", details: parse.error.flatten() }, { status: 400 })
  }

  const { date, slot } = parse.data
  // new Date("YYYY-MM-DD") parse en UTC midnight — cohérent avec la DB
  const reservationDate = new Date(date)

  // Vérifier que la date est future (ou aujourd'hui)
  const today = new Date()
  today.setUTCHours(0, 0, 0, 0)
  if (reservationDate < today) {
    return NextResponse.json({ error: "La date de réservation est dans le passé" }, { status: 422 })
  }

  // Vérifier si la date est fermée
  const closedDate = await prisma.closedDate.findFirst({
    where: { date: reservationDate },
  })
  if (closedDate) {
    return NextResponse.json({ error: "Ce jour est fermé" }, { status: 422 })
  }

  // Récupérer l'utilisateur et son solde courant
  const user = await prisma.user.findUnique({ where: { id: session.user.id } })
  if (!user) {
    return NextResponse.json({ error: "Utilisateur introuvable" }, { status: 404 })
  }

  // Vérifier le seuil de solde (credits - cost >= -3)
  const cost = calculateCost(slot)
  if (!canBook({ credits: user.credits, cost })) {
    return NextResponse.json(
      { error: "Solde insuffisant pour effectuer cette réservation" },
      { status: 403 }
    )
  }

  // Lire DESK_CAPACITY depuis SystemSetting
  const capacitySetting = await prisma.systemSetting.findUnique({
    where: { key: "DESK_CAPACITY" },
  })
  const capacity = capacitySetting ? parseInt(capacitySetting.value, 10) : 15

  // Vérifier la capacité disponible
  // Pour AM : compter les réservations AM + FULL sur ce créneau
  // Pour PM : compter les réservations PM + FULL sur ce créneau
  // Pour FULL : vérifier les deux demi-journées
  const slotsToCheck = slot === "FULL" ? (["AM", "PM"] as const) : ([slot] as const)

  for (const halfSlot of slotsToCheck) {
    const conflictingSlots = halfSlot === "AM"
      ? { in: ["AM", "FULL"] as const }
      : { in: ["PM", "FULL"] as const }

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
        { error: `Créneau ${halfSlot} complet pour cette date` },
        { status: 409 }
      )
    }
  }

  // Créer la réservation et débiter les crédits (opérations séquentielles)
  const reservation = await prisma.reservation.create({
    data: {
      userId: user.id,
      date: reservationDate,
      slot,
      type: "OPENSPACE",
      status: "CONFIRMED",
      creditsCost: cost,
    },
  })

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: { credits: { decrement: cost } },
  })

  await prisma.transaction.create({
    data: {
      userId: user.id,
      type: "DEBIT_RESERVATION",
      creditsAdd: -cost,
      creditsBefore: user.credits,
    },
  })

  // Email de confirmation (après les opérations DB)
  await brevo.sendEmail({
    template: "confirmation-reservation",
    to: user.email,
    toName: user.name ?? undefined,
    variables: {
      slot,
      costCredits: cost,
      date,
      newBalance: updatedUser.credits,
    },
  })

  return NextResponse.json(
    {
      reservation: {
        id: reservation.id,
        status: reservation.status,
        date: reservation.date.toISOString().slice(0, 10),
        slot: reservation.slot,
        costCredits: cost,
        newBalance: updatedUser.credits,
      },
    },
    { status: 201 }
  )
}
