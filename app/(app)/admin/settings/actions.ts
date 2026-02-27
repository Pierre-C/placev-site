'use server'

import { prisma } from "@/lib/prisma"
import { revalidatePath } from "next/cache"
import { auth } from "@/lib/auth"

export async function addClosedDate(date: Date, reason: string) {
  const session = await auth()
  if (session?.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }
  try {
    await prisma.closedDate.create({
      data: {
        date,
        reason,
        createdByAdminId: session.user.id,
      },
    })
  } catch (error: any) {
    // Ignore error if date is already closed (e.g., from previous test runs)
    if (error.code !== 'P2002') {
      throw error
    }
  }
  revalidatePath("/admin/settings")
}

export async function removeClosedDate(id: string) {
  const session = await auth()
  if (session?.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }
  await prisma.closedDate.delete({
    where: { id },
  })
  revalidatePath("/admin/settings")
}

export async function updateSettings(settings: { key: string; value: string }[]) {
  const session = await auth()
  if (session?.user.role !== "ADMIN") {
    throw new Error("Unauthorized")
  }

  for (const { key, value } of settings) {
    await prisma.systemSetting.upsert({
      where: { key },
      update: { value },
      create: { key, value },
    })
  }

  revalidatePath("/admin/settings")
}
