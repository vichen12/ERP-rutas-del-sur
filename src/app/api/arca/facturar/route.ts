// src/app/api/arca/facturar/route.ts
// Emite una factura electrónica via WSFE (Web Service Factura Electrónica)

import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const WSFE_URL_HOMO = 'https://wswhomo.afip.gov.ar/wsfev1/service.asmx'
const WSFE_URL_PROD = 'https://servicios1.afip.gov.ar/wsfev1/service.asmx'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const {
      tipo_comprobante,  // 1=FA, 6=FB, 11=FC
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
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
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

    const esProd   = config.arca_entorno === 'produccion'
    const wsfeUrl  = esProd ? WSFE_URL_PROD : WSFE_URL_HOMO
    const cuitEmisor = config.arca_cuit.replace(/-/g, '')
    const pv       = punto_venta || config.arca_punto_venta || 1

    // 1. Obtener token de auth
    const authRes = await fetch(`${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/arca/auth`, {
      method: 'POST',
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
      tipoComprobante: tipo_comprobante,
      nroComprobante,
      fechaStr,
      cuitReceptor: cuit_receptor || '00000000000',
      condicionIva: condicion_iva_receptor || 'CF',
      importeNeto: importe_neto,
      importeIva:  importe_iva,
      importeTotal: importe_total,
      alicuotaIva: alicuota_iva || 21,
      concepto:    concepto || 2,
      descripcion: descripcion || 'Servicio de transporte',
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
      // Guardar con estado error
      const { data: facturaError } = await supabase.from('facturas').insert([{
        tipo_comprobante: tipoLetra(tipo_comprobante),
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
      throw new Error('ARCA no devolvió CAE. Respuesta: ' + emitirText.substring(0, 500))
    }

    const cae    = caeMatch[1].trim()
    const caeVto = caeVtoMatch ? `${caeVtoMatch[1].substring(0,4)}-${caeVtoMatch[1].substring(4,6)}-${caeVtoMatch[1].substring(6,8)}` : null

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
    console.error('Error emitiendo factura:', e)
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
  const alicuotaId = p.alicuotaIva === 0 ? 3 : p.alicuotaIva === 10.5 ? 4 : p.alicuotaIva === 27 ? 6 : 5 // 5=21%
  const docTipo    = p.cuitReceptor === '00000000000' ? 99 : 80 // 99=Consumidor Final, 80=CUIT

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