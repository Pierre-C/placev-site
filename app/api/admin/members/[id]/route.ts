import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const userId = params.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      credits: true,
      isMember: true,
      segment: true,
      role: true,
      deletionRequestedAt: true,
      createdAt: true,
      _count: {
        select: { reservations: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const recentReservations = await prisma.reservation.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 5,
    select: {
      id: true,
      date: true,
      slot: true,
      status: true,
      type: true,
    },
  });

  return NextResponse.json({
    ...user,
    reservationCount: user._count.reservations,
    recentReservations,
  });
}
