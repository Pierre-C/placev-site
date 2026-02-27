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
      return NextResponse.json({ error: "DonnÃ©es invalides", details: result.error.flatten() }, { status: 422 })
    }

    const { targetUserId, date, slot } = result.data
    const reservationDate = new Date(date)

    const targetUser = await prisma.user.findUnique({ where: { id: targetUserId } })
    if (!targetUser) {
      return NextResponse.json({ error: "Utilisateur cible introuvable" }, { status: 404 })
    }

    const cost = slot === "FULL" ? 2 : 1
    
    // Balance threshold check: credits - cost >= -3
    if (targetUser.credits - cost < -3) {
      return NextResponse.json({ error: "Solde insuffisant pour le proxy (-3 max)" }, { status: 403 })
    }

    // Atomic $transaction
    const txResult = await prisma.$transaction(async (tx) => {
      // Re-check capacity
      const capacitySetting = await tx.systemSetting.findUnique({ where: { key: "DESK_CAPACITY" } })
      const capacity = capacitySetting ? parseInt(capacitySetting.value, 10) : 15

      const slotsToCheck = slot === "FULL" ? (["AM", "PM"] as const) : ([slot] as const)
      for (const halfSlot of slotsToCheck) {
        const conflictingSlots = halfSlot === "AM" ? { in: ["AM", "FULL"] as const } : { in: ["PM", "FULL"] as const }
        const count = await tx.reservation.count({
          where: {
            date: reservationDate,
            status: "CONFIRMED",
            type: "OPENSPACE",
            slot: conflictingSlots,
          },
        })
        if (count >= capacity) {
          throw new Error(`CrÃ©neau ${halfSlot} complet`)
        }
      }

      // create Reservation
      const reservation = await tx.reservation.create({
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
      const updatedUser = await tx.user.update({
        where: { id: targetUser.id },
        data: { credits: { decrement: cost } },
      })

      await tx.transaction.create({
        data: {
          userId: targetUser.id,
          type: "DEBIT_RESERVATION",
          creditsAdd: -cost,
          creditsBefore: targetUser.credits,
        },
      })

      return { reservation, updatedUser }
    })

    // Brevo email confirmation-reservation sent to the target with isProxy=true
    await brevo.sendEmail({
      template: "confirmation-reservation",
      to: targetUser.email,
      toName: targetUser.name ?? undefined,
      variables: {
        slot,
        costCredits: cost,
        date,
        newBalance: txResult.updatedUser.credits,
        isProxy: true,
      },
    })

    return NextResponse.json({ reservation: txResult.reservation, newBalance: txResult.updatedUser.credits }, { status: 201 })
  } catch (error: any) {
    if (error.message.includes("complet")) {
      return NextResponse.json({ error: error.message }, { status: 409 })
    }
    console.error("Proxy error:", error)
    return NextResponse.json({ error: "Server Error" }, { status: 500 })
  }
}
