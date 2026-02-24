import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { traccar_url, traccar_email, traccar_password } = await req.json()
    if (!traccar_url || !traccar_email) {
      return NextResponse.json({ ok: false, error: 'URL y email requeridos' })
    }
    const credentials = Buffer.from(`${traccar_email}:${traccar_password}`).toString('base64')
    const res = await fetch(`${traccar_url.replace(/\/$/, '')}/api/session`, {
      headers: { 'Authorization': `Basic ${credentials}` }
    })
    if (!res.ok) return NextResponse.json({ ok: false, error: `HTTP ${res.status}` })
    const user = await res.json()
    return NextResponse.json({ ok: true, user })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message })
  }
}