// No necesitamos importar 'serve' de std, usamos el nativo de Deno
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Manejo de seguridad CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { resumen, detalle_deudores, fecha_generacion } = await req.json()

    const emailHtml = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 20px;">
        <h1 style="color: #0284c7;">Backup Rutas del Sur</h1>
        <p>Reporte generado el <strong>${fecha_generacion}</strong></p>
        <div style="background: #0f172a; color: white; padding: 20px; border-radius: 15px; text-align: center;">
          <span>Deuda Total Acumulada</span>
          <h2>$${Number(resumen.deuda_total_acumulada).toLocaleString('es-AR')}</h2>
        </div>
        <h3>Detalle:</h3>
        ${detalle_deudores.map((c: any) => `
          <div style="padding: 10px; border-bottom: 1px solid #eee;">
            <p><strong>${c.cliente}</strong>: $${Number(c.deuda_actual).toLocaleString('es-AR')}</p>
          </div>
        `).join('')}
      </div>
    `

    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Rutas del Sur ERP <onboarding@resend.dev>',
        to: ['rutasdelsurmza@gmail.com'],
        subject: `Resguardo Contable - ${fecha_generacion}`,
        html: emailHtml,
      }),
    })

    const resData = await res.json()
    
    // Si Resend devuelve error, lo mandamos al frontend con status 400
    if (!res.ok) throw new Error(resData.message || 'Error en Resend')

    return new Response(JSON.stringify(resData), {
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