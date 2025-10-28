// components/sections/Amenities.tsx
'use client'
import { motion } from 'framer-motion'
import { Wifi, Users, Coffee, MonitorSmartphone, Sun, Snowflake, Shield, Plug } from 'lucide-react'

const items = [
  { icon: Wifi, title: 'Internet ultra-rapide', desc: 'Fibre 1 Gbps symétrique' },
  { icon: Users, title: 'Salles de réunion', desc: '3 à 12 personnes, écrans 4K' },
  { icon: Coffee, title: 'Café de spécialité', desc: 'Thé & snacks inclus' },
  { icon: MonitorSmartphone, title: 'Phone booths', desc: 'Cabines insonorisées' },
  { icon: Sun, title: 'Lumière naturelle', desc: 'Grands puits de jour' },
  { icon: Snowflake, title: 'Climatisation', desc: 'Confort été comme hiver' },
  { icon: Shield, title: 'Sécurité', desc: 'Badge + vidéo 24/7' },
  { icon: Plug, title: 'Beaucoup de prises', desc: 'USB-C et multi standards' },
]

export function Amenities() {
  return (
    <section id="services" className="mx-auto max-w-7xl px-4 py-16" style={{ background: '#FFF6E9' }}>
      <div className="mb-10 text-center">
        <h2 className="text-3xl font-semibold md:text-4xl">Tout ce qu'il faut pour bien travailler</h2>
        <p className="mt-2 text-neutral-600">Des services inclus, sans frais cachés.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((it, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.03 }} className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <it.icon className="h-6 w-6" />
            <h3 className="mt-3 font-medium">{it.title}</h3>
            <p className="mt-1 text-sm text-neutral-600">{it.desc}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
