// components/Footer.tsx
import Link from "next/link";
import { SITE } from "@/lib/config/site";

export function Footer() {
  return (
    <footer className="border-t border-black/5">
      <div className="mx-auto max-w-7xl px-4 py-10 flex flex-col items-center text-center sm:flex-row sm:text-left sm:justify-between">
        <div>
          <img
            src="/logo-placev.png"
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
          <span>
            © {new Date().getFullYear()} {SITE.name}. Tous droits réservés.
          </span>
        </div>
      </div>
    </footer>
  );
}
