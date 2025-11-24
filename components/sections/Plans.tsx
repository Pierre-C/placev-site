// components/sections/Plans.tsx
"use client";
import { SITE } from "@/lib/config/site";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";

const plans = [
  {
    name: "Bureau",
    price: 8,
    period: "demi journée",
    features: [
      "Tarif bouliacais : 7 € / demi-journée",
      "Tarif réduit : 4€ / demi-journée",
    ],
    highlight: false,
  },
  {
    name: "Abonnement bureau",
    price: 150,
    period: "mois",
    features: ["Accès illimité du lundi au mercredi", "Placement libre"],
    highlight: true,
  },
  {
    name: "Salle de réunion",
    price: 50,
    period: "2h",
    features: [
      "200€ la journée",
      "Capacité en réunion 10 personnes",
      "Ecran",
      "Fibre",
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
          Venez tester, la 1ère demi-journée est offerte
        </p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
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
      <div className="grid gap-4 md:grid-cols-1 text-center pt-10">
        <a
          href="#contact"
          className="block text-center mx-auto rounded-lg bg-gradient-to-r from-placev-blue to-placev-mint px-4 py-2 text-white hover:opacity-90 transition"
        >
          En savoir plus
        </a>
      </div>
    </section>
  );
}
