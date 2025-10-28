// components/sections/FAQ.tsx
export function FAQ() {
  const items = [
    { q: "Peut-on visiter avant de s'inscrire ?", a: "Oui, réservez une visite guidée d'environ 20 minutes." },
    { q: "Proposez-vous des tarifs équipe ?", a: "Oui, remises à partir de 3 postes — contactez-nous." },
    { q: "Y a-t-il un engagement ?", a: "Pass jour sans engagement. Abonnements mensuels résiliables à J-30." },
    { q: "Puis-je domicilier mon entreprise ?", a: "Oui, en option à 25€/mois, selon disponibilité." },
  ]
  return (
    <section id="faq" className="mx-auto max-w-4xl px-4 py-16">
      <h2 className="text-3xl font-semibold md:text-4xl text-center">Questions fréquentes</h2>
      <div className="mt-8 divide-y divide-black/5 rounded-2xl border border-black/5 bg-white">
        {items.map((it, i) => (
          <details key={i} className="group p-5">
            <summary className="cursor-pointer list-none font-medium flex items-center justify-between">
              {it.q}
              <span className="transition group-open:rotate-180">⌄</span>
            </summary>
            <p className="mt-2 text-sm text-neutral-600">{it.a}</p>
          </details>
        ))}
      </div>
    </section>
  )
}
