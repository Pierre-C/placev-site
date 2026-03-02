import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

const querySchema = z.object({
  start: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD requis"),
  end: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD requis"),
});

export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
  }

  const { searchParams } = new URL(request.url);

  const parse = querySchema.safeParse({
    start: searchParams.get("start"),
    end: searchParams.get("end"),
  });

  if (!parse.success) {
    return NextResponse.json(
      { error: "Paramètres start et end requis (format YYYY-MM-DD)" },
      { status: 400 },
    );
  }

  const { start, end } = parse.data;
  const startDate = new Date(start);
  const endDate = new Date(end);

  const [capacitySetting, openDaysSetting] = await Promise.all([
    prisma.systemSetting.findUnique({ where: { key: "DESK_CAPACITY" } }),
    prisma.systemSetting.findUnique({ where: { key: "OPEN_DAYS" } }),
  ]);
  const capacity = capacitySetting ? parseInt(capacitySetting.value, 10) : 15;
  const openDaysStr = openDaysSetting?.value ?? "1,2,3,4,5";
  const openDays = openDaysStr.split(",").map(Number);

  const closedDates = await prisma.closedDate.findMany({
    where: { date: { gte: startDate, lte: endDate } },
  });
  const closedMap = new Map<string, string>();
  for (const cd of closedDates) {
    closedMap.set(cd.date.toISOString().slice(0, 10), cd.id);
  }

  const reservations = await prisma.reservation.findMany({
    where: {
      date: { gte: startDate, lte: endDate },
      status: "CONFIRMED",
      type: { in: ["OPENSPACE", "ORGANIZATION"] },
    },
    select: { date: true, slot: true },
  });

  const countMap = new Map<string, number>();
  for (const res of reservations) {
    const dateStr = res.date.toISOString().slice(0, 10);
    if (res.slot === "FULL") {
      countMap.set(`${dateStr}|AM`, (countMap.get(`${dateStr}|AM`) ?? 0) + 1);
      countMap.set(`${dateStr}|PM`, (countMap.get(`${dateStr}|PM`) ?? 0) + 1);
    } else {
      const key = `${dateStr}|${res.slot}`;
      countMap.set(key, (countMap.get(key) ?? 0) + 1);
    }
  }

  const result: {
    date: string;
    slot: "AM" | "PM";
    count: number;
    capacity: number;
    isClosed: boolean;
    closedDateId: string | null;
  }[] = [];
  let current = new Date(startDate);

  while (current <= endDate) {
    const dateStr = current.toISOString().slice(0, 10);
    const isNotOpenDay = !openDays.includes(current.getUTCDay());
    const closedDateId = closedMap.get(dateStr) ?? null;
    const isClosed = closedDateId !== null || isNotOpenDay;

    for (const slot of ["AM", "PM"] as const) {
      const count = countMap.get(`${dateStr}|${slot}`) ?? 0;
      result.push({ date: dateStr, slot, count, capacity, isClosed, closedDateId });
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return NextResponse.json(result);
}
