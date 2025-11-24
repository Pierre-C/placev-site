// components/sections/Gallery.tsx
"use client";
import { motion } from "framer-motion";
import { SITE } from "@/lib/config/site";
import { Badge } from "./_parts";

// Icônes de réseaux sociaux personnalisées (les icônes sociales de lucide-react peuvent être dépréciées)
const InstagramIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
    <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
  </svg>
);

const FacebookIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
  </svg>
);

const LinkedinIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z" />
    <rect width="4" height="12" x="2" y="9" />
    <circle cx="4" cy="4" r="2" />
  </svg>
);

export function Gallery() {
  return (
    <section id="galerie" className="mx-auto max-w-7xl px-4 py-16">
      <div className="mb-8 flex items-end justify-between">
        <h2 className="text-3xl font-semibold md:text-4xl">
          Place V en images
        </h2>
        <div className="hidden md:flex items-center gap-2 text-sm text-neutral-600">
          <a
            href="https://www.instagram.com/placevcoworking/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-70 transition"
          >
            <Badge icon={InstagramIcon}>@placevcoworking</Badge>
          </a>
          <a
            href="https://www.facebook.com/profile.php?id=61581181941177"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-70 transition"
          >
            <Badge icon={FacebookIcon}>/placev</Badge>
          </a>
          <a
            href="https://www.linkedin.com/company/109245506/admin/dashboard/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:opacity-70 transition"
          >
            <Badge icon={LinkedinIcon}>/company/placev</Badge>
          </a>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-4">
        {SITE.gallery.map((src, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.4, delay: i * 0.03 }}
            className="overflow-hidden rounded-2xl"
          >
            <img
              src={src}
              alt={`Photo ${i + 1}`}
              className="h-56 w-full object-cover hover:scale-105 transition"
            />
          </motion.div>
        ))}
      </div>
    </section>
  );
}
