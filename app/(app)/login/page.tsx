/**
 * app/(app)/login/page.tsx
 * Page de connexion — Client Component.
 * Utilise un Server Action (loginAction) via useFormState.
 * Auth.js v5 : la redirection et le cookie sont gérés côté serveur.
 */

"use client"

import { useState } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { loginAction } from "./actions"
import Link from "next/link"
import { Eye, EyeOff } from "lucide-react"

import { ResendVerificationButton } from "./ResendVerificationButton"

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
  const [showPassword, setShowPassword] = useState(false)

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-neutral-900">Se connecter</h1>

        {state.emailNotVerified ? (
          <div data-testid="email-not-verified-msg" className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            <p className="mb-2">Votre adresse email n'a pas encore été vérifiée.</p>
            <ResendVerificationButton email={state.email ?? ""} />
          </div>
        ) : state.error ? (
          <p
            data-testid="error-message"
            className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
          >
            {state.error}
          </p>
        ) : null}

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
            <div className="flex items-center justify-between mb-1">
              <label htmlFor="password" className="block text-sm font-medium text-neutral-700">
                Mot de passe
              </label>
              <Link href="/forgot-password" className="text-xs font-medium text-neutral-500 hover:text-neutral-900 underline">
                Mot de passe oublié ?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                required
                autoComplete="current-password"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 pr-10 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
              <button
                type="button"
                data-testid="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-3 flex items-center text-neutral-400 hover:text-neutral-700"
                aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
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
