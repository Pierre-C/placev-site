import { prisma } from "@/lib/prisma"
import { MeetingRoomForm } from "./MeetingRoomForm"

export default async function MeetingRoomQuotePage() {
  const openDaysSetting = await prisma.systemSetting.findUnique({
    where: { key: "OPEN_DAYS" },
  })
  
  const openDays = openDaysSetting
    ? openDaysSetting.value.split(",").map(Number)
    : [1, 2, 3, 4, 5]

  return (
    <div className="container max-w-2xl mx-auto py-12 px-4">
      <h1 className="text-3xl font-bold mb-2">Réserver la salle de réunion</h1>
      <p className="text-gray-600 mb-8">Nous reviendrons vers vous avec un devis sous 24h.</p>
      <MeetingRoomForm openDays={openDays} />
    </div>
  )
}
