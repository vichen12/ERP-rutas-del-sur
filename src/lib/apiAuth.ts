/**
 * Helper de autenticación para API Routes (App Router)
 * Verifica la sesión Supabase usando las cookies de la request.
 * Usar al inicio de cada route handler.
 *
 * Uso:
 *   const authError = await requireAuth(req)
 *   if (authError) return authError
 */

import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function requireAuth(req: NextRequest | Request): Promise<NextResponse | null> {
  try {
    // Leer cookies desde la request
    const cookieHeader = (req as Request).headers.get('cookie') || ''
    const cookieMap = Object.fromEntries(
      cookieHeader.split(';').map(c => {
        const [k, ...v] = c.trim().split('=')
        return [k, decodeURIComponent(v.join('='))]
      }).filter(([k]) => k)
    )

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) { return cookieMap[name] },
          set() {},
          remove() {},
        },
      }
    )

    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json(
        { error: 'No autorizado. Iniciá sesión para continuar.' },
        { status: 401 }
      )
    }

    return null // Auth OK
  } catch {
    return NextResponse.json(
      { error: 'Error verificando autenticación.' },
      { status: 401 }
    )
  }
}
