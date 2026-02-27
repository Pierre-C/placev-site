import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { brevo } from "@/lib/brevo";

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const reservationId = params.id;

  const reservation = await prisma.reservation.findUnique({
    where: { id: reservationId },
    include: { user: true },
  });

  if (!reservation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (reservation.status === "CANCELLED") {
    return NextResponse.json({ error: "Already cancelled" }, { status: 409 });
  }

  // Effectuer les opérations de mise à jour (Prisma Sequential, pas de $transaction complex array)
  const updatedReservation = await prisma.reservation.update({
    where: { id: reservationId },
    data: {
      status: "CANCELLED",
      cancelledAt: new Date(),
    },
  });

  let newBalance = reservation.user.credits;

  // Remboursement uniquement pour OPENSPACE et si des crédits ont été dépensés
  if (reservation.type === "OPENSPACE" && reservation.creditsCost && reservation.creditsCost > 0) {
    const updatedUser = await prisma.user.update({
      where: { id: reservation.userId },
      data: {
        credits: {
          increment: reservation.creditsCost,
        },
      },
    });
    newBalance = updatedUser.credits;

    await prisma.transaction.create({
      data: {
        userId: reservation.userId,
        type: "REFUND_CANCELLATION",
        creditsAdd: reservation.creditsCost,
        creditsBefore: reservation.user.credits,
      },
    });
  }

  // Envoi d'email via Brevo
  if (reservation.user.email) {
    await brevo.sendEmail({
      to: reservation.user.email,
      template: "annulation-par-admin",
      variables: {
        date: reservation.date.toISOString().slice(0, 10),
        slot: reservation.slot,
        reason: "Annulation par l'administrateur",
        refundedCredits: reservation.creditsCost ?? 0,
      },
    });
  }

  return NextResponse.json({ reservation: updatedReservation, newBalance });
}
