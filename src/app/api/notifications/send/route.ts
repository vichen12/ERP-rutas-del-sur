// src/app/api/notifications/send/route.ts
// Server-side API route for sending notifications (Email + WhatsApp)
// API keys are kept server-side only (no NEXT_PUBLIC_ prefix needed)

import { NextResponse } from 'next/server'

export async function POST(req: Request) {
  try {
    const { email, whatsapp, mensaje, cantTareas } = await req.json()

    const promises: Promise<any>[] = []

    if (email) {
      promises.push(sendEmail(email, mensaje, cantTareas))
    }
    if (whatsapp) {
      promises.push(sendWhatsApp(whatsapp, mensaje))
    }

    const results = await Promise.allSettled(promises)
    const errors = results.filter(r => r.status === 'rejected').map(r => (r as PromiseRejectedResult).reason?.message)

    return NextResponse.json({ ok: true, errors: errors.length > 0 ? errors : undefined })
  } catch (e: any) {
    console.error('Error en /api/notifications/send:', e)
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

async function sendEmail(to: string, mensaje: string, cantTareas: number) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('RESEND_API_KEY no configurado en variables de entorno del servidor.')
    return
  }

  const htmlBody = `
    <div style="font-family: monospace; background: #020617; color: #e2e8f0; padding: 32px; border-radius: 16px; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #8b5cf6; font-size: 20px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 2px;">🚛 Rutas del Sur ERP</h1>
      <p style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 24px;">Recordatorio de Tareas</p>
      <div style="background: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #8b5cf6;">
        <p style="color: #94a3b8; font-size: 13px; margin: 0 0 16px;">Tenés <strong style="color: #c4b5fd;">${cantTareas} tarea${cantTareas !== 1 ? 's' : ''}</strong> que requieren atención:</p>
        ${mensaje.split('\n').filter((l: string) => l.startsWith('•')).map((linea: string) => `
          <div style="padding: 10px 0; border-bottom: 1px solid #334155; font-size: 12px; color: #e2e8f0; text-transform: uppercase;">
            ${linea.replace('•', '→')}
          </div>
        `).join('')}
      </div>
      <p style="color: #475569; font-size: 11px; text-align: center; text-transform: uppercase; letter-spacing: 2px;">Ingresá al ERP para gestionar estas tareas.</p>
    </div>
  `

  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'Rutas del Sur ERP <notificaciones@rutasdelsur.com>',
      to: [to],
      subject: `⚠️ ${cantTareas} tarea${cantTareas !== 1 ? 's' : ''} pendiente${cantTareas !== 1 ? 's' : ''} - Rutas del Sur`,
      html: htmlBody,
    }),
  })
}

async function sendWhatsApp(phone: string, mensaje: string) {
  const apiKey = process.env.CALLMEBOT_APIKEY
  if (!apiKey) {
    console.warn('CALLMEBOT_APIKEY no configurado en variables de entorno del servidor.')
    return
  }

  const mensajeEncoded = encodeURIComponent(mensaje)
  const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${mensajeEncoded}&apikey=${apiKey}`
  await fetch(url)
}
