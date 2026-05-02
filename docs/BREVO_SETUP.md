# Configuration de Brevo (Newsletter + Emails transactionnels)

Brevo est utilisé dans ce projet pour deux usages distincts :

1. **Newsletter** (ce guide) — inscription des visiteurs via le footer, gérée par `app/api/newsletter/`
2. **Emails transactionnels** — confirmation de réservation, réinitialisation de mot de passe, notifications admin, etc., gérés par `lib/brevo.ts`

Les deux usages partagent la même clé API (`BREVO_API_KEY`). En développement, `BREVO_MOCK=true` désactive l'envoi réel et logue les emails en console.

---

## 📋 Prérequis

- Un compte Brevo actif (gratuit jusqu'à 300 emails/jour)
- Accès aux paramètres de votre compte Brevo

## 🔑 Étape 1 : Obtenir votre clé API Brevo

1. Connectez-vous à votre compte Brevo : [https://app.brevo.com](https://app.brevo.com)
2. Allez dans **Paramètres** (Settings) → **Clés API** (API Keys)
3. Créez une nouvelle clé API ou copiez une clé existante
4. Conservez cette clé en sécurité

## 📝 Étape 2 : Trouver vos IDs de liste

1. Dans Brevo, allez dans **Contacts** → **Listes**
2. Cliquez sur la liste où vous souhaitez ajouter vos abonnés
3. L'ID de la liste se trouve dans l'URL :
   - Exemple : `https://app.brevo.com/contact/list/id/2`
   - L'ID est `2` dans cet exemple

## ⚙️ Étape 3 : Configurer les variables d'environnement

Créez un fichier `.env.local` à la racine de votre projet avec le contenu suivant :

```bash
# Configuration Brevo
BREVO_API_KEY=votre_cle_api_brevo
BREVO_LIST_IDS=[2]
```

**Note :** Remplacez :

- `votre_cle_api_brevo` par votre clé API obtenue à l'étape 1
- `[2]` par vos IDs de liste (format JSON array)
  - Exemple pour une liste : `[2]`
  - Exemple pour plusieurs listes : `[2,5,8]`

## 🚀 Étape 4 : Déploiement

### En local

```bash
yarn dev
```

Votre formulaire de newsletter sera maintenant fonctionnel sur votre site local.

### Sur Vercel (ou autre plateforme)

Ajoutez les variables d'environnement dans les paramètres de votre projet :

**Vercel :**

1. Allez dans Settings → Environment Variables
2. Ajoutez `BREVO_API_KEY` avec votre clé API
3. Ajoutez `BREVO_LIST_IDS` avec vos IDs de liste
4. Redéployez votre application

## 📍 Où trouver le formulaire

Le formulaire de newsletter a été ajouté :

- **Dans le Footer** : visible sur toutes les pages (version compacte)

Vous pouvez également utiliser le composant ailleurs :

```tsx
import { Newsletter } from "@/components/Newsletter";

// Version complète (avec prénom)
<Newsletter />

// Version compacte (email uniquement)
<Newsletter variant="compact" />
```

## 🧪 Tester l'intégration

1. Accédez à votre site
2. Entrez une adresse email dans le formulaire newsletter
3. Cliquez sur "S'inscrire"
4. Vérifiez dans Brevo → Contacts que l'email a bien été ajouté

## 📊 Attributs personnalisés

Les attributs suivants sont envoyés à Brevo (si fournis) :

- `PRENOM` : Prénom de l'abonné
- `NOM` : Nom de l'abonné

Vous pouvez ajouter d'autres attributs dans le fichier `app/api/newsletter/route.ts`.

Pour créer des attributs personnalisés dans Brevo :

1. Allez dans **Contacts** → **Paramètres** → **Attributs de contact**
2. Créez les attributs `PRENOM` et `NOM` (type : Texte)

## ❓ Problèmes courants

### "Email invalide"

- Vérifiez que l'email contient un @

### "Vous êtes déjà inscrit à notre newsletter !"

- Le contact existe déjà dans votre liste Brevo
- C'est un comportement normal et protège contre les doublons
- Le message s'affiche en **orange** pour indiquer qu'il ne s'agit pas d'une erreur mais d'une information
- L'utilisateur sait qu'il est bien inscrit

### "Une erreur est survenue"

- Vérifiez que votre clé API est correcte
- Vérifiez que les IDs de liste existent
- Consultez les logs du serveur pour plus de détails

## 🎨 États visuels du formulaire

Le formulaire newsletter affiche trois types de messages avec des couleurs distinctes :

- **✅ Vert** : Inscription réussie
- **🟠 Orange** : Email déjà inscrit (pas une erreur, juste une information)
- **🔴 Rouge** : Erreur réelle (problème de configuration, erreur serveur, etc.)

## 🔒 Sécurité

- ⚠️ **Ne committez JAMAIS** votre fichier `.env.local` dans Git
- Le fichier `.env.local` est déjà dans `.gitignore`
- Vos clés API ne sont accessibles que côté serveur (API Route)

## 📚 Documentation officielle

- [Documentation Brevo API](https://developers.brevo.com/)
- [Package @getbrevo/brevo sur NPM](https://www.npmjs.com/package/@getbrevo/brevo)
