// components/sections/Testimonials.tsx
'use client'
import { motion } from 'framer-motion'
import { Star } from 'lucide-react'

const reviews = [
  { name: 'Camille R.', role: 'Freelance UX', rating: 5, text: 'Super ambiance, super équipe. La fibre file, les phone booths sauvent mes calls.' },
  { name: 'Yanis M.', role: 'Startup CTO', rating: 5, text: 'On a commencé à 2, on est 8 maintenant. Les salles sont nickel et le staff réactif.' },
  { name: 'Lucia P.', role: 'Indé Marketing', rating: 4, text: 'Quartier top et très lumineux. Le café est une tuerie.' },
]

export function Testimonials() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-16">
      <h2 className="text-3xl font-semibold md:text-4xl text-center">Ils nous font confiance</h2>
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        {reviews.map((r, i) => (
          <motion.div key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.4, delay: i * 0.04 }} className="rounded-2xl border border-black/5 bg-white p-5">
            <div className="flex items-center gap-2">
              {Array.from({ length: r.rating }).map((_, j) => <Star key={j} className="h-4 w-4 fill-current" />)}
            </div>
            <p className="mt-3 text-sm text-neutral-700">“{r.text}”</p>
            <p className="mt-4 text-sm font-medium">{r.name}</p>
            <p className="text-xs text-neutral-500">{r.role}</p>
          </motion.div>
        ))}
      </div>
    </section>
  )
}
