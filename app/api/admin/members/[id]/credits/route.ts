import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { z } from "zod"

const updateCreditsSchema = z.object({
  delta: z.number(),
  description: z.string().min(1, "La description est requise"),
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
    const result = updateCreditsSchema.safeParse(body)

    if (!result.success) {
      return NextResponse.json(
        { error: result.error.issues?.[0]?.message || "Données invalides" },
        { status: 422 }
      )
    }

    const { delta, description } = result.data

    const updatedUser = await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId },
      })

      if (!user) {
        throw new Error("Utilisateur non trouvé")
      }

      const newUser = await tx.user.update({
        where: { id: userId },
        data: {
          credits: { increment: delta },
        },
      })

      await tx.transaction.create({
        data: {
          userId: userId,
          type: "MANUAL_ADJUSTMENT",
          creditsAdd: delta,
          creditsBefore: user.credits,
          // stripeId is null for manual adjustment
        },
      })

      return newUser
    })

    return NextResponse.json({
      id: updatedUser.id,
      credits: updatedUser.credits,
    })
  } catch (error: any) {
    console.error("Credit update error:", error)
    if (error.message === "Utilisateur non trouvé") {
      return NextResponse.json({ error: error.message }, { status: 404 })
    }
    return NextResponse.json({ error: "Server Error" }, { status: 500 })
  }
}
