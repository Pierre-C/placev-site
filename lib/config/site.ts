// lib/config/site.ts
export const SITE = {
  name: "PlaceV",
  description: "Espace de coworking moderne et flexible",
  address: "123 Rue de la Paix, 75001 Paris",
  phone: "+33 1 23 45 67 89",
  email: "contact@placev.fr",
  url: "https://placev.fr",
  primaryCTA: "Réserver une visite",
  tagline: "L’espace de coworking lumineux au coeur de Bouliac.",
  palette: {
    cream: "#FFF6E9",
    blue: "#0A6CFF",
    orange: "#F4A03A",
    mint: "#4FD1C5",
    white: "#FFFFFF",
  },
  gallery: [
    "/gallery/PXL_20250909_120231896.jpg",
    "/gallery/IMG_1514-min.jpg",
    "/gallery/IMG_1617-min.jpg",
    "/gallery/IMG_1664-min.jpg",
    "/gallery/IMG_1998-min.jpg",
    "/gallery/IMG_2012-min.jpg",
    "/gallery/box.jpg",
    "/gallery/PXL_20250922_084709203.jpg",
  ],
} as const;
