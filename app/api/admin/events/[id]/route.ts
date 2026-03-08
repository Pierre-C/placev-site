import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const updateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  date: z.string().refine((val) => !isNaN(Date.parse(val))).optional(),
  registrationUrl: z.string().url().nullable().optional().or(z.literal("")),
});

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const eventId = params.id;
    const body = await req.json();
    const parsed = updateSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.format() }, { status: 422 });
    }

    const existingEvent = await prisma.event.findUnique({ where: { id: eventId } });
    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    const { title, description, date, registrationUrl } = parsed.data;

    const updated = await prisma.event.update({
      where: { id: eventId },
      data: {
        ...(title && { title }),
        ...(description && { description }),
        ...(date && { date: new Date(date) }),
        ...(registrationUrl !== undefined && { registrationUrl: registrationUrl || null }),
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error("[ADMIN_PUT_EVENT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const eventId = params.id;

    const existingEvent = await prisma.event.findUnique({ where: { id: eventId } });
    if (!existingEvent) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    await prisma.event.delete({ where: { id: eventId } });

    return NextResponse.json({ deleted: true });
  } catch (error) {
    console.error("[ADMIN_DELETE_EVENT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
