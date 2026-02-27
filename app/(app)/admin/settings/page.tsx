import { prisma } from "@/lib/prisma"
import AddClosedDateForm from "./AddClosedDateForm"
import ClosedDatesList from "./ClosedDatesList"
import GlobalSettingsForm from "./GlobalSettingsForm"

export default async function SettingsPage() {
  const closedDates = await prisma.closedDate.findMany()
  const systemSettings = await prisma.systemSetting.findMany()

  return (
    <div>
      <h2 className="text-2xl font-bold">Paramètres</h2>
      <div className="mt-8">
        <h3 className="text-xl font-bold">Dates de fermeture</h3>
        <AddClosedDateForm />
        <ClosedDatesList closedDates={closedDates} />
      </div>
      <GlobalSettingsForm settings={systemSettings} />
    </div>
  )
}
