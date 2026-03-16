# Prompt Gemini — Implémentation Slice 12b : Événements Phase 2

## Contexte général

Tu travailles sur **Place V**, un site web pour un espace de coworking associatif, construit avec :
- **Next.js 14.2.5** (App Router)
- **Auth.js v5 beta** (`next-auth@5 beta.30`) pour l'authentification
- **Prisma** avec **Neon HTTP adapter** (`PrismaNeonHttp`) — **pas de WebSocket Pool**
- **Tailwind CSS**
- **TypeScript**
- Tests : **Vitest** (tests unitaires + HTTP via `next-test-api-route-handler`) + **Playwright** (E2E)

La branche active est `feat/slice-12-events`. Slice 12 est déjà implémentée (CRUD événements sans images). Tu dois implémenter **Slice 12b** qui ajoute : images par événement, page publique `/events`, et limitation à 3 événements sur la homepage.

---

## Étape 1 — Lire les fichiers de référence

Commence par lire ces fichiers dans l'ordre :

### Spec et tests à faire passer
- `specs/12b-events.yaml` — **spec complète de ce que tu dois implémenter**
- `__tests__/api/slice-12b-events.http.test.ts` — tests HTTP à faire passer
- `e2e/slice-12b-events.spec.ts` — tests E2E à faire passer

### Code existant à comprendre avant de modifier
- `prisma/schema.prisma` — schéma actuel (modèle `Event` existant, sans image)
- `prisma/seed.ts` — seeder (à modifier pour ajouter seed-event-03)
- `app/api/events/route.ts` — GET /api/events (à modifier)
- `app/api/admin/events/route.ts` — GET + POST /api/admin/events
- `app/api/admin/events/[id]/route.ts` — PUT + DELETE
- `components/sections/Events.tsx` — section homepage (à modifier)
- `app/(app)/admin/events/EventsTable.tsx` — tableau admin (à modifier)
- `app/(app)/admin/events/page.tsx` — page admin événements
- `app/page.tsx` — homepage (pour comprendre comment Events est utilisé)
- `lib/prisma.ts` — singleton Prisma avec Neon HTTP adapter

---

## Étape 2 — Contraintes critiques de l'architecture

**Lis attentivement avant d'écrire la moindre ligne :**

### Prisma + Neon HTTP
- `lib/prisma.ts` utilise `PrismaNeonHttp` — **`$transaction(callback)` n'est PAS supporté**
- Pour les opérations multiples (ex: créer un event puis upserter une image), utilise des appels Prisma séquentiels
- Les requêtes Prisma dans les routes API fonctionnent normalement avec `await prisma.event.findMany(...)` etc.

### Auth.js v5 beta — récupérer la session
- **Dans les Server Components / Route Handlers** : `import { auth } from "@/lib/auth"` puis `const session = await auth()`
- **Ne jamais** utiliser `useSession` ou `getServerSession` dans ce projet
- La session a la forme : `session.user.{ id, email, firstName, lastName, role, segment, credits }`
- Vérification admin : `session?.user?.role === "ADMIN"`

### App Router — pages publiques vs authentifiées
- `app/(app)/...` → layout authentifié (SessionProvider disponible, requiert connexion)
- `app/...` (racine, hors groupe `(app)`) → pages publiques (homepage, /contact, /login, /register, /cgv, /events)
- **La page `/events` doit être dans `app/events/page.tsx`** (pas dans `app/(app)/`)
- Les Server Components publics peuvent appeler `auth()` pour obtenir la session, mais ne la requièrent pas

### Client Components sur les pages publiques
- Les pages publiques (hors `app/(app)/`) **n'ont pas accès à `SessionProvider`**
- Un Client Component sur une page publique **ne peut pas utiliser `useSession`**
- Pour passer la session à un Client Component : récupérer via `auth()` dans le Server Component parent, puis passer en prop (ex: `isConnected: boolean`)

### `@db.Text` pour le base64 Neon/PostgreSQL
- Le champ `data` du modèle `EventImage` doit être annoté `@db.Text` dans le schema Prisma
- Sans cela, PostgreSQL tronque les grandes chaînes base64

---

## Étape 3 — Plan d'implémentation (dans cet ordre)

### 3.1 — Schéma Prisma
Dans `prisma/schema.prisma`, ajouter le modèle `EventImage` et la relation sur `Event` :

```prisma
model EventImage {
  id        String   @id @default(cuid())
  eventId   String   @unique
  data      String   @db.Text
  mimeType  String
  createdAt DateTime @default(now())

  event Event @relation(fields: [eventId], references: [id], onDelete: Cascade)
}
```

Modifier le modèle `Event` pour ajouter :
```prisma
image EventImage?
```

Puis lancer : `npx prisma db push`

### 3.2 — Seed (prisma/seed.ts)
Ajouter `seed-event-03` : un 3ème événement futur sans image (upsert idempotent comme les deux existants).

### 3.3 — Routes API nouvelles
Créer dans l'ordre :

**`app/api/admin/events/[id]/image/route.ts`**
- `POST` — upload image : body `{ data: string, mimeType: string }`. Valider que `mimeType` est dans `["image/jpeg","image/png","image/webp"]` et que `data` est présent. `prisma.eventImage.upsert` (where: `{ eventId }`, create + update). Retourner 201.
- `DELETE` — supprimer image : vérifier que l'image existe (`findUnique`), sinon 404. Appeler `prisma.eventImage.delete({ where: { eventId } })`. Retourner `{ deleted: true }`.
- Les deux handlers vérifient `session?.user?.role === "ADMIN"`, sinon 403.

**`app/api/events/[id]/image/route.ts`**
- `GET` — public, pas d'auth. Chercher l'événement (`event.findUnique`), 404 si introuvable. Chercher `eventImage.findUnique({ where: { eventId: id } })`. Si image trouvée : décoder le base64 (retirer le préfixe `data:image/...;base64,`), retourner `new Response(Buffer.from(base64, "base64"), { headers: { "Content-Type": mimeType, "Cache-Control": "public, max-age=86400" } })`. Si pas d'image : `NextResponse.redirect("/gallery/PXL_20250909_120231896.jpg", 302)`.

### 3.4 — Modifier GET /api/events
Dans `app/api/events/route.ts` :
- Lire les query params `limit` et `includePast` depuis `req.nextUrl.searchParams` (ou `new URL(req.url).searchParams`)
- Si `includePast !== "true"` : conserver le filtre `date >= aujourd'hui` (comportement actuel)
- Si `includePast === "true"` : supprimer le filtre sur la date
- Si `limit` est un entier positif valide : ajouter `take: parseInt(limit)` à la requête Prisma
- Inclure la relation image dans le select : `select: { ..., image: { select: { mimeType: true } } }`
- Calculer `imageUrl` pour chaque event : si `event.image` existe → `/api/events/${event.id}/image`, sinon → `/gallery/PXL_20250909_120231896.jpg`
- Retourner les events avec `imageUrl` dans la réponse

### 3.5 — Modifier components/sections/Events.tsx
- Changer l'appel API : `fetch("/api/events?limit=3")`
- Ajouter `imageUrl: string` au type `EventItem`
- Chaque card : ajouter `<img src={event.imageUrl} alt={event.title} className="w-full h-48 object-cover rounded-t-2xl" />` **avant** la date/titre/description
- Retirer le padding/flex-col de la card pour laisser l'image toucher les bords supérieurs arrondis
- Sous la grille : ajouter le bouton "Tous nos événements" (`data-testid="events-see-all-btn"`) centré, qui pointe vers `/events`. Ne l'afficher que si `events.length > 0`.

### 3.6 — Nouvelle page publique /events
**`app/events/page.tsx`** — Server Component :
- `import { prisma } from "@/lib/prisma"` et récupérer tous les événements avec `prisma.event.findMany({ orderBy: { date: "asc" }, select: { id, title, description, date, registrationUrl, image: { select: { mimeType: true } } } })`
- Calculer `imageUrl` pour chaque event
- Sérialiser les dates en ISO string
- Passer à `<EventsPageClient initialEvents={serializedEvents} />`

**`app/events/EventsPageClient.tsx`** — Client Component :
- State : `showPast`, `search`, `dateFrom`, `dateTo`
- Filtrage côté client sur `initialEvents` (pas de fetch API)
- Filtres dans l'ordre : showPast → search → dateFrom → dateTo
- Afficher : titre h1 (`data-testid="events-page-title"`), barre de recherche (`events-page-search`), inputs date Du/Au (`events-filter-from` / `events-filter-to`), checkbox (`events-show-past`), grille de cards (réutiliser le même design que la homepage), message vide (`events-page-empty`)
- Les cards utilisent `data-testid="event-card"` (réutilisation des testids existants)

### 3.7 — Modifier admin/events/EventsTable.tsx
- Ajouter le type `hasImage: boolean` au type `EventItem` (déduit de la présence de l'image dans les données)
- Ajouter la colonne "Image" dans le tableau : `<img data-testid="event-thumb" src={"/api/events/${event.id}/image"} />` si l'event a une image, sinon `-`
- Dans `openEditModal`, récupérer l'info `hasImage`
- Dans le formulaire modal : ajouter `<input type="file" accept="image/jpeg,image/png,image/webp" data-testid="event-form-image-input" />`
- Logique de resize via Canvas API (voir spec) dans un handler `handleImageChange`
- Aperçu `data-testid="event-image-preview"` : `<img src={imagePreview} />` (state local `imagePreview`)
- Bouton `data-testid="event-form-delete-image"` visible uniquement si `editingEvent?.hasImage`
- Au submit : après create/update, si `imageDataBase64` est défini → `POST /api/admin/events/[id]/image`
- Si clic sur "Supprimer l'image" : `DELETE /api/admin/events/[id]/image`

### 3.8 — Modifier admin/events/page.tsx
- Inclure `image: { select: { mimeType: true } }` dans le select Prisma
- Ajouter `hasImage: !!event.image` dans la sérialisation

---

## Étape 4 — Faire passer les tests

### Tests HTTP
```bash
npx vitest run __tests__/api/slice-12b-events.http.test.ts
```
Ces tests mockent Prisma et auth. Les imports attendus sont :
- `@/app/api/events/route` → handler modifié
- `@/app/api/events/[id]/image/route` → nouveau
- `@/app/api/admin/events/[id]/image/route` → nouveau

### Tests E2E
```bash
npx playwright test e2e/slice-12b-events.spec.ts
```
Prérequis : serveur lancé (`npm run dev`) + seed exécuté (`npx prisma db seed`).

### Régression — ne pas casser les tests existants
```bash
npx vitest run __tests__/api/slice-12-events.http.test.ts
npx playwright test e2e/slice-12-events.spec.ts
```

---

## Étape 5 — Points d'attention et pièges fréquents

1. **`GET /api/events` — signature de la fonction** : en App Router, les route handlers GET qui lisent les query params doivent recevoir `(req: Request)` ou utiliser `NextRequest`. Sans paramètre, `req` n'est pas disponible. Utiliser `new URL(req.url).searchParams` ou `NextRequest` et `req.nextUrl.searchParams`.

2. **`eventImage.upsert` vs `create`** : utiliser `upsert` (not `create`) pour gérer le cas "remplacer une image existante" en une seule opération :
   ```ts
   prisma.eventImage.upsert({
     where: { eventId },
     create: { eventId, data, mimeType },
     update: { data, mimeType },
   })
   ```

3. **Canvas API dans le navigateur** : la logique de resize est côté client uniquement, dans un `onChange` de l'input file. Utiliser `new Image()`, créer un canvas, `ctx.drawImage(...)`, puis `canvas.toDataURL("image/jpeg", 0.8)`. Cette opération est asynchrone (event `img.onload`). Wrap dans une `Promise`.

4. **Base64 prefix** : la valeur stockée en DB est le data URL complet (`data:image/jpeg;base64,...`). Pour servir l'image via l'API (`GET /api/events/[id]/image`), retirer le préfixe avant de passer à `Buffer.from(...)`. Exemple :
   ```ts
   const base64Data = data.replace(/^data:image\/\w+;base64,/, "")
   const buffer = Buffer.from(base64Data, "base64")
   ```

5. **`@db.Text` obligatoire** : sans cette annotation, Prisma/Neon limite la taille du champ varchar et tronque le base64.

6. **Sérialisation des dates** : la page `app/events/page.tsx` (Server Component) doit sérialiser les dates `Date` en string ISO avant de les passer au Client Component, sinon Next.js lève une erreur de sérialisation.

7. **Ne pas utiliser `useSession`** sur la page `/events` ni dans `EventsPageClient` : ce sont des composants publics hors du groupe `(app)`. Si la session est nécessaire, la passer en prop depuis le Server Component via `auth()`.

8. **Image `object-cover` et hauteur fixe** : pour que toutes les images soient à la même hauteur dans la grille, utiliser `className="w-full h-48 object-cover"` (ou `h-44`, `h-52`) avec `overflow-hidden` sur la card.

9. **`take` vs `limit` dans Prisma** : le paramètre Prisma est `take`, pas `limit`. Vérifier que le test HTTP vérifie bien `expect(call?.take).toBe(3)`.

10. **Fallback image publique** : `/gallery/PXL_20250909_120231896.jpg` est dans `public/gallery/`. Le chemin `/gallery/...` est servi statiquement par Next.js, pas besoin de route API.

---

## Fichiers à créer (nouveaux)
- `app/api/admin/events/[id]/image/route.ts`
- `app/api/events/[id]/image/route.ts`
- `app/events/page.tsx`
- `app/events/EventsPageClient.tsx`

## Fichiers à modifier
- `prisma/schema.prisma`
- `prisma/seed.ts`
- `app/api/events/route.ts`
- `components/sections/Events.tsx`
- `app/(app)/admin/events/EventsTable.tsx`
- `app/(app)/admin/events/page.tsx`
