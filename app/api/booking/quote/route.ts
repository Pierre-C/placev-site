import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { brevo } from "@/lib/brevo";

function toMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

const OPEN_FROM = 8 * 60 + 30; // 08:30 -> 510 min
const OPEN_UNTIL = 18 * 60; // 18:00 -> 1080 min
const MIN_DURATION = 120; // 2h minimum
const HOURLY_RATE = 25; // 25 €/h (tarif indicatif)
const FULL_DAY_PRICE = 200; // 200 € journée complète

const quoteSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD requis"),
  start: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:MM requis"),
  end: z.string().regex(/^\d{2}:\d{2}$/, "Format HH:MM requis"),
  companyName: z.string().min(1, "Nom de l'entreprise requis"),
  contactName: z.string().min(1, "Nom du contact requis"),
  contactEmail: z.string().email("Email invalide"),
  contactPhone: z.string().min(1, "Téléphone requis"),
  message: z.string().optional(),
});

export async function POST(request: Request) {
  try {
    const session = await auth();
    const body = await request.json();
    const result = quoteSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Données invalides", details: result.error.flatten() },
        { status: 422 },
      );
    }

    const {
      date,
      start,
      end,
      companyName,
      contactName,
      contactEmail,
      contactPhone,
      message,
    } = result.data;

    const startMin = toMinutes(start);
    const endMin = toMinutes(end);

    // 1. Granularité demi-heure
    if (startMin % 30 !== 0 || endMin % 30 !== 0) {
      return NextResponse.json(
        {
          error:
            "Les horaires doivent être à la demi-heure pile (ex: 09:00, 09:30)",
        },
        { status: 422 },
      );
    }

    // 2. Horaires d'ouverture 08:30 - 18:00
    if (startMin < OPEN_FROM || endMin > OPEN_UNTIL) {
      return NextResponse.json(
        { error: "La salle est disponible de 08h30 à 18h00 uniquement" },
        { status: 422 },
      );
    }

    // 3. Fin après début
    if (endMin <= startMin) {
      return NextResponse.json(
        { error: "L'heure de fin doit être après l'heure de début" },
        { status: 422 },
      );
    }

    // 4. Durée minimale 2h
    if (endMin - startMin < MIN_DURATION) {
      return NextResponse.json(
        { error: "La durée minimale de réservation est de 2 heures" },
        { status: 422 },
      );
    }

    // 5. Jours d'ouverture
    const openDaysSetting = await prisma.systemSetting.findUnique({
      where: { key: "OPEN_DAYS" },
    });
    const openDays = openDaysSetting
      ? openDaysSetting.value.split(",").map(Number)
      : [1, 2, 3, 4, 5]; // default Monday-Friday

    const requestedDate = new Date(date);
    const dayOfWeek = requestedDate.getDay(); // 0 = Sunday, 1 = Monday
    if (!openDays.includes(dayOfWeek)) {
      return NextResponse.json(
        { error: "Le coworking est fermé à cette date" },
        { status: 422 },
      );
    }

    // Calcul du slot automatique
    let slot: "AM" | "PM" | "FULL" = "FULL";
    if (endMin <= 12 * 60 + 30) slot = "AM";
    else if (startMin >= 12 * 60 + 30) slot = "PM";

    const reservation = await prisma.reservation.create({
      data: {
        userId: session?.user?.id || null,
        date: new Date(date),
        slot,
        type: "MEETING_ROOM",
        status: "PENDING_QUOTE",
        companyName,
        contactName,
        contactEmail,
        contactPhone,
        message,
        creditsCost: null,
        startTime: start,
        endTime: end,
      },
    });

    const adminEmail = process.env.ADMIN_EMAIL || "placevcoworking@gmail.com";
    const durationHours = (endMin - startMin) / 60;
    const isFullDay = startMin === OPEN_FROM && endMin === OPEN_UNTIL;
    const indicativePrice = isFullDay
      ? FULL_DAY_PRICE
      : Math.round(durationHours * HOURLY_RATE);

    await brevo.sendEmail({
      to: adminEmail,
      template: "nouvelle-demande-devis",
      variables: {
        date,
        start,
        end,
        durationHours,
        indicativePrice,
        companyName,
        contactName,
        contactEmail,
        contactPhone,
        message: message || "Aucun message",
      },
    });

    return NextResponse.json(
      {
        reservation: {
          id: reservation.id,
          date: reservation.date,
          companyName: reservation.companyName,
          status: reservation.status,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error("Quote error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}
