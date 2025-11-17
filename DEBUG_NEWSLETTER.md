# Guide de débogage - Newsletter

## 🔍 Problème : L'erreur 500 au lieu de la détection du doublon

J'ai amélioré le code pour capturer les erreurs de doublon Brevo de plusieurs façons différentes.

## 🧪 Comment tester et déboguer

### 1. Lancez le serveur de développement

```bash
yarn dev
```

### 2. Ouvrez la console du terminal

Gardez votre terminal visible pour voir les logs serveur.

### 3. Testez l'inscription

1. Allez sur votre site (http://localhost:3000)
2. Descendez au footer
3. Inscrivez-vous avec un email de test (ex: `test@example.com`)
4. **Réessayez avec le même email**

### 4. Consultez les logs dans le terminal

Vous devriez voir des logs détaillés comme :

```
Erreur lors de l'inscription à la newsletter: [objet d'erreur]
Response status: 400
Response body: {"code":"duplicate_parameter","message":"Contact already exists"}
```

## 🎯 Ce qui a été ajouté

Le code détecte maintenant les doublons de **5 façons différentes** :

```typescript
const isDuplicate =
  errorCode === "duplicate_parameter" || // Code d'erreur Brevo
  errorMessage.toLowerCase().includes("duplicate") || // Message contient "duplicate"
  errorMessage.toLowerCase().includes("already exist") || // Message contient "already exist"
  errorMessage.toLowerCase().includes("déjà") || // Message en français
  (error.response?.status === 400 &&
    errorMessage.toLowerCase().includes("contact")); // 400 + "contact"
```

## 📝 Que faire avec les logs

### Si vous voyez dans les logs :

**Cas 1 : Les logs montrent un doublon détecté**

```
Response body: {"code":"duplicate_parameter", ...}
```

✅ Le code devrait maintenant fonctionner et afficher le message orange

**Cas 2 : Les logs montrent une vraie erreur 500**

```
Response status: 500
Response body: {"message":"Internal Server Error"}
```

❌ Problème de configuration (vérifiez votre clé API Brevo)

**Cas 3 : Les logs montrent une structure différente**

```
Response body: {"error":"Contact déjà existant"}
```

📧 **Envoyez-moi les logs** et j'ajusterai le code pour détecter ce format

## 🔧 Vérifications à faire

### 1. Variables d'environnement

Vérifiez que votre `.env.local` contient :

```bash
BREVO_API_KEY=votre_vraie_cle_api
BREVO_LIST_IDS=[2]  # ou l'ID de votre liste
```

### 2. Clé API valide

- La clé doit avoir les permissions pour créer des contacts
- Connectez-vous sur https://app.brevo.com/settings/keys/api
- Vérifiez que la clé est active

### 3. Liste existante

- L'ID de liste doit correspondre à une liste réelle dans votre compte Brevo
- Vérifiez sur https://app.brevo.com/contact/list

## 🚀 Prochaines étapes

1. **Testez** avec un email
2. **Retestez** avec le même email
3. **Regardez** les logs dans le terminal
4. **Partagez** les logs si le problème persiste

Les logs détaillés me permettront de voir exactement comment Brevo structure ses erreurs et d'ajuster le code en conséquence.

## 💡 Mode développement

En mode développement, les détails de l'erreur sont inclus dans la réponse :

```json
{
  "error": "Une erreur est survenue lors de l'inscription",
  "details": "Le message d'erreur exact de Brevo"
}
```

Vous pouvez voir ceci dans la console du navigateur (F12 → Network → Payload).
