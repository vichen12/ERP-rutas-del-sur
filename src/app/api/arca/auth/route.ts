// src/app/api/arca/auth/route.ts
// Obtiene el Token de Acceso (TA) del WSAA de ARCA/AFIP
// El TA dura 12hs, se guarda en memoria para reutilizar

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Cache del token en memoria (dura 12hs)
let tokenCache: { token: string; sign: string; expiresAt: number } | null = null

const WSAA_URL_HOMO = 'https://wsaahomo.afip.gov.ar/ws/services/LoginCms'
const WSAA_URL_PROD = 'https://wsaa.afip.gov.ar/ws/services/LoginCms'

export async function POST(req: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )

    // Obtener configuración ARCA desde Supabase
    const { data: config } = await supabase
      .from('configuracion')
      .select('arca_cuit, arca_certificado, arca_clave_privada, arca_entorno')
      .eq('id', 1)
      .single()

    if (!config?.arca_cuit || !config?.arca_certificado || !config?.arca_clave_privada) {
      return NextResponse.json(
        { error: 'Certificado ARCA no configurado. Cargá el certificado y clave privada en Configuración.' },
        { status: 400 }
      )
    }

    // Si el token en cache todavía es válido, devolverlo
    if (tokenCache && tokenCache.expiresAt > Date.now() + 5 * 60 * 1000) {
      return NextResponse.json({ token: tokenCache.token, sign: tokenCache.sign })
    }

    const esProd = config.arca_entorno === 'produccion'
    const wsaaUrl = esProd ? WSAA_URL_PROD : WSAA_URL_HOMO

    // Construir el TRA (Ticket de Requerimiento de Acceso)
    const ahora = new Date()
    const desde = new Date(ahora.getTime() - 60000).toISOString()
    const hasta = new Date(ahora.getTime() + 43200000).toISOString() // +12hs

    const tra = `<?xml version="1.0" encoding="UTF-8"?>
<loginTicketRequest version="1.0">
  <header>
    <uniqueId>${Math.floor(Date.now() / 1000)}</uniqueId>
    <generationTime>${desde}</generationTime>
    <expirationTime>${hasta}</expirationTime>
  </header>
  <service>wsfe</service>
</loginTicketRequest>`

    // Firmar el TRA con el certificado (usando la API de firma)
    // NOTA: La firma CMS requiere Node.js crypto / forge en el servidor
    const firmaResponse = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/arca/sign`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        tra,
        certificado: config.arca_certificado,
        clavePrivada: config.arca_clave_privada,
      }),
    })

    if (!firmaResponse.ok) {
      throw new Error('Error al firmar el TRA')
    }

    const { cmsSigned } = await firmaResponse.json()

    // Llamar al WSAA de ARCA
    const soapBody = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsaa="http://wsaa.view.sua.dvadac.desein.afip.gov">
  <soapenv:Header/>
  <soapenv:Body>
    <wsaa:loginCms>
      <wsaa:in0>${cmsSigned}</wsaa:in0>
    </wsaa:loginCms>
  </soapenv:Body>
</soapenv:Envelope>`

    const wsaaResponse = await fetch(wsaaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/xml; charset=UTF-8',
        'SOAPAction': '',
      },
      body: soapBody,
    })

    const wsaaText = await wsaaResponse.text()

    // Parsear respuesta XML
    const tokenMatch = wsaaText.match(/<token>(.*?)<\/token>/s)
    const signMatch  = wsaaText.match(/<sign>(.*?)<\/sign>/s)

    if (!tokenMatch || !signMatch) {
      console.error('Respuesta WSAA:', wsaaText)
      throw new Error('No se pudo obtener el token de ARCA. Verificá el certificado.')
    }

    const token = tokenMatch[1].trim()
    const sign  = signMatch[1].trim()

    // Guardar en cache
    tokenCache = { token, sign, expiresAt: ahora.getTime() + 43200000 }

    return NextResponse.json({ token, sign })
  } catch (e: any) {
    console.error('Error auth ARCA:', e)
    return NextResponse.json({ error: e.message || 'Error de autenticación con ARCA' }, { status: 500 })
  }
}