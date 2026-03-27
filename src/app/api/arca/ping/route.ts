// src/app/api/arca/ping/route.ts
// Verifica la conexión con AFIP/ARCA

import { NextResponse, type NextRequest } from 'next/server'
import Afip from '@afipsdk/afip.js'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/apiAuth'

export async function GET(req: NextRequest) {
  // ── Verificar autenticación ──────────────────────────────
  const authError = await requireAuth(req)
  if (authError) return authError

  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ success: false, error: 'Configuración de servidor incompleta.' }, { status: 500 })
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    const { data: config, error } = await supabase
      .from('configuracion')
      .select('arca_cuit, arca_certificado, arca_clave_privada, arca_entorno')
      .eq('id', 1)
      .single()

    if (error || !config) {
      return NextResponse.json({ success: false, error: 'No se encontró configuración.' }, { status: 400 })
    }

    if (!config.arca_certificado || !config.arca_clave_privada) {
      return NextResponse.json({ success: false, error: 'Faltan certificados.' }, { status: 400 })
    }

    const afip = new Afip({
      CUIT:        parseInt(config.arca_cuit.replace(/[^0-9]/g, '')),
      cert:        config.arca_certificado,
      key:         config.arca_clave_privada,
      production:  config.arca_entorno === 'produccion',
      access_token: '',
    } as any)

    const serverStatus = await afip.ElectronicBilling.getServerStatus()
    await (afip as any).CreateTA('wsfe')

    return NextResponse.json({
      success: true,
      message: 'Conexión verificada correctamente',
      status: serverStatus,
    })
  } catch (error: any) {
    console.error('Error Ping AFIP:', error.message)
    return NextResponse.json({
      success: false,
      error: error.message || 'Error de conexión con AFIP.',
    }, { status: 500 })
  }
}
