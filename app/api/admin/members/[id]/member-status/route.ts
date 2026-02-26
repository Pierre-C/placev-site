import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const memberStatusSchema = z.object({
  isMember: z.boolean(),
})

export async function PUT(
  request: Request,
  { params }: { params: { id: string } }
) {
  const session = await auth()

  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
  }

  const userId = params.id

  try {
    const body = await request.json()
    const result = memberStatusSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: "Format invalide" },
        { status: 422 }
      )
    }

    const { isMember } = result.data

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { isMember },
    })

    return NextResponse.json({
      id: updatedUser.id,
      isMember: updatedUser.isMember,
    })
  } catch (error: any) {
    console.error("Member status update error:", error)
    return NextResponse.json({ error: "Server Error" }, { status: 500 })
  }
}
