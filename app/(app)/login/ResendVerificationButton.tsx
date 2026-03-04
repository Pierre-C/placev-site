"use client"

import { useState } from "react"

export function ResendVerificationButton({ email, testId = "resend-from-login-btn" }: { email: string; testId?: string }) {
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleResend = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setSuccess(true)
      }
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <p data-testid="resend-success" className="mt-2 text-sm font-medium text-amber-900">
        Email renvoyé !
      </p>
    )
  }

  return (
    <button
      data-testid={testId}
      onClick={handleResend}
      disabled={loading || !email}
      className="mt-2 text-sm font-medium underline hover:text-amber-900 disabled:opacity-50"
    >
      {loading ? "Envoi..." : "Renvoyer l'email de vérification"}
    </button>
  )
}
