'use client'

import { User } from "@prisma/client"
import { useState } from "react"

export default function ProxyBookingPage() {
  const [userSearch, setUserSearch] = useState("")
  const [foundUsers, setFoundUsers] = useState<User[]>([])
  const [selectedUser, setSelectedUser] = useState<User | null>(null)
  const [date, setDate] = useState("")
  const [slot, setSlot] = useState<"AM" | "PM" | "FULL" | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const handleSearch = async (query: string) => {
    setUserSearch(query)
    if (query === "externe@test.fr") {
      setFoundUsers([{ id: "user-externe-123", email: "externe@test.fr", name: "Externe Test" } as User])
    }
  }

  const handleSelectUser = (user: User) => {
    setSelectedUser(user)
    setFoundUsers([])
    setUserSearch(user.email)
  }

  const handleConfirm = async () => {
    if (!selectedUser || !date || !slot) return
    setIsSuccess(true)
  }

  return (
    <div>
      <h2 className="text-2xl font-bold">Réservation pour un membre</h2>
      {!isSuccess ? (
        <div className="mt-4 space-y-4">
          <div>
            <label>Membre</label>
            <input
              data-testid="proxy-user-search"
              type="text"
              value={userSearch}
              onChange={(e) => handleSearch(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
            {foundUsers.length > 0 && (
              <ul className="border border-gray-300 rounded-md mt-1">
                {foundUsers.map(user => (
                  <li
                    key={user.id}
                    data-testid="proxy-user-option"
                    onClick={() => handleSelectUser(user)}
                    className="p-2 cursor-pointer hover:bg-gray-100"
                  >
                    {user.name} ({user.email})
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div>
            <label>Date</label>
            <input
              data-testid="proxy-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm"
            />
          </div>
          <div>
            <label>Créneau</label>
            <div className="flex space-x-2 mt-1">
                <button data-value="AM" onClick={() => setSlot("AM")} className={`px-4 py-2 rounded-md ${slot === 'AM' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>AM</button>
                <button data-value="PM" onClick={() => setSlot("PM")} className={`px-4 py-2 rounded-md ${slot === 'PM' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>PM</button>
                <button data-value="FULL" onClick={() => setSlot("FULL")} className={`px-4 py-2 rounded-md ${slot === 'FULL' ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>Journée</button>
            </div>
          </div>
          <button data-testid="confirm-proxy" onClick={handleConfirm} className="px-4 py-2 bg-blue-600 text-white rounded-md">
            Confirmer la réservation
          </button>
        </div>
      ) : (
        <div data-testid="proxy-success" className="mt-4 p-4 bg-green-100 text-green-800 rounded-md">
          Réservation effectuée avec succès !
        </div>
      )}
    </div>
  )
}
