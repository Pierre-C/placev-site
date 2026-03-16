import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { data, mimeType } = await req.json();

    if (!data || !mimeType || !["image/jpeg", "image/png", "image/webp"].includes(mimeType)) {
      return NextResponse.json({ error: "Invalid data or mimeType" }, { status: 400 });
    }

    const event = await prisma.event.findUnique({ where: { id: params.id } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const eventImage = await prisma.eventImage.upsert({
      where: { eventId: params.id },
      create: { eventId: params.id, data, mimeType },
      update: { data, mimeType },
    });

    return NextResponse.json({
      eventId: eventImage.eventId,
      mimeType: eventImage.mimeType,
      createdAt: eventImage.createdAt,
    }, { status: 201 });

  } catch (error) {
    console.error("[POST_EVENT_IMAGE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (session?.user?.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const event = await prisma.event.findUnique({ where: { id: params.id } });
    if (!event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const eventImage = await prisma.eventImage.findUnique({ where: { eventId: params.id } });
    if (!eventImage) {
      return NextResponse.json({ error: "Image not found" }, { status: 404 });
    }

    await prisma.eventImage.delete({ where: { eventId: params.id } });

    return NextResponse.json({ deleted: true }, { status: 200 });

  } catch (error) {
    console.error("[DELETE_EVENT_IMAGE]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
