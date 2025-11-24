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
            L'association
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
            Chez Place V, nous croyons à la force du collectif et à la richesse
            des rencontres.
          </p>

          <p className="text-white">
            Porté par trois habitantes entrepreneures de Bouliac — Place V
            incarne un projet associatif, collectif et accessible, imaginé pour
            celles et ceux qui veulent conjuguer autonomie et convivialité.
          </p>

          <p className="text-white">
            L'association à pour but de créer du lien, s'entraider, transmettre,
            se sentir moins seul au boulot… et bien sûr, partager les joies, les
            galères et les cafés !
            <br />
            <br />
          </p>

          <div className="mt-8 flex justify-center">
            <a
              href="https://www.helloasso.com/associations/place-v/adhesions/adhesions"
              target="_blank"
              className="inline-flex items-center gap-2 rounded-2xl bg-white px-6 py-3 font-medium text-placev-blue shadow-lg hover:shadow-xl hover:scale-105 transition-all"
            >
              <Heart className="h-5 w-5" />
              Adhérez à l'association
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
