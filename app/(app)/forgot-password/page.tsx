"use client"

import { useFormState, useFormStatus } from "react-dom"
import { forgotPasswordAction } from "./actions"
import Link from "next/link"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-60"
    >
      {pending ? "Envoi en cours…" : "Réinitialiser le mot de passe"}
    </button>
  )
}

export default function ForgotPasswordPage() {
  const [state, formAction] = useFormState(forgotPasswordAction, { error: "", success: false })

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-neutral-50">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-neutral-900">Mot de passe oublié</h1>

        {state.success ? (
          <div className="space-y-4">
            <p
              data-testid="forgot-password-success"
              className="rounded-lg bg-green-50 p-3 text-sm text-green-700"
            >
              Si un compte existe avec cet email, un lien de réinitialisation vous a été envoyé.
            </p>
            <p className="text-center text-sm">
              <Link href="/login" className="font-medium text-neutral-900 underline">
                Retour à la connexion
              </Link>
            </p>
          </div>
        ) : (
          <>
            <p className="text-sm text-neutral-600">
              Entrez votre adresse email et nous vous enverrons un lien pour réinitialiser votre mot de passe.
            </p>

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

              <SubmitButton />
            </form>

            <p className="text-center text-sm text-neutral-500">
              <Link href="/login" className="font-medium text-neutral-900 underline">
                Retour à la connexion
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
