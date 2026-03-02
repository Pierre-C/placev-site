/**
 * @vitest-environment jsdom
 * __tests__/slice-07-main-nav.test.tsx
 * Tests unitaires — Slice 7 : Refonte Navigation Principale & CTAs
 *
 * À lancer avec : npm run test
 * next/link et LogoutButton sont mockés — aucun rendu React complet requis.
 */

import { describe, it, expect, vi } from "vitest"
import { render, screen } from "@testing-library/react"
import "@testing-library/jest-dom"
import { HeaderAuthButton } from "@/components/layout/HeaderAuthButton"

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>{children}</a>
  ),
}))

vi.mock("@/components/app/LogoutButton", () => ({
  LogoutButton: () => <button data-testid="logout-btn">Se déconnecter</button>,
}))

// ─── HeaderAuthButton — non connecté ─────────────────────────────────────────

describe("HeaderAuthButton — non connecté", () => {
  it("affiche le label 'Déjà membre ?'", () => {
    render(<HeaderAuthButton session={null} />)
    expect(screen.getByTestId("header-login-label")).toHaveTextContent("Déjà membre")
  })

  it("affiche le lien 'Se connecter' (header-login-btn)", () => {
    render(<HeaderAuthButton session={null} />)
    expect(screen.getByTestId("header-login-btn")).toBeInTheDocument()
  })

  it("le lien 'Se connecter' pointe vers /login", () => {
    render(<HeaderAuthButton session={null} />)
    expect(screen.getByTestId("header-login-btn")).toHaveAttribute("href", "/login")
  })

  it("ne contient pas de CTA 'Réserver'", () => {
    render(<HeaderAuthButton session={null} />)
    expect(screen.queryByText(/réserver/i)).toBeNull()
  })

  it("ne contient pas le conteneur header-user-menu", () => {
    render(<HeaderAuthButton session={null} />)
    expect(screen.queryByTestId("header-user-menu")).toBeNull()
  })
})

// ─── HeaderAuthButton — connecté ─────────────────────────────────────────────

describe("HeaderAuthButton — connecté", () => {
  const fakeSession = {
    user: { name: "Marie Dupont", email: "marie@test.fr", role: "USER" as const },
    expires: "2099-01-01",
  } as any

  it("affiche le conteneur header-user-menu", () => {
    render(<HeaderAuthButton session={fakeSession} />)
    expect(screen.getByTestId("header-user-menu")).toBeInTheDocument()
  })

  it("affiche 'Bonjour' et le prénom de l'utilisateur", () => {
    render(<HeaderAuthButton session={fakeSession} />)
    expect(screen.getByText(/Bonjour/i)).toBeInTheDocument()
    expect(screen.getByText(/Marie/)).toBeInTheDocument()
  })

  it("affiche le lien 'Mon espace' (header-dashboard-link)", () => {
    render(<HeaderAuthButton session={fakeSession} />)
    expect(screen.getByTestId("header-dashboard-link")).toBeInTheDocument()
  })

  it("le lien 'Mon espace' pointe vers /dashboard", () => {
    render(<HeaderAuthButton session={fakeSession} />)
    expect(screen.getByTestId("header-dashboard-link")).toHaveAttribute("href", "/dashboard")
  })

  it("affiche le bouton 'Se déconnecter' (logout-btn)", () => {
    render(<HeaderAuthButton session={fakeSession} />)
    expect(screen.getByTestId("logout-btn")).toBeInTheDocument()
  })

  it("ne contient pas de CTA 'Réserver'", () => {
    render(<HeaderAuthButton session={fakeSession} />)
    expect(screen.queryByText(/réserver/i)).toBeNull()
  })

  it("n'affiche pas le label 'Déjà membre ?'", () => {
    render(<HeaderAuthButton session={fakeSession} />)
    expect(screen.queryByTestId("header-login-label")).toBeNull()
  })
})

// ─── HeaderAuthButton — connecté (email fallback) ─────────────────────────────

describe("HeaderAuthButton — connecté sans nom", () => {
  const sessionSansNom = {
    user: { name: null, email: "sans-nom@test.fr", role: "USER" as const },
    expires: "2099-01-01",
  } as any

  it("affiche l'email quand le nom est absent", () => {
    render(<HeaderAuthButton session={sessionSansNom} />)
    expect(screen.getByText(/sans-nom@test\.fr/)).toBeInTheDocument()
  })
})
