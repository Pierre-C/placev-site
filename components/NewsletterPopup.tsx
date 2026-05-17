"use client"

import { useEffect, useState } from "react"
import { X } from "lucide-react"
import { Newsletter } from "@/components/Newsletter"

const LS_SUBSCRIBED = "nl-subscribed"
const LS_DISMISSED_AT = "nl-dismissed-at"
const DISMISS_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 jours
const SHOW_DELAY_MS = 5000

function shouldShow(): boolean {
  try {
    if (localStorage.getItem(LS_SUBSCRIBED)) return false
    const dismissedAt = localStorage.getItem(LS_DISMISSED_AT)
    if (dismissedAt && Date.now() - Number(dismissedAt) < DISMISS_TTL_MS) return false
  } catch {
    return false
  }
  return true
}

export function NewsletterPopup() {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!shouldShow()) return
    const timer = setTimeout(() => setVisible(true), SHOW_DELAY_MS)
    return () => clearTimeout(timer)
  }, [])

  function dismiss() {
    try { localStorage.setItem(LS_DISMISSED_AT, String(Date.now())) } catch {}
    setVisible(false)
  }

  // Appelé par le composant Newsletter via la réponse 200 ou 409
  function onSubscribeResult(status: "success" | "duplicate") {
    if (status === "success" || status === "duplicate") {
      try { localStorage.setItem(LS_SUBSCRIBED, "1") } catch {}
      setTimeout(() => setVisible(false), 2000)
    }
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Inscription à la newsletter Place V"
      className="fixed inset-0 z-50 flex items-end justify-center sm:items-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        onClick={dismiss}
        aria-hidden="true"
      />

      {/* Panel */}
      <div className="relative z-10 w-full max-w-md rounded-2xl bg-white shadow-2xl p-6">
        <button
          onClick={dismiss}
          aria-label="Fermer"
          className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <p className="text-xs font-semibold uppercase tracking-widest text-blue-600 mb-1">
          Restez connecté·e
        </p>
        <h2 className="text-xl font-bold text-neutral-900 mb-1">
          Suivez l'actu de Place V
        </h2>
        <p className="text-sm text-neutral-500 mb-5">
          Événements, ateliers, nouveautés… rien ne vous échappe.
        </p>

        <NewsletterPopupForm onResult={onSubscribeResult} />

        <button
          onClick={dismiss}
          className="mt-3 w-full text-xs text-neutral-400 hover:text-neutral-600 transition text-center"
        >
          Non merci, peut-être plus tard
        </button>
      </div>
    </div>
  )
}

// Wrapper autour de Newsletter pour intercepter le résultat
function NewsletterPopupForm({
  onResult,
}: {
  onResult: (status: "success" | "duplicate") => void
}) {
  const [email, setEmail] = useState("")
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error" | "duplicate">("idle")
  const [message, setMessage] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setStatus("loading")
    try {
      const res = await fetch("/api/newsletter", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      if (res.ok) {
        setStatus("success")
        setMessage("Vous êtes inscrit·e !")
        onResult("success")
      } else if (res.status === 409) {
        setStatus("duplicate")
        setMessage("Vous êtes déjà inscrit·e à notre newsletter !")
        onResult("duplicate")
      } else {
        setStatus("error")
        setMessage("Une erreur est survenue, réessayez.")
      }
    } catch {
      setStatus("error")
      setMessage("Une erreur est survenue, réessayez.")
    }
  }

  if (status === "success" || status === "duplicate") {
    return (
      <p className={`text-sm font-medium text-center py-2 ${status === "success" ? "text-green-600" : "text-orange-600"}`}>
        {message}
      </p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3">
      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="votre@email.fr"
        required
        disabled={status === "loading"}
        className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
      />
      {status === "error" && (
        <p className="text-xs text-red-600">{message}</p>
      )}
      <button
        type="submit"
        disabled={status === "loading"}
        className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
      >
        {status === "loading" ? "Inscription…" : "Je m'inscris"}
      </button>
    </form>
  )
}
