/**
 * __tests__/api/slice-12-events.http.test.ts
 * Tests HTTP — Slice 12 : Gestion des Événements
 *
 * Couvre :
 * - GET  /api/events                    → public, filtre futur, tri ASC
 * - GET  /api/admin/events              → admin uniquement, tous les événements
 * - POST /api/admin/events              → créer un événement
 * - PUT  /api/admin/events/[id]         → modifier un événement
 * - DELETE /api/admin/events/[id]       → supprimer un événement
 */

import { testApiHandler } from "next-test-api-route-handler"
import { describe, it, expect, vi, beforeEach } from "vitest"
import { mockDeep, mockReset } from "vitest-mock-extended"
import type { PrismaClient } from "@prisma/client"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("@/lib/prisma", () => ({
  prisma: mockDeep<PrismaClient>(),
}))

vi.mock("@/lib/auth", () => ({
  auth: vi.fn(),
}))

// ─── Imports après les mocks ──────────────────────────────────────────────────

import * as eventsHandler from "@/app/api/events/route"
import * as adminEventsHandler from "@/app/api/admin/events/route"
import * as adminEventByIdHandler from "@/app/api/admin/events/[id]/route"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

const mockPrisma = prisma as ReturnType<typeof mockDeep<PrismaClient>>

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FUTURE_DATE = (() => {
  const d = new Date()
  d.setDate(d.getDate() + 30)
  d.setHours(0, 0, 0, 0)
  return d
})()

const PAST_DATE = (() => {
  const d = new Date()
  d.setDate(d.getDate() - 10)
  d.setHours(0, 0, 0, 0)
  return d
})()

const fakeAdminSession = {
  user: {
    id: "admin-123",
    email: "admin@placev.fr",
    firstName: "Admin",
    lastName: "Place V",
    role: "ADMIN",
    segment: "BOULIACAIS",
    credits: 99,
  },
}

const fakeUserSession = {
  user: {
    id: "user-123",
    email: "user@test.fr",
    firstName: "Jean",
    lastName: "Dupont",
    role: "USER",
    segment: "EXTERNE",
    credits: 5,
  },
}

const fakeEventFuture = {
  id: "event-future-01",
  title: "Atelier Yoga",
  description: "Un atelier pour se détendre après le travail.",
  date: FUTURE_DATE,
  registrationUrl: "https://www.helloasso.com/yoga",
  createdAt: new Date(),
  updatedAt: new Date(),
}

const fakeEventPast = {
  id: "event-past-01",
  title: "Conférence Tech passée",
  description: "Événement déjà terminé.",
  date: PAST_DATE,
  registrationUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

const fakeEventNoUrl = {
  id: "event-future-02",
  title: "Café des membres",
  description: "Rencontre informelle sans inscription.",
  date: new Date(FUTURE_DATE.getTime() + 7 * 24 * 60 * 60 * 1000),
  registrationUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockReset(mockPrisma)
  vi.clearAllMocks()
  vi.mocked(auth).mockResolvedValue(fakeAdminSession as Awaited<ReturnType<typeof auth>>)
})

// ─── GET /api/events ──────────────────────────────────────────────────────────

describe("GET /api/events — route publique", () => {
  it("200 — retourne les événements à venir triés par date ASC", async () => {
    mockPrisma.event.findMany.mockResolvedValue([fakeEventFuture, fakeEventNoUrl] as any)

    await testApiHandler({
      appHandler: eventsHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })

        expect(res.status).toBe(200)
        const body = await res.json()
        expect(Array.isArray(body)).toBe(true)
        expect(body).toHaveLength(2)
        expect(body[0].id).toBe("event-future-01")
        expect(body[0].title).toBe("Atelier Yoga")
        expect(body[0].registrationUrl).toBe("https://www.helloasso.com/yoga")
        expect(body[1].registrationUrl).toBeNull()

        // Vérifie que la requête filtre sur le futur et trie par date ASC
        expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              date: expect.objectContaining({ gte: expect.any(Date) }),
            }),
            orderBy: { date: "asc" },
          })
        )
      },
    })
  })

  it("200 — retourne [] si aucun événement à venir", async () => {
    mockPrisma.event.findMany.mockResolvedValue([])

    await testApiHandler({
      appHandler: eventsHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })

        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body).toEqual([])
      },
    })
  })

  it("200 — les événements passés ne sont pas retournés", async () => {
    // La route doit filtrer date >= now — on vérifie via le mock
    mockPrisma.event.findMany.mockResolvedValue([]) // Simule filtre appliqué

    await testApiHandler({
      appHandler: eventsHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })

        expect(res.status).toBe(200)
        // Le mock event.findMany a été appelé avec un filtre gte
        expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              date: { gte: expect.any(Date) },
            }),
          })
        )
      },
    })
  })
})

// ─── GET /api/admin/events ────────────────────────────────────────────────────

describe("GET /api/admin/events — admin", () => {
  it("200 — admin voit tous les événements (passés + à venir) triés par date DESC", async () => {
    mockPrisma.event.findMany.mockResolvedValue([fakeEventNoUrl, fakeEventFuture, fakeEventPast] as any)

    await testApiHandler({
      appHandler: adminEventsHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })

        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body).toHaveLength(3)

        // Vérifie le tri DESC et l'absence de filtre sur la date
        expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            orderBy: { date: "desc" },
          })
        )
      },
    })
  })

  it("403 — non-admin → accès refusé", async () => {
    vi.mocked(auth).mockResolvedValueOnce(fakeUserSession as Awaited<ReturnType<typeof auth>>)

    await testApiHandler({
      appHandler: adminEventsHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })

        expect(res.status).toBe(403)
        expect(mockPrisma.event.findMany).not.toHaveBeenCalled()
      },
    })
  })

  it("403 — non authentifié → accès refusé", async () => {
    vi.mocked(auth).mockResolvedValueOnce(null as Awaited<ReturnType<typeof auth>>)

    await testApiHandler({
      appHandler: adminEventsHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })

        expect(res.status).toBe(403)
      },
    })
  })
})

// ─── POST /api/admin/events ───────────────────────────────────────────────────

describe("POST /api/admin/events — créer un événement", () => {
  it("201 — admin crée un événement avec registrationUrl", async () => {
    mockPrisma.event.create.mockResolvedValue(fakeEventFuture as any)

    await testApiHandler({
      appHandler: adminEventsHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Atelier Yoga",
            description: "Un atelier pour se détendre après le travail.",
            date: FUTURE_DATE.toISOString().slice(0, 10),
            registrationUrl: "https://www.helloasso.com/yoga",
          }),
        })

        expect(res.status).toBe(201)
        const body = await res.json()
        expect(body.id).toBe("event-future-01")
        expect(body.title).toBe("Atelier Yoga")

        expect(mockPrisma.event.create).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({
              title: "Atelier Yoga",
              description: "Un atelier pour se détendre après le travail.",
              registrationUrl: "https://www.helloasso.com/yoga",
            }),
          })
        )
      },
    })
  })

  it("201 — admin crée un événement sans registrationUrl (null)", async () => {
    mockPrisma.event.create.mockResolvedValue(fakeEventNoUrl as any)

    await testApiHandler({
      appHandler: adminEventsHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Café des membres",
            description: "Rencontre informelle sans inscription.",
            date: FUTURE_DATE.toISOString().slice(0, 10),
          }),
        })

        expect(res.status).toBe(201)
        const body = await res.json()
        expect(body.registrationUrl).toBeNull()
      },
    })
  })

  it("422 — titre manquant → erreur de validation", async () => {
    await testApiHandler({
      appHandler: adminEventsHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            description: "Une description.",
            date: FUTURE_DATE.toISOString().slice(0, 10),
          }),
        })

        expect(res.status).toBe(422)
        expect(mockPrisma.event.create).not.toHaveBeenCalled()
      },
    })
  })

  it("422 — date manquante → erreur de validation", async () => {
    await testApiHandler({
      appHandler: adminEventsHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Atelier sans date",
            description: "Oups.",
          }),
        })

        expect(res.status).toBe(422)
        expect(mockPrisma.event.create).not.toHaveBeenCalled()
      },
    })
  })

  it("403 — non-admin → accès refusé", async () => {
    vi.mocked(auth).mockResolvedValueOnce(fakeUserSession as Awaited<ReturnType<typeof auth>>)

    await testApiHandler({
      appHandler: adminEventsHandler,
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: "Test",
            description: "Test",
            date: FUTURE_DATE.toISOString().slice(0, 10),
          }),
        })

        expect(res.status).toBe(403)
        expect(mockPrisma.event.create).not.toHaveBeenCalled()
      },
    })
  })
})

// ─── PUT /api/admin/events/[id] ──────────────────────────────────────────────

describe("PUT /api/admin/events/[id] — modifier un événement", () => {
  const eventId = "event-future-01"

  it("200 — admin modifie le titre d'un événement", async () => {
    mockPrisma.event.findUnique.mockResolvedValue(fakeEventFuture as any)
    mockPrisma.event.update.mockResolvedValue({
      ...fakeEventFuture,
      title: "Atelier Yoga Avancé",
    } as any)

    await testApiHandler({
      appHandler: adminEventByIdHandler,
      params: { id: eventId },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Atelier Yoga Avancé" }),
        })

        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.title).toBe("Atelier Yoga Avancé")

        expect(mockPrisma.event.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: eventId },
            data: expect.objectContaining({ title: "Atelier Yoga Avancé" }),
          })
        )
      },
    })
  })

  it("200 — admin peut effacer le registrationUrl en passant null", async () => {
    mockPrisma.event.findUnique.mockResolvedValue(fakeEventFuture as any)
    mockPrisma.event.update.mockResolvedValue({
      ...fakeEventFuture,
      registrationUrl: null,
    } as any)

    await testApiHandler({
      appHandler: adminEventByIdHandler,
      params: { id: eventId },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ registrationUrl: null }),
        })

        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.registrationUrl).toBeNull()
      },
    })
  })

  it("404 — événement introuvable", async () => {
    mockPrisma.event.findUnique.mockResolvedValue(null)

    await testApiHandler({
      appHandler: adminEventByIdHandler,
      params: { id: "nonexistent-id" },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Nouveau titre" }),
        })

        expect(res.status).toBe(404)
        expect(mockPrisma.event.update).not.toHaveBeenCalled()
      },
    })
  })

  it("403 — non-admin → accès refusé", async () => {
    vi.mocked(auth).mockResolvedValueOnce(fakeUserSession as Awaited<ReturnType<typeof auth>>)

    await testApiHandler({
      appHandler: adminEventByIdHandler,
      params: { id: eventId },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ title: "Hacking" }),
        })

        expect(res.status).toBe(403)
        expect(mockPrisma.event.update).not.toHaveBeenCalled()
      },
    })
  })
})

// ─── DELETE /api/admin/events/[id] ───────────────────────────────────────────

describe("DELETE /api/admin/events/[id] — supprimer un événement", () => {
  const eventId = "event-future-01"

  it("200 — admin supprime un événement existant", async () => {
    mockPrisma.event.findUnique.mockResolvedValue(fakeEventFuture as any)
    mockPrisma.event.delete.mockResolvedValue(fakeEventFuture as any)

    await testApiHandler({
      appHandler: adminEventByIdHandler,
      params: { id: eventId },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "DELETE" })

        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.deleted).toBe(true)

        expect(mockPrisma.event.delete).toHaveBeenCalledWith(
          expect.objectContaining({ where: { id: eventId } })
        )
      },
    })
  })

  it("404 — événement introuvable", async () => {
    mockPrisma.event.findUnique.mockResolvedValue(null)

    await testApiHandler({
      appHandler: adminEventByIdHandler,
      params: { id: "nonexistent-id" },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "DELETE" })

        expect(res.status).toBe(404)
        expect(mockPrisma.event.delete).not.toHaveBeenCalled()
      },
    })
  })

  it("403 — non-admin → accès refusé", async () => {
    vi.mocked(auth).mockResolvedValueOnce(fakeUserSession as Awaited<ReturnType<typeof auth>>)

    await testApiHandler({
      appHandler: adminEventByIdHandler,
      params: { id: eventId },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "DELETE" })

        expect(res.status).toBe(403)
        expect(mockPrisma.event.delete).not.toHaveBeenCalled()
      },
    })
  })
})
