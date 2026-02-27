import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

export async function GET(request: Request) {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    return new NextResponse("Unauthorized", { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const from = searchParams.get("from")
    const to = searchParams.get("to")
    const status = searchParams.get("status")

    const where: any = {
      type: "OPENSPACE",
    }

    if (from || to) {
      where.date = {}
      if (from) where.date.gte = new Date(from)
      if (to) where.date.lte = new Date(to)
    }

    if (status) {
      where.status = status
    }

    const reservations = await prisma.reservation.findMany({
      where,
      include: {
        user: true,
      },
      orderBy: {
        date: "desc",
      },
    })

    const csvHeaders = "date,slot,name,email,segment,costCredits,status,isProxy\\n"
    
    const csvRows = reservations.map((r) => {
      const date = r.date.toISOString().slice(0, 10)
      const slot = r.slot
      const name = r.user?.name ? `"${r.user.name.replace(/"/g, '""')}"` : ""
      const email = r.user?.email ? `"${r.user.email.replace(/"/g, '""')}"` : ""
      const segment = r.user?.segment || ""
      const costCredits = r.creditsCost ?? 0
      const resStatus = r.status
      const isProxy = r.isProxy ? "true" : "false"

      return `${date},${slot},${name},${email},${segment},${costCredits},${resStatus},${isProxy}`
    }).join("\\n")

    const csvContent = csvHeaders + csvRows

    const response = new NextResponse(csvContent)
    response.headers.set("Content-Type", "text/csv; charset=utf-8")
    response.headers.set("Content-Disposition", 'attachment; filename="reservations.csv"')

    return response
  } catch (error: any) {
    console.error("Export error:", error)
    return new NextResponse("Server Error", { status: 500 })
  }
}
