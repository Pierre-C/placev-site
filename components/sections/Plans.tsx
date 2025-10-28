// components/sections/Plans.tsx
"use client";
import { motion } from "framer-motion";
import { Check } from "lucide-react";

const plans = [
  {
    name: "Pass Jour",
    price: 25,
    period: "jour",
    features: ["Wifi ultra-rapide", "Espaces communs", "Café & thé"],
    highlight: false,
  },
  {
    name: "Nomade",
    price: 190,
    period: "mois",
    features: [
      "Bureau flexible",
      "Accès 24/7",
      "Phone booths",
      "Crédits salle 4h/mois",
    ],
    highlight: true,
  },
  {
    name: "Résident",
    price: 320,
    period: "mois",
    features: [
      "Bureau dédié",
      "Casier sécurisé",
      "Crédits salle 8h/mois",
      "Domiciliation en option",
    ],
    highlight: false,
  },
  {
    name: "Résident",
    price: 320,
    period: "mois",
    features: [
      "Bureau dédié",
      "Casier sécurisé",
      "Crédits salle 8h/mois",
      "Domiciliation en option",
    ],
    highlight: false,
  },
];

export function Plans() {
  return (
    <section id="offres" className="mx-auto max-w-7xl px-4 py-16">
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-semibold md:text-4xl">
          Des offres simples et transparentes
        </h2>
        <p className="mt-2 text-neutral-600">
          Sans engagement long, upgradez à tout moment.
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-4">
        {plans.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className={`rounded-2xl p-6 border bg-white shadow-sm ${
              p.highlight ? "ring-2 ring-[#4FD1C5]" : ""
            }`}
          >
            <div className="flex items-baseline justify-between">
              <h3 className="text-xl font-semibold">{p.name}</h3>
              {p.highlight && (
                <span className="text-sm rounded-full bg-[#0A6CFF]/10 text-[#0A6CFF] px-2 py-0.5">
                  Populaire
                </span>
              )}
            </div>
            <div className="mt-4">
              <span className="text-4xl font-bold">{p.price}€</span>
              <span className="text-neutral-500"> / {p.period}</span>
            </div>
            <ul className="mt-4 space-y-2 text-sm">
              {p.features.map((f) => (
                <li key={f} className="flex items-center gap-2">
                  <Check className="h-4 w-4" /> {f}
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
