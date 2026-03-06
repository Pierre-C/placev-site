import { prisma } from "@/lib/prisma"
import MembersTable from "./MembersTable"

export default async function AdminDashboardPage() {
  const rawUsers = await prisma.user.findMany({
    include: {
      transactions: {
        where: { creditsAdd: { gt: 0 }, type: { not: "REFUND_CANCELLATION" } },
        select: { creditsAdd: true },
      },
    },
    orderBy: { createdAt: "desc" },
  })

  const users = rawUsers.map(({ transactions, ...u }) => ({
    ...u,
    lifetimeCredits: transactions.reduce((sum, t) => sum + t.creditsAdd, 0),
  }))

  return (
    <div>
      <h2 className="text-2xl font-bold">Membres</h2>
      <MembersTable users={users} />
    </div>
  )
}
