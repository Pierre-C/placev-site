"use client"

import { useState, Suspense } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { resetPasswordAction } from "./actions"
import { useSearchParams } from "next/navigation"
import { Eye, EyeOff } from "lucide-react"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-60"
    >
      {pending ? "Réinitialisation…" : "Enregistrer le mot de passe"}
    </button>
  )
}

function ResetPasswordForm() {
  const [state, formAction] = useFormState(resetPasswordAction, { error: "" })
  const [showPassword, setShowPassword] = useState(false)
  const searchParams = useSearchParams()
  const token = searchParams.get("token") || ""

  return (
    <>
      {state.error && (
        <p
          data-testid="error-message"
          className="rounded-lg bg-red-50 p-3 text-sm text-red-700"
        >
          {state.error}
        </p>
      )}

      <form action={formAction} className="space-y-4">
        <input type="hidden" name="token" value={token} />
        
        <div>
          <label htmlFor="newPassword" className="mb-1 block text-sm font-medium text-neutral-700">
            Nouveau mot de passe
          </label>
          <div className="relative">
            <input
              id="newPassword"
              name="newPassword"
              type={showPassword ? "text" : "password"}
              required
              autoComplete="new-password"
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
    </>
  )
}

export default function ResetPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-neutral-50">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-sm">
        <h1 className="text-2xl font-bold text-neutral-900">Nouveau mot de passe</h1>
        
        <Suspense fallback={<p>Chargement...</p>}>
          <ResetPasswordForm />
        </Suspense>
      </div>
    </div>
  )
}
