/**
 * __tests__/ui-integration.test.tsx
 * Tests unitaires — Slice 0 : Intégration UI Navigation & Authentification
 *
 * Tests des composants HeaderAuthButton et LogoutButton.
 * À lancer avec : npm run test
 */

// @vitest-environment jsdom

import { describe, it, expect, vi, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import React from "react"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}))

// next/link est rendu comme un <a> simple dans les tests
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode; [key: string]: unknown }) =>
    React.createElement("a", { href, ...props }, children),
}))

// ─── Imports après les mocks ──────────────────────────────────────────────────

import { HeaderAuthButton } from "@/components/layout/HeaderAuthButton"
import { LogoutButton } from "@/components/app/LogoutButton"

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const sessionUser = {
  user: {
    id: "user-1",
    name: "Jean Dupont",
    email: "jean@test.fr",
    role: "USER",
    segment: "EXTERNE",
    credits: 5,
  },
  expires: "2099-01-01",
}

const sessionAdmin = {
  user: {
    id: "admin-1",
    name: "Alice Admin",
    email: "admin@placev.fr",
    role: "ADMIN",
    segment: "INTERNE",
    credits: 0,
  },
  expires: "2099-01-01",
}

// ─── Tests HeaderAuthButton ────────────────────────────────────────────────────

describe("HeaderAuthButton", () => {
  it("affiche header-login-btn quand session est null", () => {
    render(<HeaderAuthButton session={null} />)

    expect(screen.queryByTestId("header-login-btn")).not.toBeNull()
    expect(screen.queryByTestId("header-user-menu")).toBeNull()
  })

  it("header-login-btn pointe vers /login", () => {
    render(<HeaderAuthButton session={null} />)

    const loginBtn = screen.queryByTestId("header-login-btn") as HTMLAnchorElement | null
    expect(loginBtn?.getAttribute("href")).toBe("/login")
  })

  it("affiche header-user-menu avec le prénom quand session user est présente", () => {
    render(<HeaderAuthButton session={sessionUser} />)

    expect(screen.queryByTestId("header-user-menu")).not.toBeNull()
    expect(screen.queryByTestId("header-login-btn")).toBeNull()
    // Le prénom "Jean" doit être visible
    expect(screen.getByTestId("header-user-menu").textContent).toContain("Jean")
  })

  it("affiche header-dashboard-link vers /dashboard quand connecté", () => {
    render(<HeaderAuthButton session={sessionUser} />)

    const dashboardLink = screen.queryByTestId("header-dashboard-link") as HTMLAnchorElement | null
    expect(dashboardLink).not.toBeNull()
    expect(dashboardLink?.getAttribute("href")).toBe("/dashboard")
  })

  it("n'affiche PAS header-admin-badge pour un user normal", () => {
    render(<HeaderAuthButton session={sessionUser} />)

    expect(screen.queryByTestId("header-admin-badge")).toBeNull()
  })

  it("affiche header-admin-badge quand session admin est présente", () => {
    render(<HeaderAuthButton session={sessionAdmin} />)

    expect(screen.queryByTestId("header-user-menu")).not.toBeNull()
    expect(screen.queryByTestId("header-admin-badge")).not.toBeNull()
  })

  it("affiche le prénom de l'admin dans header-user-menu", () => {
    render(<HeaderAuthButton session={sessionAdmin} />)

    expect(screen.getByTestId("header-user-menu").textContent).toContain("Alice")
  })
})

// ─── Tests LogoutButton ────────────────────────────────────────────────────────

describe("LogoutButton", () => {
  it("affiche le bouton avec data-testid='logout-btn'", () => {
    render(<LogoutButton />)

    expect(screen.queryByTestId("logout-btn")).not.toBeNull()
  })

  it("le bouton affiche un texte de déconnexion", () => {
    render(<LogoutButton />)

    const btn = screen.getByTestId("logout-btn")
    expect(btn.textContent?.toLowerCase()).toContain("déconnecter")
  })
})

// ─── Absence de header-contact-btn ────────────────────────────────────────────

describe("Header — absence du bouton Contact", () => {
  it("header-contact-btn ne doit pas exister dans HeaderAuthButton", () => {
    render(<HeaderAuthButton session={null} />)
    expect(screen.queryByTestId("header-contact-btn")).toBeNull()
  })

  it("header-contact-btn ne doit pas exister quand connecté", () => {
    render(<HeaderAuthButton session={sessionUser} />)
    expect(screen.queryByTestId("header-contact-btn")).toBeNull()
  })
})
