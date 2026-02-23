/**
 * app/api/auth/[...nextauth]/route.ts
 * Handlers Auth.js v5 — GET et POST pour toutes les routes /api/auth/*
 */

import { handlers } from "@/lib/auth"

export const { GET, POST } = handlers
