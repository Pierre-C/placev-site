import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    const { id } = params

    const reservation = await prisma.reservation.findUnique({
      where: { id },
    })

    if (!reservation) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    if (reservation.status === "CANCELLED") {
      return NextResponse.json({ error: "Déjà annulé" }, { status: 409 })
    }

    if (reservation.status === "CONFIRMED") {
      return NextResponse.json({ error: "Impossible d'annuler une réservation confirmée" }, { status: 409 })
    }

    const updatedReservation = await prisma.reservation.update({
      where: { id },
      data: { 
        status: "CANCELLED",
        cancelledAt: new Date(),
      },
    })

    return NextResponse.json({
      reservation: {
        id: updatedReservation.id,
        status: updatedReservation.status,
        date: updatedReservation.date,
        companyName: updatedReservation.companyName,
      }
    }, { status: 200 })
  } catch (error) {
    console.error("Cancel quote error:", error)
    return NextResponse.json({ error: "Server Error" }, { status: 500 })
  }
}
