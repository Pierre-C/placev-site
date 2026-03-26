/**
 * app/api/booking/[id]/cancel/route.ts
 * POST /api/booking/:id/cancel
 *
 * Annule une réservation de l'utilisateur connecté si la fenêtre de 12h est ouverte.
 * Rembourse les crédits et crée une Transaction REFUND_CANCELLATION.
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { canCancel } from "@/lib/services/booking"

export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  // Auth
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  const { id } = params

  // Récupérer la réservation
  const reservation = await prisma.reservation.findUnique({
    where: { id },
    include: { user: true },
  })

  if (!reservation) {
    return NextResponse.json({ error: "Réservation introuvable" }, { status: 404 })
  }

  // Vérifier que la réservation appartient à l'utilisateur
  if (reservation.userId !== session.user.id) {
    return NextResponse.json({ error: "Accès refusé" }, { status: 403 })
  }

  // Vérifier que la réservation est annulable (statut + fenêtre 12h)
  if (!canCancel({ status: reservation.status, date: reservation.date })) {
    if (reservation.status === "CANCELLED") {
      return NextResponse.json(
        { error: "Cette réservation est déjà annulée" },
        { status: 422 }
      )
    }
    return NextResponse.json(
      { error: "Annulation impossible : moins de 12h avant le début du créneau" },
      { status: 422 }
    )
  }

  // Calculer le remboursement (creditsCost peut être null pour d'anciennes réservations)
  const creditsRefunded = reservation.creditsCost ?? 0
  const creditsBefore = reservation.user?.credits ?? 0

  // Mettre à jour la réservation
  await prisma.reservation.update({
    where: { id },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
    },
  })

  // Rembourser les crédits
  const updatedUser = await prisma.user.update({
    where: { id: reservation.userId },
    data: { credits: { increment: creditsRefunded } },
  })

  // Créer la transaction de remboursement
  await prisma.transaction.create({
    data: {
      userId: reservation.userId,
      type: "REFUND_CANCELLATION",
      creditsAdd: creditsRefunded,
      creditsBefore,
    },
  })

  return NextResponse.json({
    cancelled: true,
    creditsRefunded,
    newBalance: updatedUser.credits,
  })
}
