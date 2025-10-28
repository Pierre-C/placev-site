// app/(marketing)/contact/page.tsx
export default function ContactPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-16">
      <h1 className="text-3xl font-semibold">Contact</h1>
      <p className="mt-2 text-neutral-600">Écrivez-nous, on répond vite.</p>
      <form className="mt-6 grid gap-3 max-w-lg">
        <input placeholder="Votre nom" className="rounded-xl border border-black/10 px-4 py-2" />
        <input type="email" placeholder="Votre email" className="rounded-xl border border-black/10 px-4 py-2" />
        <textarea placeholder="Votre message" rows={4} className="rounded-xl border border-black/10 px-4 py-2" />
        <button type="submit" className="rounded-xl bg-gradient-to-r from-placev-blue to-placev-mint px-4 py-2 font-medium text-white shadow-cta">Envoyer</button>
      </form>
    </div>
  )
}
