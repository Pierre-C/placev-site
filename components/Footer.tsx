// components/Footer.tsx
import Link from 'next/link'
import { SITE } from '@/lib/config/site'

export function Footer() {
  return (
    <footer className="border-t border-black/5">
      <div className="mx-auto max-w-7xl px-4 py-10 grid gap-6 md:grid-cols-3">
        <div>
          <img src="/logo-placev.png" alt="Place V Coworking" className="h-8 w-auto" />
          <p className="mt-3 text-sm text-neutral-600">Un lieu de travail flexible, convivial et inspirant.</p>
        </div>
        <div className="text-sm">
          <p className="font-medium">Liens</p>
          <ul className="mt-2 space-y-1">
            <li><Link href="/offres">Offres</Link></li>
            <li><Link href="/galerie">Galerie</Link></li>
            <li><Link href="/contact">Contact</Link></li>
          </ul>
        </div>
        <div className="text-sm">
          <p className="font-medium">Légal</p>
          <ul className="mt-2 space-y-1">
            <li><a href="#">CGU</a></li>
            <li><a href="#">Politique de confidentialité</a></li>
            <li><a href="#">Mentions légales</a></li>
          </ul>
        </div>
      </div>
      <div className="border-t border-black/5">
        <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-neutral-500 flex items-center justify-between">
          <span>© {new Date().getFullYear()} {SITE.name}. Tous droits réservés.</span>
        </div>
      </div>
    </footer>
  )
}
