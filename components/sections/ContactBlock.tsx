// components/sections/ContactBlock.tsx
import { MapPin, Phone, Mail, Clock, Send } from "lucide-react";
import { SITE } from "@/lib/config/site";

export function ContactBlock() {
  const mailtoLink = `mailto:${SITE.email}?subject=Demande de renseignements - PlaceV Coworking&body=Bonjour,%0D%0A%0D%0AJe souhaite obtenir plus d'informations sur vos espaces de coworking.%0D%0A%0D%0ACordialement`;

  return (
    <section id="contact" className="mx-auto max-w-7xl px-4 py-16">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="rounded-2xl border border-black/5 bg-white p-6">
          <h3 className="text-xl font-semibold">Nous contacter</h3>
          <p className="mt-2 text-sm text-neutral-600">
            Une question ? Envoyez-nous un message, on répond vite.
          </p>

          <div className="mt-6 space-y-3">
            <a
              href={mailtoLink}
              className="w-full rounded-xl bg-gradient-to-r from-placev-blue to-placev-mint px-4 py-3 font-medium text-white flex items-center justify-center gap-2 hover:opacity-90 transition"
            >
              <Send className="h-4 w-4" />
              Envoyer un email
            </a>

            <div className="grid gap-3 text-sm">
              <a
                href={`mailto:${SITE.email}`}
                className="flex items-center gap-2 text-neutral-600 hover:text-placev-blue transition"
              >
                <Mail className="h-4 w-4" />
                {SITE.email}
              </a>
              <a
                href={`tel:${SITE.phone.replace(/\s/g, "")}`}
                className="flex items-center gap-2 text-neutral-600 hover:text-placev-blue transition"
              >
                <Phone className="h-4 w-4" />
                {SITE.phone}
              </a>
            </div>

            <p className="text-xs text-neutral-500 pt-3">
              Vous pouvez aussi nous contacter par téléphone ou email
              directement.
            </p>
          </div>
        </div>
        <div className="rounded-2xl border border-black/5 bg-white p-6">
          <h3 className="text-xl font-semibold">Infos pratiques</h3>
          <ul className="mt-4 space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4" /> {SITE.address}
            </li>
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4" /> {SITE.phone}
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4" /> {SITE.email}
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4" /> Ouvert 24/7 pour les membres
            </li>
          </ul>
          <div className="mt-6 h-64 w-full overflow-hidden rounded-xl">
            <img
              src="https://images.unsplash.com/photo-1505761671935-60b3a7427bad?q=80&w=1200&auto=format&fit=crop"
              alt="Plan d'accès"
              className="h-full w-full object-cover"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
