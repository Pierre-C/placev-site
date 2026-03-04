// components/sections/Plans.tsx
"use client";
import { SITE } from "@/lib/config/site";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import Link from "next/link";

const coworkingPlans = [
  {
    name: "Bureau",
    price: 8,
    period: "demi-journée",
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
];

const meetingPlan = {
  name: "Salle de réunion",
  price: 50,
  period: "2h",
  features: [
    "200€ la journée",
    "Capacité en réunion 10 personnes",
    "Écran",
    "Fibre",
  ],
};

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

      {/* Ligne 1 : Coworking */}
      <div className="grid gap-4 md:grid-cols-2 max-w-4xl mx-auto mb-8">
        {coworkingPlans.map((p, i) => (
          <motion.div
            key={p.name}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.05 }}
            className={`rounded-2xl p-6 border bg-white shadow-sm flex flex-col ${
              p.highlight ? "ring-2 ring-placev-mint" : ""
            }`}
          >
            <div className="flex items-baseline justify-between">
              <h3 className="text-xl font-semibold">{p.name}</h3>
              {p.highlight && (
                <span className="text-sm rounded-full bg-placev-blue/10 text-placev-blue px-2 py-0.5">
                  Populaire
                </span>
              )}
            </div>
            <div className="mt-4 flex-grow">
              <span className="text-4xl font-bold">{p.price}€</span>
              <span className="text-neutral-500"> / {p.period}</span>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-neutral-700">
              {p.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="h-4 w-4 mt-0.5 text-placev-mint shrink-0" /> 
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        ))}
      </div>

      {/* Ligne 2 : Salle de réunion */}
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="rounded-2xl p-6 border bg-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6"
        >
          <div>
            <h3 className="text-xl font-semibold">{meetingPlan.name}</h3>
            <div className="mt-2 mb-4">
              <span className="text-4xl font-bold">{meetingPlan.price}€</span>
              <span className="text-neutral-500"> / {meetingPlan.period}</span>
            </div>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-neutral-700">
              {meetingPlan.features.map((f) => (
                <li key={f} className="flex items-start gap-2">
                  <Check className="h-4 w-4 mt-0.5 text-placev-mint shrink-0" /> 
                  <span>{f}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="shrink-0 flex flex-col gap-3">
            <Link
              href="/booking/meeting-room"
              className="rounded-lg bg-gradient-to-r from-placev-blue to-placev-mint px-6 py-3 text-center text-white font-medium hover:opacity-90 transition"
            >
              Réserver la salle
            </Link>
          </div>
        </motion.div>
      </div>

      <div className="grid gap-4 md:grid-cols-1 text-center pt-10">
        <a
          href="#contact"
          className="inline-block text-center mx-auto rounded-lg px-6 py-2 text-placev-blue font-medium hover:bg-placev-blue/5 transition"
        >
          Nous contacter
        </a>
      </div>
    </section>
  );
}
