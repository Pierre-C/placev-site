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

## 📧 Configuration Brevo (Formulaire de contact)

Le formulaire de contact utilise Brevo (anciennement Sendinblue) pour l'envoi d'emails.

### 1. Créer un compte Brevo

1. Allez sur [https://www.brevo.com](https://www.brevo.com)
2. Créez un compte gratuit (300 emails/jour inclus)
3. Confirmez votre email

### 2. Obtenir votre clé API

1. Connectez-vous à Brevo
2. Allez dans **Settings** → **API Keys** : [https://app.brevo.com/settings/keys/api](https://app.brevo.com/settings/keys/api)
3. Cliquez sur **Generate a new API key**
4. Donnez-lui un nom (ex: "PlaceV Website")
5. Copiez la clé générée

### 3. Configurer les variables d'environnement

Créez un fichier `.env.local` à la racine du projet :

```env
# Brevo API Key
BREVO_API_KEY=votre_clé_api_ici

# Email de destination pour recevoir les messages
CONTACT_EMAIL=contact@placev.fr
```

### 4. Configurer l'expéditeur dans Brevo

1. Allez dans **Senders** → **Add a new sender**
2. Ajoutez `noreply@placev.fr` (ou votre domaine)
3. Vérifiez le domaine si nécessaire

### 5. Tester en local

```bash
yarn dev
```

Allez sur [http://localhost:3000](http://localhost:3000), descendez au formulaire de contact et testez l'envoi !

## 📦 Déploiement sur Vercel

### Variables d'environnement sur Vercel

1. Allez dans votre projet sur [Vercel](https://vercel.com)
2. **Settings** → **Environment Variables**
3. Ajoutez :
   - `BREVO_API_KEY` : votre clé API Brevo
   - `CONTACT_EMAIL` : votre email de réception

### Déploiement

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
- **Email** : Brevo (API transactionnelle)

## 📁 Structure du projet

```
placev-site/
├── app/
│   ├── api/contact/         # API route pour le formulaire
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
