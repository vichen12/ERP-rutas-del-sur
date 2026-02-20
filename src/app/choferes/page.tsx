'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from 'react'
import { 
  Plus, Search, Loader2, UserCheck, ShieldAlert, 
  CreditCard, UserPlus, SearchX
} from 'lucide-react'
// 🚀 CAMBIO CLAVE: Importación directa para estabilidad
import { supabase } from '@/lib/supabase' 

// Componentes del sistema
import { ChoferCard } from '@/components/ChoferCard' 
import { ChoferModal } from '@/components/ChoferModal'
import { ChoferStatsModal } from '@/components/ChoferStatsModal'

export default function ChoferesPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [choferes, setChoferes] = useState<any[]>([])
  const [camiones, setCamiones] = useState<any[]>([])
  const [todosLosViajes, setTodosLosViajes] = useState<any[]>([])
  const [search, setSearch] = useState('')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)
  const [selectedChofer, setSelectedChofer] = useState<any>(null)
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const initialFormState = {
    nombre: '', dni: '', licencia: '', vto_licencia: '', 
    telefono: '', estado: 'Disponible', foto_url: '' 
  }

  const [formData, setFormData] = useState(initialFormState)

  useEffect(() => { 
    setMounted(true)
    fetchData() 
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      // 🛰️ QUERY CORREGIDA: Sin 'pago_chofer_realizado' para evitar Error 400
      const [ch, ca, vi] = await Promise.all([
        supabase.from('choferes').select('*').order('nombre', { ascending: true }),
        supabase.from('camiones').select('id, patente, modelo, operador_id'),
        supabase.from('viajes').select('chofer_id, pago_chofer, km_recorridos, fecha')
      ])
      
      if (ch.data) setChoferes(ch.data)
      if (ca.data) setCamiones(ca.data)
      if (vi.data) setTodosLosViajes(vi.data)
    } catch (error: any) {
      console.error("❌ Error de radar:", error.message)
    } finally {
      setLoading(false)
    }
  }

  // --- 📊 KPI DINÁMICOS CORREGIDOS ---
  const globalStats = useMemo(() => {
    const hoy = new Date()
    return {
      // Calculamos deuda total basándonos en todos los viajes cargados
      deudaTotal: todosLosViajes.reduce((acc, curr) => acc + (Number(curr.pago_chofer) || 0), 0),
      vencimientosProximos: choferes.filter(ch => {
        if (!ch.vto_licencia) return false
        const vto = new Date(ch.vto_licencia)
        const diff = (vto.getTime() - hoy.getTime()) / (1000 * 3600 * 24)
        return diff <= 30 && diff > 0
      }).length
    }
  }, [todosLosViajes, choferes])

  // --- HANDLERS CORREGIDOS ---
  const handleEdit = (chofer: any) => {
    setFormData({
      nombre: chofer.nombre || '', 
      dni: chofer.dni || '',
      licencia: chofer.licencia || '', 
      // ✅ BUG 1 CORREGIDO: Usando 'chofer' en lugar del inexistente 'ch'
      vto_licencia: chofer.vto_licencia || '',
      telefono: chofer.telefono || '', 
      estado: chofer.estado || 'Disponible',
      foto_url: chofer.foto_url || ''
    })
    setEditingId(chofer.id); 
    setIsModalOpen(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setIsSubmitting(true)
    try {
      const payload = { 
        ...formData, 
        nombre: formData.nombre.toUpperCase(), 
        licencia: formData.licencia.toUpperCase() 
      }
      
      const { error } = editingId 
        ? await supabase.from('choferes').update(payload).eq('id', editingId)
        : await supabase.from('choferes').insert([payload])
      
      if (error) throw error
      setIsModalOpen(false); 
      fetchData()
    } catch (err: any) { 
      alert("❌ Error al guardar legajo: " + err.message) 
    } finally { 
      setIsSubmitting(false) 
    }
  }

  const filtered = choferes.filter(ch => 
    ch.nombre.toLowerCase().includes(search.toLowerCase()) || 
    ch.dni?.includes(search)
  )

  if (!mounted || loading) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-indigo-500 w-16 h-16 mb-4" strokeWidth={1} />
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 animate-pulse">Sincronizando Staff...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-24 pt-32 relative font-sans italic selection:bg-indigo-500/30">
      
      {/* BACKGROUND FX */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e1b4b,transparent)] opacity-40" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="max-w-[1600px] mx-auto px-6 md:px-10 space-y-12 relative z-10">
        
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10">
          <div className="space-y-6 flex-1">
            <h1 className="text-6xl md:text-9xl font-black italic tracking-tighter text-white uppercase leading-[0.8]">
              STAFF <span className="text-indigo-600 font-thin">/</span> <br className="hidden md:block"/> OPERADORES
            </h1>
            
            <div className="flex flex-wrap gap-4 pt-4">
              <HeaderStat label="Masa Salarial" val={`$${globalStats.deudaTotal.toLocaleString()}`} color="text-rose-500" icon={CreditCard} />
              <HeaderStat label="Legajos Activos" val={choferes.length} color="text-indigo-400" icon={UserCheck} />
              <HeaderStat label="Licencias" val={globalStats.vencimientosProximos} color="text-amber-500" icon={ShieldAlert} highlight={globalStats.vencimientosProximos > 0} />
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
            <div className="relative group flex-1 xl:w-96">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400" size={20} />
              <input 
                value={search} onChange={e => setSearch(e.target.value)} 
                placeholder="BUSCAR OPERADOR..." 
                className="w-full bg-slate-950/80 border border-white/10 rounded-3xl py-5 pl-16 text-white font-black outline-none focus:border-indigo-500/40 uppercase transition-all" 
              />
            </div>
            <button 
              onClick={() => {setEditingId(null); setFormData(initialFormState); setIsModalOpen(true)}}
              className="px-10 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black uppercase tracking-[0.2em] transition-all shadow-[0_0_30px_rgba(79,70,229,0.3)] flex items-center justify-center gap-3 active:scale-95"
            >
              <Plus size={20} strokeWidth={3} /> Alta Legajo
            </button>
          </div>
        </header>

        {filtered.length === 0 ? (
          <div className="py-40 flex flex-col items-center justify-center border-2 border-dashed border-white/5 rounded-[4rem] bg-white/[0.01]">
            <SearchX size={80} className="text-slate-800 mb-6" />
            <p className="text-slate-500 font-black uppercase tracking-[0.4em] text-center">Sin resultados</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-8">
            {filtered.map(ch => {
              const camion = camiones.find(c => c.operador_id === ch.id)
              const viajesCh = todosLosViajes.filter(v => v.chofer_id === ch.id)
              // Cálculo de saldo ajustado a las columnas existentes
              const saldo = viajesCh.reduce((acc, v) => acc + (Number(v.pago_chofer) || 0), 0)
              const kms = viajesCh.reduce((acc, v) => acc + (Number(v.km_recorridos) || 0), 0)

              return (
                <ChoferCard 
                  key={ch.id} chofer={ch} camion={camion} 
                  totalKm={kms} totalViajes={viajesCh.length} saldoPendiente={saldo}
                  onEdit={handleEdit} onDelete={() => {}} onViewStats={() => {setSelectedChofer(ch); setIsStatsModalOpen(true)}} 
                />
              )
            })}
          </div>
        )}
      </div>

      <ChoferModal 
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSubmit} isSubmitting={isSubmitting} 
        editingId={editingId} formData={formData} setFormData={setFormData} 
      />

      <ChoferStatsModal 
        isOpen={isStatsModalOpen} onClose={() => setIsStatsModalOpen(false)}
        chofer={selectedChofer}
        viajes={todosLosViajes.filter(v => v.chofer_id === selectedChofer?.id)}
        onRefresh={fetchData}
      />
    </div>
  )
}

function HeaderStat({ label, val, color, icon: Icon, highlight }: any) {
  return (
    <div className={`bg-slate-950/60 border ${highlight ? 'border-amber-500/40 bg-amber-500/5' : 'border-white/5'} px-6 py-4 rounded-[2rem] backdrop-blur-md min-w-[180px] group hover:border-white/20 transition-all`}>
      <p className={`text-[9px] font-black uppercase tracking-widest mb-1 flex items-center gap-2 ${color}`}>
        <Icon size={12} /> {label}
      </p>
      <p className="text-2xl font-black text-white italic tracking-tighter">{val}</p>
    </div>
  )
}