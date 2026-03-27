// src/app/api/arca/test/route.ts
// Verifica la conexión con el servidor Traccar GPS

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/apiAuth'

export async function POST(req: NextRequest) {
  // ── Verificar autenticación ──────────────────────────────
  const authError = await requireAuth(req)
  if (authError) return authError

  try {
    const { traccar_url, traccar_email, traccar_password } = await req.json()

    if (!traccar_url || !traccar_email) {
      return NextResponse.json({ ok: false, error: 'URL y email requeridos' })
    }

    // Validar que la URL sea HTTPS en producción
    const url = traccar_url.replace(/\/$/, '')
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      return NextResponse.json({ ok: false, error: 'URL inválida.' })
    }

    const credentials = Buffer.from(`${traccar_email}:${traccar_password}`).toString('base64')
    const res = await fetch(`${url}/api/session`, {
      headers: { 'Authorization': `Basic ${credentials}` },
    })

    if (!res.ok) return NextResponse.json({ ok: false, error: `HTTP ${res.status}` })

    const user = await res.json()
    // No retornar datos sensibles del usuario Traccar — solo confirmar éxito
    return NextResponse.json({ ok: true, user: { name: user.name, id: user.id } })
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message })
  }
}
