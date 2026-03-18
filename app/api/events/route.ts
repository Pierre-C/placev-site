import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const limit = searchParams.get("limit");
    const includePast = searchParams.get("includePast");

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const whereParams = includePast === "true" ? {} : { date: { gte: now } };
    const takeValue = limit && !isNaN(parseInt(limit)) ? parseInt(limit) : undefined;

    const events = await prisma.event.findMany({
      where: whereParams,
      orderBy: { date: "asc" },
      take: takeValue,
      select: {
        id: true,
        title: true,
        description: true,
        date: true,
        registrationUrl: true,
        image: {
          select: { mimeType: true }
        }
      },
    });

    const mappedEvents = events.map(event => {
      const { image, ...rest } = event;
      return {
        ...rest,
        imageUrl: image ? `/api/events/${event.id}/image` : "/gallery/PXL_20250909_120231896.jpg"
      };
    });

    return NextResponse.json(mappedEvents, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("[GET_EVENTS]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
