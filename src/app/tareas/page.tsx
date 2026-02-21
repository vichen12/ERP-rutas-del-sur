'use client'
import { useState, useEffect, useMemo } from 'react'
import { getSupabase } from '@/lib/supabase'
import { TareasHeader } from '@/components/tareas/TareasHeader'
import { TareasKpis } from '@/components/tareas/TareasKpis'
import { TareasGrid } from '@/components/tareas/TareasGrid'
import { TareaModal } from '@/components/tareas/TareaModal'
import { NotifConfigModal } from '@/components/tareas/NotifConfigModal'
import { checkAndSendNotificaciones } from '@/lib/tareasNotificaciones'

export default function TareasPage() {
  const supabase = getSupabase()

  const [tareas, setTareas] = useState<any[]>([])
  const [camiones, setCamiones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filtro, setFiltro] = useState<'todas' | 'pendientes' | 'hoy' | 'vencidas' | 'completadas'>('pendientes')
  const [categoriaFiltro, setCategoriaFiltro] = useState<string>('todas')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTarea, setEditingTarea] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)

  const [isNotifModalOpen, setIsNotifModalOpen] = useState(false)
  const [notifConfig, setNotifConfig] = useState({ email: '', whatsapp: '' })

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const [tareasRes, camionesRes, configRes] = await Promise.all([
        supabase
          .from('tareas')
          .select('*, camiones(patente)')
          .order('fecha_vencimiento', { ascending: true }),
        supabase.from('camiones').select('id, patente').order('patente'),
        supabase.from('configuracion').select('notif_email, notif_whatsapp').eq('id', 1).single(),
      ])
      setTareas(tareasRes.data || [])
      setCamiones(camionesRes.data || [])
      if (configRes.data) {
        setNotifConfig({
          email: configRes.data.notif_email || '',
          whatsapp: configRes.data.notif_whatsapp || '',
        })
      }
      if (tareasRes.data && configRes.data) {
        await checkAndSendNotificaciones(
          supabase,
          tareasRes.data,
          configRes.data.notif_email || '',
          configRes.data.notif_whatsapp || ''
        )
      }
    } catch (e) {
      console.error('Error cargando tareas:', e)
    } finally {
      setLoading(false)
    }
  }

  // FILTRADO
  const hoy = new Date().toISOString().split('T')[0]
  const tareasFiltradas = useMemo(() => {
    return tareas.filter(t => {
      if (categoriaFiltro !== 'todas' && t.categoria !== categoriaFiltro) return false
      if (filtro === 'completadas') return t.completada
      if (filtro === 'pendientes') return !t.completada
      if (filtro === 'hoy') return !t.completada && t.fecha_vencimiento === hoy
      if (filtro === 'vencidas') return !t.completada && t.fecha_vencimiento < hoy
      return true
    })
  }, [tareas, filtro, categoriaFiltro, hoy])

  // KPIS
  const kpis = useMemo(() => {
    const pendientes = tareas.filter(t => !t.completada)
    const vencidas = pendientes.filter(t => t.fecha_vencimiento < hoy)
    const proximas = pendientes.filter(t => {
      const diff = Math.ceil((new Date(t.fecha_vencimiento).getTime() - new Date(hoy).getTime()) / (1000 * 60 * 60 * 24))
      return diff >= 0 && diff <= 7
    })
    const completadasHoy = tareas.filter(t => t.completada && t.fecha_completada?.startsWith(hoy))
    return { total: pendientes.length, vencidas: vencidas.length, proximas: proximas.length, completadasHoy: completadasHoy.length }
  }, [tareas, hoy])

  // COMPLETAR TAREA
  async function handleCompletar(tarea: any) {
    const now = new Date().toISOString()
    await supabase.from('tareas').update({ completada: true, fecha_completada: now }).eq('id', tarea.id)

    if (tarea.es_recurrente && tarea.periodo_recurrencia) {
      const proximaFecha = calcularProximaFecha(tarea.fecha_vencimiento, tarea.periodo_recurrencia)
      await supabase.from('tareas').insert([{
        titulo: tarea.titulo,
        descripcion: tarea.descripcion,
        categoria: tarea.categoria,
        fecha_vencimiento: proximaFecha,
        dias_anticipacion: tarea.dias_anticipacion,
        es_recurrente: true,
        periodo_recurrencia: tarea.periodo_recurrencia,
        camion_id: tarea.camion_id || null,
        notificacion_enviada: false,
      }])
    }
    fetchAll()
  }

  function calcularProximaFecha(fechaStr: string, periodo: string): string {
    const fecha = new Date(fechaStr)
    switch (periodo) {
      case 'semanal':     fecha.setDate(fecha.getDate() + 7); break
      case 'mensual':     fecha.setMonth(fecha.getMonth() + 1); break
      case 'bimestral':   fecha.setMonth(fecha.getMonth() + 2); break
      case 'trimestral':  fecha.setMonth(fecha.getMonth() + 3); break
      case 'semestral':   fecha.setMonth(fecha.getMonth() + 6); break
      case 'anual':       fecha.setFullYear(fecha.getFullYear() + 1); break
    }
    return fecha.toISOString().split('T')[0]
  }

  async function handleSave(data: any) {
    setIsSaving(true)
    try {
      if (editingTarea) {
        await supabase.from('tareas').update({
          titulo: data.titulo,
          descripcion: data.descripcion,
          categoria: data.categoria,
          fecha_vencimiento: data.fecha_vencimiento,
          dias_anticipacion: Number(data.dias_anticipacion),
          es_recurrente: data.es_recurrente,
          periodo_recurrencia: data.es_recurrente ? data.periodo_recurrencia : null,
          camion_id: data.camion_id || null,
          notificacion_enviada: false,
        }).eq('id', editingTarea.id)
      } else {
        await supabase.from('tareas').insert([{
          titulo: data.titulo,
          descripcion: data.descripcion,
          categoria: data.categoria,
          fecha_vencimiento: data.fecha_vencimiento,
          dias_anticipacion: Number(data.dias_anticipacion),
          es_recurrente: data.es_recurrente,
          periodo_recurrencia: data.es_recurrente ? data.periodo_recurrencia : null,
          camion_id: data.camion_id || null,
        }])
      }
      setIsModalOpen(false)
      setEditingTarea(null)
      fetchAll()
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta tarea?')) return
    await supabase.from('tareas').delete().eq('id', id)
    fetchAll()
  }

  async function handleSaveNotifConfig(email: string, whatsapp: string) {
    setNotifConfig({ email, whatsapp })
    await supabase.from('configuracion').update({ notif_email: email, notif_whatsapp: whatsapp }).eq('id', 1)
    setIsNotifModalOpen(false)
  }

  return (
    <main className="min-h-screen bg-[#020617] pt-16 md:pt-20 lg:pt-24 pb-10 md:pb-20 transition-all duration-300">
      {/* Contenedor con ancho máximo y padding responsivo */}
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 space-y-6 md:space-y-10">

        {/* Sección de Header: Asegúrate de que los botones en TareasHeader se apilen en móviles si es necesario */}
        <section className="w-full overflow-hidden">
          <TareasHeader
            filtro={filtro}
            setFiltro={setFiltro}
            categoriaFiltro={categoriaFiltro}
            setCategoriaFiltro={setCategoriaFiltro}
            onNuevaTarea={() => { setEditingTarea(null); setIsModalOpen(true) }}
            onOpenNotifConfig={() => setIsNotifModalOpen(true)}
            notifConfig={notifConfig}
          />
        </section>

        {/* Sección de KPIs: Suele usar un grid interno (ej. grid-cols-1 md:grid-cols-2 lg:grid-cols-4) */}
        <section className="w-full">
          <TareasKpis kpis={kpis} loading={loading} />
        </section>

        {/* Sección de Listado/Grid de tareas */}
        <section className="w-full">
          <TareasGrid
            tareas={tareasFiltradas}
            loading={loading}
            onCompletar={handleCompletar}
            onEdit={(t) => { setEditingTarea(t); setIsModalOpen(true) }}
            onDelete={handleDelete}
          />
        </section>

        {/* Los Modales ya suelen ser responsivos por su naturaleza de centrado absoluto */}
        <TareaModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingTarea(null) }}
          onSubmit={handleSave}
          isSaving={isSaving}
          editingData={editingTarea}
          camiones={camiones}
        />

        <NotifConfigModal
          isOpen={isNotifModalOpen}
          onClose={() => setIsNotifModalOpen(false)}
          onSave={handleSaveNotifConfig}
          initialEmail={notifConfig.email}
          initialWhatsapp={notifConfig.whatsapp}
        />
      </div>
    </main>
  )
}