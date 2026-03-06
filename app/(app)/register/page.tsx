"use client"

import { useState, useEffect } from "react"
import { useFormState, useFormStatus } from "react-dom"
import { registerAction } from "./actions"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Eye, EyeOff, Info } from "lucide-react"

function SubmitButton() {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 disabled:opacity-60 mt-6"
    >
      {pending ? "Création en cours…" : "Créer mon compte"}
    </button>
  )
}

export default function RegisterPage() {
  const [state, formAction] = useFormState(registerAction, { error: "" })
  const [showPassword, setShowPassword] = useState(false)
  const [isBouliacais, setIsBouliacais] = useState(false)
  const [tarifReduit, setTarifReduit] = useState(false)
  const [showTooltip, setShowTooltip] = useState(false)
  
  const router = useRouter()
  useEffect(() => {
    if (state.success) {
      router.push("/verify-email-sent")
    }
  }, [state.success, router])

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-neutral-50">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-sm my-8">
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="firstName" className="mb-1 block text-sm font-medium text-neutral-700">
                Prénom <span className="text-red-500">*</span>
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                required
                autoComplete="given-name"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="mb-1 block text-sm font-medium text-neutral-700">
                Nom <span className="text-red-500">*</span>
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                required
                autoComplete="family-name"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
              />
            </div>
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
            <div className="relative">
              <input
                id="password"
                name="password"
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

          <div className="space-y-3 pt-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-neutral-700">
                Êtes-vous Bouliacais ?
              </label>
              <input type="hidden" name="isBouliacais" value={isBouliacais ? "true" : "false"} />
              <div className="flex gap-2">
                <button
                  type="button"
                  data-testid="toggle-bouliacais-oui"
                  onClick={() => setIsBouliacais(true)}
                  className={`flex-1 rounded-lg border py-2 text-sm transition-colors ${
                    isBouliacais 
                      ? "border-neutral-900 bg-neutral-900 text-white" 
                      : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  Oui
                </button>
                <button
                  type="button"
                  data-testid="toggle-bouliacais-non"
                  onClick={() => setIsBouliacais(false)}
                  className={`flex-1 rounded-lg border py-2 text-sm transition-colors ${
                    !isBouliacais 
                      ? "border-neutral-900 bg-neutral-900 text-white" 
                      : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  Non
                </button>
              </div>
            </div>

            {!isBouliacais && (
              <div>
                <label htmlFor="city" className="mb-1 block text-sm font-medium text-neutral-700">
                  Ville d'origine
                </label>
                <input
                  id="city"
                  name="city"
                  data-testid="city-input"
                  type="text"
                  required
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-neutral-900"
                />
              </div>
            )}

            <div>
              <div className="mb-2 flex items-center gap-2">
                <label className="block text-sm font-medium text-neutral-700">
                  Souhaitez-vous bénéficier du tarif réduit ?
                </label>
                <div className="relative flex items-center">
                  <button
                    type="button"
                    data-testid="tooltip-tarif-reduit-trigger"
                    onMouseEnter={() => setShowTooltip(true)}
                    onMouseLeave={() => setShowTooltip(false)}
                    onClick={() => setShowTooltip(!showTooltip)}
                    className="text-neutral-400 hover:text-neutral-600 focus:outline-none"
                  >
                    <Info className="h-4 w-4" />
                  </button>
                  {showTooltip && (
                    <div 
                      data-testid="tooltip-tarif-reduit"
                      className="absolute bottom-full left-1/2 z-10 mb-2 w-64 -translate-x-1/2 rounded-lg bg-neutral-900 p-2 text-xs text-white shadow-lg"
                    >
                      Le tarif réduit (4€/demi-journée) s'applique aux étudiants et demandeurs d'emploi sur présentation d'un justificatif à votre arrivée.
                      <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-neutral-900"></div>
                    </div>
                  )}
                </div>
              </div>
              <input type="hidden" name="tarifReduit" value={tarifReduit ? "true" : "false"} />
              <div className="flex gap-2">
                <button
                  type="button"
                  data-testid="toggle-tarif-reduit-oui"
                  onClick={() => setTarifReduit(true)}
                  className={`flex-1 rounded-lg border py-2 text-sm transition-colors ${
                    tarifReduit 
                      ? "border-neutral-900 bg-neutral-900 text-white" 
                      : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  Oui
                </button>
                <button
                  type="button"
                  data-testid="toggle-tarif-reduit-non"
                  onClick={() => setTarifReduit(false)}
                  className={`flex-1 rounded-lg border py-2 text-sm transition-colors ${
                    !tarifReduit 
                      ? "border-neutral-900 bg-neutral-900 text-white" 
                      : "border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50"
                  }`}
                >
                  Non
                </button>
              </div>
            </div>

            <div className="flex items-start gap-2 pt-2">
              <input
                id="cgu"
                name="cgu"
                type="checkbox"
                value="true"
                required
                className="mt-1 h-4 w-4 rounded border-gray-300 text-neutral-900 focus:ring-neutral-900"
              />
              <label htmlFor="cgu" className="text-sm text-neutral-600">
                J'accepte les CGU et la politique de confidentialité <span className="text-red-500">*</span>
              </label>
            </div>
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