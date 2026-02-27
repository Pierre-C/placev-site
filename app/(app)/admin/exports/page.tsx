import ExportButtons from "./ExportButtons"

export default function ExportsPage() {
  return (
    <div>
      <h2 className="text-2xl font-bold">Exports</h2>
      <p className="mt-2 text-neutral-500">
        Téléchargez les données de Place V au format CSV.
      </p>
      <ExportButtons />
    </div>
  )
}
