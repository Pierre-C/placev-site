// components/sections/ContactBlock.tsx
'use client'
import { useState } from 'react'
import { MapPin, Phone, Mail, Clock, Loader2, CheckCircle } from 'lucide-react'
import { SITE } from '@/lib/config/site'

export function ContactBlock() {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' })
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de l\'envoi')
      }

      setSuccess(true)
      setFormData({ name: '', email: '', message: '' })
      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="contact" className="mx-auto max-w-7xl px-4 py-16">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-white p-6">
          <h3 className="text-xl font-semibold">Nous contacter</h3>
          <p className="mt-2 text-sm text-neutral-600">Une question ? Envoyez-nous un message, on répond vite.</p>
          
          <form onSubmit={handleSubmit} className="mt-6 grid gap-3">
            <input 
              placeholder="Votre nom" 
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              disabled={loading}
              className="rounded-xl border border-black/10 px-4 py-2 disabled:opacity-50" 
            />
            <input 
              type="email" 
              placeholder="Votre email" 
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
              disabled={loading}
              className="rounded-xl border border-black/10 px-4 py-2 disabled:opacity-50" 
            />
            <textarea 
              placeholder="Votre message" 
              rows={4} 
              value={formData.message}
              onChange={(e) => setFormData({ ...formData, message: e.target.value })}
              required
              disabled={loading}
              className="rounded-xl border border-black/10 px-4 py-2 disabled:opacity-50" 
            />
            
            <button 
              type="submit" 
              disabled={loading}
              className="rounded-xl bg-gradient-to-r from-placev-blue to-placev-mint px-4 py-2 font-medium text-white disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Envoi en cours...
                </>
              ) : success ? (
                <>
                  <CheckCircle className="h-4 w-4" />
                  Message envoyé !
                </>
              ) : (
                'Envoyer'
              )}
            </button>

            {error && (
              <p className="text-sm text-red-600 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            {success && (
              <p className="text-sm text-green-600 bg-green-50 px-3 py-2 rounded-lg">
                ✓ Merci ! Nous vous répondrons très bientôt.
              </p>
            )}
            
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
