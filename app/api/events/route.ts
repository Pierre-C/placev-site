import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  try {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const events = await prisma.event.findMany({
      where: { date: { gte: now } },
      orderBy: { date: "asc" },
      select: {
        id: true,
        title: true,
        description: true,
        date: true,
        registrationUrl: true,
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("[GET_EVENTS]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
