# PlaceV - Site Web Coworking

Site web moderne pour PlaceV Coworking, construit avec Next.js 14, React 18, TypeScript et Tailwind CSS.

## 🚀 Installation

```bash
# Installer les dépendances
yarn install

# Lancer le serveur de développement
yarn dev
```

Le site sera accessible sur [http://localhost:3000](http://localhost:3000)

## 📧 Contact

Le formulaire de contact utilise un simple lien `mailto:` qui ouvre le client email de l'utilisateur avec un message pré-rempli. Aucune configuration serveur nécessaire !

## 📬 Newsletter

Le site inclut un système d'inscription à la newsletter intégré avec **Brevo** (anciennement Sendinblue). Le formulaire est visible dans le footer sur toutes les pages.

**Configuration requise :**

- Clé API Brevo
- ID(s) de liste Brevo

Consultez [BREVO_SETUP.md](./BREVO_SETUP.md) pour les instructions détaillées de configuration.

## 📦 Déploiement sur Vercel

```bash
# Push vers GitHub
git push origin main

# Ou déployer directement via CLI
npx vercel --prod
```

## 🛠️ Stack Technique

- **Framework** : Next.js 14 (App Router)
- **Language** : TypeScript
- **Styling** : Tailwind CSS
- **Animations** : Framer Motion
- **Icons** : Lucide React
- **Newsletter** : Brevo (anciennement Sendinblue)

## 📁 Structure du projet

```
placev-site/
├── app/
│   ├── api/
│   │   └── newsletter/      # API route newsletter
│   ├── contact/             # Page contact
│   ├── galerie/             # Page galerie
│   ├── offres/              # Page offres
│   ├── layout.tsx           # Layout global
│   ├── page.tsx             # Page d'accueil
│   ├── icon.svg             # Favicon
│   └── manifest.json        # PWA manifest
├── components/
│   ├── Header.tsx           # En-tête
│   ├── Footer.tsx           # Pied de page
│   ├── Newsletter.tsx       # Composant newsletter
│   └── sections/            # Sections de la page d'accueil
│       ├── Hero.tsx
│       ├── Amenities.tsx
│       ├── Plans.tsx
│       ├── Gallery.tsx
│       ├── Testimonials.tsx
│       ├── FAQ.tsx
│       └── ContactBlock.tsx
├── lib/
│   └── config/
│       └── site.ts          # Configuration du site
└── public/
    └── logo-placev.png      # Logo
```

## 📝 License

Propriétaire - PlaceV Coworking
