// components/sections/Gallery.tsx
'use client'
import { motion } from 'framer-motion'
import { SITE } from '@/lib/config/site'
import { Badge } from './_parts'
import { Instagram, Facebook, Linkedin } from 'lucide-react'

export function Gallery() {
  return (
    <section id="galerie" className="mx-auto max-w-7xl px-4 py-16" style={{ background: 'linear-gradient(0deg, rgba(79,209,197,0.08), rgba(79,209,197,0.08))' }}>
      <div className="mb-8 flex items-end justify-between">
        <h2 className="text-3xl font-semibold md:text-4xl">Une ambiance qui donne envie</h2>
        <div className="hidden md:flex items-center gap-2 text-sm text-neutral-600">
          <Badge icon={Instagram}>@placev</Badge>
          <Badge icon={Facebook}>/placev</Badge>
          <Badge icon={Linkedin}>/company/placev</Badge>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        {SITE.gallery.map((src, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.03 }} className="overflow-hidden rounded-2xl">
            <img src={src} alt={`Photo ${i + 1}`} className="h-56 w-full object-cover hover:scale-105 transition" />
          </motion.div>
        ))}
      </div>
    </section>
  )
}
