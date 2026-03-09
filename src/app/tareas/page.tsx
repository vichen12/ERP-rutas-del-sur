'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import { supabase } from '@/lib/supabase'
import { Plus, Loader2, Clock, AlertTriangle, CheckSquare } from 'lucide-react'
import { TareasList } from '@/components/tareas/Tareaslist'
import { TareaModal } from '@/components/tareas/TareaModal'
import { CompletarModal } from '@/components/tareas/Completarmodal'

type Tab = 'por_cumplir' | 'atrasadas' | 'cumplidas'

export default function TareasPage() {
  const [tareas, setTareas] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<Tab>('por_cumplir')

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTarea, setEditingTarea] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)

  // CompletarModal
  const [completandoTarea, setCompletandoTarea] = useState<any>(null)

  const mountedRef = useRef(true)
  useEffect(() => {
    mountedRef.current = true
    fetchTareas()
    return () => { mountedRef.current = false }
  }, [])

  async function fetchTareas() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('tareas')
        .select('*')
        .order('fecha_vencimiento', { ascending: true })
      if (!mountedRef.current) return
      if (error) console.error('Error fetch:', error.message)
      setTareas(data || [])
    } catch (e: any) {
      console.error('Error cargando tareas:', e?.message || e)
    } finally {
      if (mountedRef.current) setLoading(false)
    }
  }

  const hoy = new Date().toISOString().split('T')[0]

  // ═══ SEPARAR POR TABS ═══
  const porCumplir = useMemo(() =>
    tareas.filter(t => {
      if (t.completada) return false
      if (t.fecha_vencimiento < hoy) return false
      // Solo mostrar si ya llegó la fecha_inicio (o no tiene)
      if (t.fecha_inicio && t.fecha_inicio > hoy) return false
      return true
    }).sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento)),
    [tareas, hoy]
  )
  const atrasadas = useMemo(() =>
    tareas.filter(t => !t.completada && t.fecha_vencimiento < hoy)
      .sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento)),
    [tareas, hoy]
  )
  const cumplidas = useMemo(() =>
    tareas.filter(t => t.completada)
      .sort((a, b) => (b.fecha_completada || '').localeCompare(a.fecha_completada || '')),
    [tareas]
  )

  // ═══ INICIAR COMPLETAR ═══
  function iniciarCompletar(tarea: any) {
    if (tarea.afecta_caja && tarea.monto) {
      // Abrir modal con 3 opciones
      setCompletandoTarea(tarea)
    } else {
      // Sin caja → completar directo
      ejecutarCompletar(tarea, false)
    }
  }

  // ═══ EJECUTAR COMPLETAR ═══
  async function ejecutarCompletar(tarea: any, descontarCaja: boolean) {
    try {
      // Si descontar caja
      if (descontarCaja && tarea.afecta_caja && tarea.monto) {
        await supabase.from('movimientos_caja').insert([{
          tipo: 'egreso',
          monto: Number(tarea.monto),
          descripcion: `TAREA: ${tarea.titulo}`,
          fecha: new Date().toISOString().split('T')[0],
          tipo_gasto: 'tarea',
        }])
      }

      // Marcar completada
      const now = new Date().toISOString()
      await supabase.from('tareas').update({ completada: true, fecha_completada: now }).eq('id', tarea.id)

      // Si recurrente → crear la siguiente
      if (tarea.es_recurrente && tarea.periodo_recurrencia) {
        const proximaFecha = calcularProximaFecha(tarea.fecha_vencimiento, tarea.periodo_recurrencia)
        await supabase.from('tareas').insert([{
          titulo: tarea.titulo,
          descripcion: tarea.descripcion || null,
          fecha_inicio: proximaFecha,
          fecha_vencimiento: proximaFecha,
          es_recurrente: true,
          periodo_recurrencia: tarea.periodo_recurrencia,
          afecta_caja: tarea.afecta_caja || false,
          monto: tarea.monto || null,
          completada: false,
          categoria: tarea.categoria || 'operativa',
        }])
      }

      setCompletandoTarea(null)
      fetchTareas()
    } catch (e: any) {
      console.error('Error completando:', e?.message || e)
    }
  }

  function calcularProximaFecha(fechaStr: string, periodo: string): string {
    const fecha = new Date(fechaStr + 'T12:00:00')
    switch (periodo) {
      case 'semanal': fecha.setDate(fecha.getDate() + 7); break
      case 'quincenal': fecha.setDate(fecha.getDate() + 14); break
      case 'mensual': fecha.setMonth(fecha.getMonth() + 1); break
      case 'bimestral': fecha.setMonth(fecha.getMonth() + 2); break
      case 'trimestral': fecha.setMonth(fecha.getMonth() + 3); break
      case 'semestral': fecha.setMonth(fecha.getMonth() + 6); break
      case 'anual': fecha.setFullYear(fecha.getFullYear() + 1); break
    }
    return fecha.toISOString().split('T')[0]
  }

  // ═══ GUARDAR ═══
  async function handleSave(data: any) {
    if (!(data.titulo || '').trim()) { alert('El título de la tarea es obligatorio.'); return; }
    if (!data.fecha_vencimiento) { alert('La fecha de vencimiento es obligatoria.'); return; }
    setIsSaving(true)
    try {
      const payload = {
        titulo: data.titulo,
        descripcion: data.descripcion || null,
        fecha_inicio: data.fecha_inicio || data.fecha_vencimiento,
        fecha_vencimiento: data.fecha_vencimiento,
        es_recurrente: data.es_recurrente || false,
        periodo_recurrencia: data.es_recurrente ? data.periodo_recurrencia : null,
        afecta_caja: data.afecta_caja || false,
        monto: data.afecta_caja ? Number(data.monto) || null : null,
        categoria: data.categoria || 'operativa',
      }

      let result
      if (editingTarea) {
        result = await supabase.from('tareas').update(payload).eq('id', editingTarea.id)
      } else {
        result = await supabase.from('tareas').insert([{ ...payload, completada: false }])
      }

      if (result.error) {
        alert('Error: ' + (result.error.message || JSON.stringify(result.error)))
        return
      }

      setIsModalOpen(false)
      setEditingTarea(null)
      fetchTareas()
    } catch (e: any) {
      alert('Error: ' + (e?.message || JSON.stringify(e)))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta tarea?')) return
    const { error } = await supabase.from('tareas').delete().eq('id', id)
    if (error) { alert('Error al eliminar tarea: ' + error.message); return }
    fetchTareas()
  }

  const tabs: { value: Tab; label: string; icon: any; count: number; color: string }[] = [
    { value: 'por_cumplir', label: 'Por Cumplir', icon: Clock, count: porCumplir.length, color: 'bg-violet-600' },
    { value: 'atrasadas', label: 'Atrasadas', icon: AlertTriangle, count: atrasadas.length, color: 'bg-rose-600' },
    { value: 'cumplidas', label: 'Cumplidas', icon: CheckSquare, count: cumplidas.length, color: 'bg-emerald-600' },
  ]

  const tareasActivas = activeTab === 'por_cumplir' ? porCumplir : activeTab === 'atrasadas' ? atrasadas : cumplidas

  return (
    <main className="min-h-screen bg-[#020617] pt-16 md:pt-20 lg:pt-24 pb-10 md:pb-20 font-sans italic">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 space-y-8">

        {/* ═══ HEADER ═══ */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.85]">
            TAREAS
          </h1>
          <button onClick={() => { setEditingTarea(null); setIsModalOpen(true) }}
            className="flex items-center gap-2 px-7 py-3.5 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest transition-all active:scale-95 shadow-xl group">
            <Plus size={16} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
            Nueva Tarea
          </button>
        </div>

        {/* ═══ TABS ═══ */}
        <div className="overflow-x-auto w-full pb-1">
          <div className="flex bg-slate-900 p-1.5 rounded-3xl border border-white/5 w-fit min-w-full sm:min-w-0">
            {tabs.map(t => (
              <button
                key={t.value}
                onClick={() => setActiveTab(t.value)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${activeTab === t.value
                  ? `${t.color} text-white shadow-lg`
                  : 'text-slate-500 hover:text-white'
                  }`}
              >
                <t.icon size={13} />
                {t.label}
                <span className={`ml-1 px-2 py-0.5 rounded-lg text-[8px] tabular-nums ${activeTab === t.value
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-slate-500'
                  }`}>
                  {t.count}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ═══ CONTENIDO ═══ */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-violet-500" size={40} />
          </div>
        ) : (
          <TareasList
            tareas={tareasActivas}
            tipo={activeTab}
            onCompletar={iniciarCompletar}
            onEdit={(t) => { setEditingTarea(t); setIsModalOpen(true) }}
            onDelete={handleDelete}
          />
        )}

        {/* ═══ MODALES ═══ */}
        <TareaModal
          isOpen={isModalOpen}
          onClose={() => { setIsModalOpen(false); setEditingTarea(null) }}
          onSubmit={handleSave}
          isSaving={isSaving}
          editingData={editingTarea}
        />
        <CompletarModal
          tarea={completandoTarea}
          onClose={() => setCompletandoTarea(null)}
          onCompletarConCaja={() => completandoTarea && ejecutarCompletar(completandoTarea, true)}
          onCompletarSinCaja={() => completandoTarea && ejecutarCompletar(completandoTarea, false)}
        />
      </div>
    </main>
  )
}