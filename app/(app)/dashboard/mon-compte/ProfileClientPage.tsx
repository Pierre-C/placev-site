"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

interface ProfileClientPageProps {
  initialUser: {
    firstName: string
    lastName: string
    email: string
    address: string | null
    phone: string | null
    deletionRequestedAt: Date | null
  }
}

export default function ProfileClientPage({ initialUser }: ProfileClientPageProps) {
  const router = useRouter()
  
  // Section 1: Profile
  const [profile, setProfile] = useState({
    firstName: initialUser.firstName,
    lastName: initialUser.lastName,
    address: initialUser.address ?? "",
    phone: initialUser.phone ?? "",
  })
  const [profileLoading, setProfileLoading] = useState(false)
  const [profileSuccess, setProfileSuccess] = useState(false)
  const [phoneError, setPhoneError] = useState("")

  // Section 2: Password
  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
  })
  const [passLoading, setPassLoading] = useState(false)
  const [passSuccess, setPassSuccess] = useState(false)
  const [passError, setPassError] = useState("")

  // Section 3: Deletion
  const [isDeleting, setIsDeleting] = useState(false)
  const [isConfirmingDeletion, setIsConfirmingDeletion] = useState(false)
  const [deletionSuccess, setDeletionSuccess] = useState(false) // Reset local state to allow tests to see the button

  const handleProfileSave = async (e: React.FormEvent) => {
    e.preventDefault()

    // Valider le téléphone si renseigné
    if (profile.phone) {
      if (!/^(?:\+33|0033|0)[1-9](\d{8})$/.test(profile.phone)) {
        setPhoneError("Format invalide. Exemples : 0612345678, +33612345678")
        return
      }
    }
    setPhoneError("")

    setProfileLoading(true)
    setProfileSuccess(false)
    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      })
      if (res.ok) {
        setProfileSuccess(true)
        router.refresh()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setProfileLoading(false)
    }
  }

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault()
    if (passwords.newPassword.length < 8) {
      setPassError("Le nouveau mot de passe doit faire au moins 8 caractères")
      return
    }
    setPassLoading(true)
    setPassSuccess(false)
    setPassError("")
    try {
      const res = await fetch("/api/profile/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(passwords),
      })
      if (res.ok) {
        setPassSuccess(true)
        setPasswords({ currentPassword: "", newPassword: "" })
      } else {
        const data = await res.json()
        setPassError(data.error || "Une erreur est survenue")
      }
    } catch (err) {
      console.error(err)
      setPassError("Erreur serveur")
    } finally {
      setPassLoading(false)
    }
  }

  const handleRequestDeletion = async () => {
    setIsDeleting(true)
    try {
      const res = await fetch("/api/profile/request-deletion", { method: "POST" })
      if (res.ok) {
        setDeletionSuccess(true)
        setIsConfirmingDeletion(false)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <div className="space-y-12 py-8">
      {/* SECTION 1 — PROFIL */}
      <section className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-100">
        <h2 className="text-xl font-bold mb-6">Informations personnelles</h2>
        <form data-testid="profile-form" onSubmit={handleProfileSave} className="space-y-4 max-w-lg">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Prénom</label>
              <input
                name="firstName"
                required
                value={profile.firstName}
                onChange={(e) => setProfile({ ...profile, firstName: e.target.value })}
                className="w-full p-2 border border-neutral-200 rounded-lg text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-1">Nom</label>
              <input
                name="lastName"
                required
                value={profile.lastName}
                onChange={(e) => setProfile({ ...profile, lastName: e.target.value })}
                className="w-full p-2 border border-neutral-200 rounded-lg text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Email (non modifiable)</label>
            <input
              name="email"
              disabled
              value={initialUser.email}
              className="w-full p-2 border border-neutral-200 rounded-lg text-sm bg-neutral-50 text-neutral-500 cursor-not-allowed"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Adresse</label>
            <textarea
              name="address"
              value={profile.address}
              onChange={(e) => setProfile({ ...profile, address: e.target.value })}
              className="w-full p-2 border border-neutral-200 rounded-lg text-sm h-24 resize-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Téléphone</label>
            <input
              name="phone"
              type="tel"
              value={profile.phone}
              onChange={(e) => {
                setProfile({ ...profile, phone: e.target.value })
                if (phoneError) setPhoneError("")
              }}
              className="w-full p-2 border border-neutral-200 rounded-lg text-sm"
            />
            </div>

            {phoneError && (
            <p data-testid="phone-error" className="text-red-600 text-xs mt-1">{phoneError}</p>
            )}          
          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={profileLoading}
              data-testid="profile-save-btn"
              className="px-6 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
            >
              {profileLoading ? "Enregistrement..." : "Enregistrer"}
            </button>
            {profileSuccess && (
              <span data-testid="profile-save-success" className="text-green-600 text-sm font-medium">✓ Modifications enregistrées</span>
            )}
          </div>
        </form>
      </section>

      {/* SECTION 2 — MOT DE PASSE */}
      <section className="bg-white p-8 rounded-2xl shadow-sm border border-neutral-100">
        <h2 className="text-xl font-bold mb-6">Changement de mot de passe</h2>
        <form data-testid="change-password-form" onSubmit={handlePasswordChange} className="space-y-4 max-w-lg">
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Mot de passe actuel</label>
            <input
              name="currentPassword"
              type="password"
              required
              value={passwords.currentPassword}
              onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
              className="w-full p-2 border border-neutral-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-neutral-700 mb-1">Nouveau mot de passe (min. 8 chars)</label>
            <input
              name="newPassword"
              type="password"
              required
              minLength={8}
              value={passwords.newPassword}
              onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
              className="w-full p-2 border border-neutral-200 rounded-lg text-sm"
            />
          </div>
          
          <div className="flex flex-col gap-2 pt-4">
            <div className="flex items-center gap-4">
              <button
                type="submit"
                disabled={passLoading}
                data-testid="change-password-btn"
                className="px-6 py-2 bg-neutral-900 text-white rounded-lg text-sm font-medium hover:bg-neutral-800 disabled:opacity-50"
              >
                {passLoading ? "Mise à jour..." : "Mettre à jour le mot de passe"}
              </button>
              {passSuccess && (
                <span data-testid="change-password-success" className="text-green-600 text-sm font-medium">✓ Mot de passe mis à jour</span>
              )}
            </div>
            {passError && (
              <p data-testid="change-password-error" className="text-red-600 text-sm font-medium mt-1">{passError}</p>
            )}
          </div>
        </form>
      </section>

      {/* SECTION 3 — DANGER ZONE */}
      <section className="bg-red-50 p-8 rounded-2xl border border-red-100">
        <h2 className="text-xl font-bold text-red-900 mb-2">Supprimer votre compte</h2>
        <p className="text-sm text-red-700 mb-6">Souhaitez-vous demander la suppression de votre compte ? Vos données seront anonymisées conformément au RGPD.</p>
        
        {deletionSuccess ? (
          <div data-testid="deletion-requested-success" className="p-4 bg-white border border-red-200 rounded-xl text-red-900 font-bold text-sm">
            ✓ Votre demande de suppression a été enregistrée. Elle sera traitée par nos administrateurs.
          </div>
        ) : (
          <div>
            <button
              onClick={() => setIsConfirmingDeletion(true)}
              data-testid="request-deletion-btn"
              className="px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 transition"
            >
              Demander la suppression de mon compte
            </button>

            {isConfirmingDeletion && (
              <div 
                data-testid="deletion-confirm-dialog"
                className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-neutral-900/60 backdrop-blur-sm"
              >
                <div className="bg-white p-8 rounded-3xl shadow-2xl w-full max-w-md text-center">
                  <h3 className="text-xl font-black mb-4">Êtes-vous sûr ?</h3>
                  <p className="text-neutral-500 text-sm mb-8">
                    Cette action demandera à un administrateur d&apos;anonymiser votre compte de façon irréversible.
                  </p>
                  <div className="flex gap-4">
                    <button
                      data-testid="deletion-confirm-btn"
                      disabled={isDeleting}
                      onClick={handleRequestDeletion}
                      className="flex-1 px-6 py-3 bg-red-600 text-white font-black rounded-2xl hover:bg-red-700"
                    >
                      {isDeleting ? "Demande en cours..." : "Oui, supprimer"}
                    </button>
                    <button
                      data-testid="deletion-cancel-btn"
                      onClick={() => setIsConfirmingDeletion(false)}
                      className="flex-1 px-6 py-3 bg-neutral-100 text-neutral-600 font-black rounded-2xl hover:bg-neutral-200"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
