# 🚀 Déploiement Rapide - Checklist

Guide rapide pour déployer Place V sur Vercel.

## ✅ Checklist pré-déploiement

### 1. Variables d'environnement locales (.env.local)

Voir `.env.example` à la racine pour la liste complète. Variables minimales requises :

```bash
DATABASE_URL=postgresql://...           # URL Neon PostgreSQL
NEXTAUTH_SECRET=...                     # openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
NEXT_PUBLIC_APP_URL=https://placev.co
ADMIN_EMAIL=placevcoworking@gmail.com
BREVO_API_KEY=xkeysib-...
BREVO_LIST_IDS=[2]
STRIPE_SECRET_KEY=sk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
STRIPE_PRICE_BOULIACAIS=price_...
STRIPE_PRICE_REDUIT=price_...
STRIPE_PRICE_EXTERNE=price_...
```

En développement local, `BREVO_MOCK=true` et `STRIPE_MOCK=true` permettent de travailler sans clés réelles.

### 2. Test en local

```bash
yarn dev
# Testez le site sur http://localhost:3000
yarn test        # Tests unitaires + HTTP
yarn test:e2e    # Tests Playwright (optionnel avant push)
```

## 🌐 Déploiement sur Vercel

### Étape 1 : Ajouter les variables d'environnement

**Sur Vercel Dashboard :**

1. Ouvrez votre projet sur [vercel.com](https://vercel.com)
2. **Settings** → **Environment Variables**
3. Ajoutez chaque variable de `.env.example` :

Variables critiques pour la **Production** :

```
DATABASE_URL          → URL Neon main branch
NEXTAUTH_SECRET       → clé secrète Auth.js
NEXTAUTH_URL          → https://placev.co
NEXT_PUBLIC_APP_URL   → https://placev.co
ADMIN_EMAIL           → placevcoworking@gmail.com
BREVO_MOCK            → false
BREVO_API_KEY         → xkeysib-...
BREVO_LIST_IDS        → [2]
STRIPE_MOCK           → false
NEXT_PUBLIC_STRIPE_MOCK → false
STRIPE_SECRET_KEY     → sk_live_... (ou sk_test_... en test)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY → pk_live_...
STRIPE_WEBHOOK_SECRET → whsec_...
STRIPE_PRICE_BOULIACAIS / REDUIT / EXTERNE → price_...
```

Pour le **staging** (Preview / branche `staging`) :
- `BREVO_MOCK=true`, `STRIPE_MOCK=true` (pas de vrais envois)
- `NEXT_PUBLIC_APP_URL` → URL Preview Vercel de la branche
- `DATABASE_URL` → URL Neon branche `staging`

4. Cliquez **Save** pour chaque variable

### Étape 2 : Redéployer

**Option A - Via Git (recommandé) :**

```bash
git add .
git commit -m "Add newsletter with Brevo"
git push origin main
```

**Option B - Via Vercel Dashboard :**

1. **Deployments** → Dernier déploiement → `...` → **Redeploy**

**Option C - Via CLI :**

```bash
vercel --prod
```

### Étape 3 : Vérifier

1. ✅ Déploiement terminé (vert)
2. ✅ Allez sur votre site (ex: `placev.co`)
3. ✅ Testez la connexion / inscription utilisateur
4. ✅ Testez le formulaire newsletter dans le footer
5. ✅ Vérifiez dans Brevo → Contacts que l'email apparaît

## 🐛 En cas de problème

### La newsletter ne fonctionne pas en production

1. **Vérifiez les variables d'environnement**

   - Vercel Dashboard → Settings → Environment Variables
   - Les deux variables doivent être présentes pour "Production"

2. **Consultez les logs**

   - Vercel Dashboard → Deployments → Cliquez sur le déploiement
   - Functions → `/api/newsletter`
   - Regardez les erreurs dans les logs

3. **Redéployez**
   - Les variables d'environnement ne sont appliquées qu'aux nouveaux déploiements
   - Si vous venez d'ajouter les variables, redéployez

### Comment redéployer rapidement

```bash
# Commit vide pour forcer un redéploiement
git commit --allow-empty -m "Redeploy"
git push origin main
```

## 📋 Valeurs nécessaires

Avant de déployer, assurez-vous d'avoir :

- [ ] **URL Neon** : branche `main` pour la production, `develop` pour le staging
- [ ] **Clé API Brevo** : [app.brevo.com/settings/keys/api](https://app.brevo.com/settings/keys/api)
- [ ] **ID de liste Brevo** : Brevo → Contacts → Listes (dans l'URL)
- [ ] **Clés Stripe** : Dashboard Stripe → Développeurs → Clés API
- [ ] **IDs de prix Stripe** : Dashboard Stripe → Produits (un par segment : Bouliacais, Réduit, Externe)
- [ ] **Projet sur GitHub** : Connecté à Vercel
- [ ] **Compte Vercel** : Gratuit sur [vercel.com](https://vercel.com)

## 🔗 Guides détaillés

- **Configuration Brevo** : [BREVO_SETUP.md](./BREVO_SETUP.md)
- **Déploiement Vercel** : [VERCEL_DEPLOYMENT.md](./VERCEL_DEPLOYMENT.md)
- **Débogage Newsletter** : [DEBUG_NEWSLETTER.md](./DEBUG_NEWSLETTER.md)

## ⏱️ Temps estimé

- Configuration variables Vercel : **2 minutes**
- Redéploiement : **1-2 minutes**
- Vérification : **1 minute**

**Total : ~5 minutes** ⚡

