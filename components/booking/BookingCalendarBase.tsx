import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";

// --- ⚙️ Paramètres à adapter (mettre vos vrais tarifs et clés) ---
const HALF_DAY_PRICE_EUR = 12; // € / personne / demi-journée (à adapter)
const FULL_DAY_PRICE_EUR = 20; // € / personne / journée complète (à adapter)
const DAILY_CAPACITY = 10; // capacité totale simultanée du lieu

// Les créneaux proposés (demi-journée AM/PM + FULL)
const SLOTS = [
  { id: "AM", label: "Matin (9h–13h)", type: "HALF" as const },
  { id: "PM", label: "Après-midi (14h–18h)", type: "HALF" as const },
  { id: "FULL", label: "Journée (9h–18h)", type: "FULL" as const },
];

type SlotId = "AM" | "PM" | "FULL";
type SlotType = "HALF" | "FULL";

type Availability = {
  date: string; // YYYY-MM-DD
  slot: SlotId;
  remaining: number; // places restantes
};

type SelectionItem = {
  date: string;
  slot: SlotId;
  quantity: number; // nb de personnes
};

// Helpers dates
function formatYMD(date: Date) {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, n: number) {
  const d = new Date(date);
  d.setDate(d.getDate() + n);
  return d;
}

function startOfMonth(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth(), 1);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfMonth(d = new Date()) {
  const x = new Date(d.getFullYear(), d.getMonth() + 1, 0);
  x.setHours(23, 59, 59, 999);
  return x;
}

function startOfWeekMonday(d: Date) {
  const date = new Date(d);
  const day = (date.getDay() + 6) % 7; // 0=lundi ... 6=dimanche
  date.setDate(date.getDate() - day);
  date.setHours(0, 0, 0, 0);
  return date;
}

function getMonthGrid(currentMonth: Date) {
  // Retourne 6 semaines (42 cases) couvrant le mois affiché
  const start = startOfWeekMonday(startOfMonth(currentMonth));
  return Array.from({ length: 42 }, (_, i) => addDays(start, i));
}

// Prix par type de créneau
function priceFor(type: SlotType) {
  return type === "FULL" ? FULL_DAY_PRICE_EUR : HALF_DAY_PRICE_EUR;
}

// --- Composant principal ---
export default function BookingCalendarTriangles() {
  const [monthCursor, setMonthCursor] = useState(() => startOfMonth());
  const [availability, setAvailability] = useState<Availability[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selections, setSelections] = useState<Record<string, SelectionItem>>({});

  const days = useMemo(() => getMonthGrid(monthCursor), [monthCursor]);

  // Charge l'API d'availability pour toute la plage visible
  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const start = formatYMD(days[0]);
        const end = formatYMD(addDays(days[41], 1)); // end exclusif côté API
        // 🔗 À brancher côté serveur: GET /api/availability?start=YYYY-MM-DD&end=YYYY-MM-DD
        const res = await fetch(`/api/availability?start=${start}&end=${end}`);
        if (!res.ok) throw new Error("Réponse serveur invalide");
        const data: Availability[] = await res.json();
        setAvailability(data);
      } catch (e: any) {
        // Fallback démo (si API non prête): tout à 10 places
        console.warn("API indisponible, fallback de démonstration.");
        const fake: Availability[] = [];
        for (const d of days) {
          const ymd = formatYMD(d);
          for (const s of SLOTS) fake.push({ date: ymd, slot: s.id, remaining: DAILY_CAPACITY });
        }
        setAvailability(fake);
        setError(
          "L'API d'availability n'est pas encore branchée. Les chiffres affichés sont simulés."
        );
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monthCursor]);

  const availMap = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of availability) {
      m.set(`${a.date}|${a.slot}`, a.remaining);
    }
    return m;
  }, [availability])
