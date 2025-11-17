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
    features: ["Tarif bouliacais : 7 €", "Tarif réduit : 4€"],
    highlight: false,
  },
  {
    name: "Abonnement",
    price: 150,
    period: "mois",
    features: ["Bureau flexible", "Accès libre", "Phone booth"],
    highlight: true,
  },
  {
    name: "Salle de réunion",
    price: 50,
    period: "2h",
    features: [
      "100€ la demi journée",
      "200€ par jour",
      "8 à 10 personnnes",
      "Ecran",
      "Fibre",
    ],
    highlight: false,
  },
];

export function Plans() {
  const mailtoLink = `mailto:${SITE.email}?subject=Demande de renseignements - PlaceV Coworking&body=Bonjour,%0D%0A%0D%0AJe souhaite obtenir plus d'informations sur vos espaces de coworking.%0D%0A%0D%0ACordialement`;
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
        <Link
          href={mailtoLink}
          className="block text-center mx-auto rounded-lg bg-gradient-to-r from-placev-blue to-placev-mint px-4 py-2 text-white"
        >
          En savoir plus
        </Link>
      </div>
    </section>
  );
}
