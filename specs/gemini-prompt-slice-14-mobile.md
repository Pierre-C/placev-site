# Prompt Gemini — Slice 14 : Responsiveness mobile et tablette

## Contexte du projet

Tu travailles sur **Place V**, un espace de coworking à Bouliac.
Stack : **Next.js 14.2.5**, **Tailwind CSS**, Auth.js v5 beta, Prisma + Neon.

L'application est développée desktop-first. Cette slice corrige tous les problèmes
de responsiveness pour les formats **mobile (390px, P1)** et **tablette (768px, P2)**.

---

## Règles globales à appliquer dans TOUT le code

Avant toute modification fichier par fichier, intègre ces règles :

| Règle | Avant | Après |
|---|---|---|
| Padding cards | `p-6` | `p-4 sm:p-6` |
| Touch targets boutons | `py-2` ou moins | `py-3` minimum (~44px) |
| Touch targets icônes/cercles | taille libre | `min-w-[44px] min-h-[44px]` |
| Flex horizontal | `flex gap-X` | `flex flex-col sm:flex-row gap-X` |
| Gros titres | `text-3xl` | `text-2xl sm:text-3xl` |
| Grilles 2 colonnes | `grid grid-cols-2` | `grid grid-cols-1 sm:grid-cols-2` |
| Colonnes secondaires tables admin | rien | `hidden md:table-cell` sur `<th>` ET `<td>` |
| Modals | `p-8` intérieur | `p-4 sm:p-8` |

---

## Fichier 1 : `app/(app)/dashboard/DashboardNav.tsx`

**Problème** : 4 onglets en `flex space-x-4` sans scroll. Sur mobile <480px les onglets
"Mon compte" et "Historique" débordent ou se compriment au point d'être illisibles.

**Ce qui doit changer** :

```tsx
// AVANT
<nav data-testid="dashboard-nav" className="flex space-x-4 border-b">
  <Link className="px-3 py-2 text-sm ...">

// APRÈS
<nav data-testid="dashboard-nav" className="flex overflow-x-auto border-b scrollbar-hide">
  <Link className="shrink-0 whitespace-nowrap px-3 py-3 text-sm ...">
```

- Ajouter `overflow-x-auto` sur la `<nav>`
- Ajouter `scrollbar-hide` (classe Tailwind plugin, ou CSS `scrollbar-width: none`)
- Ajouter `shrink-0` et `whitespace-nowrap` sur chaque `<Link>`
- Augmenter `py-2` → `py-3` pour le touch target

Si le plugin Tailwind `scrollbar-hide` n'est pas installé, ajouter ce CSS global :
```css
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
```

---

## Fichier 2 : `app/(app)/dashboard/layout.tsx`

**Problème** : En-tête avec `flex items-center justify-between` comprenant le titre
`text-3xl` + badge de solde. Sur mobile ils se compriment sur une ligne.

**Ce qui doit changer** :

```tsx
// AVANT
<div className="mb-4 flex items-center justify-between">
  <h1 className="text-3xl font-bold text-neutral-900">Bonjour, {user.firstName}</h1>
</div>

// APRÈS
<div className="mb-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
  <h1 className="text-2xl sm:text-3xl font-bold text-neutral-900">Bonjour, {user.firstName}</h1>
</div>
```

Pour le badge de solde :
```tsx
// AVANT
<div className="mb-4 rounded-xl border-2 bg-white px-4 py-3 flex items-center justify-between">

// APRÈS
<div className="mb-4 rounded-xl border-2 bg-white px-3 sm:px-4 py-2.5 sm:py-3 flex items-center justify-between">
```

---

## Fichier 3 : `app/(app)/dashboard/CreditPackCard.tsx`

**Ce qui doit changer** :

```tsx
// AVANT — wrapper
<div data-testid={`credit-pack-${credits}`}
  className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100 flex flex-col">

// APRÈS
<div data-testid={`credit-pack-${credits}`}
  className="rounded-2xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-neutral-100 flex flex-col">
```

```tsx
// AVANT — bouton
className="w-full py-3 bg-blue-500 text-white rounded-xl text-sm font-semibold
           hover:bg-blue-600 disabled:opacity-50 transition"

// APRÈS — py-3 + text-base pour touch target ≥ 44px
className="w-full py-3 bg-blue-500 text-white rounded-xl text-base sm:text-sm font-semibold
           hover:bg-blue-600 disabled:opacity-50 transition"
```

---

## Fichier 4 : `app/(app)/dashboard/CreditQuantitySelector.tsx`

**Ce qui doit changer** :

```tsx
// AVANT — wrapper card
className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-neutral-100 flex flex-col"

// APRÈS
className="rounded-2xl bg-white p-4 sm:p-6 shadow-sm ring-1 ring-neutral-100 flex flex-col"
```

```tsx
// AVANT — boutons +/- (circulaires)
className="... rounded-full border border-neutral-300 ..."

// APRÈS — ajouter min-w et min-h pour touch target 44px
className="... min-w-[44px] min-h-[44px] rounded-full border border-neutral-300 ..."
```

---

## Fichier 5 : `app/(app)/dashboard/UpcomingReservations.tsx`

**Problème** : ligne principale `flex justify-between` peut comprimer sur mobile.
Dialog de confirmation avec 2 boutons en ligne se comprime sur 320px.

**Ce qui doit changer** :

```tsx
// AVANT — ligne de réservation principale
<div className="flex items-center justify-between gap-2">

// APRÈS — empilé sur mobile, en ligne sur sm+
<div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between sm:gap-2">
```

```tsx
// AVANT — boutons de la dialog
<div className="flex gap-2">
  <button className="...px-4 py-2...">Oui, annuler</button>
  <button className="...px-4 py-2...">Garder</button>
</div>

// APRÈS — empilés sur mobile, en ligne sur sm+
<div className="flex flex-col sm:flex-row gap-2">
  <button className="...w-full sm:w-auto px-4 py-3...">Oui, annuler</button>
  <button className="...w-full sm:w-auto px-4 py-3...">Garder</button>
</div>
```

---

## Fichier 6 : `app/(app)/dashboard/mon-compte/ProfileClientPage.tsx`

**Problème** : `grid grid-cols-2 gap-4` sans breakpoint pour les champs Prénom/Nom.

**Ce qui doit changer** :

```tsx
// AVANT
<div className="grid grid-cols-2 gap-4">

// APRÈS
<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
```

Appliquer à TOUTES les grilles 2 colonnes du formulaire (chercher `grid-cols-2` dans ce fichier).

---

## Fichier 7 : `app/(app)/admin/MembersTable.tsx`

**Problème** : Table à 7 colonnes avec `px-6` par cellule. Débordement horizontal
garanti sur mobile et tablette. Scroll horizontal forcé = mauvaise UX.

**Stratégie** : Masquer les colonnes secondaires sur mobile, les afficher sur md+.

**Ce qui doit changer sur le `<thead>`** :

```tsx
// Colonnes à masquer sur mobile (ajouter hidden md:table-cell)
<th className="hidden md:table-cell px-6 py-3 ...">Crédits à vie</th>
<th className="hidden md:table-cell px-6 py-3 ...">Segment</th>
<th className="hidden md:table-cell px-6 py-3 ...">Adhérent</th>
```

**Même chose sur chaque `<tr>` du `<tbody>`** — masquer les `<td>` correspondants :

```tsx
<td className="hidden md:table-cell px-6 py-4 ...">...</td>  {/* crédits à vie */}
<td className="hidden md:table-cell px-6 py-4 ...">...</td>  {/* segment */}
<td className="hidden md:table-cell px-6 py-4 ...">...</td>  {/* adhérent */}
```

**Colonnes conservées sur mobile** : Nom, Email, Crédits, Action.

**Pour la modal des membres** — boutons du footer :

```tsx
// AVANT
<div className="px-8 py-6 bg-neutral-50 flex gap-4 border-t">

// APRÈS
<div className="px-4 sm:px-8 py-4 sm:py-6 bg-neutral-50 flex flex-col sm:flex-row gap-3 border-t">
```

Et dans la modal, remplacer les `p-8` intérieurs par `p-4 sm:p-8`.

---

## Fichier 8 : `app/(app)/admin/quotes/QuotesTable.tsx`

**Même stratégie que MembersTable** :

```tsx
// Masquer sur mobile
<th className="hidden md:table-cell px-6 py-3 ...">Entreprise</th>
<th className="hidden md:table-cell px-6 py-3 ...">Contact</th>

// tbody — même chose sur les <td> correspondants
<td className="hidden md:table-cell ...">...</td>
```

**Colonnes conservées mobile** : Date, Statut, Actions.

**Dans la modal de détail** :

```tsx
// AVANT
<div className="grid grid-cols-3 gap-2">

// APRÈS
<div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
```

---

## Fichier 9 : `app/(app)/admin/events/EventsTable.tsx`

**Ce qui doit changer** :

```tsx
// AVANT — wrapper table sans overflow
<div className="border rounded-md overflow-hidden max-h-[600px] overflow-y-auto">

// APRÈS — ajouter overflow-x-auto
<div className="border rounded-md overflow-hidden max-h-[600px] overflow-y-auto overflow-x-auto">
```

```tsx
// Masquer sur mobile
<th className="hidden md:table-cell p-3">Description</th>
<th className="hidden md:table-cell p-3">Lien</th>

// tbody — même chose
<td className="hidden md:table-cell ...">...</td>
```

**Dans la modal de création** :

```tsx
// AVANT
<div className="bg-white rounded-lg p-6 max-w-md w-full">

// APRÈS
<div className="bg-white rounded-lg p-4 sm:p-6 max-w-md w-full">
```

---

## Fichier 10 : `app/(app)/admin/settings/GlobalSettingsForm.tsx`

```tsx
// AVANT
<div className="flex items-end gap-4">
  <div className="flex-1 max-w-[200px]">
    <input className="w-full" />
  </div>
  <button className="... px-6 py-2.5">Enregistrer</button>
</div>

// APRÈS
<div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-3">
  <div className="w-full sm:max-w-[200px]">
    <input className="w-full" />
  </div>
  <button className="... w-full sm:w-auto px-6 py-3 sm:py-2.5">Enregistrer</button>
</div>
```

---

## Fichier 11 : `app/(app)/admin/calendar/AdminCalendar.tsx`

**Ce qui doit changer (améliorations incrémentales)** :

```tsx
// AVANT — boutons AM/PM
className="flex-1 px-1 py-1.5 text-center text-[10px] ..."

// APRÈS — augmenter le touch target
className="flex-1 px-1 py-2 sm:py-1.5 text-center text-[10px] ..."
```

```tsx
// AVANT — panel de réservations
className="bg-white rounded-2xl shadow-xl p-6"

// APRÈS
className="bg-white rounded-2xl shadow-xl p-4 sm:p-6"
```

---

## CSS global à ajouter (si pas déjà présent)

Dans `app/globals.css` ou `styles/globals.css` :

```css
/* Masquer la scrollbar visuellement tout en conservant le scroll */
.scrollbar-hide::-webkit-scrollbar { display: none; }
.scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
```

---

## Tests à faire passer après implémentation

### Tests unitaires
```bash
npx vitest run __tests__/unit/slice-14-responsive.unit.test.tsx
```

Les tests unitaires vérifient que les composants contiennent les classes responsive
attendues (p-4, overflow-x-auto, shrink-0, whitespace-nowrap, etc.).

### Tests E2E
```bash
npx playwright test e2e/slice-14-mobile-responsive.spec.ts
```

Les tests E2E vérifient sur viewports réels (390px mobile, 768px tablette) :
- Aucun débordement horizontal (`scrollWidth <= clientWidth`)
- Éléments clés visibles
- Touch targets ≥ 44px sur les boutons critiques

---

## Ordre d'implémentation recommandé

1. **DashboardNav.tsx** — impact immédiat sur toute la navigation membre
2. **layout.tsx** — header visible sur toutes les pages membre
3. **CreditPackCard.tsx** + **CreditQuantitySelector.tsx** — page recharge (P1)
4. **UpcomingReservations.tsx** — page principale membre
5. **ProfileClientPage.tsx** — mon compte
6. **MembersTable.tsx** — admin (P2)
7. **QuotesTable.tsx** + **EventsTable.tsx** — admin (P2)
8. **AdminCalendar.tsx** + **GlobalSettingsForm.tsx** — admin (P2)

---

## Ce qu'il NE FAUT PAS modifier

- `app/(app)/dashboard/CreditQuantitySection.tsx` — grille déjà responsive ✓
- `app/(app)/admin/settings/ClosedDatesModal.tsx` — flex-col sm:flex-row déjà en place ✓
- Toutes les routes API (`app/api/**`) — pas de UI
- Les fichiers de tests existants

---

## Contraintes techniques

- **Ne pas casser les `data-testid` existants** — les tests E2E en dépendent
- **Tailwind uniquement** — pas de CSS inline, pas de `style={{}}`
- **Pas de refonte** — corrections ciblées classe par classe
- **Breakpoints prioritaires** : `sm:` (640px) pour mobile→tablette, `md:` (768px) pour tablette→desktop
