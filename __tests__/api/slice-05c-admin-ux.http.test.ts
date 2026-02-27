/**
 * __tests__/api/slice-05c-admin-ux.http.test.ts
 * Tests HTTP — Slice 5c : Admin UX v2
 *
 * Nouvelles routes / modifications :
 *   DELETE /api/admin/close-date        → réouvrir une date fermée manuellement
 *   GET    /api/admin/calendar          → vérifier le nouveau champ closedDateId
 */

import { testApiHandler } from "next-test-api-route-handler"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockDeep, mockReset } from "vitest-mock-extended"
import type { PrismaClient } from "@prisma/client"

// ─── Mocks ───────────────────────────────────────────────────────────────────

vi.mock("@/lib/prisma", () => ({
  prisma: mockDeep<PrismaClient>(),
}))

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

// ─── Imports après les mocks ──────────────────────────────────────────────────

import * as closeDateHandler from "@/app/api/admin/close-date/route"
import * as calendarHandler from "@/app/api/admin/calendar/route"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

const mockPrisma = prisma as ReturnType<typeof mockDeep<PrismaClient>>

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FUTURE_DATE = (() => {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  return d.toISOString().slice(0, 10)
})()

const fakeAdminSession = {
  user: {
    id: "admin-123",
    email: "admin@placev.fr",
    name: "Admin Place V",
    role: "ADMIN",
    segment: "BOULIACAIS",
    credits: 99,
  },
}

const fakeUserSession = {
  user: {
    id: "user-123",
    email: "externe@test.fr",
    name: "Externe Test",
    role: "USER",
    segment: "EXTERNE",
    credits: 5,
  },
}

const fakeClosedDate = {
  id: "cd-test-123",
  date: new Date(FUTURE_DATE),
  reason: "Travaux",
  createdByAdminId: "admin-123",
  createdAt: new Date(),
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockReset(mockPrisma)
  vi.clearAllMocks()
  vi.mocked(auth).mockResolvedValue(fakeAdminSession as Awaited<ReturnType<typeof auth>>)
})

// ─── DELETE /api/admin/close-date ─────────────────────────────────────────────

describe("DELETE /api/admin/close-date", () => {
  it("200 — date fermée trouvée → suppression réussie, retourne { success: true, date }", async () => {
    mockPrisma.closedDate.findFirst.mockResolvedValue(fakeClosedDate)
    mockPrisma.closedDate.delete.mockResolvedValue(fakeClosedDate)

    await testApiHandler({
      appHandler: closeDateHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: FUTURE_DATE }),
        })
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.success).toBe(true)
        expect(body.date).toBe(FUTURE_DATE)

        // Vérifier que la suppression utilise l'ID trouvé
        expect(mockPrisma.closedDate.delete).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: fakeClosedDate.id },
          })
        )
      },
    })
  })

  it("404 — aucune ClosedDate pour cette date", async () => {
    mockPrisma.closedDate.findFirst.mockResolvedValue(null)

    await testApiHandler({
      appHandler: closeDateHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: FUTURE_DATE }),
        })
        expect(res.status).toBe(404)
        // Aucune suppression ne doit avoir eu lieu
        expect(mockPrisma.closedDate.delete).not.toHaveBeenCalled()
      },
    })
  })

  it("400 — date manquante dans le body", async () => {
    await testApiHandler({
      appHandler: closeDateHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({}),
        })
        expect(res.status).toBe(400)
        expect(mockPrisma.closedDate.delete).not.toHaveBeenCalled()
      },
    })
  })

  it("403 — non-admin refusé", async () => {
    vi.mocked(auth).mockResolvedValue(fakeUserSession as Awaited<ReturnType<typeof auth>>)
    await testApiHandler({
      appHandler: closeDateHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: FUTURE_DATE }),
        })
        expect(res.status).toBe(403)
      },
    })
  })
})

// ─── GET /api/admin/calendar — champ closedDateId ────────────────────────────

describe("GET /api/admin/calendar — nouveau champ closedDateId", () => {
  beforeEach(() => {
    mockPrisma.systemSetting.findUnique.mockImplementation(async ({ where }: { where: { key: string } }) => {
      if (where.key === "DESK_CAPACITY") return { key: "DESK_CAPACITY", value: "15" }
      if (where.key === "OPEN_DAYS") return { key: "OPEN_DAYS", value: "1,2,3" }
      return null
    })
    mockPrisma.reservation.findMany.mockResolvedValue([])
  })

  it("closedDateId est non-null pour une date fermée manuellement via ClosedDate", async () => {
    // La route retourne les closedDates depuis findMany
    mockPrisma.closedDate.findMany.mockResolvedValue([fakeClosedDate])

    await testApiHandler({
      appHandler: calendarHandler,
      url: `/api/admin/calendar?start=${FUTURE_DATE}&end=${FUTURE_DATE}`,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })
        expect(res.status).toBe(200)
        const body = await res.json()

        // Au moins une entrée pour FUTURE_DATE doit avoir closedDateId non-null
        const entryForDate = body.find(
          (e: { date: string; slot: string; closedDateId?: string | null }) =>
            e.date === FUTURE_DATE
        )
        expect(entryForDate).toBeDefined()
        expect(entryForDate.closedDateId).toBe(fakeClosedDate.id)
      },
    })
  })

  it("closedDateId est null pour un jour non-ouvert (non-open weekday sans ClosedDate)", async () => {
    mockPrisma.closedDate.findMany.mockResolvedValue([])

    // Trouver un Jeudi dans les prochains jours (jour non-ouvert si OPEN_DAYS=1,2,3)
    const d = new Date(FUTURE_DATE)
    // Avancer jusqu'au prochain jeudi
    while (d.getUTCDay() !== 4) d.setUTCDate(d.getUTCDate() + 1)
    const thursdayStr = d.toISOString().slice(0, 10)

    await testApiHandler({
      appHandler: calendarHandler,
      url: `/api/admin/calendar?start=${thursdayStr}&end=${thursdayStr}`,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })
        expect(res.status).toBe(200)
        const body = await res.json()

        const entryForThursday = body.find(
          (e: { date: string; isClosed: boolean; closedDateId?: string | null }) =>
            e.date === thursdayStr && e.isClosed === true
        )
        if (entryForThursday) {
          // Jour non-ouvert → closedDateId null (pas de ClosedDate créée)
          expect(entryForThursday.closedDateId).toBeNull()
        }
      },
    })
  })

  it("la réponse inclut toujours le champ closedDateId (même null) pour chaque entrée", async () => {
    mockPrisma.closedDate.findMany.mockResolvedValue([])

    await testApiHandler({
      appHandler: calendarHandler,
      url: `/api/admin/calendar?start=${FUTURE_DATE}&end=${FUTURE_DATE}`,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })
        expect(res.status).toBe(200)
        const body = await res.json()

        for (const entry of body) {
          // closedDateId doit toujours être présent (null ou string)
          expect("closedDateId" in entry).toBe(true)
        }
      },
    })
  })
})
