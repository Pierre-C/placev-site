import { NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

const bodySchema = z.object({
  value: z.number().int().min(1, "La capacitÃ© doit Ãªtre d'au moins 1"),
})

export async function PUT(request: Request) {
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

    const { value } = result.data

    const setting = await prisma.systemSetting.upsert({
      where: { key: "DESK_CAPACITY" },
      update: { value: value.toString() },
      create: { key: "DESK_CAPACITY", value: value.toString() },
    })

    return NextResponse.json({ key: setting.key, value: parseInt(setting.value, 10) })
  } catch (error: any) {
    console.error("Capacity setting error:", error)
    return NextResponse.json({ error: "Server Error" }, { status: 500 })
  }
}
