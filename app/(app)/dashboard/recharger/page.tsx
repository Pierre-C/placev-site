import { Suspense } from "react"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CreditPackSection } from "../CreditPackSection"
import { PaymentStatusBanner } from "../PaymentStatusBanner"

export default async function RechargerPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (session.user.role === "ADMIN") redirect("/admin")

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { segment: true },
  })
  if (!user) redirect("/login")

  return (
    <div>
      <Suspense fallback={null}>
        <PaymentStatusBanner />
      </Suspense>
      <CreditPackSection segment={user.segment} />
    </div>
  )
}
