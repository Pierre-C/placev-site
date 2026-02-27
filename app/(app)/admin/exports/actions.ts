"use server"

import { prisma } from "@/lib/prisma"
import Papa from "papaparse"

export async function exportMembers() {
  const users = await prisma.user.findMany()
  const csv = Papa.unparse(users)
  return csv
}

export async function exportBookings() {
  const bookings = await prisma.reservation.findMany({
    include: {
      user: true,
    },
  })
  const csv = Papa.unparse(bookings)
  return csv
}
