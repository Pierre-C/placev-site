// app/api/contact/route.ts
import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  const data = await req.json()
  // TODO: brancher un service d’email (Resend/Postmark) ou CRM
  console.log('CONTACT_FORM', data)
  return NextResponse.json({ ok: true })
}
