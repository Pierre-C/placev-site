/**
 * app/(app)/login/page.tsx
 * Page de connexion — Client Component.
 * Utilise un Server Action (loginAction) via useFormState.
 * Auth.js v5 : la redirection et le cookie sont gérés côté serveur.
 */

"use client"

import { useFormState, useFormStatus } from "react-dom"
import { loginAction } from "./actions"
import Link from "next/link"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-60"
    >
      {pending ? "Connexion en cours…" : "Se connecter"}
    </button>
  )
}

export default function LoginPage() {
  const [state, formAction] = useFormState(loginAction, { error: "" })

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-neutral-900">Se connecter</h1>

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
            <label htmlFor="email" className="mb-1 block text-sm font-medium text-neutral-700">
              Email
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
              Mot de passe
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoComplete="current-password"
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
            />
          </div>

          <SubmitButton />
        </form>

        <p className="text-center text-sm text-neutral-500">
          Pas encore de compte ?{" "}
          <Link href="/register" className="font-medium text-neutral-900 underline">
            Créer un compte
          </Link>
        </p>
      </div>
    </div>
  )
}
