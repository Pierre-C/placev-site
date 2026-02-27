"use server"

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

export async function updateCredits(userId: string, delta: number, reason: string) {
  const session = await auth()
  if (session?.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  const user = await prisma.user.findUnique({ where: { id: userId } })
  if (!user) {
    throw new Error("User not found")
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      credits: {
        increment: delta,
      },
    },
  })

  await prisma.transaction.create({
    data: {
      userId,
      creditsAdd: delta,
      creditsBefore: user.credits,
      type: "MANUAL_ADJUSTMENT",
      // We could store the reason somewhere, maybe in a new field on Transaction
    },
  })

  revalidatePath("/admin")
}

export async function toggleMember(userId: string, isMember: boolean) {
  const session = await auth()
  if (session?.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  await prisma.user.update({
    where: { id: userId },
    data: { isMember },
  })
  revalidatePath("/admin")
}
