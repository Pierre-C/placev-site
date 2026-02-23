/**
 * middleware.ts
 * Protection des routes via Auth.js v5.
 * Utilise authConfig (edge-safe, sans bcrypt ni Prisma).
 *
 * Règles :
 *   /dashboard/* → redirect /login si non authentifié
 *   /booking/*   → redirect /login si non authentifié
 *   /admin/*     → role ADMIN requis → redirect /dashboard si USER
 */

import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"
import { NextResponse } from "next/server"

const { auth } = NextAuth(authConfig)

export default auth((req) => {
  const { nextUrl } = req
  const session = req.auth
  const isLoggedIn = !!session

  const isAdminRoute = nextUrl.pathname.startsWith("/admin")
  const isDashboardRoute = nextUrl.pathname.startsWith("/dashboard")
  const isBookingRoute = nextUrl.pathname.startsWith("/booking")
  const isProtected = isAdminRoute || isDashboardRoute || isBookingRoute

  // Non authentifié → /login
  if (isProtected && !isLoggedIn) {
    return NextResponse.redirect(new URL("/login", req.url))
  }

  // USER sur /admin → /dashboard
  if (isAdminRoute && isLoggedIn && session.user.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/dashboard", req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: ["/dashboard/:path*", "/booking/:path*", "/admin/:path*"],
}
