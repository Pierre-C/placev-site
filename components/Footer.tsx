// components/Footer.tsx
import Link from "next/link";
import { SITE } from "@/lib/config/site";
import { Newsletter } from "./Newsletter";

export function Footer() {
  return (
    <footer className="border-t border-black/5">
      <div className="mx-auto max-w-7xl px-4 py-10 grid gap-6 md:grid-cols-3">
        <div>
          <img
            src="/logo-placev.png"
            alt="Place V Coworking"
            className="h-8 w-auto"
          />
          <p className="mt-3 text-sm text-neutral-600">
            Un lieu de travail flexible, convivial et inspirant.
          </p>
        </div>
        <div className="md:col-span-2">
          <h3 className="text-sm font-semibold mb-3">Restez informé</h3>
          <p className="text-sm text-neutral-600 mb-3">
            Inscrivez-vous à notre newsletter pour recevoir nos actualités et
            offres spéciales
          </p>
          <Newsletter variant="compact" />
        </div>
      </div>
      <div className="border-t border-black/5">
        <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-neutral-500 flex items-center justify-between">
          <span>
            © {new Date().getFullYear()} {SITE.name}. Tous droits réservés.
          </span>
        </div>
      </div>
    </footer>
  );
}
