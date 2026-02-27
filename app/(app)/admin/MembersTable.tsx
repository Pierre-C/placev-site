'use client'

import { User } from "@prisma/client"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { updateCredits, toggleMember } from "./actions"

export default function MembersTable({ users: initialUsers }: { users: User[] }) {
  const router = useRouter()
  const [users, setUsers] = useState<User[]>(initialUsers)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [creditsDelta, setCreditsDelta] = useState(0)
  const [creditsReason, setCreditsReason] = useState("")
  const [showSuccessToast, setShowSuccessToast] = useState(false)

  // Update local state when props change (e.g., after a successful router.refresh)
  useEffect(() => {
    setUsers(initialUsers)
  }, [initialUsers])

  const openModal = (user: User) => {
    setSelectedUser(user)
    setIsModalOpen(true)
  }

  const closeModal = () => {
    setSelectedUser(null)
    setIsModalOpen(false)
    setCreditsDelta(0)
    setCreditsReason("")
  }

  const handleSaveCredits = async () => {
    if (!selectedUser) return
    await updateCredits(selectedUser.id, creditsDelta, creditsReason)
    closeModal()
    setShowSuccessToast(true)
    setTimeout(() => setShowSuccessToast(false), 3000)
    router.refresh()
  }

  const handleToggleMember = async (userId: string, isMember: boolean) => {
    // Optimistic UI update
    setUsers(prevUsers =>
      prevUsers.map(user =>
        user.id === userId ? { ...user, isMember } : user
      )
    )
    
    await toggleMember(userId, isMember)
    router.refresh()
  }

  return (
    <>
      <div className="mt-4 overflow-x-auto">
        <div className="inline-block min-w-full align-middle">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table data-testid="members-table" className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Nom</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Email</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Crédits</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Adhérent</th>
                  <th scope="col" className="px-3 py-3.5 text-left text-sm font-semibold text-gray-900">Role</th>
                  <th scope="col" className="relative py-3.5 pl-3 pr-4 sm:pr-6">
                    <span className="sr-only">Actions</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {users.map((user) => (
                  <tr data-testid="member-row" key={user.id}>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{user.name}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{user.email}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{user.credits}</td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">
                      <button
                        data-testid="member-toggle"
                        data-checked={user.isMember ? "true" : "false"}
                        onClick={() => handleToggleMember(user.id, !user.isMember)}
                      >
                        {user.isMember ? "Oui" : "Non"}
                      </button>
                    </td>
                    <td className="whitespace-nowrap px-3 py-4 text-sm text-gray-500">{user.role}</td>
                    <td className="relative whitespace-nowrap py-4 pl-3 pr-4 text-right text-sm font-medium sm:pr-6">
                      <button data-testid="edit-credits-btn" onClick={() => openModal(user)} className="text-indigo-600 hover:text-indigo-900">
                        Éditer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showSuccessToast && (
        <div data-testid="success-toast" className="mt-4 p-4 bg-green-100 text-green-800 rounded-md">
          Opération réussie.
        </div>
      )}

      {isModalOpen && selectedUser && (
        <div data-testid="edit-credits-modal" className="fixed inset-0 bg-gray-500 bg-opacity-75 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg shadow-xl">
            <h3 className="text-lg font-bold">Modifier les crédits de {selectedUser.name}</h3>
            <div className="mt-4">
              <label htmlFor="credits-delta">Variation (+/-)</label>
              <input
                id="credits-delta"
                data-testid="credits-delta"
                type="number"
                value={creditsDelta}
                onChange={(e) => setCreditsDelta(parseInt(e.target.value, 10))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div className="mt-4">
              <label htmlFor="credits-reason">Raison</label>
              <input
                id="credits-reason"
                data-testid="credits-reason"
                type="text"
                value={creditsReason}
                onChange={(e) => setCreditsReason(e.target.value)}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
              />
            </div>
            <div className="mt-6 flex justify-end space-x-4">
              <button onClick={closeModal} className="text-gray-600">Annuler</button>
              <button data-testid="save-credits" onClick={handleSaveCredits} className="px-4 py-2 bg-blue-600 text-white rounded-md">
                Enregistrer
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
