# Prompt Gemini — Fix Slice 12b : Migration DB manquante + vérification E2E

## Diagnostic : cause racine identifiée

**Tu as oublié de pousser le schéma Prisma vers la base de données.**

L'erreur qui fait échouer TOUS les tests E2E est :

```
PrismaClientKnownRequestError:
Invalid `prisma.event.findMany()` invocation:
relation "public.EventImage" does not exist
```

Le modèle `EventImage` a été ajouté dans `prisma/schema.prisma` et le client
Prisma a été regénéré (`prisma generate`), mais la table n'a PAS été créée en
base. Le code est correct — il manque uniquement la migration DB.

---

## Étape 1 — Appliquer la migration (OBLIGATOIRE EN PREMIER)

```bash
npx prisma db push
```

Cette commande :
1. Crée la table `EventImage` dans Neon
2. Régénère automatiquement le Prisma Client

Attendre que la commande se termine (`✓ Your database is now in sync`).

---

## Étape 2 — Re-lancer le seeder

Le seeder doit tourner APRÈS la migration pour que les événements seed soient
présents. Le seed doit maintenant inclure `seed-event-03` (3ème événement futur).

Vérifier que `prisma/seed.ts` contient bien un 3ème `prisma.event.upsert` avec
`id: "seed-event-03"` et une date dans le futur. S'il manque, l'ajouter :

```ts
await prisma.event.upsert({
  where: { id: "seed-event-03" },
  update: {
    title: "Atelier découverte",
    description: "Venez découvrir notre espace lors d'un atelier convivial.",
    date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // +21 jours
    registrationUrl: null,
  },
  create: {
    id: "seed-event-03",
    title: "Atelier découverte",
    description: "Venez découvrir notre espace lors d'un atelier convivial.",
    date: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000), // +21 jours
    registrationUrl: null,
  },
})
```

Puis lancer :
```bash
npx prisma db seed
```

---

## Étape 3 — Vérifier que le serveur de dev tourne

Le serveur Next.js (`npm run dev`) doit être (re)démarré après la migration
pour que le nouveau Prisma Client compilé soit chargé. Si le serveur était déjà
lancé pendant `prisma db push`, il a peut-être recompilé automatiquement en
mode `--turbo`. Sinon, le redémarrer.

---

## Étape 4 — Lancer les tests dans l'ordre

### Tests HTTP (doivent déjà passer — ne pas casser)
```bash
npx vitest run __tests__/api/slice-12b-events.http.test.ts
npx vitest run __tests__/api/slice-12-events.http.test.ts
```

### Tests E2E slice 12 (régression — doivent refonctionner après db push)
```bash
npx playwright test e2e/slice-12-events.spec.ts
```

### Tests E2E slice 12b (nouveaux)
```bash
npx playwright test e2e/slice-12b-events.spec.ts
```

---

## Étape 5 — Corrections à appliquer si certains tests E2E échouent encore

Après `db push`, si des tests échouent encore, voici les corrections probables :

### 5a — Test "le bouton 'Tous nos événements' est visible"
Le test utilise `cards.count()` sans attendre que la section charge. La section
`Events` retourne `null` pendant le chargement (`if (loading) return null`).
Si ce test échoue (0 events détectés), corriger ainsi dans le fichier de test
`e2e/slice-12b-events.spec.ts` :

```ts
test("le bouton 'Tous nos événements' est visible sous la grille", async ({ page }) => {
  await page.goto("/")

  // Attendre que la section soit visible (après chargement du fetch)
  const section = page.locator('[data-testid="events-section"]')
  await expect(section).toBeVisible()

  const cards = section.locator('[data-testid="event-card"]')
  const count = await cards.count()

  if (count > 0) {
    await expect(page.locator('[data-testid="events-see-all-btn"]')).toBeVisible()
  }
})
```

### 5b — Tests "contiennent une image" et "image occupe le haut de la card"
Même problème : attendre la section avant de compter les cards.

```ts
test("les cards d'événements contiennent une image", async ({ page }) => {
  await page.goto("/")
  const section = page.locator('[data-testid="events-section"]')
  await expect(section).toBeVisible()
  // ... suite inchangée
})
```

### 5c — Test "clic bouton → redirige vers /events"
Si ce test échoue avec "strict mode violation" (plusieurs boutons ou éléments
trouvés), s'assurer que `data-testid="events-see-all-btn"` est unique sur la page.

### 5d — Test d'upload d'image (Playwright setInputFiles)
Le test charge le fichier `public/gallery/PXL_20250909_120231896.jpg` via :
```ts
await fileInput.setInputFiles(
  path.join(process.cwd(), "public", "gallery", "PXL_20250909_120231896.jpg")
)
```
Ce fichier existe bien dans le projet. Si l'upload échoue, vérifier que :
- `handleImageChange` dans `EventsTable.tsx` utilise `FileReader` + Canvas
- Le Canvas API fonctionne dans Playwright Chromium (il fonctionne normalement)
- Le POST à `/api/admin/events/[id]/image` reçoit bien le body `{ data, mimeType }`

### 5e — Miniature après upload (event-thumb)
Après avoir uploadé et sauvegardé une image, le test recharge la page
(`adminPage.goto("/admin/events")`) pour voir la miniature. Si `event-thumb`
n'apparaît pas :
- Vérifier que `GET /api/admin/events` inclut bien `image: { select: { mimeType: true } }` dans le select Prisma (c'est déjà dans le code — vérifier que c'est bien sauvegardé)
- Vérifier que `hasImage: !!image` est bien dans la sérialisation

---

## Résumé des fichiers à ne PAS modifier (déjà corrects)

- `app/api/admin/events/[id]/image/route.ts` ✓
- `app/api/events/[id]/image/route.ts` ✓
- `app/api/events/route.ts` ✓
- `app/api/admin/events/route.ts` ✓
- `app/events/page.tsx` ✓
- `app/events/EventsPageClient.tsx` ✓
- `components/sections/Events.tsx` ✓
- `app/(app)/admin/events/EventsTable.tsx` ✓
- `app/(app)/admin/events/page.tsx` ✓

## La seule vraie action requise

```bash
npx prisma db push && npx prisma db seed
```

Puis relancer les tests E2E.
