'use client'
// Eliminamos el export dynamic que da conflicto en cliente
// export const dynamic = 'force-dynamic' 

import { useState, useEffect, useMemo } from 'react'
import { Plus, Search, Loader2 } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

// IMPORTACIONES
import { ChoferCard } from '@/components/ChoferCard' 
import { ChoferModal } from '@/components/ChoferModal'
import { ChoferStatsModal } from '@/components/ChoferStatsModal'

export default function ChoferesPage() {
  const [loading, setLoading] = useState(true)
  const [choferes, setChoferes] = useState<any[]>([])
  const [camiones, setCamiones] = useState<any[]>([])
  const [todosLosViajes, setTodosLosViajes] = useState<any[]>([])
  const [search, setSearch] = useState('')
  
  // Estados para Modales
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)
  const [selectedChofer, setSelectedChofer] = useState<any>(null)
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [formData, setFormData] = useState({
    nombre: '', 
    licencia: '', 
    vencimiento_licencia: '', 
    telefono: '', 
    camion_asignado: '' 
  })

  const supabase = getSupabase()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [ch, ca, vi] = await Promise.all([
        supabase.from('choferes').select('*').order('nombre', { ascending: true }),
        supabase.from('camiones').select('id, patente, modelo, chofer_id'),
        supabase.from('viajes').select('*').order('fecha', { ascending: false })
      ])
      
      if (ch.data) setChoferes(ch.data)
      if (ca.data) setCamiones(ca.data)
      if (vi.data) setTodosLosViajes(vi.data)
    } catch (error) {
      console.error("Error sync:", error)
    } finally {
      setLoading(false)
    }
  }

  // --- KPI GLOBAL: DEUDA TOTAL FLOTA ---
  const deudaGlobal = useMemo(() => {
    return todosLosViajes
      .filter(v => !v.pago_chofer_realizado)
      .reduce((acc, curr) => acc + (Number(curr.pago_chofer) || 0), 0)
  }, [todosLosViajes])

  // --- HANDLERS ---
  const handleOpenStats = (chofer: any) => {
    setSelectedChofer(chofer)
    setIsStatsModalOpen(true)
  }

  const handleEdit = (chofer: any) => {
    const camionActual = camiones.find(c => c.chofer_id === chofer.id)
    setFormData({
      nombre: chofer.nombre,
      licencia: chofer.licencia || '',
      vencimiento_licencia: chofer.vencimiento_licencia || '',
      telefono: chofer.telefono || '',
      camion_asignado: camionActual ? camionActual.id : ''
    })
    setEditingId(chofer.id)
    setIsModalOpen(true)
  }

  const handleCreate = () => {
    setFormData({ nombre: '', licencia: '', vencimiento_licencia: '', telefono: '', camion_asignado: '' })
    setEditingId(null)
    setIsModalOpen(true)
  }

  const handleDelete = async (id: string, nombre: string) => {
    if (!confirm(`ATENCIÓN: ¿Seguro que desea dar de baja a ${nombre}?`)) return
    
    // Primero desvinculamos camiones
    await supabase.from('camiones').update({ chofer_id: null }).eq('chofer_id', id)
    
    // Intentamos borrar chofer
    const { error } = await supabase.from('choferes').delete().eq('id', id)
    
    if (error) alert("Error: El chofer tiene viajes históricos asociados. No se puede borrar por seguridad.")
    else fetchData()
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      let choferId = editingId
      const payload = {
        nombre: formData.nombre.toUpperCase(),
        licencia: formData.licencia.toUpperCase(),
        vencimiento_licencia: formData.vencimiento_licencia,
        telefono: formData.telefono
      }

      if (editingId) {
        await supabase.from('choferes').update(payload).eq('id', editingId)
      } else {
        const { data, error } = await supabase.from('choferes').insert([payload]).select()
        if (error) throw error
        choferId = data[0].id
      }

      if (choferId) {
        await supabase.from('camiones').update({ chofer_id: null }).eq('chofer_id', choferId)
        if (formData.camion_asignado) {
            await supabase.from('camiones').update({ chofer_id: null }).eq('id', formData.camion_asignado)
            await supabase.from('camiones').update({ chofer_id: choferId }).eq('id', formData.camion_asignado)
        }
      }
      setIsModalOpen(false)
      fetchData()
    } catch (err: any) { alert("Error: " + err.message) } 
    finally { setIsSubmitting(false) }
  }

  const filtered = choferes.filter(ch => ch.nombre.toLowerCase().includes(search.toLowerCase()))

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center">
      <Loader2 className="animate-spin text-indigo-500 w-12 h-12" />
    </div>
  )

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-20 pt-24 md:pt-32 relative font-sans italic selection:bg-indigo-500/30">
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="max-w-[1600px] mx-auto px-4 md:px-6 lg:px-10 space-y-8 md:space-y-12 relative z-10">
        
        {/* HEADER RESPONSIVE */}
        <header className="flex flex-col xl:flex-row justify-between items-start gap-8 border-b border-white/5 pb-8 md:pb-12">
          <div className="space-y-4 w-full xl:w-auto">
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.8] break-words">
              LEGAJO <br className="hidden md:block"/> <span className="text-indigo-600 font-thin">/</span> CHOFERES
            </h1>
            
            {/* KPIs en Grilla Responsive (1 col móvil, 2 cols tablet) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 md:pt-6 w-full max-w-2xl">
              <div className="bg-rose-500/5 border border-rose-500/20 px-6 py-4 rounded-[2rem] backdrop-blur-md w-full">
                <p className="text-[9px] md:text-[10px] font-black text-rose-500 uppercase tracking-widest mb-1">Deuda Total Flota</p>
                <p className="text-2xl md:text-3xl font-black text-white italic">$ {deudaGlobal.toLocaleString()}</p>
              </div>
              <div className="bg-white/5 border border-white/10 px-6 py-4 rounded-[2rem] backdrop-blur-md w-full">
                <p className="text-[9px] md:text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Plantel Activo</p>
                <p className="text-2xl md:text-3xl font-black text-white italic">{choferes.length} Choferes</p>
              </div>
            </div>
          </div>

          {/* BUSCADOR Y BOTONES RESPONSIVE */}
          <div className="flex flex-col sm:flex-row flex-wrap gap-4 w-full xl:w-auto mt-4 xl:mt-0">
            <div className="relative w-full sm:flex-1 xl:w-96 group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
              <input 
                value={search} 
                onChange={e => setSearch(e.target.value)} 
                placeholder="BUSCAR PERSONAL..." 
                className="w-full bg-slate-950/50 border border-white/10 rounded-3xl py-4 md:py-5 pl-14 text-white font-bold outline-none focus:border-indigo-500/50 uppercase italic transition-all text-sm md:text-base" 
              />
            </div>
            <button 
              onClick={handleCreate} 
              className="w-full sm:w-auto px-8 md:px-10 py-4 md:py-0 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black uppercase tracking-widest transition-all shadow-xl shadow-indigo-600/20 active:scale-95 flex items-center justify-center gap-3"
            >
              <Plus size={20} strokeWidth={3} /> Alta
            </button>
          </div>
        </header>

        {/* GRILLA RESPONSIVE (1 col móvil, 2 tablet, 3 desktop) */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-8">
          {filtered.map(ch => {
            const camion = camiones.find(c => c.chofer_id === ch.id)
            const misViajes = todosLosViajes.filter(v => v.chofer_id === ch.id)
            
            const saldoChofer = misViajes
              .filter(v => !v.pago_chofer_realizado)
              .reduce((acc, curr) => acc + (Number(curr.pago_chofer) || 0), 0)

            const kmTotales = misViajes.reduce((acc, curr) => 
              acc + (Number(curr.km_salida || curr.km_recorridos) || 0) + (Number(curr.km_retorno) || 0), 0
            )

            return (
              <ChoferCard 
                key={ch.id} 
                chofer={ch} 
                camion={camion} 
                totalKm={kmTotales} 
                totalViajes={misViajes.length} 
                saldoPendiente={saldoChofer}
                onEdit={handleEdit} 
                onDelete={handleDelete}
                onViewStats={() => handleOpenStats(ch)} 
              />
            )
          })}
        </div>

        {/* MODALES */}
        <ChoferModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)} 
          onSubmit={handleSubmit} 
          isSubmitting={isSubmitting} 
          editingId={editingId} 
          formData={formData} 
          setFormData={setFormData} 
          camiones={camiones} 
        />

        <ChoferStatsModal 
          isOpen={isStatsModalOpen}
          onClose={() => setIsStatsModalOpen(false)}
          chofer={selectedChofer}
          viajes={todosLosViajes.filter(v => v.chofer_id === selectedChofer?.id)}
          onRefresh={fetchData}
        />
      </div>
    </div>
  )
}