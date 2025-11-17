// components/Newsletter.tsx
"use client";

import { useState } from "react";
import { Mail, Send } from "lucide-react";

interface NewsletterProps {
  variant?: "default" | "compact";
  className?: string;
}

export function Newsletter({
  variant = "default",
  className = "",
}: NewsletterProps) {
  const [email, setEmail] = useState("");
  const [firstName, setFirstName] = useState("");
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error" | "duplicate"
  >("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setMessage("");

    try {
      const response = await fetch("/api/newsletter", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email,
          firstName,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setStatus("success");
        setMessage(data.message || "Inscription réussie !");
        setEmail("");
        setFirstName("");
      } else {
        // Détection du cas de doublon
        if (response.status === 409 || data.isDuplicate) {
          setStatus("duplicate");
          setMessage(
            data.error || "Vous êtes déjà inscrit à notre newsletter !"
          );
        } else {
          setStatus("error");
          setMessage(data.error || "Une erreur est survenue");
        }
      }
    } catch (error) {
      setStatus("error");
      setMessage("Une erreur est survenue lors de l'inscription");
    }
  };

  if (variant === "compact") {
    return (
      <div className={className}>
        <form onSubmit={handleSubmit} className="flex flex-col gap-2">
          <div className="flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Votre email"
              required
              disabled={status === "loading"}
              className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 text-sm focus:border-placev-blue focus:outline-none focus:ring-2 focus:ring-placev-blue/20 disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={status === "loading"}
              className="rounded-lg bg-gradient-to-r from-placev-blue to-placev-mint px-4 py-2 text-white hover:opacity-90 disabled:opacity-50 transition"
            >
              {status === "loading" ? (
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
          {message && (
            <p
              className={`text-sm ${
                status === "success"
                  ? "text-green-600"
                  : status === "duplicate"
                  ? "text-orange-600"
                  : "text-red-600"
              }`}
            >
              {message}
            </p>
          )}
        </form>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-black/5 bg-white p-6 ${className}`}
    >
      <div className="flex items-center gap-2 mb-2">
        <Mail className="h-5 w-5 text-placev-blue" />
        <h3 className="text-xl font-semibold">Newsletter</h3>
      </div>
      <p className="text-sm text-neutral-600 mb-4">
        Restez informé de nos actualités et offres spéciales
      </p>

      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <input
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Prénom (optionnel)"
            disabled={status === "loading"}
            className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm focus:border-placev-blue focus:outline-none focus:ring-2 focus:ring-placev-blue/20 disabled:opacity-50"
          />
        </div>
        <div>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Votre email"
            required
            disabled={status === "loading"}
            className="w-full rounded-lg border border-neutral-300 px-4 py-2 text-sm focus:border-placev-blue focus:outline-none focus:ring-2 focus:ring-placev-blue/20 disabled:opacity-50"
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className="w-full rounded-lg bg-gradient-to-r from-placev-blue to-placev-mint px-4 py-3 font-medium text-white flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50"
        >
          {status === "loading" ? (
            <>
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
              Inscription...
            </>
          ) : (
            <>
              <Send className="h-5 w-5" />
              S'inscrire
            </>
          )}
        </button>

        {message && (
          <p
            className={`text-sm text-center ${
              status === "success"
                ? "text-green-600"
                : status === "duplicate"
                ? "text-orange-600"
                : "text-red-600"
            }`}
          >
            {message}
          </p>
        )}
      </form>
    </div>
  );
}
