import Link from "next/link"
import { ResendVerificationButton } from "../login/ResendVerificationButton"

export default function VerifyEmailSentPage({
  searchParams,
}: {
  searchParams: { email?: string }
}) {
  const email = searchParams.email ?? ""

  return (
    <div className="flex min-h-screen items-center justify-center p-4 bg-neutral-50">
      <div className="w-full max-w-md space-y-6 rounded-2xl bg-white p-8 shadow-sm text-center">
        <h1 className="text-2xl font-bold text-neutral-900">Vérifiez votre boîte mail</h1>
        
        <p data-testid="verify-email-sent-message" className="text-neutral-600">
          Un lien de vérification a été envoyé à votre adresse email. Veuillez cliquer sur ce lien pour activer votre compte.
        </p>

        <div className="rounded-lg bg-blue-50 p-4 text-sm text-blue-800 text-left">
          <p>
            <strong>Note :</strong> L'email peut parfois arriver dans votre dossier de <strong>courriers indésirables (spams)</strong>. Pensez à vérifier !
          </p>
        </div>

        <div className="pt-4 border-t border-neutral-100">
          <p className="text-sm text-neutral-500 mb-2">Vous n'avez rien reçu ?</p>
          <ResendVerificationButton email={email} testId="resend-btn" />
        </div>

        <div className="pt-4">
          <Link href="/login" className="text-sm font-medium text-neutral-900 underline hover:text-neutral-700">
            Retour à la connexion
          </Link>
        </div>
      </div>
    </div>
  )
}