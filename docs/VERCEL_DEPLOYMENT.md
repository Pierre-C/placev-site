# Déploiement sur Vercel

Ce guide explique comment déployer le site Place V sur Vercel (Production et Staging).

## 📋 Prérequis

- Un compte Vercel (gratuit)
- Le projet PlaceV sur GitHub, connecté à Vercel
- Une base de données Neon (branche `main` pour la production, `develop` pour le staging)
- Clés API Brevo (transactionnels + newsletter)
- Clés Stripe et IDs de prix (3 segments : Bouliacais, Réduit, Externe)

## 🚀 Étapes de déploiement

### 1. Configuration initiale sur Vercel

Si ce n'est pas encore fait :

1. Allez sur [https://vercel.com](https://vercel.com)
2. Connectez-vous avec GitHub
3. Cliquez sur **Add New Project**
4. Importez votre repository `placev-site`
5. Cliquez sur **Deploy** (le déploiement initial se fera sans les variables d'environnement)

### 2. Configuration des variables d'environnement

Toutes les variables listées dans `.env.example` doivent être configurées sur Vercel. Voici les valeurs par environnement.

#### Production (`main`)

```
DATABASE_URL                        → URL Neon branche main
NEXTAUTH_SECRET                     → clé générée (openssl rand -base64 32)
NEXTAUTH_URL                        → https://placev.co
NEXT_PUBLIC_APP_URL                 → https://placev.co
ADMIN_EMAIL                         → placevcoworking@gmail.com
BREVO_MOCK                          → false
NEXT_PUBLIC_STRIPE_MOCK             → false
STRIPE_MOCK                         → false
BREVO_API_KEY                       → xkeysib-...
BREVO_LIST_IDS                      → [2]
STRIPE_SECRET_KEY                   → sk_live_... (ou sk_test_... si encore en test)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY  → pk_live_...
STRIPE_WEBHOOK_SECRET               → whsec_...
STRIPE_PRICE_BOULIACAIS             → price_...
STRIPE_PRICE_REDUIT                 → price_...
STRIPE_PRICE_EXTERNE                → price_...
```

#### Staging / Preview (branche `staging`)

```
DATABASE_URL                        → URL Neon branche staging
NEXTAUTH_SECRET                     → même clé ou clé distincte
NEXTAUTH_URL                        → https://[url-preview-vercel]
NEXT_PUBLIC_APP_URL                 → https://[url-preview-vercel]
ADMIN_EMAIL                         → placevcoworking@gmail.com
BREVO_MOCK                          → true   ← pas de vrais emails
NEXT_PUBLIC_STRIPE_MOCK             → true   ← pas de vrais paiements
STRIPE_MOCK                         → true
```

> Pour scoper une variable à une branche précise : dans Vercel, choisir **Preview** comme environnement puis cliquer sur **Add** et saisir le nom de la branche (`staging`).

#### Via la CLI Vercel

```bash
npm i -g vercel
vercel login
vercel link

# Ajouter une variable (exemple)
vercel env add BREVO_API_KEY
# → valeur, puis choisir les environnements

vercel env ls   # Vérifier
```

### 3. Redéploiement

Les variables d'environnement ne sont appliquées qu'aux **nouveaux déploiements**.

#### Option A : Redéployer via le Dashboard

1. Allez dans l'onglet **Deployments**
2. Sur le dernier déploiement, cliquez sur les 3 points `...`
3. Sélectionnez **Redeploy**
4. Cochez **Use existing Build Cache** (plus rapide)
5. Cliquez sur **Redeploy**

#### Option B : Redéployer via Git

```bash
# Faites un commit (même vide) pour déclencher un redéploiement
git commit --allow-empty -m "Redeploy with environment variables"
git push origin main
```

#### Option C : Redéployer via la CLI

```bash
vercel --prod
```

### 4. Vérification du déploiement

1. **Attendez la fin du déploiement** (1-2 minutes)

2. **Testez votre site en production**

   - Allez sur votre URL Vercel (ex: `placev-site.vercel.app`)
   - Descendez au footer
   - Testez le formulaire newsletter

3. **Vérifiez les logs en cas d'erreur**
   - Dans Vercel : **Deployments** → Cliquez sur le déploiement → **Functions**
   - Cliquez sur `/api/newsletter`
   - Vous verrez les logs de l'API

## 🔍 Debugging en production

### Consulter les logs

1. **Via le Dashboard Vercel**

   - Projet → **Deployments** → Dernier déploiement
   - Onglet **Functions** → `/api/newsletter`
   - Les `console.log` et `console.error` apparaissent ici

2. **Via la CLI**
   ```bash
   vercel logs
   # Ou pour une URL spécifique
   vercel logs https://placev-site.vercel.app
   ```

### Vérifier les variables d'environnement

```bash
# Liste toutes les variables
vercel env ls

# Récupère une variable spécifique (production)
vercel env pull
```

## ⚠️ Problèmes courants

### "Une erreur est survenue lors de l'inscription" en production

**Causes possibles :**

1. **Variables d'environnement manquantes**

   - Vérifiez dans Settings → Environment Variables
   - Les variables doivent être présentes pour "Production"

2. **Redéploiement nécessaire**

   - Les variables ne sont pas appliquées aux déploiements existants
   - Redéployez après avoir ajouté les variables

3. **Format incorrect de BREVO_LIST_IDS**

   - Doit être `[2]` et non `2` ou `"[2]"`
   - Format JSON array requis

4. **Clé API Brevo invalide**
   - Vérifiez que la clé est active dans Brevo
   - Testez la clé en local d'abord

### Les logs ne montrent rien

Si vous ne voyez pas les logs `console.error` :

1. Allez dans **Settings** → **Functions**
2. Vérifiez que les logs sont activés
3. Les logs peuvent prendre quelques secondes à apparaître

### L'environnement Preview ne fonctionne pas

Les branches preview (non-main) utilisent l'environnement "Preview" :

```bash
# Assurez-vous d'avoir ajouté les variables pour Preview aussi
vercel env add BREVO_API_KEY preview
vercel env add BREVO_LIST_IDS preview
```

## 🎯 Checklist de déploiement

Avant de considérer le déploiement comme réussi :

- [ ] Toutes les variables d'environnement ajoutées dans Vercel
- [ ] `DATABASE_URL` pointe vers la bonne branche Neon (main en prod)
- [ ] `NEXTAUTH_SECRET` configuré
- [ ] `NEXT_PUBLIC_APP_URL` correct pour chaque environnement
- [ ] `BREVO_MOCK=false` + `BREVO_API_KEY` en production
- [ ] `STRIPE_MOCK=false` + clés Stripe en production
- [ ] IDs de prix Stripe (`STRIPE_PRICE_*`) configurés
- [ ] Redéploiement effectué après l'ajout des variables
- [ ] Déploiement terminé avec succès (vert)
- [ ] Connexion / inscription utilisateur fonctionnelle
- [ ] Test d'inscription newsletter réussi (email dans Brevo Contacts)
- [ ] Test de doublon newsletter fonctionne (message orange)

## 🔒 Sécurité

✅ **Bonnes pratiques :**

- Les variables d'environnement sont **chiffrées** par Vercel
- Elles ne sont **jamais exposées** côté client
- Elles sont uniquement accessibles dans les **API Routes** (côté serveur)
- Ne committez **jamais** `.env.local` dans Git

## 📚 Ressources

- [Documentation Vercel - Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Documentation Vercel - Functions Logs](https://vercel.com/docs/concepts/functions/serverless-functions/logging)
- [Documentation Brevo API](https://developers.brevo.com/)

## 🆘 Besoin d'aide ?

Si après avoir suivi ces étapes la newsletter ne fonctionne toujours pas :

1. Consultez les logs dans Vercel (Deployments → Functions → /api/newsletter)
2. Testez en local avec les mêmes variables d'environnement
3. Vérifiez que votre clé API Brevo a les bonnes permissions
4. Contactez le support Vercel si le problème persiste

