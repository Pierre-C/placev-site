// components/sections/_parts.tsx
import { LucideIcon } from 'lucide-react'

export function Badge({ icon: Icon, children }: { icon: LucideIcon, children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full bg-black/5 px-3 py-1 text-sm">
      <Icon className="h-4 w-4" />
      <span>{children}</span>
    </div>
  )
}
