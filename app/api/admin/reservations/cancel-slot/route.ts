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

  const targetSlots = slot === "AM" ? ["AM", "FULL"] : ["PM", "FULL"];

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

    if (reservation.creditsCost && reservation.creditsCost > 0) {
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

    if (reservation.user.email) {
      await brevo.sendEmail({
        to: reservation.user.email,
        template: "annulation-par-admin",
        variables: {
          date: reservation.date.toISOString().slice(0, 10),
          slot: reservation.slot,
          reason: `Annulation groupée (${slot})`,
          refundedCredits: reservation.creditsCost ?? 0,
        },
      });
    }

    cancelledCount++;
  }

  return NextResponse.json({ cancelledCount });
}
