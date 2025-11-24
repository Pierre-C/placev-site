# Déploiement sur Vercel avec Newsletter

Ce guide explique comment déployer votre site PlaceV sur Vercel avec la fonctionnalité newsletter Brevo.

## 📋 Prérequis

- Un compte Vercel (gratuit)
- Votre projet PlaceV sur GitHub
- Votre clé API Brevo
- L'ID de votre liste Brevo

## 🚀 Étapes de déploiement

### 1. Configuration initiale sur Vercel

Si ce n'est pas encore fait :

1. Allez sur [https://vercel.com](https://vercel.com)
2. Connectez-vous avec GitHub
3. Cliquez sur **Add New Project**
4. Importez votre repository `placev-site`
5. Cliquez sur **Deploy** (le déploiement initial se fera sans les variables d'environnement)

### 2. Configuration des variables d'environnement

#### Via le Dashboard (Interface Web)

1. **Accédez aux paramètres**

   - Ouvrez votre projet sur Vercel
   - Cliquez sur **Settings** (onglet en haut)
   - Dans le menu latéral, cliquez sur **Environment Variables**

2. **Ajoutez BREVO_API_KEY**

   ```
   Name:  BREVO_API_KEY
   Value: [Votre clé API Brevo, ex: xkeysib-abc123...]
   ```

   - Cochez les environnements :
     - ✅ Production
     - ✅ Preview
     - ✅ Development (optionnel)
   - Cliquez sur **Save**

3. **Ajoutez BREVO_LIST_IDS**

   ```
   Name:  BREVO_LIST_IDS
   Value: [2]
   ```

   ⚠️ **Important** : La valeur doit être au format JSON array : `[2]` ou `[2,5]` pour plusieurs listes

   - Cochez les mêmes environnements
   - Cliquez sur **Save**

4. **Vérifiez vos variables**

   Vous devriez voir :

   ```
   BREVO_API_KEY      Production, Preview        xkeysib-•••••
   BREVO_LIST_IDS     Production, Preview        [2]
   ```

#### Via la CLI Vercel

```bash
# 1. Installez la CLI Vercel (si pas déjà fait)
npm i -g vercel

# 2. Connectez-vous
vercel login

# 3. Liez votre projet local
vercel link

# 4. Ajoutez les variables d'environnement
vercel env add BREVO_API_KEY
# Quand demandé:
# - Quelle valeur? → [Collez votre clé API]
# - Pour quels environnements? → Production, Preview

vercel env add BREVO_LIST_IDS
# Quand demandé:
# - Quelle valeur? → [2]
# - Pour quels environnements? → Production, Preview

# 5. Vérifiez les variables
vercel env ls
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

- [ ] Variables d'environnement ajoutées dans Vercel
- [ ] `BREVO_API_KEY` configurée pour Production
- [ ] `BREVO_LIST_IDS` configurée pour Production (format `[2]`)
- [ ] Redéploiement effectué après l'ajout des variables
- [ ] Déploiement terminé avec succès (vert)
- [ ] Test d'inscription réussi sur le site en production
- [ ] Email reçu dans Brevo Contacts
- [ ] Test de doublon fonctionne (message orange)

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

