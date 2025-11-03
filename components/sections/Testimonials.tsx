// components/sections/Testimonials.tsx
"use client";
import { motion } from "framer-motion";
import { Star } from "lucide-react";

const reviews = [
  {
    name: "Anne T.",
    role: "Artisane fleuriste",
    rating: 5,
    text: "Un espace de co-working convivial, spacieux et très lumineux où il est agréable de venir travailler pour la journée. La halle Vettiner et ses commerces situés juste à côté sont propices aux échanges avec les co-worker. C'est devenu mon bureau du lundi ;)",
  },
  {
    name: "Alexandre C.",
    role: "Consultant",
    rating: 5,
    text: "Chouette endroit, très lumineux, juste à côté des commerces de Bouliac et géré par une super association très dynamique. Wifi au top, endroit calme et belle salle de réunion disponible pour les calls.",
  },
  {
    name: "Florence P.",
    role: "Architecte d'intérieur",
    rating: 5,
    text: "Un espace lumineux, accueillant et de belles rencontres avec les coworkers! Merci beaucoup d'avoir crée ce lieu qui manquait sur notre belle rive droite !",
  },
];

export function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <h2 className="text-3xl font-semibold md:text-4xl text-center">
        Ils nous font confiance
      </h2>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {reviews.map((r, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.04 }}
            className="rounded-2xl border border-black/5 bg-white p-5"
          >
            <div className="flex items-center gap-2">
              {Array.from({ length: r.rating }).map((_, j) => (
                <Star key={j} className="h-4 w-4 fill-current" />
              ))}
            </div>
            <p className="mt-3 text-sm text-neutral-700">“{r.text}”</p>
            <p className="mt-4 text-sm font-medium">{r.name}</p>
            <p className="text-xs text-neutral-500">{r.role}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
