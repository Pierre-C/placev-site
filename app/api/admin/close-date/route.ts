import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { brevo } from "@/lib/brevo"

const bodySchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Format YYYY-MM-DD requis"),
  reason: z.string().optional(),
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

    const { date, reason } = result.data
    const targetDate = new Date(date)

    // Check if date is past
    const today = new Date()
    today.setUTCHours(0, 0, 0, 0)
    if (targetDate < today) {
        return NextResponse.json({ error: "Cannot close a past date" }, { status: 422 })
    }

    // 1. Identify CONFIRMED DESK reservations beforehand since we cannot use interactive transactions
    const reservations = await prisma.reservation.findMany({
      where: {
        date: targetDate,
        status: "CONFIRMED",
        type: "OPENSPACE",
      },
      include: {
        user: true,
      },
    }) || []

    const cancelledReservations = []
    const operations: any[] = []

    // 2. Create ClosedDate
    operations.push(prisma.closedDate.create({
      data: {
        date: targetDate,
        reason,
        createdByAdminId: session.user.id,
      },
    }))

    // 3. For each reservation: status=CANCELLED, user.credits += costCredits, Transaction(CANCELLATION_REFUND)
    for (const res of reservations) {
      const cost = res.creditsCost ?? 0
      
      operations.push(prisma.reservation.update({
        where: { id: res.id },
        data: { status: "CANCELLED", cancelledAt: new Date() },
      }))

      if (res.userId && cost > 0 && res.user) {
        operations.push(prisma.user.update({
          where: { id: res.userId },
          data: { credits: { increment: cost } },
        }))

        operations.push(prisma.transaction.create({
          data: {
            userId: res.userId,
            type: "REFUND_CANCELLATION",
            creditsAdd: cost,
            creditsBefore: res.user.credits,
          },
        }))
      }
      cancelledReservations.push(res)
    }

    // 4. Create Reservation(type=ORGANIZATION) to block the slot
    operations.push(prisma.reservation.create({
      data: {
        userId: null,
        date: targetDate,
        slot: "FULL",
        type: "ORGANIZATION",
        status: "CONFIRMED",
        creditsCost: null,
        label: reason || "Fermeture exceptionnelle",
      },
    }))

    // Execute all operations sequentially because interactive transactions are not supported in HTTP mode
    for (const op of operations) {
      await prisma.$transaction([op])
    }

    const closedDate = { date: targetDate, reason }

    // IMPORTANT: Brevo emails annulation-par-admin sent AFTER the transaction succeeds. Send N emails.
    for (const res of cancelledReservations) {
      if (res.user && res.user.email) {
        try {
          await brevo.sendEmail({
            template: "annulation-par-admin",
            to: res.user.email,
            toName: res.user.name ?? undefined,
            variables: {
              date,
              slot: res.slot,
              reason: reason || "Fermeture exceptionnelle",
              refundedCredits: res.creditsCost ?? 0,
            },
          })
        } catch (error) {
          console.error(`Failed to send 'annulation-par-admin' email to ${res.user.email}:`, error)
        }
      }
    }

    return NextResponse.json({ success: true, closedDate, cancelledCount: cancelledReservations.length }, { status: 200 })
  } catch (error: any) {
    console.error("Close date error:", error)
    if (error.code === 'P2002') {
      return NextResponse.json({ error: "Date dÃ©jÃ  fermÃ©e" }, { status: 409 })
    }
    return NextResponse.json({ error: "Server Error" }, { status: 500 })
  }
}
