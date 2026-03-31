# Prompt Gemini — Slice 14b : Responsiveness admin (suite)

## Contexte

Tu travailles sur **Place V**, un espace de coworking.
Stack : **Next.js 14.2.5**, **Tailwind CSS**.

La responsiveness membre a déjà été corrigée (slice 14a). Cette slice corrige
les 3 fichiers admin restants. Les modifications sont **ciblées** — aucune
refonte, corrections classe par classe uniquement.

---

## Fichier 1 : `app/(app)/admin/events/EventsTable.tsx`

### 1a. Ajouter `overflow-x-auto` sur le wrapper de table

```tsx
// AVANT (ligne ~223)
<div className="border rounded-md overflow-hidden max-h-[600px] overflow-y-auto">

// APRÈS
<div className="border rounded-md overflow-hidden max-h-[600px] overflow-y-auto overflow-x-auto">
```

### 1b. Masquer les colonnes Description et Lien sur mobile

Dans le `<thead>` :

```tsx
// AVANT
<th className="p-3 font-semibold">Description</th>
// ...
<th className="p-3 font-semibold">Lien</th>

// APRÈS
<th className="hidden md:table-cell p-3 font-semibold">Description</th>
// ...
<th className="hidden md:table-cell p-3 font-semibold">Lien</th>
```

Dans le `<tbody>`, sur chaque `<tr>` :

```tsx
// AVANT — td Description
<td className="p-3">
  <span className="truncate block max-w-xs" ...>

// APRÈS
<td className="hidden md:table-cell p-3">
  <span className="truncate block max-w-xs" ...>

// AVANT — td Lien
<td className="p-3">
  {event.registrationUrl ? ...}

// APRÈS
<td className="hidden md:table-cell p-3">
  {event.registrationUrl ? ...}
```

**Colonnes conservées sur mobile** : Image, Titre, Date, Actions.

### 1c. Modal de création/édition

```tsx
// AVANT (ligne ~317)
<div className="bg-white rounded-lg p-6 max-w-md w-full my-auto" data-testid="event-form-modal">

// APRÈS
<div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full my-auto" data-testid="event-form-modal">
```

---

## Fichier 2 : `app/(app)/admin/settings/GlobalSettingsForm.tsx`

### 2a. Section Capacité — layout flex

```tsx
// AVANT (ligne ~84)
<div className="flex items-end gap-4">
  <div className="flex-1 max-w-[200px]">
    <label ...>Nombre de places</label>
    <input ... className="w-full ..." />
  </div>
  <button data-testid="save-settings" ... className="bg-neutral-900 text-white px-6 py-2.5 rounded-xl ...">
    Enregistrer
  </button>
</div>

// APRÈS
<div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
  <div className="w-full sm:max-w-[200px]">
    <label ...>Nombre de places</label>
    <input ... className="w-full ..." />
  </div>
  <button data-testid="save-settings" ... className="bg-neutral-900 text-white px-6 py-3 sm:py-2.5 rounded-xl w-full sm:w-auto ...">
    Enregistrer
  </button>
</div>
```

### 2b. Chercher et corriger les autres occurrences similaires dans ce fichier

Chercher tous les patterns `flex items-end gap-4` avec un input + un bouton côte à côte dans ce fichier, et appliquer le même traitement (`flex-col sm:flex-row`, `w-full sm:w-auto` sur le bouton, `w-full sm:max-w-[...]` sur l'input).

---

## Fichier 3 : `app/(app)/admin/calendar/AdminCalendar.tsx`

### 3a. Boutons AM/PM — augmenter le touch target

```tsx
// AVANT — bouton AM (ligne ~380)
className={`flex-1 px-1 py-1.5 text-center text-[10px] leading-tight transition-colors ${...}`}

// APRÈS
className={`flex-1 px-1 py-2 sm:py-1.5 text-center text-[10px] leading-tight transition-colors ${...}`}
```

Appliquer la même correction sur le bouton PM (même pattern, juste en dessous).

### 3b. Panel de réservations — padding

```tsx
// AVANT (ligne ~412)
<div data-testid="admin-slots-panel" className="bg-white rounded-2xl shadow-xl ring-1 ring-neutral-100 p-6 space-y-6">

// APRÈS
<div data-testid="admin-slots-panel" className="bg-white rounded-2xl shadow-xl ring-1 ring-neutral-100 p-4 sm:p-6 space-y-6">
```

### 3c. Tableau dans le panel — négatif margin mobile

Le tableau des réservations dans le panel a déjà `overflow-x-auto`. Ajouter le
débordement négatif pour que le scroll commence au bord de l'écran sur mobile :

```tsx
// Chercher le div wrappant le tableau dans le panel (celui qui a overflow-x-auto)
// AVANT
<div className="overflow-x-auto">

// APRÈS
<div className="overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0">
```

---

## Ce qu'il ne faut PAS modifier

- Aucun `data-testid` existant
- Aucun fichier déjà traité dans la slice 14a :
  - `DashboardNav.tsx` ✅
  - `layout.tsx` ✅
  - `CreditPackCard.tsx` ✅
  - `CreditQuantitySelector.tsx` ✅
  - `UpcomingReservations.tsx` ✅
  - `ProfileClientPage.tsx` ✅
  - `MembersTable.tsx` ✅
  - `QuotesTable.tsx` ✅ (colonnes masquées + modal corrigée)
- Aucun fichier API (`app/api/**`)
- Aucun fichier de test

---

## Contraintes

- **Tailwind uniquement** — pas de CSS inline, pas de `style={{}}`
- **Pas de refonte** — uniquement les 3 points listés par fichier
- **Ne pas casser les `data-testid`** — les tests E2E en dépendent
- Breakpoints : `sm:` (640px) pour mobile→tablette, `md:` (768px) pour tablette→desktop

---

## Vérification après implémentation

```bash
npx playwright test e2e/slice-14-mobile-responsive.spec.ts
```

Les tests admin dans cette spec vérifient :
- Pas de débordement horizontal sur `/admin/members`
- Table membres visible sur tablette (768px)
