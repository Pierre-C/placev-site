import { prisma } from "@/lib/prisma"
import MembersTable from "./MembersTable"

export default async function AdminDashboardPage() {
  const users = await prisma.user.findMany()

  return (
    <div>
      <h2 className="text-2xl font-bold">Gestion des membres</h2>
      <MembersTable users={users} />
    </div>
  )
}
