import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Manejo de pre-flight para CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { resumen, detalle_deudores, fecha_generacion } = await req.json()

    // Armamos el HTML del mail con el estilo de Rutas del Sur
    const htmlContent = `
      <div style="font-family: sans-serif; color: #020617; max-width: 600px; margin: auto;">
        <h1 style="color: #0284c7; border-bottom: 2px solid #0284c7; padding-bottom: 10px;">
          REPORTE MENSUAL - RUTAS DEL SUR
        </h1>
        <p><strong>Fecha de Generación:</strong> ${fecha_generacion}</p>
        <div style="background: #f1f5f9; padding: 20px; rounded: 15px; margin: 20px 0;">
          <h2 style="margin: 0; font-size: 1.2rem;">DEUDA TOTAL ACUMULADA</h2>
          <p style="font-size: 2rem; font-weight: 900; color: #e11d48; margin: 10px 0;">
            $${resumen.deuda_total_acumulada.toLocaleString('es-AR')}
          </p>
          <p style="font-size: 0.8rem; color: #64748b;">Total de Clientes en Cartera: ${resumen.total_clientes}</p>
        </div>
        <h3>DETALLE POR CLIENTE Y REMITOS PENDIENTES:</h3>
        ${detalle_deudores.map((c: any) => `
          <div style="border-left: 4px solid #0284c7; padding-left: 15px; margin-bottom: 25px;">
            <p style="font-weight: bold; margin: 0; text-transform: uppercase;">${c.cliente} (CUIT: ${c.cuit})</p>
            <p style="color: #e11d48; font-weight: 800; margin: 5px 0;">Saldo: $${c.deuda_actual.toLocaleString('es-AR')}</p>
            <ul style="font-size: 0.85rem; color: #475569;">
              ${c.remitos_pendientes.map((r: string) => `<li>${r}</li>`).join('')}
            </ul>
          </div>
        `).join('')}
        <footer style="margin-top: 40px; font-size: 0.7rem; color: #94a3b8; text-align: center;">
          Sistema ERP Rutas del Sur - Generado automáticamente por Vincenzo Dallapé
        </footer>
      </div>
    `

    // Envío vía Resend
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Rutas del Sur ERP <onboarding@resend.dev>',
        to: ['rutasdelsurmza@gmail.com'],
        subject: `Backup Mensual Rutas del Sur - ${fecha_generacion}`,
        html: htmlContent,
      }),
    })

    const data = await res.json()
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})