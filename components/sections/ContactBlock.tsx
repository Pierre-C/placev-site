// components/sections/ContactBlock.tsx
"use client";

import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { Newsletter } from "@/components/Newsletter";
import { SITE } from "@/lib/config/site";
import { useState, FormEvent } from "react";

export function ContactBlock() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });
  const [status, setStatus] = useState<
    "idle" | "loading" | "success" | "error"
  >("idle");
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
    <section id="contact" className="mx-auto max-w-7xl px-4 py-16">
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-black/5 bg-white p-6">
          <h3 className="text-xl font-semibold">Nous contacter</h3>
          <p className="mt-2 text-sm text-neutral-600">
            Une question ? Envoyez-nous un message, on répond vite.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-3">
            <input
              type="text"
              placeholder="Votre nom *"
              required
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className="w-full rounded-xl border border-black/10 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-placev-blue"
            />
            <input
              type="email"
              placeholder="Votre email *"
              required
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className="w-full rounded-xl border border-black/10 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-placev-blue"
            />
            <input
              type="tel"
              placeholder="Votre téléphone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              className="w-full rounded-xl border border-black/10 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-placev-blue"
            />
            <textarea
              placeholder="Votre message *"
              required
              rows={4}
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              className="w-full rounded-xl border border-black/10 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-placev-blue"
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
              className="w-full rounded-xl bg-gradient-to-r from-placev-blue to-placev-mint px-4 py-3 font-medium text-white flex items-center justify-center gap-2 hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="h-4 w-4" />
              {status === "loading"
                ? "Envoi en cours..."
                : "Envoyer le message"}
            </button>
          </form>

          <div className="mt-4 pt-4 border-t border-black/5">
            <p className="text-sm text-neutral-600 mb-2">
              Ou contactez-nous directement :
            </p>
            <div className="grid gap-2 text-sm">
              <a
                href={`mailto:${SITE.email}`}
                className="flex items-center gap-2 text-neutral-600 hover:text-placev-blue transition"
              >
                <Mail className="h-4 w-4" />
                {SITE.email}
              </a>
              <a
                href={`tel:${SITE.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-2 text-neutral-600 hover:text-placev-blue transition"
              >
                <Phone className="h-4 w-4" />
                {SITE.phone}
              </a>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-6">
          <h3 className="text-xl font-semibold">Infos pratiques</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> {SITE.address}
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> {SITE.phone}
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> {SITE.email}
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4" /> Ouvert du lundi au mercredi, de 8:30
              à 18:00
            </li>
          </ul>
          <div className="mt-6 h-64 w-full overflow-hidden rounded-xl">
            <img
              src="/gallery/PXL_20250909_120231896.jpg"
              alt="Plan d'accès"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
        <div data-testid="contact-newsletter" className="rounded-2xl border border-black/5 bg-white p-6">
          <Newsletter variant="default" />
        </div>
      </div>
    </section>
  );
}
