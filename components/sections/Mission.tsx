// components/sections/Mission.tsx
"use client";
import { motion } from "framer-motion";
import { Heart, Users, Lightbulb, Coffee } from "lucide-react";

export function Mission() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl font-semibold md:text-4xl">Notre mission</h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-8 space-y-6 text-lg text-neutral-700 leading-relaxed"
        >
          <p>
            À Place V, nous croyons à la force du collectif et à la richesse
            des rencontres.
          </p>

          <p>
            Né au cœur de Bouliac, notre espace de coworking associatif à
            taille humaine est un lieu où l'on travaille, échange, apprend et
            crée ensemble.
          </p>

          <p>
            Porté par trois habitantes entrepreneures de Bouliac —{" "}
            <strong>Marlène Bonhomme</strong>,{" "}
            <strong>Suzanne Boureau</strong> et <strong>Margot Rota</strong> —
            Place V incarne un projet associatif, collectif et accessible,
            imaginé pour celles et ceux qui veulent conjuguer autonomie et
            convivialité.
          </p>

          <div className="bg-gradient-to-r from-placev-blue/5 to-placev-mint/5 rounded-2xl p-6 my-8">
            <p className="text-xl font-medium text-neutral-900 mb-4">
              Notre ambition ?
            </p>
            <p>
              Créer du lien, s'entraider, mutualiser les idées, se sentir moins
              seul au boulot… et bien sûr, partager les joies, les galères et
              les cafés !
            </p>
          </div>

          <p>
            Plus qu'un simple lieu de travail, Place V est aussi un espace de
            transmission : des savoir-faire, des savoir-être, et des valeurs
            qui font vivre le <strong>Village</strong>, la <strong>Vie</strong>{" "}
            et surtout <strong>Vous</strong>.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-12 grid gap-4 sm:grid-cols-2 md:grid-cols-4"
        >
          {[
            { icon: Heart, label: "Convivialité" },
            { icon: Users, label: "Collectif" },
            { icon: Lightbulb, label: "Transmission" },
            { icon: Coffee, label: "Partage" },
          ].map((item, i) => (
            <div
              key={i}
              className="flex flex-col items-center gap-2 rounded-xl border border-black/5 bg-white p-4 text-center"
            >
              <item.icon className="h-8 w-8 text-placev-blue" />
              <span className="font-medium text-neutral-900">
                {item.label}
              </span>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}

