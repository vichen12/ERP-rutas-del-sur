'use client'
import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase' 
// Importaciones con rutas de subcarpetas en MINÚSCULAS como me indicaste
import { CostosFijosSection } from '@/components/costos/CostosFijosSection'
import { MultasSection } from '@/components/multas/MultasSection'
import { PuntoEquilibrioSection } from '@/components/costos/PuntoEquilibrioSection'
import { CostoModal } from '@/components/costos/CostoModal'
import { MultaModal } from '@/components/multas/MultaModal'
import { LayoutDashboard, AlertOctagon, TrendingUp, DollarSign } from 'lucide-react'

type Tab = 'costos' | 'multas' | 'equilibrio'

export default function CostosMultasPage() {
  const [activeTab, setActiveTab] = useState<Tab>('costos')
  const [costos, setCostos] = useState<any[]>([])
  const [multas, setMultas] = useState<any[]>([])
  const [choferes, setChoferes] = useState<any[]>([])
  const [camiones, setCamiones] = useState<any[]>([])
  const [viajes, setViajes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Modales
  const [isCostoModalOpen, setIsCostoModalOpen] = useState(false)
  const [editingCosto, setEditingCosto] = useState<any>(null)
  const [isMultaModalOpen, setIsMultaModalOpen] = useState(false)
  const [editingMulta, setEditingMulta] = useState<any>(null)
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const [costosRes, multasRes, choferesRes, camionesRes, viajesRes] = await Promise.all([
        supabase.from('costos_fijos').select('*').order('nombre'),
        supabase.from('multas').select('*, choferes(nombre), camiones(patente)').order('fecha', { ascending: false }),
        supabase.from('choferes').select('id, nombre').order('nombre'),
        supabase.from('camiones').select('id, patente').order('patente'),
        supabase.from('viajes').select('precio, fecha').eq('estado', 'completado'),
      ])
      setCostos(costosRes.data || [])
      setMultas(multasRes.data || [])
      setChoferes(choferesRes.data || [])
      setCamiones(camionesRes.data || [])
      setViajes(viajesRes.data || [])
    } catch (e) {
        console.error("Error cargando datos:", e)
    } finally {
      setLoading(false)
    }
  }

  // ── ACCIONES COSTOS ──
  async function handleSaveCosto(data: any) {
    setIsSaving(true)
    try {
      if (editingCosto) {
        await supabase.from('costos_fijos').update(data).eq('id', editingCosto.id)
      } else {
        await supabase.from('costos_fijos').insert([data])
      }
      setIsCostoModalOpen(false)
      setEditingCosto(null)
      fetchAll()
    } finally { setIsSaving(false) }
  }

  async function handleDeleteCosto(id: string) {
    if (!confirm('¿Eliminar este costo fijo?')) return
    await supabase.from('costos_fijos').delete().eq('id', id)
    fetchAll()
  }

  async function handleToggleCosto(id: string, activo: boolean) {
    await supabase.from('costos_fijos').update({ activo: !activo }).eq('id', id)
    fetchAll()
  }

  // ── ACCIONES MULTAS ──
  async function handleSaveMulta(data: any) {
    setIsSaving(true)
    try {
      if (editingMulta) {
        await supabase.from('multas').update(data).eq('id', editingMulta.id)
      } else {
        await supabase.from('multas').insert([data])
      }
      setIsMultaModalOpen(false)
      setEditingMulta(null)
      fetchAll()
    } finally { setIsSaving(false) }
  }

  async function handleDeleteMulta(id: string) {
    if (!confirm('¿Eliminar esta multa?')) return
    await supabase.from('multas').delete().eq('id', id)
    fetchAll()
  }

  async function handlePagarMulta(multa: any) {
    await supabase.from('multas').update({ estado: 'pagada', fecha_pago: new Date().toISOString() }).eq('id', multa.id)
    fetchAll()
  }

  const totalCostosFijosMes = useMemo(() => {
    return costos
      .filter(c => c.activo)
      .reduce((acc, c) => acc + (c.es_anual ? Number(c.monto) / 12 : Number(c.monto)), 0)
  }, [costos])

  const tabs: { value: Tab; label: string; icon: any }[] = [
    { value: 'costos',      label: 'Costos Fijos',       icon: DollarSign },
    { value: 'multas',      label: 'Multas',              icon: AlertOctagon },
    { value: 'equilibrio',  label: 'Punto de Equilibrio', icon: TrendingUp },
  ]

  return (
    <main className="min-h-screen bg-[#020617] pt-20 lg:pt-24 pb-20 font-sans italic">
      <div className="max-w-[1400px] mx-auto px-4 md:px-8 space-y-8">
        <div>
          <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.85]">
            COSTOS <br />
            <span className="text-orange-500 font-thin">/ MULTAS</span>
          </h1>
        </div>

        <div className="flex bg-slate-900 p-1.5 rounded-3xl border border-white/5 w-fit">
          {tabs.map(t => (
            <button
              key={t.value}
              onClick={() => setActiveTab(t.value)}
              className={`flex items-center gap-2.5 px-7 py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${
                activeTab === t.value
                  ? 'bg-orange-600 text-white shadow-lg'
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              <t.icon size={13} />
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'costos' && (
          <CostosFijosSection
            costos={costos}
            loading={loading}
            totalMensual={totalCostosFijosMes}
            onNuevo={() => { setEditingCosto(null); setIsCostoModalOpen(true) }}
            onEdit={(c) => { setEditingCosto(c); setIsCostoModalOpen(true) }}
            onDelete={handleDeleteCosto}
            onToggle={handleToggleCosto}
          />
        )}
        {activeTab === 'multas' && (
          <MultasSection
            multas={multas}
            loading={loading}
            onNueva={() => { setEditingMulta(null); setIsMultaModalOpen(true) }}
            onEdit={(m) => { setEditingMulta(m); setIsMultaModalOpen(true) }}
            onDelete={handleDeleteMulta}
            onPagar={handlePagarMulta}
          />
        )}
        {activeTab === 'equilibrio' && (
          <PuntoEquilibrioSection
            costosFijosMes={totalCostosFijosMes}
            viajes={viajes}
            multas={multas}
            costos={costos}
          />
        )}

        <CostoModal
          isOpen={isCostoModalOpen}
          onClose={() => { setIsCostoModalOpen(false); setEditingCosto(null) }}
          onSubmit={handleSaveCosto}
          isSaving={isSaving}
          editingData={editingCosto}
        />
        <MultaModal
          isOpen={isMultaModalOpen}
          onClose={() => { setIsMultaModalOpen(false); setEditingMulta(null) }}
          onSubmit={handleSaveMulta}
          isSaving={isSaving}
          editingData={editingMulta}
          choferes={choferes}
          camiones={camiones}
        />
      </div>
    </main>
  )
}