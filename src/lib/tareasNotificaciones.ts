// lib/tareasNotificaciones.ts
// Envía notificaciones por Email (Resend) y WhatsApp (CallMeBot - gratuito)
// Se llama cada vez que se carga la página de Tareas
// Las API keys se manejan en el servidor (/api/notifications/send) para no exponerlas al cliente

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

    // Usar T12:00:00 para evitar problemas de timezone (midnight puede cruzar al día anterior)
    const fechaVto = new Date(t.fecha_vencimiento + 'T12:00:00')
    const diffDays = Math.ceil((fechaVto.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))

    // Avisar cuando quedan exactamente dias_anticipacion días o menos (y no está vencida hace más de 3 días)
    return diffDays <= t.dias_anticipacion && diffDays >= -3
  })

  if (tareasParaNotificar.length === 0) return

  // Armar el mensaje
  const mensaje = buildMensaje(tareasParaNotificar, hoy)

  // Enviar notificaciones a través del API route del servidor (las API keys permanecen en el servidor)
  try {
    await fetch('/api/notifications/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: email || null,
        whatsapp: whatsapp || null,
        mensaje,
        cantTareas: tareasParaNotificar.length,
      }),
    })
  } catch (e) {
    console.error('Error enviando notificaciones:', e)
  }

  // Marcar como notificadas
  const ids = tareasParaNotificar.map(t => t.id)
  await supabase
    .from('tareas')
    .update({ notificacion_enviada: true })
    .in('id', ids)
}

function buildMensaje(tareas: any[], hoy: Date): string {
  const lineas = tareas.map(t => {
    // Usar T12:00:00 para evitar problemas de timezone
    const fechaVto = new Date(t.fecha_vencimiento + 'T12:00:00')
    const diffDays = Math.ceil((fechaVto.getTime() - hoy.getTime()) / (1000 * 60 * 60 * 24))
    const estado = diffDays < 0
      ? `⚠️ VENCIDA hace ${Math.abs(diffDays)} día${Math.abs(diffDays) !== 1 ? 's' : ''}`
      : diffDays === 0
      ? '🔴 VENCE HOY'
      : `📅 Vence en ${diffDays} día${diffDays !== 1 ? 's' : ''} (${new Date(t.fecha_vencimiento + 'T12:00:00').toLocaleDateString('es-AR')})`
    const recurrente = t.es_recurrente ? ` | 🔄 ${t.periodo_recurrencia}` : ''
    return `• ${t.titulo} → ${estado}${recurrente}`
  }).join('\n')

  return `🚛 *Rutas del Sur ERP - Tareas Pendientes*\n\nTenés ${tareas.length} tarea${tareas.length !== 1 ? 's' : ''} que requieren atención:\n\n${lineas}\n\n_Ingresá al ERP para gestionar estas tareas._`
}
