import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { brevo } from "@/lib/brevo";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const body = await request.json();
  const { date, slot } = body;

  if (!date || (slot !== "AM" && slot !== "PM")) {
    return NextResponse.json({ error: "Invalid parameters" }, { status: 422 });
  }

  const targetDate = new Date(date);

  const targetSlots: import("@prisma/client").Slot[] = slot === "AM" ? ["AM", "FULL"] : ["PM", "FULL"];

  const reservationsToCancel = await prisma.reservation.findMany({
    where: {
      date: targetDate,
      slot: { in: targetSlots },
      status: "CONFIRMED",
      type: "OPENSPACE",
    },
    include: { user: true },
  });

  let cancelledCount = 0;

  for (const reservation of reservationsToCancel) {
    await prisma.reservation.update({
      where: { id: reservation.id },
      data: {
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    });

    if (reservation.userId && reservation.user && reservation.creditsCost && reservation.creditsCost > 0) {
      await prisma.user.update({
        where: { id: reservation.userId },
        data: {
          credits: {
            increment: reservation.creditsCost,
          },
        },
      });

      await prisma.transaction.create({
        data: {
          userId: reservation.userId,
          type: "REFUND_CANCELLATION",
          creditsAdd: reservation.creditsCost,
          creditsBefore: reservation.user.credits,
        },
      });
    }

    if (reservation.user?.email) {
      const SLOT_LABELS: Record<string, string> = { AM: "Matin", PM: "Après-midi", FULL: "Journée complète" }
      const slotLabel = SLOT_LABELS[reservation.slot] ?? reservation.slot
      const dateLabel = reservation.date.toLocaleDateString("fr-FR", {
        weekday: "long", day: "numeric", month: "long", year: "numeric",
      })
      await brevo.sendEmail({
        to: reservation.user.email,
        template: "annulation-par-admin",
        variables: {
          date: reservation.date.toISOString().slice(0, 10),
          dateLabel,
          slot: reservation.slot,
          slotLabel,
          reason: `Annulation groupée — ${SLOT_LABELS[slot] ?? slot}`,
          refundedCredits: reservation.creditsCost ?? 0,
        },
      });
    }

    cancelledCount++;
  }

  return NextResponse.json({ cancelledCount });
}
