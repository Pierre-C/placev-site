/**
 * app/(app)/register/page.tsx
 * Page d'inscription — Client Component.
 * Utilise un Server Action (registerAction) via useFormState.
 * Auth.js v5 : la création de compte, la session et la redirection sont côté serveur.
 */

"use client"

import { useFormState, useFormStatus } from "react-dom"
import { registerAction } from "./actions"
import Link from "next/link"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-60"
    >
      {pending ? "Création en cours…" : "Créer mon compte"}
    </button>
  )
}

export default function RegisterPage() {
  const [state, formAction] = useFormState(registerAction, { error: "" })

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-neutral-900">Créer un compte</h1>

        {state.error && (
          <p
            data-testid="error-message"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {state.error}
          </p>
        )}

        <form action={formAction} className="space-y-4">
          <div>
            <label htmlFor="name" className="mb-1 block text-sm font-medium text-neutral-700">
              Nom complet
            </label>
            <input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          <div>
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-neutral-700">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              autoComplete="email"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          <div>
            <label htmlFor="password" className="mb-1 block text-sm font-medium text-neutral-700">
              Mot de passe <span className="text-red-500">*</span>
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="new-password"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          <div>
            <label htmlFor="segment" className="mb-1 block text-sm font-medium text-neutral-700">
              Tarif
            </label>
            <select
              id="segment"
              name="segment"
              defaultValue="EXTERNE"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            >
              <option value="EXTERNE">Externe (8 € / crédit)</option>
              <option value="BOULIACAIS">Bouliacais (7 € / crédit)</option>
              <option value="REDUIT">Tarif réduit (4 € / crédit)</option>
            </select>
          </div>

          <SubmitButton />
        </form>

        <p className="text-center text-sm text-neutral-500">
          Déjà un compte ?{" "}
          <Link href="/login" className="font-medium text-neutral-900 underline">
            Se connecter
          </Link>
        </p>
      </div>
    </div>
  )
}
