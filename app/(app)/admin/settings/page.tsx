import { prisma } from "@/lib/prisma"
import ClosedDatesModal from "./ClosedDatesModal"
import GlobalSettingsForm from "./GlobalSettingsForm"

export default async function SettingsPage() {
  const closedDates = await prisma.closedDate.findMany()
  const systemSettings = await prisma.systemSetting.findMany()

  return (
    <div>
      <h2 className="text-2xl font-bold">Paramètres</h2>
      <div className="mt-8">
        <h3 className="text-xl font-bold">Dates de fermeture</h3>
        <div className="mt-4">
          <ClosedDatesModal closedDates={closedDates} />
        </div>
      </div>
      <GlobalSettingsForm settings={systemSettings} />
    </div>
  )
}
