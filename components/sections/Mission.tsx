// components/sections/Mission.tsx
"use client";
import { motion } from "framer-motion";
import { Heart, Users, Lightbulb, Coffee } from "lucide-react";

export function Mission() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16 bg-placev-blue rounded-2xl">
      <div className="mx-auto max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <h2 className="text-3xl font-semibold md:text-4xl text-white">
            Notre mission
          </h2>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="mt-8 space-y-6 text-lg text-neutral-700 leading-relaxed text-center color-white"
        >
          <p className="text-white">
            à Place V, nous croyons à la force du collectif et à la richesse des
            rencontres.
          </p>

          <p className="text-white">
            Porté par trois habitantes entrepreneures de Bouliac —{" "}
            <strong>Marlène Bonhomme</strong>, <strong>Suzanne Boureau</strong>{" "}
            et <strong>Margot Rota</strong> — Place V incarne un projet
            associatif, collectif et accessible, imaginé pour celles et ceux qui
            veulent conjuguer autonomie et convivialité.
          </p>

          <p className="text-white">
            L'association à pour but de créer du lien, s'entraider, mutualiser
            les idées, se sentir moins seul au boulot… et bien sûr, partager les
            joies, les galères et les cafés !
          </p>

          <p className="text-white">
            Plus qu'un simple lieu de travail, Place V est aussi un espace de
            transmission : des savoir-faire, des savoir-être, et des valeurs qui
            font vivre le <strong>Village</strong>, la <strong>Vie</strong> et
            surtout <strong>Vous</strong>.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
