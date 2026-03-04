"use client"

import { useEffect, Suspense, useRef } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { autoLoginAction } from "./actions"

function AutoLogin() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const vt = searchParams.get("vt")
  const attempted = useRef(false)

  useEffect(() => {
    if (!vt) { 
      router.push("/login?verified=1")
      return 
    }
    
    if (attempted.current) return
    attempted.current = true

    autoLoginAction(vt).then((result) => {
      if (result?.error) {
        router.push("/login?verified=1")
      }
    })
  }, [vt, router])

  return (
    <p data-testid="autologin-spinner" className="text-neutral-600">
      Connexion en cours…
    </p>
  )
}

export default function VerifyEmailCallbackPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-sm text-center">
        <h1 className="text-2xl font-bold text-neutral-900 mb-4">Vérification réussie</h1>
        <Suspense fallback={<p>Chargement...</p>}>
          <AutoLogin />
        </Suspense>
      </div>
    </div>
  )
}