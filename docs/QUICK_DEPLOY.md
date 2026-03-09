# 🚀 Déploiement Rapide - Checklist

Guide rapide pour déployer PlaceV avec la newsletter sur Vercel.

## ✅ Checklist pré-déploiement

### 1. Variables d'environnement locales (.env.local)

```bash
BREVO_API_KEY=xkeysib-votre-cle-api
BREVO_LIST_IDS=[2]
```

### 2. Test en local

```bash
yarn dev
# Testez la newsletter sur http://localhost:3000
```

## 🌐 Déploiement sur Vercel

### Étape 1 : Ajouter les variables d'environnement

**Sur Vercel Dashboard :**

1. Ouvrez votre projet sur [vercel.com](https://vercel.com)
2. **Settings** → **Environment Variables**
3. Ajoutez :

```
Name:  BREVO_API_KEY
Value: [votre-clé-api-brevo]
Env:   ✅ Production  ✅ Preview  ✅ Development
```

```
Name:  BREVO_LIST_IDS
Value: [2]
Env:   ✅ Production  ✅ Preview  ✅ Development
```

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
2. ✅ Allez sur votre site (ex: `placev-site.vercel.app`)
3. ✅ Testez le formulaire newsletter dans le footer
4. ✅ Vérifiez dans Brevo → Contacts que l'email apparaît

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

- [ ] **Clé API Brevo** : Obtenez-la sur [app.brevo.com/settings/keys/api](https://app.brevo.com/settings/keys/api)
- [ ] **ID de liste Brevo** : Trouvez-le dans Brevo → Contacts → Listes (dans l'URL)
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

