import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import AdminNav from "./AdminNav"

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) redirect("/login")
  if (session.user.role !== "ADMIN") redirect("/dashboard")

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-3xl font-bold text-neutral-900">Administration</h1>

      <AdminNav />

      <div className="mt-8">
        {children}
      </div>
    </div>
  )
}
