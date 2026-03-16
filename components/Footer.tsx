// components/Footer.tsx
import Link from "next/link";
import { SITE } from "@/lib/config/site";

export function Footer() {
  return (
    <footer className="border-t border-black/5">
      <div className="mx-auto max-w-7xl px-4 py-10 flex flex-col items-center text-center sm:flex-row sm:text-left sm:justify-between">
        <div>
          <img
            src="/logo-placev.svg"
            alt="Place V Coworking"
            className="h-8 w-auto mx-auto sm:mx-0"
          />
          <p className="mt-3 text-sm text-neutral-600">
            Un lieu de travail flexible, convivial et inspirant.
          </p>
        </div>
      </div>
      <div className="border-t border-black/5">
        <div className="mx-auto max-w-7xl px-4 py-4 text-xs text-neutral-500 flex items-center justify-between">
          <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span>© {new Date().getFullYear()} {SITE.name}. Tous droits réservés.</span>
            <span className="text-neutral-300">·</span>
            <Link href="/cgv" className="hover:text-neutral-700 transition-colors">Conditions générales de ventes</Link>
            <span className="text-neutral-300">·</span>
            <Link href="/mentions-legales" className="hover:text-neutral-700 transition-colors">Mentions légales</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
