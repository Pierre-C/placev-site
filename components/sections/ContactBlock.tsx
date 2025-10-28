// components/sections/ContactBlock.tsx
import { MapPin, Phone, Mail, Clock } from 'lucide-react'
import { SITE } from '@/lib/config/site'

export function ContactBlock() {
  return (
    <section id="contact" className="mx-auto max-w-7xl px-4 py-16">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-white p-6">
          <h3 className="text-xl font-semibold">Nous contacter</h3>
          <p className="mt-2 text-sm text-neutral-600">Une question ? Envoyez-nous un message, on répond vite.</p>
          <form className="mt-6 grid gap-3">
            <input placeholder="Votre nom" className="rounded-xl border border-black/10 px-4 py-2" />
            <input type="email" placeholder="Votre email" className="rounded-xl border border-black/10 px-4 py-2" />
            <textarea placeholder="Votre message" rows={4} className="rounded-xl border border-black/10 px-4 py-2" />
            <button type="button" className="rounded-xl bg-gradient-to-r from-placev-blue to-placev-mint px-4 py-2 font-medium text-white">Envoyer</button>
            <p className="text-xs text-neutral-500">En cliquant sur « Envoyer », vous acceptez notre politique de confidentialité.</p>
          </form>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-6">
          <h3 className="text-xl font-semibold">Infos pratiques</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {SITE.address}</li>
            <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> {SITE.phone}</li>
            <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> {SITE.email}</li>
            <li className="flex items-center gap-2"><Clock className="h-4 w-4" /> Ouvert 24/7 pour les membres</li>
          </ul>
          <div className="mt-6 h-64 w-full overflow-hidden rounded-xl">
            <img src="https://images.unsplash.com/photo-1505761671935-60b3a7427bad?q=80&w=1200&auto=format&fit=crop" alt="Plan d'accès" className="h-full w-full object-cover" />
          </div>
        </div>
      </div>
    </section>
  )
}
