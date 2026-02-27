import { prisma } from "@/lib/prisma"
import AdminCalendar from "./AdminCalendar"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"

export default async function AdminCalendarPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") {
    redirect("/login")
  }

  const [capacitySetting, openDaysSetting] = await Promise.all([
    prisma.systemSetting.findUnique({ where: { key: "DESK_CAPACITY" } }),
    prisma.systemSetting.findUnique({ where: { key: "OPEN_DAYS" } }),
  ])

  const capacity = capacitySetting ? parseInt(capacitySetting.value, 10) : 15
  const openDaysStr = openDaysSetting?.value ?? "1,2,3"
  const openDays = openDaysStr.split(",").map(Number)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Calendrier Coworking</h2>
      <AdminCalendar capacity={capacity} openDays={openDays} />
    </div>
  )
}
