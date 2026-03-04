import Link from "next/link"
import { ResendVerificationButton } from "../login/ResendVerificationButton"

export default function VerifyEmailErrorPage({
  searchParams,
}: {
  searchParams: { reason?: string; email?: string }
}) {
  const reason = searchParams.reason
  const email = searchParams.email ?? ""

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-neutral-50">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-sm text-center">
        <h1 className="text-2xl font-bold text-neutral-900">Erreur de vérification</h1>

        {reason === "invalid" && (
          <p data-testid="verify-error-message" className="text-neutral-600">
            Ce lien est invalide.
          </p>
        )}

        {reason === "expired" && (
          <p data-testid="verify-error-message" className="text-neutral-600">
            Ce lien a expiré (validité 24h).
          </p>
        )}

        {reason === "invalid" && (
          <p className="text-sm text-neutral-500">Contactez le support si le problème persiste.</p>
        )}

        {reason === "expired" && (
          <div className="pt-4 border-t border-neutral-100">
            <p className="text-sm text-neutral-500 mb-2">Voulez-vous recevoir un nouveau lien ?</p>
            <ResendVerificationButton email={email} testId="resend-from-error-btn" />
          </div>
        )}

        <div className="pt-4">
          <Link href="/login" className="text-sm font-medium text-neutral-900 underline hover:text-neutral-700">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  )
}