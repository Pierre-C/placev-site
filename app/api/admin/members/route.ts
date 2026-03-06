import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { shouldShowMemberAlert } from "@/lib/services/admin"

export async function GET() {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      credits: true,
      isMember: true,
      deletionRequestedAt: true,
      transactions: {
        where: { 
          creditsAdd: { gt: 0 },
          type: { not: "REFUND_CANCELLATION" }
        },
        select: { creditsAdd: true },
      },
      _count: {
        select: {
          reservations: {
            where: {
              type: "OPENSPACE",
              status: "CONFIRMED",
            },
          },
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  })

  const members = users.map((user) => {
    const reservationCount = user._count.reservations
    const lifetimeCredits = user.transactions?.reduce((acc, tx) => acc + tx.creditsAdd, 0) ?? 0
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      credits: user.credits,
      isMember: user.isMember,
      deletionRequestedAt: user.deletionRequestedAt,
      reservationCount,
      lifetimeCredits,
      alertFlag: shouldShowMemberAlert({
        isMember: user.isMember,
        reservationCount,
      }),
    }
  })

  return NextResponse.json(members)
}
