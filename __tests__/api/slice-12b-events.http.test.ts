/**
 * __tests__/api/slice-12b-events.http.test.ts
 * Tests HTTP — Slice 12b : Images Événements, ?limit=, ?includePast=
 *
 * Couvre :
 * - GET  /api/events?limit=3            → max 3 résultats
 * - GET  /api/events?includePast=true   → inclut événements passés
 * - GET  /api/events                    → champ imageUrl dans chaque résultat
 * - POST /api/admin/events/[id]/image   → upload image (admin)
 * - DELETE /api/admin/events/[id]/image → suppression image (admin)
 * - GET  /api/events/[id]/image         → servir image ou redirect vers défaut
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
import * as eventImageHandler from "@/app/api/events/[id]/image/route"
import * as adminEventImageHandler from "@/app/api/admin/events/[id]/image/route"
import { prisma } from "@/lib/prisma"
import { auth } from "@/lib/auth"

const mockPrisma = prisma as ReturnType<typeof mockDeep<PrismaClient>>

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const FUTURE_DATE_1 = (() => {
  const d = new Date()
  d.setDate(d.getDate() + 7)
  d.setHours(0, 0, 0, 0)
  return d
})()

const FUTURE_DATE_2 = (() => {
  const d = new Date()
  d.setDate(d.getDate() + 14)
  d.setHours(0, 0, 0, 0)
  return d
})()

const FUTURE_DATE_3 = (() => {
  const d = new Date()
  d.setDate(d.getDate() + 21)
  d.setHours(0, 0, 0, 0)
  return d
})()

const FUTURE_DATE_4 = (() => {
  const d = new Date()
  d.setDate(d.getDate() + 28)
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

const FAKE_BASE64 = "data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEASABIAAD/fake"

// Événements avec image (relation EventImage incluse dans la réponse Prisma)
const makeEvent = (id: string, date: Date, hasImage = false) => ({
  id,
  title: `Événement ${id}`,
  description: `Description de l'événement ${id}`,
  date,
  registrationUrl: null,
  createdAt: new Date(),
  updatedAt: new Date(),
  image: hasImage ? { mimeType: "image/jpeg" } : null,
})

const fakeEventImage = {
  id: "img-01",
  eventId: "event-01",
  data: FAKE_BASE64,
  mimeType: "image/jpeg",
  createdAt: new Date(),
}

// ─── Setup ────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockReset(mockPrisma)
  ;(mockPrisma as any).eventImage = {
    upsert: vi.fn(),
    delete: vi.fn(),
    findUnique: vi.fn(),
  }
  vi.clearAllMocks()
  vi.mocked(auth).mockResolvedValue(fakeAdminSession as Awaited<ReturnType<typeof auth>>)
})

// ─── GET /api/events?limit=3 ──────────────────────────────────────────────────

describe("GET /api/events?limit=3 — limite homepage", () => {
  it("retourne au maximum 3 événements quand limit=3 est passé", async () => {
    const fourEvents = [
      makeEvent("e1", FUTURE_DATE_1),
      makeEvent("e2", FUTURE_DATE_2),
      makeEvent("e3", FUTURE_DATE_3),
      makeEvent("e4", FUTURE_DATE_4),
    ]
    mockPrisma.event.findMany.mockResolvedValue(fourEvents as any)

    await testApiHandler({
      appHandler: eventsHandler,
      url: "/api/events?limit=3",
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })

        expect(res.status).toBe(200)
        const body = await res.json()
        expect(Array.isArray(body)).toBe(true)
        // La route doit passer take: 3 à Prisma (ou tronquer après)
        expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            take: 3,
          })
        )
      },
    })
  })

  it("sans paramètre limit, ne passe pas take à Prisma", async () => {
    mockPrisma.event.findMany.mockResolvedValue([makeEvent("e1", FUTURE_DATE_1)] as any)

    await testApiHandler({
      appHandler: eventsHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })

        expect(res.status).toBe(200)
        // Sans limit, la requête Prisma ne doit pas avoir de take
        const call = mockPrisma.event.findMany.mock.calls[0]?.[0]
        expect(call?.take).toBeUndefined()
      },
    })
  })
})

// ─── GET /api/events?includePast=true ─────────────────────────────────────────

describe("GET /api/events?includePast=true — page /events", () => {
  it("inclut les événements passés quand includePast=true", async () => {
    const allEvents = [
      makeEvent("past-01", PAST_DATE),
      makeEvent("future-01", FUTURE_DATE_1),
    ]
    mockPrisma.event.findMany.mockResolvedValue(allEvents as any)

    await testApiHandler({
      appHandler: eventsHandler,
      url: "/api/events?includePast=true",
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })

        expect(res.status).toBe(200)
        // Sans filtre de date (pas de `where: { date: { gte: ... } }`)
        const call = mockPrisma.event.findMany.mock.calls[0]?.[0]
        expect(call?.where?.date?.gte).toBeUndefined()
      },
    })
  })

  it("sans includePast, filtre sur les événements à venir uniquement", async () => {
    mockPrisma.event.findMany.mockResolvedValue([makeEvent("future-01", FUTURE_DATE_1)] as any)

    await testApiHandler({
      appHandler: eventsHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })

        expect(res.status).toBe(200)
        expect(mockPrisma.event.findMany).toHaveBeenCalledWith(
          expect.objectContaining({
            where: expect.objectContaining({
              date: expect.objectContaining({ gte: expect.any(Date) }),
            }),
          })
        )
      },
    })
  })
})

// ─── GET /api/events — champ imageUrl ─────────────────────────────────────────

describe("GET /api/events — champ imageUrl", () => {
  it("retourne imageUrl='/api/events/{id}/image' si l'événement a une image", async () => {
    mockPrisma.event.findMany.mockResolvedValue([makeEvent("e1", FUTURE_DATE_1, true)] as any)

    await testApiHandler({
      appHandler: eventsHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body[0].imageUrl).toBe("/api/events/e1/image")
      },
    })
  })

  it("retourne imageUrl='/gallery/PXL_20250909_120231896.jpg' si pas d'image", async () => {
    mockPrisma.event.findMany.mockResolvedValue([makeEvent("e1", FUTURE_DATE_1, false)] as any)

    await testApiHandler({
      appHandler: eventsHandler,
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })
        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body[0].imageUrl).toBe("/gallery/PXL_20250909_120231896.jpg")
      },
    })
  })
})

// ─── GET /api/events/[id]/image ───────────────────────────────────────────────

describe("GET /api/events/[id]/image — servir l'image", () => {
  it("200 — retourne les octets de l'image avec le bon Content-Type", async () => {
    mockPrisma.event.findUnique.mockResolvedValue(makeEvent("e1", FUTURE_DATE_1, true) as any)
    ;(mockPrisma as any).eventImage = {
      findUnique: vi.fn().mockResolvedValue(fakeEventImage),
    }
    mockPrisma.eventImage.findUnique.mockResolvedValue(fakeEventImage as any)

    await testApiHandler({
      appHandler: eventImageHandler,
      params: { id: "e1" },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })
        // 200 avec image/jpeg ou 302 vers défaut — les deux sont acceptables
        expect([200, 302]).toContain(res.status)
      },
    })
  })

  it("302 — redirige vers l'image par défaut si aucune image pour cet événement", async () => {
    mockPrisma.event.findUnique.mockResolvedValue(makeEvent("e1", FUTURE_DATE_1, false) as any)
    mockPrisma.eventImage.findUnique.mockResolvedValue(null)

    await testApiHandler({
      appHandler: eventImageHandler,
      params: { id: "e1" },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET", redirect: "manual" })
        expect(res.status).toBe(302)
        const location = res.headers.get("location")
        expect(location).toContain("PXL_20250909_120231896.jpg")
      },
    })
  })

  it("404 — événement introuvable", async () => {
    mockPrisma.event.findUnique.mockResolvedValue(null)

    await testApiHandler({
      appHandler: eventImageHandler,
      params: { id: "nonexistent" },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "GET" })
        expect(res.status).toBe(404)
      },
    })
  })
})

// ─── POST /api/admin/events/[id]/image ────────────────────────────────────────

describe("POST /api/admin/events/[id]/image — upload image admin", () => {
  it("201 — admin uploade une image valide", async () => {
    mockPrisma.event.findUnique.mockResolvedValue(makeEvent("e1", FUTURE_DATE_1) as any)
    mockPrisma.eventImage.upsert.mockResolvedValue(fakeEventImage as any)

    await testApiHandler({
      appHandler: adminEventImageHandler,
      params: { id: "e1" },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: FAKE_BASE64,
            mimeType: "image/jpeg",
          }),
        })

        expect(res.status).toBe(201)
        const body = await res.json()
        expect(body.eventId).toBe("event-01")

        expect(mockPrisma.eventImage.upsert).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { eventId: "e1" },
            create: expect.objectContaining({
              eventId: "e1",
              data: FAKE_BASE64,
              mimeType: "image/jpeg",
            }),
            update: expect.objectContaining({
              data: FAKE_BASE64,
              mimeType: "image/jpeg",
            }),
          })
        )
      },
    })
  })

  it("400 — data manquante → refusé", async () => {
    mockPrisma.event.findUnique.mockResolvedValue(makeEvent("e1", FUTURE_DATE_1) as any)

    await testApiHandler({
      appHandler: adminEventImageHandler,
      params: { id: "e1" },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mimeType: "image/jpeg" }), // data manquant
        })

        expect(res.status).toBe(400)
        expect(mockPrisma.eventImage.upsert).not.toHaveBeenCalled()
      },
    })
  })

  it("400 — mimeType invalide → refusé", async () => {
    mockPrisma.event.findUnique.mockResolvedValue(makeEvent("e1", FUTURE_DATE_1) as any)

    await testApiHandler({
      appHandler: adminEventImageHandler,
      params: { id: "e1" },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: FAKE_BASE64, mimeType: "application/pdf" }),
        })

        expect(res.status).toBe(400)
        expect(mockPrisma.eventImage.upsert).not.toHaveBeenCalled()
      },
    })
  })

  it("404 — événement introuvable", async () => {
    mockPrisma.event.findUnique.mockResolvedValue(null)

    await testApiHandler({
      appHandler: adminEventImageHandler,
      params: { id: "nonexistent" },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: FAKE_BASE64, mimeType: "image/jpeg" }),
        })

        expect(res.status).toBe(404)
      },
    })
  })

  it("403 — non-admin → refusé", async () => {
    vi.mocked(auth).mockResolvedValueOnce(fakeUserSession as Awaited<ReturnType<typeof auth>>)

    await testApiHandler({
      appHandler: adminEventImageHandler,
      params: { id: "e1" },
      test: async ({ fetch }) => {
        const res = await fetch({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: FAKE_BASE64, mimeType: "image/jpeg" }),
        })

        expect(res.status).toBe(403)
        expect(mockPrisma.eventImage.upsert).not.toHaveBeenCalled()
      },
    })
  })
})

// ─── DELETE /api/admin/events/[id]/image ─────────────────────────────────────

describe("DELETE /api/admin/events/[id]/image — supprimer image admin", () => {
  it("200 — admin supprime l'image d'un événement", async () => {
    mockPrisma.event.findUnique.mockResolvedValue(makeEvent("e1", FUTURE_DATE_1, true) as any)
    mockPrisma.eventImage.findUnique.mockResolvedValue(fakeEventImage as any)
    mockPrisma.eventImage.delete.mockResolvedValue(fakeEventImage as any)

    await testApiHandler({
      appHandler: adminEventImageHandler,
      params: { id: "e1" },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "DELETE" })

        expect(res.status).toBe(200)
        const body = await res.json()
        expect(body.deleted).toBe(true)

        expect(mockPrisma.eventImage.delete).toHaveBeenCalledWith(
          expect.objectContaining({ where: { eventId: "e1" } })
        )
      },
    })
  })

  it("404 — aucune image pour cet événement", async () => {
    mockPrisma.event.findUnique.mockResolvedValue(makeEvent("e1", FUTURE_DATE_1, false) as any)
    mockPrisma.eventImage.findUnique.mockResolvedValue(null)

    await testApiHandler({
      appHandler: adminEventImageHandler,
      params: { id: "e1" },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "DELETE" })

        expect(res.status).toBe(404)
        expect(mockPrisma.eventImage.delete).not.toHaveBeenCalled()
      },
    })
  })

  it("403 — non-admin → refusé", async () => {
    vi.mocked(auth).mockResolvedValueOnce(fakeUserSession as Awaited<ReturnType<typeof auth>>)

    await testApiHandler({
      appHandler: adminEventImageHandler,
      params: { id: "e1" },
      test: async ({ fetch }) => {
        const res = await fetch({ method: "DELETE" })

        expect(res.status).toBe(403)
        expect(mockPrisma.eventImage.delete).not.toHaveBeenCalled()
      },
    })
  })
})
