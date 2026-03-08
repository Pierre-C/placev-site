import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { z } from "zod";

const createSchema = z.object({
  title: z.string().min(1, "Le titre est requis"),
  description: z.string().min(1, "La description est requise"),
  date: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Date invalide",
  }),
  registrationUrl: z.string().url().nullable().optional().or(z.literal("")),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const events = await prisma.event.findMany({
      orderBy: { date: "desc" },
      select: {
        id: true,
        title: true,
        description: true,
        date: true,
        registrationUrl: true,
        createdAt: true,
      },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("[ADMIN_GET_EVENTS]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const body = await req.json();
    const parsed = createSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.format() }, { status: 422 });
    }

    const { title, description, date, registrationUrl } = parsed.data;

    const event = await prisma.event.create({
      data: {
        title,
        description,
        date: new Date(date),
        registrationUrl: registrationUrl || null,
      },
    });

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("[ADMIN_POST_EVENT]", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
