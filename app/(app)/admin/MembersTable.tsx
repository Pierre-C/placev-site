'use client'

import { User } from "@prisma/client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { updateCredits, toggleMember } from "./actions"
import { motion, AnimatePresence } from "framer-motion"

type UserWithExtras = User & {
  reservationCount?: number
  recentReservations?: Array<{
    id: string
    date: Date
    slot: string
    status: string
  }>
}

export default function MembersTable({ users: initialUsers }: { users: User[] }) {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<UserWithExtras | null>(null)
  const [loadingDetails, setLoadingDetails] = useState(false)
  
  // Edit states in modal
  const [creditsDelta, setCreditsDelta] = useState(0)
  const [creditsReason, setCreditsReason] = useState("")
  const [isMemberEdit, setIsMemberEdit] = useState(false)
  const [segmentEdit, setSegmentEdit] = useState<string>("EXTERNE")

  const [showSuccessToast, setShowSuccessToast] = useState(false)

  useEffect(() => {
    setUsers(initialUsers)
  }, [initialUsers])

  const openModal = async (user: User) => {
    setSelectedUser(user)
    setIsMemberEdit(user.isMember)
    setSegmentEdit(user.segment || "EXTERNE")
    setIsModalOpen(true)
    
    // Fetch detailed info
    setLoadingDetails(true)
    try {
      const res = await fetch(`/api/admin/members/${user.id}`)
      if (res.ok) {
        const fullUser = await res.json()
        setSelectedUser(fullUser)
      }
    } catch (err) {
      console.error("Failed to fetch user details", err)
    } finally {
      setLoadingDetails(false)
    }
  }

  const closeModal = () => {
    setSelectedUser(null)
    setIsModalOpen(false)
    setCreditsDelta(0)
    setCreditsReason("")
  }

  const handleSaveAll = async () => {
    if (!selectedUser) return
    
    // 1. Credits if delta != 0
    if (creditsDelta !== 0) {
        await updateCredits(selectedUser.id, creditsDelta, creditsReason)
    }

    // 2. Member status if changed
    if (isMemberEdit !== selectedUser.isMember) {
        await toggleMember(selectedUser.id, isMemberEdit)
    }

    // 3. Segment if changed
    if (segmentEdit !== selectedUser.segment) {
        await fetch(`/api/admin/members/${selectedUser.id}/segment`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ segment: segmentEdit })
        })
    }

    closeModal()
    setShowSuccessToast(true)
    setTimeout(() => setShowSuccessToast(false), 3000)
    router.refresh()
  }

  const handleQuickToggleMember = async (userId: string, currentStatus: boolean) => {
    const nextStatus = !currentStatus
    // Optimistic UI update
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId ? { ...user, isMember: nextStatus } : user
      )
    )
    await toggleMember(userId, nextStatus)
    router.refresh()
  }

  return (
    <div className="space-y-6">
      <div className="overflow-x-auto bg-white rounded-2xl shadow-sm ring-1 ring-neutral-100 mt-6">
        <table data-testid="members-table" className="min-w-full divide-y divide-neutral-200">
          <thead>
            <tr className="bg-neutral-50 text-xs font-black text-neutral-400 uppercase tracking-wider">
              <th className="px-6 py-4 text-left">Nom</th>
              <th className="px-6 py-4 text-left">Email</th>
              <th className="px-6 py-4 text-left">Crédits</th>
              <th className="px-6 py-4 text-left">Segment</th>
              <th className="px-6 py-4 text-left">Adhérent</th>
              <th className="px-6 py-4 text-right pr-10">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {users.map((user) => (
              <tr data-testid="member-row" key={user.id} className="hover:bg-neutral-50/50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap font-bold text-neutral-900">{user.name || "N/A"}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500 font-medium">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-neutral-900">{user.credits}</td>
                <td data-testid="member-segment" className="px-6 py-4 whitespace-nowrap">
                   <span className="px-2 py-1 rounded-lg bg-neutral-100 text-[10px] font-black uppercase text-neutral-600">
                     {user.segment}
                   </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <button
                    data-testid="member-is-member-badge"
                    data-value={user.isMember ? "true" : "false"}
                    onClick={() => handleQuickToggleMember(user.id, user.isMember)}
                    className={`px-3 py-1 rounded-full text-xs font-black uppercase transition-all ${
                        user.isMember 
                        ? "bg-green-100 text-green-700 hover:bg-green-200" 
                        : "bg-red-100 text-red-700 hover:bg-red-200"
                    }`}
                  >
                    {user.isMember ? "Oui" : "Non"}
                  </button>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right pr-10">
                  <button 
                    data-testid="view-edit-btn" 
                    onClick={() => openModal(user)} 
                    className="text-blue-600 font-bold text-xs hover:underline decoration-2 underline-offset-4"
                  >
                    Voir/Éditer
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showSuccessToast && (
        <div data-testid="success-toast" className="fixed bottom-4 right-4 bg-green-600 text-white px-6 py-3 rounded-xl shadow-xl font-bold z-50">
          ✓ Modification enregistrée
        </div>
      )}

      {/* MODAL ENRICHI */}
      <AnimatePresence>
        {isModalOpen && selectedUser && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-neutral-900/60 backdrop-blur-sm"
            />
            <motion.div
              data-testid="member-detail-modal"
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden"
            >
                {/* Header */}
                <div className="bg-neutral-50 px-8 py-6 border-b">
                    <h3 className="text-2xl font-black text-neutral-900">{selectedUser.name || "Détails Membre"}</h3>
                    <p className="text-neutral-500 font-medium">{selectedUser.email}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-0 divide-y md:divide-y-0 md:divide-x">
                    {/* Infos (Read-only) */}
                    <div className="p-8 space-y-6">
                        <div className="space-y-4">
                            <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest">Informations</h4>
                            <div className="space-y-2">
                                <p className="text-sm font-medium text-neutral-500">Inscrit le : <span className="text-neutral-900 font-bold">{new Date(selectedUser.createdAt).toLocaleDateString('fr-FR')}</span></p>
                                <p className="text-sm font-medium text-neutral-500">Total réservations : <span className="text-neutral-900 font-bold">{selectedUser.reservationCount ?? "..."}</span></p>
                            </div>
                        </div>

                        <div className="space-y-4 pt-4 border-t">
                            <h4 className="text-xs font-black text-neutral-400 uppercase tracking-widest">Dernières réservations</h4>
                            <div data-testid="member-info-reservations" className="space-y-2">
                                {loadingDetails ? (
                                    <p className="text-xs text-neutral-400 italic">Chargement...</p>
                                ) : (selectedUser.recentReservations?.length || 0) === 0 ? (
                                    <p className="text-xs text-neutral-400 italic">Aucune réservation trouvée.</p>
                                ) : (
                                    selectedUser.recentReservations?.map(res => (
                                        <div key={res.id} className="flex items-center justify-between text-xs bg-neutral-50 p-2 rounded-lg">
                                            <span className="font-bold">{new Date(res.date).toLocaleDateString('fr-FR')}</span>
                                            <span className="font-black text-neutral-400">{res.slot}</span>
                                            <span className={`font-black uppercase text-[9px] ${res.status === 'CONFIRMED' ? 'text-green-600' : 'text-neutral-400'}`}>{res.status}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Édition */}
                    <div className="p-8 space-y-6 bg-blue-50/30">
                        <h4 className="text-xs font-black text-blue-400 uppercase tracking-widest">Édition</h4>
                        
                        {/* Crédits */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-neutral-600">Variation crédits (+/-)</label>
                            <div className="flex gap-2">
                                <input
                                    data-testid="credits-delta"
                                    type="number"
                                    value={creditsDelta}
                                    onChange={(e) => setCreditsDelta(parseInt(e.target.value, 10) || 0)}
                                    className="w-20 rounded-xl border-neutral-200 font-black"
                                />
                                <input
                                    data-testid="credits-reason"
                                    placeholder="Raison..."
                                    type="text"
                                    value={creditsReason}
                                    onChange={(e) => setCreditsReason(e.target.value)}
                                    className="flex-1 rounded-xl border-neutral-200 text-sm font-medium"
                                />
                            </div>
                        </div>

                        {/* Segment */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-neutral-600">Segment tarifaire</label>
                            <select
                                data-testid="member-edit-segment"
                                value={segmentEdit}
                                onChange={(e) => setSegmentEdit(e.target.value)}
                                className="w-full rounded-xl border-neutral-200 font-bold text-sm"
                            >
                                <option value="BOULIACAIS">BOULIACAIS</option>
                                <option value="EXTERNE">EXTERNE</option>
                                <option value="REDUIT">REDUIT</option>
                            </select>
                        </div>

                        {/* IsMember */}
                        <div className="flex items-center gap-3">
                            <button
                                type="button"
                                onClick={() => setIsMemberEdit(!isMemberEdit)}
                                className={`w-12 h-6 rounded-full relative transition-colors ${isMemberEdit ? 'bg-green-500' : 'bg-neutral-300'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isMemberEdit ? 'left-7' : 'left-1'}`} />
                            </button>
                            <span className="text-sm font-bold text-neutral-700">Adhérent de l&apos;association</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="px-8 py-6 bg-neutral-50 flex gap-4 border-t">
                    <button 
                        data-testid="save-credits" 
                        onClick={handleSaveAll} 
                        className="flex-1 bg-blue-600 text-white font-black py-3 rounded-2xl hover:bg-blue-700 transition-colors shadow-lg shadow-blue-200"
                    >
                        Enregistrer les modifications
                    </button>
                    <button onClick={closeModal} className="px-6 py-3 text-neutral-500 font-bold hover:bg-neutral-200 rounded-2xl transition-colors">
                        Annuler
                    </button>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}
