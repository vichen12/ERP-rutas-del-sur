// lib/tareasNotificaciones.ts
// Envía notificaciones por Email (Resend) y WhatsApp (CallMeBot - gratuito)
// Se llama cada vez que se carga la página de Tareas

export async function checkAndSendNotificaciones(
  supabase: any,
  tareas: any[],
  email: string,
  whatsapp: string
) {
  if (!email && !whatsapp) return
  if (!tareas || tareas.length === 0) return

  const hoy = new Date()
  hoy.setHours(0, 0, 0, 0)

  // Buscar tareas que:
  // 1. No estén completadas
  // 2. No hayan tenido notificación enviada aún
  // 3. Estén dentro del rango de días de anticipación
  const tareasParaNotificar = tareas.filter(t => {
    if (t.completada) return false
    if (t.notificacion_enviada) return false

    const fechaVto = new Date(t.fecha_vencimiento + 'T00:00:00')
    const diffDays = Math.ceil((fechaVto.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
    
    // Avisar cuando quedan exactamente dias_anticipacion días o menos (y no está vencida hace más de 3 días)
    return diffDays <= t.dias_anticipacion && diffDays >= -3
  })

  if (tareasParaNotificar.length === 0) return

  // Armar el mensaje
  const mensaje = buildMensaje(tareasParaNotificar, hoy)

  // Enviar notificaciones en paralelo
  const promises: Promise<any>[] = []

  if (email) {
    promises.push(sendEmail(email, mensaje, tareasParaNotificar.length))
  }
  if (whatsapp) {
    promises.push(sendWhatsApp(whatsapp, mensaje))
  }

  await Promise.allSettled(promises)

  // Marcar como notificadas
  const ids = tareasParaNotificar.map(t => t.id)
  await supabase
    .from('tareas')
    .update({ notificacion_enviada: true })
    .in('id', ids)
}

function buildMensaje(tareas: any[], hoy: Date): string {
  const lineas = tareas.map(t => {
    const fechaVto = new Date(t.fecha_vencimiento + 'T00:00:00')
    const diffDays = Math.ceil((fechaVto.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
    const estado = diffDays < 0
      ? `⚠️ VENCIDA hace ${Math.abs(diffDays)} día${Math.abs(diffDays) !== 1 ? 's' : ''}`
      : diffDays === 0
      ? '🔴 VENCE HOY'
      : `📅 Vence en ${diffDays} día${diffDays !== 1 ? 's' : ''} (${new Date(t.fecha_vencimiento + 'T00:00:00').toLocaleDateString('es-AR')})`
    const recurrente = t.es_recurrente ? ` | 🔄 ${t.periodo_recurrencia}` : ''
    return `• ${t.titulo} → ${estado}${recurrente}`
  }).join('\n')

  return `🚛 *Rutas del Sur ERP - Tareas Pendientes*\n\nTenés ${tareas.length} tarea${tareas.length !== 1 ? 's' : ''} que requieren atención:\n\n${lineas}\n\n_Ingresá al ERP para gestionar estas tareas._`
}

// =============================================
// EMAIL — Resend (https://resend.com — plan free: 3000 emails/mes)
// Necesitás: RESEND_API_KEY en .env.local
// =============================================
async function sendEmail(to: string, mensaje: string, cantTareas: number) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_RESEND_API_KEY
    if (!apiKey) {
      console.warn('RESEND_API_KEY no configurado. Agregá NEXT_PUBLIC_RESEND_API_KEY en .env.local')
      return
    }

    const htmlBody = `
      <div style="font-family: monospace; background: #020617; color: #e2e8f0; padding: 32px; border-radius: 16px; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #8b5cf6; font-size: 20px; margin-bottom: 4px; text-transform: uppercase; letter-spacing: 2px;">🚛 Rutas del Sur ERP</h1>
        <p style="color: #64748b; font-size: 11px; text-transform: uppercase; letter-spacing: 3px; margin-bottom: 24px;">Recordatorio de Tareas</p>
        <div style="background: #1e293b; border-radius: 12px; padding: 20px; margin-bottom: 20px; border-left: 4px solid #8b5cf6;">
          <p style="color: #94a3b8; font-size: 13px; margin: 0 0 16px;">Tenés <strong style="color: #c4b5fd;">${cantTareas} tarea${cantTareas !== 1 ? 's' : ''}</strong> que requieren atención:</p>
          ${mensaje.split('\n').filter(l => l.startsWith('•')).map(linea => `
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
  } catch (e) {
    console.error('Error enviando email:', e)
  }
}

// =============================================
// WHATSAPP — CallMeBot (GRATUITO)
// Setup en 2 minutos: https://www.callmebot.com/blog/free-api-whatsapp-messages/
// 1. Agregá +34 644 78 84 95 a tus contactos de WhatsApp como "CallMeBot"
// 2. Mandá el mensaje: "I allow callmebot to send me messages"
// 3. Recibirás tu apikey por WhatsApp
// 4. Guardá esa apikey en .env.local como NEXT_PUBLIC_CALLMEBOT_APIKEY
// =============================================
async function sendWhatsApp(phone: string, mensaje: string) {
  try {
    const apiKey = process.env.NEXT_PUBLIC_CALLMEBOT_APIKEY
    if (!apiKey) {
      console.warn('CALLMEBOT_APIKEY no configurado. Seguí las instrucciones en tareasNotificaciones.ts para obtenerla gratuitamente.')
      return
    }

    const mensajeEncoded = encodeURIComponent(mensaje)
    const url = `https://api.callmebot.com/whatsapp.php?phone=${phone}&text=${mensajeEncoded}&apikey=${apiKey}`
    
    await fetch(url)
  } catch (e) {
    console.error('Error enviando WhatsApp:', e)
  }
}








