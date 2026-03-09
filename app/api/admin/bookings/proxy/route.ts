import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { brevo } from "@/lib/brevo"

const bodySchema = z.object({
  targetUserId: z.string().min(1, "targetUserId requis"),
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
      return NextResponse.json({ error: "Données invalides", details: result.error.flatten() }, { status: 422 })
    }

    const { targetUserId, date, slot } = result.data
    const reservationDate = new Date(date)

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } })
    if (!targetUser) {
      return NextResponse.json({ error: "Utilisateur cible introuvable" }, { status: 404 })
    }

    const cost = slot === "FULL" ? 2 : 1

    // Balance threshold check: credits - cost >= 0
    if (targetUser.credits - cost < 0) {
      return NextResponse.json({ error: "Solde insuffisant pour le proxy" }, { status: 403 })
    }

    // Re-check capacity
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
        return NextResponse.json({ error: `Créneau ${halfSlot} complet` }, { status: 409 })
      }
    }

    // create Reservation
    const reservation = await prisma.reservation.create({
      data: {
        userId: targetUser.id,
        date: reservationDate,
        slot,
        type: "OPENSPACE",
        status: "CONFIRMED",
        creditsCost: cost,
        isProxy: true,
        proxyAdminId: session.user.id,
      },
    })

    // debit targetUser.credits
    const updatedUser = await prisma.user.update({
      where: { id: targetUser.id },
      data: { credits: { decrement: cost } },
    })

    await prisma.transaction.create({
      data: {
        userId: targetUser.id,
        type: "DEBIT_RESERVATION",
        creditsAdd: -cost,
        creditsBefore: targetUser.credits,
      },
    })

    // Brevo email confirmation-reservation sent to the target with isProxy=true
    await brevo.sendEmail({
      template: "confirmation-reservation",
      to: targetUser.email,
      toName: `${targetUser.firstName} ${targetUser.lastName}`,
      variables: {
        slot,
        costCredits: cost,
        date,
        newBalance: updatedUser.credits,
        isProxy: "true",
      },
    })

    return NextResponse.json({ reservation, newBalance: updatedUser.credits }, { status: 201 })
  } catch (error: any) {
    console.error("Proxy error:", error)
    return NextResponse.json({ error: "Server Error" }, { status: 500 })
  }
}
