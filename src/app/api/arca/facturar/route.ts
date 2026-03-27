// src/app/api/arca/facturar/route.ts
// Emite una factura electrónica via WSFE (Web Service Factura Electrónica)

import { NextResponse, type NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requireAuth } from '@/lib/apiAuth'

const WSFE_URL_HOMO = 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx'
const WSFE_URL_PROD = 'https://servicios1.afip.gov.ar/wsfev1/service.asmx'

// ── Validaciones de input ────────────────────────────────────────────────────
const TIPOS_VALIDOS = [1, 6, 11, 19]
const CONCEPTOS_VALIDOS = [1, 2, 3]
const CUIT_REGEX = /^\d{11}$/
const CUIT_CF = '00000000000' // Consumidor Final

function validarInput(body: any): string | null {
  const { tipo_comprobante, punto_venta, importe_neto, importe_iva, importe_total, cuit_receptor } = body

  if (!TIPOS_VALIDOS.includes(Number(tipo_comprobante)))
    return `tipo_comprobante inválido. Valores permitidos: ${TIPOS_VALIDOS.join(', ')}`

  if (!Number.isInteger(Number(punto_venta)) || Number(punto_venta) < 1)
    return 'punto_venta inválido.'

  if (Number(importe_total) <= 0)
    return 'importe_total debe ser mayor a cero.'

  if (Number(importe_neto) < 0 || Number(importe_iva) < 0)
    return 'Los importes no pueden ser negativos.'

  if (Math.abs((Number(importe_neto) + Number(importe_iva)) - Number(importe_total)) > 0.05)
    return 'importe_neto + importe_iva no coincide con importe_total.'

  if (cuit_receptor && cuit_receptor !== CUIT_CF && !CUIT_REGEX.test(cuit_receptor.replace(/-/g, '')))
    return 'cuit_receptor tiene formato inválido (debe ser 11 dígitos).'

  return null
}

export async function POST(req: NextRequest) {
  // ── Verificar autenticación ──────────────────────────────
  const authError = await requireAuth(req)
  if (authError) return authError

  if (!process.env.NEXT_PUBLIC_APP_URL) {
    return NextResponse.json({ error: 'NEXT_PUBLIC_APP_URL no configurada.' }, { status: 500 })
  }
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return NextResponse.json({ error: 'Configuración de servidor incompleta.' }, { status: 500 })
  }

  try {
    const body = await req.json()

    // ── Validar inputs ───────────────────────────────────────
    const validationError = validarInput(body)
    if (validationError) {
      return NextResponse.json({ error: validationError }, { status: 400 })
    }

    const {
      tipo_comprobante,
      punto_venta,
      fecha_comprobante,
      cuit_receptor,
      condicion_iva_receptor,
      importe_neto,
      importe_iva,
      importe_total,
      alicuota_iva,
      concepto,
      descripcion,
      cliente_id,
      viaje_id,
      remito_id,
    } = body

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Obtener config
    const { data: config } = await supabase
      .from('configuracion')
      .select('arca_cuit, arca_punto_venta, arca_entorno')
      .eq('id', 1)
      .single()

    if (!config?.arca_cuit) {
      return NextResponse.json({ error: 'ARCA no configurado' }, { status: 400 })
    }

    const esProd      = config.arca_entorno === 'produccion'
    const wsfeUrl     = esProd ? WSFE_URL_PROD : WSFE_URL_HOMO
    const cuitEmisor  = config.arca_cuit.replace(/-/g, '')
    const pv          = punto_venta || config.arca_punto_venta || 1

    // 1. Obtener token de auth — pasar cookies para mantener sesión
    const authRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/arca/auth`, {
      method: 'POST',
      headers: { 'cookie': req.headers.get('cookie') || '' },
    })
    if (!authRes.ok) {
      const err = await authRes.json()
      throw new Error(err.error || 'Error de autenticación')
    }
    const { token, sign } = await authRes.json()

    // 2. Obtener último número de comprobante
    const ultimoNroSoap = buildSoapUltimoComprobante(cuitEmisor, token, sign, pv, tipo_comprobante)
    const ultimoRes = await fetch(wsfeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml; charset=UTF-8', 'SOAPAction': 'FECompUltimoAutorizado' },
      body: ultimoNroSoap,
    })
    const ultimoText = await ultimoRes.text()
    const ultimoMatch = ultimoText.match(/<CbteNro>(.*?)<\/CbteNro>/)
    const ultimoNro   = ultimoMatch ? parseInt(ultimoMatch[1]) : 0
    const nroComprobante = ultimoNro + 1

    // 3. Emitir comprobante
    const fechaStr = fecha_comprobante.replace(/-/g, '')
    const soapEmitir = buildSoapEmitirComprobante({
      cuitEmisor,
      token,
      sign,
      pv,
      tipoComprobante:  tipo_comprobante,
      nroComprobante,
      fechaStr,
      cuitReceptor:     cuit_receptor || CUIT_CF,
      condicionIva:     condicion_iva_receptor || 'CF',
      importeNeto:      Number(importe_neto),
      importeIva:       Number(importe_iva),
      importeTotal:     Number(importe_total),
      alicuotaIva:      alicuota_iva || 21,
      concepto:         CONCEPTOS_VALIDOS.includes(Number(concepto)) ? Number(concepto) : 2,
      descripcion:      descripcion || 'Servicio de transporte',
    })

    const emitirRes = await fetch(wsfeUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'text/xml; charset=UTF-8', 'SOAPAction': 'FECAESolicitar' },
      body: soapEmitir,
    })
    const emitirText = await emitirRes.text()

    // Parsear respuesta
    const caeMatch    = emitirText.match(/<CAE>(.*?)<\/CAE>/)
    const caeVtoMatch = emitirText.match(/<CAEFchVto>(.*?)<\/CAEFchVto>/)
    const errMatch    = emitirText.match(/<ErrMsg>(.*?)<\/ErrMsg>/)
    const obsMatch    = emitirText.match(/<Msg>(.*?)<\/Msg>/g)

    if (errMatch) {
      const { data: facturaError } = await supabase.from('facturas').insert([{
        tipo_comprobante: Number(tipo_comprobante),
        punto_venta: pv,
        numero_comprobante: nroComprobante,
        fecha_comprobante,
        cuit_receptor,
        condicion_iva_receptor,
        importe_neto, importe_iva, importe_total, alicuota_iva,
        concepto, descripcion,
        cliente_id: cliente_id || null,
        viaje_id:   viaje_id   || null,
        remito_id:  remito_id  || null,
        estado: 'error',
        error_msg: errMatch[1],
      }]).select().single()

      return NextResponse.json({ error: errMatch[1], factura: facturaError }, { status: 422 })
    }

    if (!caeMatch) {
      throw new Error('ARCA no devolvió CAE. Verificá los datos e intentá de nuevo.')
    }

    const cae    = caeMatch[1].trim()
    const caeVto = caeVtoMatch
      ? `${caeVtoMatch[1].substring(0,4)}-${caeVtoMatch[1].substring(4,6)}-${caeVtoMatch[1].substring(6,8)}`
      : null

    // 4. Guardar en Supabase
    const { data: factura, error: dbError } = await supabase.from('facturas').insert([{
      tipo_comprobante: tipoLetra(tipo_comprobante),
      punto_venta: pv,
      numero_comprobante: nroComprobante,
      fecha_comprobante,
      cae,
      cae_vto: caeVto,
      cuit_receptor,
      condicion_iva_receptor,
      importe_neto, importe_iva, importe_total, alicuota_iva,
      concepto, descripcion,
      cliente_id: cliente_id || null,
      viaje_id:   viaje_id   || null,
      remito_id:  remito_id  || null,
      estado: 'emitida',
    }]).select('*, clientes(razon_social)').single()

    if (dbError) throw dbError

    // 5. Si viene de un remito, marcarlo como facturado
    if (remito_id) {
      await supabase.from('remitos').update({ facturado: true, factura_id: factura.id }).eq('id', remito_id)
    }

    return NextResponse.json({ factura, cae, caeVto, nroComprobante, observaciones: obsMatch })
  } catch (e: any) {
    console.error('Error emitiendo factura:', e.message)
    return NextResponse.json({ error: e.message || 'Error al emitir la factura' }, { status: 500 })
  }
}

// ── HELPERS SOAP ──────────────────────────────────────────

function tipoLetra(tipo: number): string {
  const map: Record<number, string> = { 1: 'A', 6: 'B', 11: 'C', 19: 'E' }
  return map[tipo] || 'B'
}

function buildSoapUltimoComprobante(cuit: string, token: string, sign: string, pv: number, tipo: number) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ar="http://ar.gov.afip.dif.FEV1/">
  <soapenv:Body>
    <ar:FECompUltimoAutorizado>
      <ar:Auth><ar:Token>${token}</ar:Token><ar:Sign>${sign}</ar:Sign><ar:Cuit>${cuit}</ar:Cuit></ar:Auth>
      <ar:PtoVta>${pv}</ar:PtoVta>
      <ar:CbteTipo>${tipo}</ar:CbteTipo>
    </ar:FECompUltimoAutorizado>
  </soapenv:Body>
</soapenv:Envelope>`
}

function buildSoapEmitirComprobante(p: any) {
  const alicuotaId = p.alicuotaIva === 0 ? 3 : p.alicuotaIva === 10.5 ? 4 : p.alicuotaIva === 27 ? 6 : 5
  const docTipo    = p.cuitReceptor === CUIT_CF ? 99 : 80

  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ar="http://ar.gov.afip.dif.FEV1/">
  <soapenv:Body>
    <ar:FECAESolicitar>
      <ar:Auth><ar:Token>${p.token}</ar:Token><ar:Sign>${p.sign}</ar:Sign><ar:Cuit>${p.cuitEmisor}</ar:Cuit></ar:Auth>
      <ar:FeCAEReq>
        <ar:FeCabReq>
          <ar:CantReg>1</ar:CantReg>
          <ar:PtoVta>${p.pv}</ar:PtoVta>
          <ar:CbteTipo>${p.tipoComprobante}</ar:CbteTipo>
        </ar:FeCabReq>
        <ar:FeDetReq>
          <ar:FECAEDetRequest>
            <ar:Concepto>${p.concepto}</ar:Concepto>
            <ar:DocTipo>${docTipo}</ar:DocTipo>
            <ar:DocNro>${p.cuitReceptor}</ar:DocNro>
            <ar:CbteDesde>${p.nroComprobante}</ar:CbteDesde>
            <ar:CbteHasta>${p.nroComprobante}</ar:CbteHasta>
            <ar:CbteFch>${p.fechaStr}</ar:CbteFch>
            <ar:ImpTotal>${p.importeTotal.toFixed(2)}</ar:ImpTotal>
            <ar:ImpTotConc>0.00</ar:ImpTotConc>
            <ar:ImpNeto>${p.importeNeto.toFixed(2)}</ar:ImpNeto>
            <ar:ImpOpEx>0.00</ar:ImpOpEx>
            <ar:ImpTrib>0.00</ar:ImpTrib>
            <ar:ImpIVA>${p.importeIva.toFixed(2)}</ar:ImpIVA>
            <ar:FchServDesde>${p.fechaStr}</ar:FchServDesde>
            <ar:FchServHasta>${p.fechaStr}</ar:FchServHasta>
            <ar:FchVtoPago>${p.fechaStr}</ar:FchVtoPago>
            <ar:MonId>PES</ar:MonId>
            <ar:MonCotiz>1</ar:MonCotiz>
            <ar:Iva>
              <ar:AlicIva>
                <ar:Id>${alicuotaId}</ar:Id>
                <ar:BaseImp>${p.importeNeto.toFixed(2)}</ar:BaseImp>
                <ar:Importe>${p.importeIva.toFixed(2)}</ar:Importe>
              </ar:AlicIva>
            </ar:Iva>
          </ar:FECAEDetRequest>
        </ar:FeDetReq>
      </ar:FeCAEReq>
    </ar:FECAESolicitar>
  </soapenv:Body>
</soapenv:Envelope>`
}
