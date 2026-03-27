'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from 'react'
import * as supabaseLib from '@/lib/supabase'
import { Plus, Loader2, Clock, AlertTriangle, CheckSquare } from 'lucide-react'
import { TareasList } from '@/components/tareas/Tareaslist'
import { TareaModal } from '@/components/tareas/TareaModal'
import { CompletarModal } from '@/components/tareas/Completarmodal'

const supabase = (supabaseLib as any).supabase || ((supabaseLib as any).getSupabase?.()) || supabaseLib

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

  useEffect(() => { fetchTareas() }, [])

  async function fetchTareas() {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('tareas')
        .select('*')
        .order('fecha_vencimiento', { ascending: true })
      if (error) console.error('Error fetch:', error.message)
      setTareas(data || [])
    } catch (e: any) {
      console.error('Error cargando tareas:', e?.message || e)
    } finally {
      setLoading(false)
    }
  }

  const hoy = new Date().toISOString().split('T')[0]

  // ═══ SEPARAR POR TABS — single pass en lugar de 3 filters ═══
  const { porCumplir, atrasadas, cumplidas } = useMemo(() => {
    const pc: any[] = [], at: any[] = [], cu: any[] = []
    for (const t of tareas) {
      if (t.completada) { cu.push(t); continue }
      if (t.fecha_vencimiento < hoy) { at.push(t); continue }
      if (t.fecha_inicio && t.fecha_inicio > hoy) continue
      pc.push(t)
    }
    pc.sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento))
    at.sort((a, b) => a.fecha_vencimiento.localeCompare(b.fecha_vencimiento))
    cu.sort((a, b) => (b.fecha_vencimiento || '').localeCompare(a.fecha_vencimiento || ''))
    return { porCumplir: pc, atrasadas: at, cumplidas: cu }
  }, [tareas, hoy])

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
      const now = new Date().toISOString()
      const ops: Promise<any>[] = [
        supabase.from('tareas').update({ completada: true, fecha_completada: now }).eq('id', tarea.id)
      ]

      if (descontarCaja && tarea.afecta_caja && tarea.monto) {
        ops.push(supabase.from('movimientos_caja').insert([{
          tipo: 'egreso',
          tipo_cuenta: 'banco',
          categoria: 'costo_fijo',
          monto: Number(tarea.monto),
          descripcion: `TAREA: ${tarea.titulo}`,
          fecha: now.split('T')[0],
        }]))
      }

      if (tarea.es_recurrente && tarea.periodo_recurrencia) {
        const proximaFecha = calcularProximaFecha(tarea.fecha_vencimiento, tarea.periodo_recurrencia)
        ops.push(supabase.from('tareas').insert([{
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
        }]))
      }

      await Promise.all(ops)
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
    setIsSaving(true)
    try {
      const payload = {
        titulo: data.titulo,
        descripcion: data.descripcion || null,
        fecha_inicio: data.fecha_inicio || data.fecha_vencimiento,
        fecha_vencimiento: data.fecha_vencimiento,
        es_recurrente: data.es_recurrente || false,
        periodo_recurrencia: data.es_recurrente ? data.periodo_recurrencia : 'mensual',
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
    await supabase.from('tareas').delete().eq('id', id)
    fetchTareas()
  }

  const tabs: { value: Tab; label: string; icon: any; count: number; color: string }[] = [
    { value: 'por_cumplir', label: 'Por Cumplir', icon: Clock, count: porCumplir.length, color: 'bg-violet-600' },
    { value: 'atrasadas', label: 'Atrasadas', icon: AlertTriangle, count: atrasadas.length, color: 'bg-rose-600' },
    { value: 'cumplidas', label: 'Cumplidas', icon: CheckSquare, count: cumplidas.length, color: 'bg-emerald-600' },
  ]

  const tareasActivas = activeTab === 'por_cumplir' ? porCumplir : activeTab === 'atrasadas' ? atrasadas : cumplidas

  return (
    <main className="min-h-screen bg-[#141c28] pt-16 md:pt-20 lg:pt-24 pb-10 md:pb-20 font-sans italic">
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 md:px-8 space-y-8">

        {/* ═══ HEADER ═══ */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <h1 className="text-4xl sm:text-6xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.85]">
            TAREAS
          </h1>
          <button onClick={() => { setEditingTarea(null); setIsModalOpen(true) }}
            className="flex items-center gap-2 px-7 py-3.5 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest transition-all active:scale-95 shadow-xl group">
            <Plus size={16} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
            Nueva Tarea
          </button>
        </div>

        {/* ═══ TABS ═══ */}
        <div className="flex flex-wrap bg-[#1a2537] p-1.5 rounded-3xl border border-white/5 w-fit gap-1">
          {tabs.map(t => (
            <button
              key={t.value}
              onClick={() => setActiveTab(t.value)}
              className={`flex items-center gap-2.5 px-6 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === t.value
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