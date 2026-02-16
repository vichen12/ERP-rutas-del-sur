'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabase'
import { Plus, UserCircle, Calendar, Truck, Loader2 } from 'lucide-react'

// Componentes del ERP
import { CamionCard } from '@/components/CamionCard'
import { CamionModal } from '@/components/CamionModal'

export default function FlotaPage() {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'camiones' | 'choferes'>('camiones')
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  const [choferes, setChoferes] = useState<any[]>([])
  const [camiones, setCamiones] = useState<any[]>([])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  // Estado del Formulario
  const [formData, setFormData] = useState<any>({
    patente: '',
    modelo: '',
    km_actual: '',
    ultimo_cambio_aceite: '',
    vencimiento_rto: '', 
    chofer_id: ''
  })

  const supabase = getSupabase()

  useEffect(() => {
    setMounted(true)
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [ch, ca] = await Promise.all([
        supabase.from('choferes').select('*').order('nombre'),
        // Traemos explícitamente la columna vencimiento_rto
        supabase.from('camiones').select('*, choferes(nombre)').order('patente')
      ])
      setChoferes(ch.data || [])
      setCamiones(ca.data || [])
    } catch (err) {
      console.error("Error cargando flota:", err)
    } finally {
      setLoading(false)
    }
  }

  // --- GUARDADO ---
  const handleSaveCamion = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    try {
      // El payload debe coincidir EXACTO con los nombres de columna en Supabase
      const payload = {
        patente: formData.patente.toUpperCase(),
        modelo: formData.modelo.toUpperCase(),
        km_actual: Number(formData.km_actual),
        ultimo_cambio_aceite: Number(formData.ultimo_cambio_aceite),
        chofer_id: formData.chofer_id || null,
        // Si el string está vacío, mandamos null para no romper el tipo DATE de Postgres
        vencimiento_rto: formData.vencimiento_rto === '' ? null : formData.vencimiento_rto 
      }

      const { error } = editingId 
        ? await supabase.from('camiones').update(payload).eq('id', editingId)
        : await supabase.from('camiones').insert([payload])

      if (error) throw error

      setIsModalOpen(false)
      setEditingId(null)
      resetForm()
      await fetchData()

    } catch (error: any) {
      alert("❌ Error en la base de datos: " + error.message)
    } finally {
      setIsSubmitting(false)
    }
  }

  // --- EDICIÓN (ACÁ ESTÁ EL TRUCO) ---
  const handleEditClick = (camion: any) => {
    setEditingId(camion.id)
    
    // Postgres suele devolver "YYYY-MM-DD" o "YYYY-MM-DDTHH:MM:SS"
    // El input date de HTML SOLO acepta "YYYY-MM-DD". 
    // Si tiene una 'T', la cortamos.
    const fechaParaInput = camion.vencimiento_rto 
      ? camion.vencimiento_rto.split('T')[0] 
      : ''

    setFormData({
      patente: camion.patente || '',
      modelo: camion.modelo || '',
      km_actual: camion.km_actual || '',
      ultimo_cambio_aceite: camion.ultimo_cambio_aceite || '',
      vencimiento_rto: fechaParaInput,
      chofer_id: camion.chofer_id || ''
    })
    setIsModalOpen(true)
  }

  const handleDeleteCamion = async (id: string, patente: string) => {
    if (!confirm(`¿Borrar unidad ${patente}?`)) return
    const { error } = await supabase.from('camiones').delete().eq('id', id)
    if (!error) fetchData()
  }

  const resetForm = () => {
    setFormData({
      patente: '', modelo: '', km_actual: '', 
      ultimo_cambio_aceite: '', vencimiento_rto: '', chofer_id: ''
    })
  }

  if (!mounted || loading) return (
    <div className="h-screen bg-[#020617] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="text-cyan-500 animate-spin" size={40} />
        <p className="text-cyan-500 font-black italic uppercase tracking-[0.3em]">Sincronizando Flota...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#020617] p-6 lg:p-10 pb-32 font-sans italic">
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:50px_50px]" />

      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 mb-12 relative z-10">
        <div>
          <h1 className="text-5xl lg:text-7xl font-black italic tracking-tighter text-white uppercase leading-none">
            RECURSOS <span className="text-cyan-500 font-light underline decoration-cyan-500/10">SUR</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-4">Control de Activos y Mantenimiento</p>
        </div>

        <div className="flex gap-4 items-center">
          <div className="flex bg-slate-900/50 p-1.5 rounded-3xl border border-white/5 backdrop-blur-md">
            <button 
              onClick={() => setActiveTab('camiones')}
              className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'camiones' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/30' : 'text-slate-500 hover:text-white'}`}
            >
              Camiones
            </button>
            <button 
              onClick={() => setActiveTab('choferes')}
              className={`px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'choferes' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30' : 'text-slate-500 hover:text-white'}`}
            >
              Choferes
            </button>
          </div>

          <button 
            onClick={() => { resetForm(); setEditingId(null); setIsModalOpen(true); }}
            className="p-5 bg-white text-black rounded-2xl hover:bg-cyan-400 transition-all active:scale-90 shadow-xl shadow-white/5"
          >
            <Plus size={24} strokeWidth={3} />
          </button>
        </div>
      </header>

      <main className="relative z-10">
        {activeTab === 'camiones' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {camiones.map((c) => (
              <CamionCard 
                key={c.id} 
                camion={c}
                chofer={c.choferes}
                totalGastos={0} 
                onEdit={handleEditClick}
                onDelete={handleDeleteCamion}
                onAddGasto={(camion) => alert(`Gasto para ${camion.patente}`)}
                onShowHistory={(camion) => alert(`Historial ${camion.patente}`)}
              />
            ))}
          </div>
        )}

        {activeTab === 'choferes' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {choferes.map((ch) => {
              const vencimiento = new Date(ch.vencimiento_licencia);
              const estaVencido = vencimiento < new Date();
              return (
                <div key={ch.id} className="bg-slate-900/40 border border-white/5 p-10 rounded-[3rem] relative group hover:bg-slate-800/40 transition-all">
                  <div className="flex justify-between items-center mb-8">
                    <div className="p-4 rounded-2xl bg-slate-950 border border-white/10 text-indigo-400 shadow-lg shadow-indigo-500/10">
                      <UserCircle size={30} />
                    </div>
                    <span className={`text-[9px] font-black px-4 py-1.5 rounded-full uppercase tracking-tighter ${estaVencido ? 'bg-rose-500 text-white animate-pulse' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      {estaVencido ? 'Licencia Vencida' : 'Operativo'}
                    </span>
                  </div>
                  <h3 className="text-3xl font-black text-white italic uppercase tracking-tighter mb-2">{ch.nombre}</h3>
                  <div className="pt-6 border-t border-white/5">
                    <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-1">Vencimiento LNH</p>
                    <p className={`text-lg font-black italic ${estaVencido ? 'text-rose-500' : 'text-slate-300'}`}>
                      {vencimiento.toLocaleDateString('es-AR')}
                    </p>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </main>

      <CamionModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveCamion}
        isSubmitting={isSubmitting}
        editingId={editingId}
        formData={formData}
        setFormData={setFormData}
        choferes={choferes}
      />
    </div>
  )
}