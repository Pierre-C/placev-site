# Place V — Site Coworking & Module Réservation

Site web complet pour Place V Coworking (Bouliac, 33) : site vitrine + module de réservation en ligne avec authentification, crédits, paiements Stripe et emails transactionnels.

## Stack technique

| Domaine | Technologie |
|---|---|
| Framework | Next.js 14.2.5 (App Router) |
| Langage | TypeScript |
| Base de données | Neon (PostgreSQL serverless) via Prisma |
| Authentification | Auth.js v5 beta (credentials email/password) |
| Paiements | Stripe (crédits coworking + salle de réunion) |
| Emails | Brevo (newsletter + emails transactionnels) |
| UI | Tailwind CSS + shadcn/UI + Framer Motion |
| Tests | Vitest (unit + HTTP) + Playwright (E2E) |
| Validation | Zod |

## Installation

```bash
yarn install
cp .env.example .env.local
# Remplir les variables dans .env.local
yarn dev
```

Site accessible sur [http://localhost:3000](http://localhost:3000)

## Variables d'environnement

Copier `.env.example` en `.env.local` et remplir les valeurs. Variables requises :

| Variable | Description |
|---|---|
| `DATABASE_URL` | URL Neon PostgreSQL |
| `NEXTAUTH_SECRET` | Clé secrète Auth.js (`openssl rand -base64 32`) |
| `NEXTAUTH_URL` | URL de base (ex. `http://localhost:3000`) |
| `NEXT_PUBLIC_APP_URL` | URL publique (ex. `https://placev.co`) |
| `ADMIN_EMAIL` | Email destinataire des notifications admin |
| `BREVO_API_KEY` | Clé API Brevo (si `BREVO_MOCK=false`) |
| `STRIPE_SECRET_KEY` | Clé secrète Stripe (si `STRIPE_MOCK=false`) |
| `STRIPE_PUBLISHABLE_KEY` | Clé publique Stripe (si `STRIPE_MOCK=false`) |
| `STRIPE_WEBHOOK_SECRET` | Secret webhook Stripe (si `STRIPE_MOCK=false`) |

En développement local, les services externes fonctionnent en **mode mock** par défaut (`BREVO_MOCK=true`, `STRIPE_MOCK=true`) : aucune clé réelle n'est requise pour travailler en local.

## Tests

```bash
yarn test            # Tests unitaires + HTTP (Vitest)
yarn test:e2e        # Tests E2E (Playwright)
yarn test:all        # Tous les tests
```

## Documentation

La documentation détaillée est dans le dossier [`docs/`](docs/) :

| Fichier | Contenu |
|---|---|
| [BREVO_SETUP.md](docs/BREVO_SETUP.md) | Configuration Brevo — newsletter et emails transactionnels |
| [NEWSLETTER_FEATURES.md](docs/NEWSLETTER_FEATURES.md) | Comportement de la newsletter (détection doublons) |
| [DEBUG_NEWSLETTER.md](docs/DEBUG_NEWSLETTER.md) | Dépannage newsletter |
| [VERCEL_DEPLOYMENT.md](docs/VERCEL_DEPLOYMENT.md) | Guide déploiement Vercel complet |
| [QUICK_DEPLOY.md](docs/QUICK_DEPLOY.md) | Checklist déploiement rapide |

## Structure du projet

```
placev-site/
├── app/
│   ├── (app)/          # Module réservation — routes protégées
│   │   ├── login/      # Connexion
│   │   ├── register/   # Inscription
│   │   ├── dashboard/  # Tableau de bord utilisateur
│   │   ├── profile/    # Profil et préférences
│   │   └── ...         # Mot de passe oublié, réinitialisation…
│   ├── (admin)/        # Interface administration
│   ├── api/            # API routes (auth, booking, stripe, brevo, admin…)
│   ├── cgv/            # Page CGU/CGV
│   ├── contact/        # Page contact
│   ├── galerie/        # Page galerie
│   ├── offres/         # Page offres
│   └── page.tsx        # Page d'accueil (site vitrine)
├── components/         # Composants UI partagés
├── lib/                # Singletons et utilitaires
│   ├── prisma.ts       # Client Prisma (Neon HTTP adapter)
│   ├── auth.ts         # Auth.js v5 config complète (Node.js)
│   ├── auth.config.ts  # Auth.js v5 config edge-safe (middleware)
│   ├── stripe.ts       # Client Stripe — bascule mock/réel via STRIPE_MOCK
│   └── brevo.ts        # Client Brevo — bascule mock/réel via BREVO_MOCK
├── prisma/             # Schéma et migrations Prisma
├── __tests__/          # Tests Vitest (unit + HTTP)
├── e2e/                # Tests Playwright
└── specs/              # Spécifications fonctionnelles des slices
```

## Déploiement

Voir [docs/VERCEL_DEPLOYMENT.md](docs/VERCEL_DEPLOYMENT.md) pour le guide complet.

En résumé : configurer toutes les variables de `.env.example` dans Vercel (Settings → Environment Variables), avec `STRIPE_MOCK=false` et `BREVO_MOCK=false` en production.

Pour le staging (branche `staging`), configurer `NEXT_PUBLIC_APP_URL` avec l'URL Preview Vercel correspondante, scopée à cette branche.

## Licence

Propriétaire — Place V Coworking
