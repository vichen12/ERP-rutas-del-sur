'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { Plus, Search, Loader2 } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'
import { ChoferCard } from '@/components/ChoferCard' 
import { ChoferModal } from '@/components/ChoferModal'
import { ChoferStatsModal } from '@/components/ChoferStatsModal' // IMPORTANTE

export default function ChoferesPage() {
  const [loading, setLoading] = useState(true)
  const [choferes, setChoferes] = useState<any[]>([])
  const [camiones, setCamiones] = useState<any[]>([])
  const [todosLosViajes, setTodosLosViajes] = useState<any[]>([]) // Ahora traemos todo para filtrar
  const [search, setSearch] = useState('')
  
  // Estados para Modales
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isStatsModalOpen, setIsStatsModalOpen] = useState(false)
  const [selectedChofer, setSelectedChofer] = useState<any>(null)
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [formData, setFormData] = useState({
    nombre: '', licencia: '', vencimiento_licencia: '', telefono: '', camion_asignado: '' 
  })

  const supabase = getSupabase()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    // Traemos choferes, camiones y la bitácora completa de viajes
    const [ch, ca, vi] = await Promise.all([
      supabase.from('choferes').select('*').order('nombre', { ascending: true }),
      supabase.from('camiones').select('id, patente, modelo, chofer_id'),
      supabase.from('viajes').select('*').order('fecha', { ascending: false })
    ])
    
    if (ch.data) setChoferes(ch.data)
    if (ca.data) setCamiones(ca.data)
    if (vi.data) setTodosLosViajes(vi.data)
    setLoading(false)
  }

  // --- Lógica de Estadísticas ---
  const handleOpenStats = (chofer: any) => {
    setSelectedChofer(chofer)
    setIsStatsModalOpen(true)
  }

  // --- GESTIÓN DE PERSONAL ---
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
    // Desvinculamos el camión antes de borrar al chofer
    await supabase.from('camiones').update({ chofer_id: null }).eq('chofer_id', id)
    const { error } = await supabase.from('choferes').delete().eq('id', id)
    if (error) alert("Error: Probablemente tenga viajes asociados. Configure borrado en cascada.")
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
        // Limpiamos asignaciones viejas y ponemos la nueva
        await supabase.from('camiones').update({ chofer_id: null }).eq('chofer_id', choferId)
        if (formData.camion_asignado) {
            await supabase.from('camiones').update({ chofer_id: choferId }).eq('id', formData.camion_asignado)
        }
      }
      setIsModalOpen(false)
      fetchData()
    } catch (err: any) { alert("Error: " + err.message) } 
    finally { setIsSubmitting(false) }
  }

  const filtered = choferes.filter(ch => ch.nombre.toLowerCase().includes(search.toLowerCase()))

  if (loading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><Loader2 className="animate-spin text-indigo-500 w-10 h-10" /></div>

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-20 pt-32 relative font-sans italic selection:bg-indigo-500/30">
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 space-y-12 relative z-10">
        <header className="flex flex-col xl:flex-row justify-between items-end gap-8">
          <div className="space-y-4 w-full xl:w-auto">
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.8]">
              LEGAJO <br/> <span className="text-indigo-600 font-thin">/</span> CHOFERES
            </h1>
          </div>
          <div className="flex flex-wrap gap-4 w-full xl:w-auto">
            <div className="relative flex-1 xl:w-96">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="BUSCAR PERSONAL..." className="w-full bg-slate-950 border border-white/10 rounded-3xl py-5 pl-14 text-white font-bold outline-none focus:border-indigo-500/50 uppercase italic" />
            </div>
            <button onClick={handleCreate} className="px-8 bg-indigo-600 hover:bg-indigo-500 text-white rounded-3xl font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2">
              <Plus size={20} strokeWidth={3} /> Alta
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filtered.map(ch => {
            const camion = camiones.find(c => c.chofer_id === ch.id)
            const misViajes = todosLosViajes.filter(v => v.chofer_id === ch.id)
            
            // Calculamos km del mes actual para la pre-visualización en la card
            const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
            const kmMes = misViajes
              .filter(v => new Date(v.fecha) >= inicioMes)
              .reduce((acc, curr) => acc + (Number(curr.km_recorridos) || 0), 0)

            return (
              <ChoferCard 
                key={ch.id} 
                chofer={ch} 
                camion={camion} 
                totalKm={kmMes} // Mostramos km del mes en la card
                totalViajes={misViajes.length} 
                onEdit={handleEdit} 
                onDelete={handleDelete}
                onViewStats={() => handleOpenStats(ch)} // Nueva prop para abrir el modal de km
              />
            )
          })}
        </div>

        {/* MODAL DE ALTA / EDICIÓN */}
        <ChoferModal 
          isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} 
          onSubmit={handleSubmit} isSubmitting={isSubmitting} 
          editingId={editingId} formData={formData} setFormData={setFormData} camiones={camiones} 
        />

        {/* NUEVO: MODAL DE ESTADÍSTICAS DETALLADAS (KM SEMANA/MES/AÑO) */}
        <ChoferStatsModal 
          isOpen={isStatsModalOpen}
          onClose={() => setIsStatsModalOpen(false)}
          chofer={selectedChofer}
          viajes={todosLosViajes.filter(v => v.chofer_id === selectedChofer?.id)}
        />
      </div>
    </div>
  )
}