# Prompt Gemini — Slice 13 : Stripe — Achat de crédits à quantité libre

## Contexte du projet

Tu travailles sur **Place V**, un espace de coworking à Bouliac.
Stack : Next.js 14.2.5, Auth.js v5 beta, Prisma + Neon (HTTP adapter), Stripe.

Les utilisateurs ont un **segment** parmi : `BOULIACAIS`, `REDUIT`, `EXTERNE`.
Chaque segment correspond à un tarif différent, configuré dans Stripe avec
des **Price IDs fixes** (prix par crédit).

---

## Objectif de cette slice

**Remplacer les packs de crédits fixes** (1, 5, 10, 20) par un **sélecteur de
quantité libre** (défaut : 5, min : 1, max : 50). L'API Stripe doit utiliser le
**Price ID du segment** de l'utilisateur plutôt qu'un `unit_amount` calculé.

---

## Price IDs Stripe (environnement de test)

| Segment      | Price ID                              | Product ID           |
|-------------|---------------------------------------|----------------------|
| BOULIACAIS  | `price_1TBYHHEID1Nnljio4QncDIrv`     | `prod_U9s1FioEfe9buT` |
| REDUIT      | `price_1TBYHZEID1NnljiozNIqQjWv`     | `prod_U9s1r7aHEdB8Y7` |
| EXTERNE     | `price_1TBYH0EID1Nnljioy0663vTY`     | `prod_U9s1LK3UaR6i3r` |

Clé publique Stripe (test) :
`pk_test_51S5PhqEID1NnljioUd11yiKsnSjXdT90c3JlOUKfvwb7TpiX5Mri7Jr3gnvSMKYc4WhffK6eA7Won3RbGcV8yfck00l77a0jCc`

---

## Fichiers à modifier — liste exhaustive

### 1. `lib/env.ts` — Ajouter les Price IDs dans le schéma Zod

```ts
// Ajouter dans envSchema (z.object) :
STRIPE_PRICE_BOULIACAIS: z.string().optional(),
STRIPE_PRICE_REDUIT: z.string().optional(),
STRIPE_PRICE_EXTERNE: z.string().optional(),
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
```

### 2. `.env.local` — Ajouter les variables (ne pas committer)

```env
STRIPE_PRICE_BOULIACAIS=price_1TBYHHEID1Nnljio4QncDIrv
STRIPE_PRICE_REDUIT=price_1TBYHZEID1NnljiozNIqQjWv
STRIPE_PRICE_EXTERNE=price_1TBYH0EID1Nnljioy0663vTY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_51S5PhqEID1NnljioUd11yiKsnSjXdT90c3JlOUKfvwb7TpiX5Mri7Jr3gnvSMKYc4WhffK6eA7Won3RbGcV8yfck00l77a0jCc
```

---

### 3. `app/api/credits/checkout/route.ts` — Refactorer complètement

**Fichier actuel (à remplacer) :**

```ts
// ACTUEL — supprime ce fichier et réécris-le complètement
const checkoutSchema = z.object({
  creditsAmount: z.enum(["5", "10", "20"]),
})
// ... utilise SystemSetting + price_data.unit_amount
```

**Nouveau fichier :**

```ts
/**
 * app/api/credits/checkout/route.ts
 * POST /api/credits/checkout
 * Crée une session Stripe Checkout pour l'achat de N crédits.
 *
 * Auth requise — retourne 401 si non authentifié.
 * Input  : { creditsAmount: number }  — entier entre 1 et 50
 * Output : { url: string } — URL vers laquelle rediriger le client
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { stripe } from "@/lib/stripe"
import { env } from "@/lib/env"

const MIN_CREDITS = 1
const MAX_CREDITS = 50

const checkoutSchema = z.object({
  creditsAmount: z.coerce.number().int().min(MIN_CREDITS).max(MAX_CREDITS),
})

// Mapping segment → clé env var
const PRICE_ENV_KEY: Record<string, keyof typeof env> = {
  BOULIACAIS: "STRIPE_PRICE_BOULIACAIS",
  REDUIT: "STRIPE_PRICE_REDUIT",
  EXTERNE: "STRIPE_PRICE_EXTERNE",
}

export async function POST(request: NextRequest) {
  // ── Authentification ──────────────────────────────────────────────────────
  const session = await auth()
  if (!session?.user) {
    return NextResponse.json({ error: "Non authentifié" }, { status: 401 })
  }

  // ── Validation input ──────────────────────────────────────────────────────
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body JSON invalide" }, { status: 422 })
  }

  const parsed = checkoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ errors: parsed.error.issues }, { status: 422 })
  }

  const credits = parsed.data.creditsAmount

  // ── Price ID Stripe selon le segment ─────────────────────────────────────
  const segment = session.user.segment ?? "EXTERNE"
  const envKey = PRICE_ENV_KEY[segment]
  const priceId = envKey ? env[envKey] : undefined

  if (!priceId) {
    return NextResponse.json(
      { error: `Price ID non configuré pour le segment ${segment}` },
      { status: 500 }
    )
  }

  // ── Création session Stripe ────────────────────────────────────────────────
  const baseUrl = env.NEXTAUTH_URL ?? "http://localhost:3000"

  const checkoutSession = await stripe.checkout.sessions.create({
    line_items: [
      {
        price: priceId,
        quantity: credits,
      },
    ],
    mode: "payment",
    success_url: `${baseUrl}/dashboard?payment=success`,
    cancel_url: `${baseUrl}/dashboard?payment=cancelled`,
    metadata: {
      userId: session.user.id,
      creditsAmount: String(credits),
    },
  })

  return NextResponse.json({ url: checkoutSession.url })
}
```

> **Note importante** : Le webhook `POST /api/webhooks/stripe/route.ts` reste
> **inchangé** — il lit déjà `metadata.creditsAmount` et incrémente les crédits.

---

### 4. `app/(app)/dashboard/CreditQuantitySelector.tsx` — Créer (nouveau fichier)

```tsx
/**
 * app/(app)/dashboard/CreditQuantitySelector.tsx
 * Sélecteur de quantité libre de crédits — Client Component.
 * Remplace les packs fixes.
 */

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

const MIN_CREDITS = 1
const MAX_CREDITS = 50
const DEFAULT_CREDITS = 5

interface Props {
  pricePerCredit: number  // en centimes, pour affichage uniquement
}

export function CreditQuantitySelector({ pricePerCredit }: Props) {
  const router = useRouter()
  const [quantity, setQuantity] = useState(DEFAULT_CREDITS)
  const [loading, setLoading] = useState(false)

  const totalCents = quantity * pricePerCredit
  const totalDisplay =
    totalCents % 100 === 0
      ? `${totalCents / 100} €`
      : `${(totalCents / 100).toFixed(2).replace(".", ",")} €`

  const pricePerCreditDisplay =
    pricePerCredit % 100 === 0
      ? `${pricePerCredit / 100} €/crédit`
      : `${(pricePerCredit / 100).toFixed(2).replace(".", ",")} €/crédit`

  const handleBuy = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/credits/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ creditsAmount: quantity }),
      })
      if (res.ok) {
        const { url } = await res.json()
        router.push(url)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      data-testid="credit-quantity-section"
      className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100 max-w-sm"
    >
      <p className="text-sm text-neutral-500 mb-1">{pricePerCreditDisplay}</p>

      {/* Contrôles quantité */}
      <div className="flex items-center gap-4 my-4">
        <button
          data-testid="credit-quantity-minus"
          onClick={() => setQuantity((q) => Math.max(MIN_CREDITS, q - 1))}
          disabled={quantity <= MIN_CREDITS}
          className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-700 font-bold text-xl
                     hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed
                     flex items-center justify-center"
          aria-label="Diminuer la quantité"
        >
          −
        </button>

        <div className="text-center min-w-[80px]">
          <p
            data-testid="credit-quantity-display"
            className="text-3xl font-bold text-neutral-900"
          >
            {quantity}
          </p>
          <p className="text-xs text-neutral-500">crédit{quantity > 1 ? "s" : ""}</p>
        </div>

        <button
          data-testid="credit-quantity-plus"
          onClick={() => setQuantity((q) => Math.min(MAX_CREDITS, q + 1))}
          disabled={quantity >= MAX_CREDITS}
          className="w-10 h-10 rounded-full bg-neutral-100 text-neutral-700 font-bold text-xl
                     hover:bg-neutral-200 disabled:opacity-30 disabled:cursor-not-allowed
                     flex items-center justify-center"
          aria-label="Augmenter la quantité"
        >
          +
        </button>
      </div>

      {/* Prix total */}
      <p
        data-testid="credit-quantity-price"
        className="text-2xl font-semibold text-neutral-800 mb-5"
      >
        {totalDisplay}
      </p>

      {/* Bouton Acheter */}
      <button
        data-testid="credit-quantity-buy-btn"
        onClick={handleBuy}
        disabled={loading}
        className="w-full py-3 bg-neutral-900 text-white rounded-xl text-sm font-semibold
                   hover:bg-neutral-800 disabled:opacity-50 transition"
      >
        {loading ? "Redirection..." : "Acheter"}
      </button>
    </div>
  )
}
```

---

### 5. `app/(app)/dashboard/CreditPackSection.tsx` → renommer en `CreditQuantitySection.tsx`

Remplace complètement le fichier `CreditPackSection.tsx` par :

```tsx
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
```

> **Note** : Après avoir créé `CreditQuantitySection.tsx`, supprimer (ou vider)
> `CreditPackSection.tsx` pour éviter les conflits d'import.

---

### 6. `app/(app)/dashboard/page.tsx` — Mettre à jour l'import

Dans `page.tsx`, remplacer :

```ts
// AVANT
import { CreditPackSection } from "./CreditPackSection"
// ...
<CreditPackSection segment={user.segment} />
```

par :

```ts
// APRÈS
import { CreditQuantitySection } from "./CreditQuantitySection"
// ...
<CreditQuantitySection segment={user.segment} />
```

---

## Fichiers à NE PAS modifier

| Fichier | Raison |
|---|---|
| `app/api/webhooks/stripe/route.ts` | Fonctionne déjà avec `metadata.creditsAmount` |
| `lib/stripe.ts` | Singleton inchangé |
| `lib/stripe-mock.ts` | Mock inchangé |
| `lib/services/credits.ts` | Services inchangés |
| `app/api/stripe-mock/checkout/route.ts` | Mock inchangé |
| `app/api/stripe-mock/confirm-payment/route.ts` | Mock inchangé |
| `app/(app)/dashboard/CreditPackButton.tsx` | Peut être conservé (non utilisé) |
| `prisma/schema.prisma` | Aucun changement de schéma requis |

---

## data-testid requis (utilisés dans les tests E2E)

| data-testid | Composant | Description |
|---|---|---|
| `credit-quantity-section` | CreditQuantitySelector | Conteneur principal |
| `credit-quantity-minus` | CreditQuantitySelector | Bouton décrémentation |
| `credit-quantity-plus` | CreditQuantitySelector | Bouton incrémentation |
| `credit-quantity-display` | CreditQuantitySelector | Affichage quantité courante |
| `credit-quantity-price` | CreditQuantitySelector | Affichage prix total |
| `credit-quantity-buy-btn` | CreditQuantitySelector | Bouton d'achat |

---

## Logique de validation (contrat API)

```
POST /api/credits/checkout
Body : { creditsAmount: number | string }  ← z.coerce.number() accepte les deux

Réponses :
  200 { url: string }          → session Stripe créée, rediriger le client
  401 { error: string }        → non authentifié
  422 { errors: [...] }        → hors bornes [1–50], non-entier, absent
  500 { error: string }        → STRIPE_PRICE_{segment} absent des env vars
```

---

## Mapping Price ID (logique serveur)

```ts
const PRICE_MAP = {
  BOULIACAIS: env.STRIPE_PRICE_BOULIACAIS,  // price_1TBYHHEID1Nnljio4QncDIrv
  REDUIT:     env.STRIPE_PRICE_REDUIT,      // price_1TBYHZEID1NnljiozNIqQjWv
  EXTERNE:    env.STRIPE_PRICE_EXTERNE,     // price_1TBYH0EID1Nnljioy0663vTY
}

// La session Stripe utilise price (pas price_data) :
stripe.checkout.sessions.create({
  line_items: [{ price: PRICE_MAP[segment], quantity: credits }],
  mode: "payment",
  ...
})
```

---

## Ordre d'implémentation recommandé

1. `lib/env.ts` — ajouter les 4 nouvelles clés Zod
2. `.env.local` — ajouter les valeurs réelles
3. `app/api/credits/checkout/route.ts` — réécrire selon le template ci-dessus
4. `app/(app)/dashboard/CreditQuantitySelector.tsx` — créer
5. `app/(app)/dashboard/CreditPackSection.tsx` → `CreditQuantitySection.tsx` — renommer/réécrire
6. `app/(app)/dashboard/page.tsx` — mettre à jour l'import

## Vérification finale

```bash
# Tests HTTP (doivent passer)
npx vitest run __tests__/api/slice-13-stripe.http.test.ts

# Tests E2E (serveur lancé + STRIPE_MOCK=true)
npx playwright test e2e/slice-13-stripe.spec.ts
```
