/**
 * app/(app)/dashboard/CreditQuantitySection.tsx
 * Section "Recharger des crédits" — Server Component.
 * Récupère le prix affiché depuis SystemSetting et délègue l'interactivité
 * à CreditQuantitySelector (Client Component).
 */

import { prisma } from "@/lib/prisma"
import { CreditQuantitySelector } from "./CreditQuantitySelector"

interface Props {
  segment: string
}

export async function CreditQuantitySection({ segment }: Props) {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: `PRICE_CREDIT_${segment}` },
  })

  // Fallback 800 centimes (8€) si le setting n'est pas encore configuré
  const pricePerCredit = setting ? parseInt(setting.value, 10) : 800

  return (
    <section className="mb-6">
      <h2 className="mb-3 text-lg font-semibold text-neutral-900">
        Recharger des crédits
      </h2>
      <CreditQuantitySelector pricePerCredit={pricePerCredit} />
    </section>
  )
}
