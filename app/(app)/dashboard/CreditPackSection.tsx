/**
 * app/(app)/dashboard/CreditPackSection.tsx
 * Section "Recharger des crédits" — Server Component.
 * Récupère les prix depuis SystemSetting et affiche les 3 packs.
 */

import { prisma } from "@/lib/prisma"
import { CreditPackButton } from "./CreditPackButton"

const PACKS: Array<{ credits: "5" | "10" | "20" }> = [
  { credits: "5" },
  { credits: "10" },
  { credits: "20" },
]

interface Props {
  segment: string
}

export async function CreditPackSection({ segment }: Props) {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: `PRICE_CREDIT_${segment}` },
  })

  const pricePerCredit = setting ? parseInt(setting.value, 10) : 800

  return (
    <section className="mb-6">
      <h2 className="mb-3 text-lg font-semibold text-neutral-900">
        Recharger des crédits
      </h2>
      <div
        className="grid grid-cols-1 gap-3 sm:grid-cols-3"
        data-testid="credit-packs"
      >
        {PACKS.map(({ credits }) => {
          const totalCents = parseInt(credits) * pricePerCredit
          const euros = (totalCents / 100).toFixed(0)
          const centsRemainder = totalCents % 100

          return (
            <div
              key={credits}
              className="rounded-2xl bg-white p-5 shadow-sm ring-1 ring-neutral-100"
              data-testid={`credit-pack-${credits}`}
            >
              <p className="text-2xl font-bold text-neutral-900">{credits}</p>
              <p className="text-sm text-neutral-500">crédits</p>
              <p
                className="mt-2 text-lg font-semibold text-neutral-700"
                data-testid={`pack-price-${credits}`}
              >
                {centsRemainder === 0
                  ? `${euros} €`
                  : `${(totalCents / 100).toFixed(2).replace(".", ",")} €`}
              </p>
              <p className="text-xs text-neutral-400">
                {(pricePerCredit / 100).toFixed(centsRemainder === 0 ? 0 : 2).replace(".", ",")} €/crédit
              </p>
              <CreditPackButton
                creditsAmount={credits}
                label="Acheter"
              />
            </div>
          )
        })}
      </div>
    </section>
  )
}
