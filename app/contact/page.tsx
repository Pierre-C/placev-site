// app/contact/page.tsx
"use client";

import { Send } from "lucide-react";
import { useState, FormEvent } from "react";

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Une erreur est survenue");
      }

      setStatus("success");
      setFormData({ name: "", email: "", phone: "", message: "" });
      
      // Réinitialiser le message de succès après 5 secondes
      setTimeout(() => {
        setStatus("idle");
      }, 5000);
    } catch (error: any) {
      setStatus("error");
      setErrorMessage(error.message);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <h1 className="text-3xl font-semibold">Contact</h1>
      <p className="mt-2 text-neutral-600">Écrivez-nous, on répond vite.</p>
      
      <form onSubmit={handleSubmit} className="mt-6 grid gap-3 max-w-lg">
        <input
          type="text"
          placeholder="Votre nom *"
          required
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="rounded-xl border border-black/10 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-placev-blue"
        />
        <input
          type="email"
          placeholder="Votre email *"
          required
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          className="rounded-xl border border-black/10 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-placev-blue"
        />
        <input
          type="tel"
          placeholder="Votre téléphone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          className="rounded-xl border border-black/10 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-placev-blue"
        />
        <textarea
          placeholder="Votre message *"
          required
          rows={4}
          value={formData.message}
          onChange={(e) => setFormData({ ...formData, message: e.target.value })}
          className="rounded-xl border border-black/10 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-placev-blue"
        />

        {status === "success" && (
          <div className="rounded-xl bg-green-50 border border-green-200 p-3 text-sm text-green-800">
            ✓ Message envoyé avec succès ! Nous vous répondrons rapidement.
          </div>
        )}

        {status === "error" && (
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-sm text-red-800">
            ✗ {errorMessage}
          </div>
        )}

        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-xl bg-gradient-to-r from-placev-blue to-placev-mint px-4 py-2 font-medium text-white shadow-cta flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4" />
          {status === "loading" ? "Envoi en cours..." : "Envoyer"}
        </button>
      </form>
    </div>
  );
}
