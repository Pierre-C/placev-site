// app/layout.tsx
import "./globals.css";
import type { Metadata } from "next";
import { Header } from "@/components/Header";
import { Footer } from "@/components/Footer";

export const metadata: Metadata = {
  title: "Place V Coworking — Votre place pour créer, travailler et rencontrer",
  description:
    "Espace de coworking moderne : offres flexibles, salles de réunion, communauté.",
  metadataBase: new URL("https://placev.fr"),
  openGraph: {
    title: "Place V Coworking",
    description: "Espace de coworking moderne au cœur de la ville",
    type: "website",
    locale: "fr_FR",
  },
  twitter: {
    card: "summary_large_image",
    title: "Place V Coworking",
    description: "Espace de coworking moderne au cœur de la ville",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr" className="scroll-smooth">
      <body className="min-h-screen bg-gradient-to-b from-white to-neutral-50 text-neutral-900">
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}
