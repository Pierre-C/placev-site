# CLAUDE.md — Place V Booking Module

> Ce fichier est lu automatiquement par Claude Code à chaque session.
> Ne pas le modifier sans valider les changements avec l'équipe.

---

## 1. Contexte du projet

Place V est un espace de coworking à Bouliac (33). Ce repo contient :
- **Le site vitrine existant** (Next.js 14, App Router, Tailwind, Brevo) — ne pas toucher sauf intégration UI
- **Le module de réservation** (en cours de développement) — routes sous `/(app)`

L'objectif est de remplacer un suivi Excel manuel par une plateforme web complète gérant les crédits, les réservations et l'administration des membres.

---

## 2. Stack technique — FIGÉE, ne pas proposer d'alternative

| Couche | Techno | Notes |
|---|---|---|
| Framework | Next.js 14+ App Router | Server Components par défaut |
| Base de données | Neon (Serverless Postgres) | Branche `develop` en local ET preview |
| ORM | Prisma | Typage strict bout en bout |
| Auth | Auth.js v5 | Credentials Email/Password |
| Paiement | Stripe SDK + Webhooks | Mocké en local (STRIPE_MOCK=true) |
| Mailing | Brevo API | Mocké en local (BREVO_MOCK=true) |
| UI | Shadcn/UI + Tailwind + Framer Motion | Cohérence avec le site vitrine |
| Tests unitaires | Vitest | |
| Tests E2E | Playwright | |
| Validation | Zod | Toutes les entrées API et Server Actions |

---

## 3. Environnements — RÈGLE ABSOLUE

```
Local (dev)   →  Neon branche develop  +  STRIPE_MOCK=true  +  BREVO_MOCK=true
Preview       →  Neon branche develop  +  STRIPE_MOCK=true  +  BREVO_MOCK=true
Production    →  Neon branche main     +  Stripe live       +  Brevo réel
```

**Il n'y a pas de base de données locale (pas de Docker, pas de SQLite).
On utilise directement la branche Neon `develop` en local.**

### Variables .env.local minimales pour démarrer

```bash
DATABASE_URL="postgresql://neondb_owner:...@...neon.tech/neondb?sslmode=require"
NEXTAUTH_SECRET=""        # openssl rand -base64 32
NEXTAUTH_URL="http://localhost:3000"
STRIPE_MOCK="true"
NEXT_PUBLIC_STRIPE_MOCK="true"
BREVO_MOCK="true"
```

### Variables Vercel par contexte

| Variable | Production | Preview |
|---|---|---|
| `DATABASE_URL` | Neon branche `main` | Neon branche `develop` |
| `STRIPE_MOCK` | `false` | `true` |
| `NEXT_PUBLIC_STRIPE_MOCK` | `false` | `true` |
| `STRIPE_SECRET_KEY` | `sk_live_...` | non requis |
| `STRIPE_WEBHOOK_SECRET` | `whsec_live_...` | non requis |
| `BREVO_MOCK` | `false` | `true` |
| `BREVO_API_KEY` | clé réelle | non requis |

### Migrations Prisma

```bash
# En dev local → sur la branche Neon develop
npx prisma migrate dev --name <description>

# En CI/CD (Vercel build command)
npx prisma migrate deploy && next build
```

**Ne jamais lancer `prisma migrate dev` sur la branche Neon `main`.**

---

## 4. Stratégie des mocks — Stripe et Brevo

### Pourquoi mocker

Stripe et Brevo sont des services externes. En phase de développement, ni le compte Stripe ni les templates Brevo ne sont configurés. Les mocks permettent de développer et tester les 5 Slices sans aucune dépendance externe.

### Architecture

Chaque service a un singleton (`lib/stripe.ts`, `lib/brevo.ts`) qui bascule automatiquement selon la variable d'environnement. **Le code applicatif ne change jamais — seule la variable contrôle le comportement.**

```
STRIPE_MOCK=true  →  lib/stripe-mock.ts   (faux client, webhook auto-déclenché)
STRIPE_MOCK=false →  vrai SDK Stripe

BREVO_MOCK=true   →  lib/brevo-mock.ts    (log console + mockEmailLog[])
BREVO_MOCK=false  →  vrai appel API Brevo
```

### Stripe — flux mock

**Crédits (Slice 2) :**
1. `POST /api/credits/checkout` → `mockStripe.checkout.sessions.create()`
2. Retourne URL locale `/api/stripe-mock/checkout?session_id=cs_mock_...`
3. Cette page déclenche le webhook mock automatiquement
4. Crédits mis à jour en DB → redirect `/dashboard?payment=success`

**Salle de réunion (Slice 4) :**
1. `POST /api/booking/meeting-room` → `mockStripe.paymentIntents.create()`
2. Retourne `{ reservationId, clientSecret: "pi_mock_..._secret_mock" }`
3. UI affiche bouton "Simuler le paiement" (si `NEXT_PUBLIC_STRIPE_MOCK=true`)
4. Ce bouton appelle `POST /api/stripe-mock/confirm-payment`
5. Webhook mock déclenché → `Reservation.status = CONFIRMED`

### Brevo — comportement mock

En mode `BREVO_MOCK=true`, chaque email est :
- **Loggé en console** avec template, destinataire et variables
- **Stocké dans `mockEmailLog[]`** pour les assertions de test
- **Jamais envoyé** à une vraie adresse

```
┌─ [Brevo Mock] Email simulé ──────────────────────────────
│  Template     : confirmation-reservation
│  Destinataire : Jean Dupont <jean@placev.fr>
│  Variables    : date: 2025-03-20, slot: AM, credits: 4
└──────────────────────────────────────────────────────────
```

### Fichiers mock à ne jamais modifier

```
lib/stripe-mock.ts                        ← faux client Stripe
lib/stripe.ts                             ← singleton bascule mock/réel
lib/brevo-mock.ts                         ← faux client Brevo
lib/brevo.ts                              ← singleton bascule mock/réel
app/api/stripe-mock/checkout/route.ts     ← simulation paiement crédits
app/api/stripe-mock/confirm-payment/route.ts  ← simulation paiement salle
__tests__/__mocks__/stripe.ts             ← mock Vitest Stripe
__tests__/__mocks__/brevo.ts              ← mock Vitest Brevo
```

---

## 5. Structure du projet

```
/app
  /(site-vitrine)         → NE PAS MODIFIER (Home, Offres, Galerie, Contact)
  /(app)                  → Module réservation — layout authentifié
    /dashboard            → Vue membre (solde, historique, réservations)
    /booking              → Page réservation (Client Component)
    /admin                → Back-office admin (role ADMIN uniquement)

/api
  /auth                   → Auth.js endpoints
  /availability           → GET disponibilités
  /booking                → POST créer réservation
  /booking/[id]/cancel    → POST annuler réservation
  /credits/checkout       → POST session Stripe crédits
  /webhooks/stripe        → POST webhook Stripe (mock + réel)
  /stripe-mock/checkout   → GET simulation paiement crédits (mock uniquement)
  /stripe-mock/confirm-payment → POST simulation paiement salle (mock uniquement)

/lib
  prisma.ts               → Singleton Prisma (jamais new PrismaClient() ailleurs)
  auth.ts                 → Config Auth.js + callbacks session JWT
  stripe.ts               → Singleton Stripe (bascule mock/réel)
  stripe-mock.ts          → Faux client Stripe
  brevo.ts                → Singleton Brevo (bascule mock/réel)
  brevo-mock.ts           → Faux client Brevo
  env.ts                  → Validation Zod des variables d'environnement

/components
  /booking
    BookingCalendar.tsx   → Composant tuiles AM/PM/FULL
  /admin
    MembersTable.tsx      → Table Shadcn triable

/specs                    → Fichiers YAML par Slice — lire avant de coder
/__tests__
  /api                    → Tests HTTP (next-test-api-route-handler)
  /__mocks__              → Mocks Vitest (stripe.ts, brevo.ts)
  auth.test.ts            → Tests unitaires Slice 1
  booking.test.ts         → Tests unitaires Slice 3
  admin.test.ts           → Tests unitaires Slice 5
/e2e                      → Tests Playwright
  global.setup.ts         → Création des sessions auth
  helpers/fixtures.ts     → Fixtures réutilisables
```

---

## 6. Conventions de code — OBLIGATOIRES

- **Server Components par défaut.** `'use client'` uniquement si interaction UI nécessaire
- **Imports avec alias `@/`** (configuré dans tsconfig.json)
- **Pas de `any` TypeScript.** Typage strict partout
- **Zod sur toutes les entrées.** API Routes + Server Actions = validation Zod systématique
- **Prisma singleton.** Toujours importer depuis `@/lib/prisma`
- **Stripe singleton.** Toujours importer depuis `@/lib/stripe`
- **Brevo singleton.** Toujours importer depuis `@/lib/brevo`
- **Variables d'env via `@/lib/env.ts`.** Ne jamais lire `process.env.X` directement dans le code applicatif
- **Nommage :** composants PascalCase, fichiers kebab-case, fonctions camelCase
- **Pas de `console.log` en production.** Utiliser des erreurs typées

---

## 7. Règles métier critiques

### Crédits (open-space)
- 1 crédit = 1 demi-journée (AM ou PM)
- 1 journée complète (FULL) = 2 crédits
- **Seuil de blocage : `user.credits - cost < -3` → réservation refusée**
- Exemples : credits=-2 + cost=1 → -3 → **autorisé** / credits=-2 + cost=2 → -4 → **refusé**
- Annulation : autorisée uniquement si `now() < reservation.start - 12h`

### Salle de réunion
- Tarif : 25€/h, minimum 2h (50€), demi-journée 100€, journée 200€
- Paiement Stripe direct (Payment Intent), pas de crédits
- **La règle de gratuité coworker < 2h est gérée physiquement — NE PAS implémenter**

### Admin
- Alerte rouge : `!isMember && count(reservations CONFIRMED) > 3`
- Réservation proxy : débite l'utilisateur **CIBLE**, `isProxy = true`
- Fermeture de date : batch atomique (`$transaction`) — annulation + remboursement + email ×N

---

## 8. Workflow agent par session

1. **Lire la spec YAML** de la feature cible dans `/specs` avant de coder
2. **Mocker Stripe et Brevo** dans les tests via `vi.mock('@/lib/stripe')` et `vi.mock('@/lib/brevo')`
3. **Écrire les tests en premier** (unitaires, puis HTTP, puis E2E)
4. **Implémenter le code** pour faire passer les tests
5. **Ne jamais modifier** les fichiers de test existants dans `/__tests__/`
6. **Committer** après chaque étape : `git commit -m "feat(slice-X): ..."`
7. **Arrêter la session** si > 20-25 échanges — créer `SESSION_CONTEXT.md` pour reprendre

---

## 9. Commandes disponibles

```bash
npm run dev                              # Serveur Next.js (port 3000)
npm run test                             # Vitest — tous les tests
npm run test:watch                       # Vitest en mode watch
npm run test:coverage                    # Vitest avec rapport de couverture
npm run test:http                        # Tests HTTP uniquement (__tests__/api)
npm run test:e2e                         # Playwright — tous les tests E2E
npm run test:e2e:slice1                  # Playwright — Slice 1 uniquement
npm run test:e2e:slice3                  # Playwright — Slice 3 uniquement
npm run test:all                         # Vitest + Playwright
npm run lint                             # ESLint
npx prisma studio                        # UI Prisma (inspecter la DB Neon develop)
npx prisma migrate dev --name <n>        # Nouvelle migration (Neon develop)
npx prisma db seed                       # Seeder (users de test + SystemSettings)
```

---

## 10. Hors scope — Ne pas implémenter

- Intégration automatique HelloAsso (validation manuelle par l'admin)
- Règle de gratuité salle < 2h pour les coworkers (gestion physique)
- Gestion des événements coworking
- Suppression de compte / RGPD
- Statistiques et KPIs avancés
- Paiement en ligne de l'adhésion annuelle
