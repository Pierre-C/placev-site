// components/sections/FAQ.tsx
export function FAQ() {
  const items = [
    {
      q: "Peut-on visiter avant de s'inscrire ?",
      a: "Oui, contactez nous pour venir visiter et profiter d'une demi-journée offerte.",
    },
    {
      q: "Comment réserver un poste ?",
      a: "Envoyez nous un mail à placevcoworking pour réserver votre demi-journée offerte.",
    },
    {
      q: "Comment devenir coworker ?",
      a: "Une fois le test effectué, nous vous enverrons le lien pour adhérer à l'association et choisir la formule adaptée.",
    },
    {
      q: "A qui s'adresse le coworking ?",
      a: "Tout le monde peut venir travailler, que vous soyez indépendant, entrepreneur, salarié ou étudiant.",
    },
    {
      q: "Je ne suis pas coworker, puis-je réserver la salle de réunion ?",
      a: "Oui bien sur contactez-nous à placevcoworking@gmail.com pour réserver la salle de réunion.",
    },
  ];
  return (
    <section id="faq" className="mx-auto max-w-4xl px-4 py-16">
      <h2 className="text-3xl font-semibold md:text-4xl text-center">
        Questions fréquentes
      </h2>
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
  );
}
