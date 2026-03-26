/**
 * app/(app)/dashboard/CreditQuantitySection.tsx
 * Section "Recharger des crédits" — Server Component.
 * Récupère le prix affiché depuis SystemSetting et délègue l'interactivité
 * à CreditQuantitySelector (Client Component).
 */

import { prisma } from "@/lib/prisma"
import { CreditQuantitySelector } from "./CreditQuantitySelector"
import { CreditPackCard } from "./CreditPackCard"

const PACKS = [
  { label: "Carte 5 journées",  credits: 10 },
  { label: "Carte 10 journées", credits: 20 },
  { label: "Carte 15 journées", credits: 30 },
  { label: "Carte 20 journées", credits: 40 },
  { label: "Carte 30 journées", credits: 60 },
]

interface Props {
  segment: string
}

export async function CreditQuantitySection({ segment }: Props) {
  const setting = await prisma.systemSetting.findUnique({
    where: { key: `PRICE_CREDIT_${segment}` },
  })

  // Fallback 800 centimes (8€) si le setting n'est pas encore configuré
  const pricePerCredit = setting ? parseInt(setting.value, 10) : 800

  const priceDisplay =
    pricePerCredit % 100 === 0
      ? `${pricePerCredit / 100}€`
      : `${(pricePerCredit / 100).toFixed(2).replace(".", ",")}€`

  return (
    <section className="mb-6">
      <h2 className="mb-1 text-lg font-semibold text-neutral-900">
        Recharger des crédits
      </h2>
      <p className="mb-4 text-sm text-neutral-600">
        1 crédit de {priceDisplay} = 1/2 journée de coworking.
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <CreditQuantitySelector pricePerCredit={pricePerCredit} />
        {PACKS.map((pack) => (
          <CreditPackCard
            key={pack.label}
            label={pack.label}
            credits={pack.credits}
            pricePerCredit={pricePerCredit}
          />
        ))}
      </div>
      <p className="mt-3 text-xs text-neutral-500">
        Si votre statut a changé (demandeur d&apos;emploi, résident à Bouliac),{" "}
        <a
          href="mailto:admin@placev.fr"
          className="underline hover:text-neutral-700"
        >
          contacter les admins
        </a>{" "}
        pour adapter votre tarif.
      </p>
    </section>
  )
}
