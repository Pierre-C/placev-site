// components/sections/Hero.tsx
"use client";
import { motion } from "framer-motion";
import { Badge } from "./_parts";
import { SITE } from "@/lib/config/site";
import {
  ArrowRight,
  Calendar,
  MapPin,
  Wifi,
  Coffee,
  Clock,
} from "lucide-react";

export function Hero() {
  return (
    <section
      className="relative overflow-hidden"
      style={{ background: SITE.palette.white }}
    >
      <div className="mx-auto max-w-7xl px-4 py-20 lg:py-28">
        <div className="grid gap-8 lg:grid-cols-2 lg:gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h1 className="mt-5 text-4xl font-bold leading-tight md:text-6xl">
              {SITE.tagline}
            </h1>
            <p className="mt-5 text-lg text-neutral-600">
              12 bureaux en open space & une salle de réunion équipée. Ouvert du
              lundi au mercredi, de 8:30 à 18:00. Commerces, restaurants,
              parking à proximité.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <a
                href="#contact"
                className="rounded-2xl bg-gradient-to-r from-placev-blue to-placev-mint px-5 py-3 font-medium text-white inline-flex items-center gap-2 shadow-cta hover:opacity-90 transition"
              >
                {SITE.primaryCTA}
                <ArrowRight className="h-4 w-4" />
              </a>
            </div>
            <div className="mt-6 flex flex-wrap items-center gap-3 text-sm text-neutral-600">
              <Badge icon={Clock}>Du lundi au mercredi</Badge>
              <Badge icon={MapPin}>
                13 rue du bourg, Espace Saxon, 33270 Bouliac
              </Badge>
              <Badge icon={Wifi}>Fibre très haut débit</Badge>
              <Badge icon={Coffee}>Café & thé à volonté</Badge>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative h-[400px] lg:h-[500px] rounded-2xl overflow-hidden shadow-xl"
          >
            <img
              src="/gallery/PXL_20250909_120231896.jpg"
              alt="Espace Place V Coworking"
              className="h-full w-full object-cover"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
