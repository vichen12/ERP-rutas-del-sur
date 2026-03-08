'use client'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import { AlertOctagon, TrendingUp, DollarSign, Receipt, ChevronRight } from 'lucide-react'

import { CostosFijosSection } from '@/components/costos/CostosFijosSection'
import { MultasSection } from '@/components/multas/MultasSection'
import { PuntoEquilibrioSection } from '@/components/costos/PuntoEquilibrioSection'
import { ImpuestoModal } from '@/components/costos/Impuestomodal'
import { CostoModal } from '@/components/costos/CostoModal'
import { PagarModal } from '@/components/costos/pagarmodal'
import { MultaModal } from '@/components/multas/MultaModal'

type Tab = 'impuestos' | 'costos' | 'multas' | 'equilibrio'

// ═══════════════════════════════════════════════════════════
//  TIPOS Y MOTOR DE FÓRMULAS
// ═══════════════════════════════════════════════════════════
export interface VariableContext {
  VENTAS: number
  GASOIL: number
  CHOFERES: number
  ESTRUCTURA: number
  NETO: number
  VIAJES: number
}

export type Frecuencia = 'semanal' | 'quincenal' | 'mensual' | 'bimestral' | 'trimestral' | 'semestral' | 'anual'

export function evaluarFormula(formulaStr: string, ctx: VariableContext): number | null {
  try {
    if (!formulaStr || !formulaStr.trim()) return null
    const asNum = Number(formulaStr)
    if (!isNaN(asNum)) return asNum

    let expr = formulaStr.toUpperCase().trim()
    const vars: Record<string, number> = {
      VENTAS: ctx.VENTAS, GASOIL: ctx.GASOIL, CHOFERES: ctx.CHOFERES,
      ESTRUCTURA: ctx.ESTRUCTURA, NETO: ctx.NETO, VIAJES: ctx.VIAJES,
    }
    const sortedKeys = Object.keys(vars).sort((a, b) => b.length - a.length)
    for (const key of sortedKeys) {
      expr = expr.replace(new RegExp(key, 'g'), String(vars[key]))
    }
    if (!/^[\d\s+\-*/().]+$/.test(expr)) return null
    const result = Function(`"use strict"; return (${expr})`)()
    if (typeof result !== 'number' || !isFinite(result)) return null
    return Math.round(result * 100) / 100
  } catch { return null }
}

export function avanzarFecha(fecha: string, frecuencia: Frecuencia): string {
  const d = new Date(fecha + 'T12:00:00')
  switch (frecuencia) {
    case 'semanal': d.setDate(d.getDate() + 7); break
    case 'quincenal': d.setDate(d.getDate() + 14); break
    case 'mensual': d.setMonth(d.getMonth() + 1); break
    case 'bimestral': d.setMonth(d.getMonth() + 2); break
    case 'trimestral': d.setMonth(d.getMonth() + 3); break
    case 'semestral': d.setMonth(d.getMonth() + 6); break
    case 'anual': d.setFullYear(d.getFullYear() + 1); break
  }
  return d.toISOString().split('T')[0]
}

export function labelFrecuencia(f: string): string {
  const map: Record<string, string> = {
    semanal: 'Semanal', quincenal: 'Quincenal', mensual: 'Mensual',
    bimestral: 'Bimestral', trimestral: 'Trimestral', semestral: 'Semestral', anual: 'Anual',
  }
  return map[f] || f
}

export default function CostosMultasPage() {
  const [activeTab, setActiveTab] = useState<Tab>('impuestos')
  const [costos, setCostos] = useState<any[]>([])
  const [multas, setMultas] = useState<any[]>([])
  const [choferes, setChoferes] = useState<any[]>([])
  const [camiones, setCamiones] = useState<any[]>([])
  const [viajes, setViajes] = useState<any[]>([])
  const [cargasCombustible, setCargasCombustible] = useState<any[]>([])
  const [cuentaChoferes, setCuentaChoferes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const hoy = new Date()
  const hoyStr = hoy.toISOString().split('T')[0]
  const [dateStart, setDateStart] = useState(() => new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0])
  const [dateEnd, setDateEnd] = useState(() => new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0])

  // Modales
  const [isImpuestoModalOpen, setIsImpuestoModalOpen] = useState(false)
  const [editingImpuesto, setEditingImpuesto] = useState<any>(null)
  const [isCostoModalOpen, setIsCostoModalOpen] = useState(false)
  const [editingCosto, setEditingCosto] = useState<any>(null)
  const [isMultaModalOpen, setIsMultaModalOpen] = useState(false)
  const [editingMulta, setEditingMulta] = useState<any>(null)
  const [isPagarModalOpen, setIsPagarModalOpen] = useState(false)
  const [pagandoItem, setPagandoItem] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const [costosRes, multasRes, choferesRes, camionesRes, viajesRes, gasoilRes, ctaRes] = await Promise.all([
        supabase.from('costos_fijos').select('*').order('nombre'),
        supabase.from('multas').select('*, choferes(nombre), camiones(patente)').order('fecha', { ascending: false }),
        supabase.from('choferes').select('id, nombre').order('nombre'),
        supabase.from('camiones').select('id, patente').order('patente'),
        supabase.from('viajes').select('tarifa_flete, fecha, estado').eq('estado', 'completado'),
        supabase.from('cargas_combustible').select('total, fecha'),
        supabase.from('cuenta_corriente_choferes').select('monto, fecha, tipo'),
      ])
      setCostos(costosRes.data || [])
      setMultas(multasRes.data || [])
      setChoferes(choferesRes.data || [])
      setCamiones(camionesRes.data || [])
      setViajes(viajesRes.data || [])
      setCargasCombustible(gasoilRes.data || [])
      setCuentaChoferes(ctaRes.data || [])
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  // ═══ CONTEXTO DE VARIABLES ═══
  const variableContext: VariableContext = useMemo(() => {
    const inRange = (fecha: string) => fecha >= dateStart && fecha <= dateEnd
    const ventasTotal = viajes.filter(v => inRange(v.fecha)).reduce((a, v) => a + Number(v.tarifa_flete || 0), 0)
    const gasoilTotal = cargasCombustible.filter(c => inRange(c.fecha)).reduce((a, c) => a + Number(c.total || 0), 0)
    const choferesTotal = cuentaChoferes.filter(c => inRange(c.fecha)).reduce((a, c) => a + Number(c.monto || 0), 0)
    const viajesCount = viajes.filter(v => inRange(v.fecha)).length
    return { VENTAS: ventasTotal, GASOIL: gasoilTotal, CHOFERES: choferesTotal, ESTRUCTURA: 0, NETO: ventasTotal - gasoilTotal - choferesTotal, VIAJES: viajesCount }
  }, [viajes, cargasCombustible, cuentaChoferes, dateStart, dateEnd])

  // ═══ PENDIENTES ═══
  const pendientes = useMemo(() => {
    return costos.filter(c => {
      if (!c.activo) return false
      if (c.tipo === 'impuesto' || c.recurrente) {
        return c.proximo_pago && c.proximo_pago <= hoyStr
      }
      return !c.pagado
    })
  }, [costos, hoyStr])

  // ═══ TOTAL MENSUAL ═══
  const totalCostosFijosMes = useMemo(() => {
    const factores: Record<string, number> = { semanal: 4.33, quincenal: 2.17, mensual: 1, bimestral: 0.5, trimestral: 0.333, semestral: 0.167, anual: 0.083 }
    return costos.filter(c => c.activo && (c.tipo === 'impuesto' || c.recurrente)).reduce((acc, c) => {
      const val = evaluarFormula(c.monto, variableContext)
      if (val === null) return acc
      return acc + val * (factores[c.frecuencia] || 1)
    }, 0)
  }, [costos, variableContext])

  // ═══ HANDLERS ═══
  async function handleSaveImpuesto(data: any) {
    setIsSaving(true)
    try {
      const payload = { ...data, tipo: 'impuesto', descripcion: data.nombre }
      if (!payload.proximo_pago) payload.proximo_pago = hoyStr
      let res
      if (editingImpuesto) res = await supabase.from('costos_fijos').update(payload).eq('id', editingImpuesto.id)
      else res = await supabase.from('costos_fijos').insert([payload])
      if (res.error) { alert('Error al guardar: ' + res.error.message); return }
      setIsImpuestoModalOpen(false); setEditingImpuesto(null); fetchAll()
    } finally { setIsSaving(false) }
  }

  async function handleSaveCosto(data: any) {
    setIsSaving(true)
    try {
      const payload = { ...data, tipo: 'costo', pagado: false, descripcion: data.nombre }
      if (data.recurrente && !payload.proximo_pago) payload.proximo_pago = hoyStr
      let res
      if (editingCosto) res = await supabase.from('costos_fijos').update(payload).eq('id', editingCosto.id)
      else res = await supabase.from('costos_fijos').insert([payload])
      if (res.error) { alert('Error al guardar: ' + res.error.message); return }
      setIsCostoModalOpen(false); setEditingCosto(null); fetchAll()
    } finally { setIsSaving(false) }
  }

  async function handleDeleteCosto(id: string) {
    if (!confirm('¿Eliminar este registro?')) return
    const { error } = await supabase.from('costos_fijos').delete().eq('id', id)
    if (error) { alert('Error al eliminar: ' + error.message); return }
    fetchAll()
  }

  async function handleToggleCosto(id: string, activo: boolean) {
    const { error } = await supabase.from('costos_fijos').update({ activo: !activo }).eq('id', id)
    if (error) { alert('Error al actualizar: ' + error.message); return }
    fetchAll()
  }

  function abrirPagar(item: any) { setPagandoItem(item); setIsPagarModalOpen(true) }

  async function handleConfirmarPago(item: any, montoFinal: number) {
    setIsSaving(true)
    try {
      const categoria = item.tipo === 'impuesto' ? 'impuesto' : 'costo_fijo'
      const movRes = await supabase.from('movimientos_caja').insert([{
        tipo: 'egreso',
        categoria,
        monto: montoFinal,
        descripcion: `${item.tipo === 'impuesto' ? 'IMPUESTO' : 'COSTO'}: ${item.nombre}`,
        fecha: hoyStr,
      }])
      if (movRes.error) { alert('Error al registrar pago: ' + movRes.error.message); return }
      const updates: any = { ultimo_pago: hoyStr, monto_ultimo_pago: montoFinal }
      if (item.tipo === 'impuesto' || item.recurrente) {
        updates.proximo_pago = avanzarFecha(item.proximo_pago || hoyStr, item.frecuencia || 'mensual')
      } else {
        updates.pagado = true
      }
      await supabase.from('costos_fijos').update(updates).eq('id', item.id)
      setIsPagarModalOpen(false); setPagandoItem(null); fetchAll()
    } catch (e: any) { alert('Error: ' + (e?.message || e)) }
    finally { setIsSaving(false) }
  }

  // Multas
  async function handleSaveMulta(data: any) {
    const monto = Number(data.monto)
    if (!monto || monto <= 0 || isNaN(monto)) { alert('El monto de la multa debe ser mayor a 0.'); return; }
    if (!data.fecha) { alert('La fecha es obligatoria.'); return; }
    setIsSaving(true)
    try {
      // Limpiar UUIDs vacíos — Supabase rechaza '' para columnas UUID
      const payload = {
        ...data,
        chofer_id: data.chofer_id || null,
        camion_id: data.camion_id || null,
        monto,
      }
      let res
      if (editingMulta) res = await supabase.from('multas').update(payload).eq('id', editingMulta.id)
      else res = await supabase.from('multas').insert([payload])
      if (res.error) { alert('Error multa: ' + res.error.message); return }
      setIsMultaModalOpen(false); setEditingMulta(null); fetchAll()
    } finally { setIsSaving(false) }
  }
  async function handleDeleteMulta(id: string) {
    if (!confirm('¿Eliminar?')) return
    const { error } = await supabase.from('multas').delete().eq('id', id)
    if (error) { alert('Error al eliminar multa: ' + error.message); return }
    fetchAll()
  }
  async function handlePagarMulta(multa: any) {
    const res = await supabase.from('multas').update({ estado: 'pagada', fecha_pago: new Date().toISOString().split('T')[0] }).eq('id', multa.id)
    if (res.error) { alert('Error al pagar multa: ' + res.error.message); return }
    fetchAll()
  }

  const setEsteMes = () => { setDateStart(new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0]); setDateEnd(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0]) }
  const setEsteAno = () => { setDateStart(new Date(hoy.getFullYear(), 0, 1).toISOString().split('T')[0]); setDateEnd(new Date(hoy.getFullYear(), 11, 31).toISOString().split('T')[0]) }

  const tabs: { value: Tab; label: string; icon: any }[] = [
    { value: 'impuestos', label: 'Impuestos', icon: Receipt },
    { value: 'costos', label: 'Costos', icon: DollarSign },
    { value: 'multas', label: 'Multas', icon: AlertOctagon },
    { value: 'equilibrio', label: 'Punto de Equilibrio', icon: TrendingUp },
  ]

  return (
    <main className="min-h-screen bg-[#020617] pt-20 lg:pt-24 pb-20 font-sans italic">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 space-y-8">

        <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.85]">
          COSTOS <br /><span className="text-orange-500 font-thin">/ MULTAS</span>
        </h1>

        {/* FILTRO GLOBAL */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-950/60 p-2 rounded-[2rem] border border-white/5">
          <div className="flex bg-slate-900 p-1 rounded-2xl border border-white/5 shrink-0">
            <button onClick={setEsteMes} className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/5 transition-all">Este Mes</button>
            <button onClick={setEsteAno} className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/5 transition-all">Este Año</button>
          </div>
          <div className="flex flex-1 items-center gap-4 px-4">
            <div className="flex flex-col">
              <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Desde</span>
              <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="bg-transparent text-white font-black text-sm outline-none [color-scheme:dark]" />
            </div>
            <ChevronRight size={14} className="text-slate-700" />
            <div className="flex flex-col">
              <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Hasta</span>
              <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="bg-transparent text-white font-black text-sm outline-none [color-scheme:dark]" />
            </div>
          </div>
        </div>

        {/* TABS */}
        <div className="flex bg-slate-900 p-1.5 rounded-3xl border border-white/5 w-fit">
          {tabs.map(t => (
            <button key={t.value} onClick={() => setActiveTab(t.value)}
              className={`flex items-center gap-2.5 px-7 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === t.value ? 'bg-orange-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
              <t.icon size={13} />{t.label}
            </button>
          ))}
        </div>

        {/* CONTENIDO */}
        {(activeTab === 'impuestos' || activeTab === 'costos') && (
          <CostosFijosSection
            activeSubTab={activeTab}
            costos={costos} loading={loading} pendientes={pendientes}
            variableContext={variableContext} totalMensual={totalCostosFijosMes}
            onNuevoImpuesto={() => { setEditingImpuesto(null); setIsImpuestoModalOpen(true) }}
            onNuevoCosto={() => { setEditingCosto(null); setIsCostoModalOpen(true) }}
            onEdit={(c) => { if (c.tipo === 'impuesto') { setEditingImpuesto(c); setIsImpuestoModalOpen(true) } else { setEditingCosto(c); setIsCostoModalOpen(true) } }}
            onDelete={handleDeleteCosto} onToggle={handleToggleCosto} onPagar={abrirPagar}
          />
        )}
        {activeTab === 'multas' && (
          <MultasSection multas={multas} loading={loading}
            onNueva={() => { setEditingMulta(null); setIsMultaModalOpen(true) }}
            onEdit={(m) => { setEditingMulta(m); setIsMultaModalOpen(true) }}
            onDelete={handleDeleteMulta} onPagar={handlePagarMulta} />
        )}
        {activeTab === 'equilibrio' && (
          <PuntoEquilibrioSection costosFijosMes={totalCostosFijosMes} viajes={viajes} multas={multas} costos={costos} />
        )}

        {/* MODALES */}
        <ImpuestoModal isOpen={isImpuestoModalOpen} onClose={() => { setIsImpuestoModalOpen(false); setEditingImpuesto(null) }}
          onSubmit={handleSaveImpuesto} isSaving={isSaving} editingData={editingImpuesto} variableContext={variableContext} />
        <CostoModal isOpen={isCostoModalOpen} onClose={() => { setIsCostoModalOpen(false); setEditingCosto(null) }}
          onSubmit={handleSaveCosto} isSaving={isSaving} editingData={editingCosto} />
        <PagarModal isOpen={isPagarModalOpen} onClose={() => { setIsPagarModalOpen(false); setPagandoItem(null) }}
          onConfirm={handleConfirmarPago} isSaving={isSaving} item={pagandoItem} variableContext={variableContext} />
        <MultaModal isOpen={isMultaModalOpen} onClose={() => { setIsMultaModalOpen(false); setEditingMulta(null) }}
          onSubmit={handleSaveMulta} isSaving={isSaving} editingData={editingMulta} choferes={choferes} camiones={camiones} />
      </div>
    </main>
  )
}