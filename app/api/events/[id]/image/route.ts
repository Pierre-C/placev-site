import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  try {
    const event = await prisma.event.findUnique({ where: { id: params.id } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const eventImage = await prisma.eventImage.findUnique({ where: { eventId: params.id } });
    if (!eventImage || !eventImage.data) {
      return NextResponse.redirect(new URL("/gallery/PXL_20250909_120231896.jpg", req.url), 302);
    }

    try {
      const base64Data = eventImage.data.replace(/^data:image\/\w+;base64,/, "");
      const buffer = Buffer.from(base64Data, "base64");

      return new Response(buffer, {
        headers: {
          "Content-Type": eventImage.mimeType,
          "Cache-Control": "public, max-age=86400",
        },
      });
    } catch (e) {
      // Invalid base64 fallback
      return NextResponse.redirect(new URL("/gallery/PXL_20250909_120231896.jpg", req.url), 302);
    }

  } catch (error) {
    console.error("[GET_EVENT_IMAGE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
