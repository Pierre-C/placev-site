// components/Header.tsx
"use client";
import Link from "next/link";
import { useState } from "react";
import { Menu, X, Calendar } from "lucide-react";
import { SITE } from "@/lib/config/site";

export function Header() {
  const [open, setOpen] = useState(false);
  
  return (
    <header className="sticky top-0 z-50 backdrop-blur bg-white/70 border-b border-black/5">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <img
            src="/logo-placev.png"
            alt="Place V Coworking"
            className="h-10 w-auto"
          />
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm">
          {/* <Link href="/offres" className="hover:opacity-70">Offres</Link>
          <Link href="/galerie" className="hover:opacity-70">Galerie</Link>
          <Link href="/contact" className="hover:opacity-70">Contact</Link> */}
          <a
            href="/#contact"
            className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-placev-blue to-placev-mint px-4 py-2 text-white shadow-cta hover:opacity-90 transition"
          >
            <Calendar className="h-4 w-4" /> {SITE.primaryCTA}
          </a>
        </nav>
        <button
          className="md:hidden"
          onClick={() => setOpen(!open)}
          aria-label="Menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>
      {open && (
        <div className="md:hidden border-t border-black/5 px-4 py-3 space-y-3 bg-white/90">
          {[
            ["Offres", "/offres"],
            ["Galerie", "/galerie"],
            ["Contact", "/contact"],
          ].map(([label, href]) => (
            <Link key={href} href={href} className="block py-1">
              {label}
            </Link>
          ))}
          <a
            href="/#contact"
            className="block text-center rounded-2xl bg-gradient-to-r from-placev-blue to-placev-mint px-4 py-2 text-white hover:opacity-90 transition"
          >
            {SITE.primaryCTA}
          </a>
        </div>
      )}
    </header>
  );
}
