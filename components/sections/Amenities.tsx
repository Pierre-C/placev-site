// components/sections/Amenities.tsx
"use client";
import { motion } from "framer-motion";
import {
  Wifi,
  Users,
  Coffee,
  MonitorSmartphone,
  Sun,
  Snowflake,
  Shield,
  Plug,
  CarTaxiFront,
  ShoppingBag,
} from "lucide-react";
import { SITE } from "@/lib/config/site";

const items = [
  { icon: Wifi, title: "Internet ultra-rapide", desc: "Fibre" },
  { icon: Users, title: "Salle de réunion", desc: "8 à 10 personnes" },
  { icon: Coffee, title: "Café & Thé", desc: "Boissons chaudes à volonté" },
  {
    icon: MonitorSmartphone,
    title: "Phone booths",
    desc: "Cabine insonorisée",
  },
  {
    icon: ShoppingBag,
    title: "Proche des commerces",
    desc: "Boulangerie, boucherie et restaurants",
  },
  { icon: Snowflake, title: "Climatisation", desc: "Confort été comme hiver" },
  {
    icon: Shield,
    title: "Cuisine",
    desc: "Frigo, micro-ondes...",
  },
  { icon: CarTaxiFront, title: "Parking", desc: "Gratuit, à proximité" },
];

export function Amenities() {
  return (
    <section
      id="services"
      className="mx-auto max-w-7xl px-4 py-16 rounded-2xl"
      style={{ background: SITE.palette.cream }}
    >
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-semibold md:text-4xl">
          Tout ce qu'il faut pour bien travailler
        </h2>
        <p className="mt-2 text-neutral-600"></p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.03 }}
            className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm"
          >
            <it.icon className="h-6 w-6" />
            <h3 className="mt-3 font-medium">{it.title}</h3>
            <p className="mt-1 text-sm text-neutral-600">{it.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  );
}
