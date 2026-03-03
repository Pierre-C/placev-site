import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const bodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD requis"),
  slot: z.enum(["AM", "PM", "FULL"]),
})

export async function POST(request: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  try {
    const body = await request.json()
    const result = bodySchema.safeParse(body)
    if (!result.success) {
      return NextResponse.json({ error: "DonnÃ©es invalides", details: result.error.flatten() }, { status: 422 })
    }

    const { date, slot } = result.data
    const reservationDate = new Date(date)

    // Re-check capacity for organization
    const capacitySetting = await prisma.systemSetting.findUnique({ where: { key: "DESK_CAPACITY" } })
    const capacity = capacitySetting ? parseInt(capacitySetting.value, 10) : 15

    const slotsToCheck = slot === "FULL" ? (["AM", "PM"] as const) : ([slot] as const)
    for (const halfSlot of slotsToCheck) {
      const conflictingSlots = halfSlot === "AM" ? { in: ["AM", "FULL"] as import("@prisma/client").Slot[] } : { in: ["PM", "FULL"] as import("@prisma/client").Slot[] }
      const count = await prisma.reservation.count({
        where: {
          date: reservationDate,
          status: "CONFIRMED",
          type: "OPENSPACE",
          slot: conflictingSlots,
        },
      })
      if (count >= capacity) {
        return NextResponse.json({ error: `CrÃ©neau ${halfSlot} complet` }, { status: 409 })
      }
    }

    // Create Reservation(type=ORGANIZATION, userId=null, costCredits=null)
    const reservation = await prisma.reservation.create({
      data: {
        userId: null,
        date: reservationDate,
        slot,
        type: "ORGANIZATION",
        status: "CONFIRMED",
        creditsCost: null,
      },
    })

    return NextResponse.json({ reservation }, { status: 201 })
  } catch (error: any) {
    console.error("Organisation booking error:", error)
    return NextResponse.json({ error: "Server Error" }, { status: 500 })
  }
}
