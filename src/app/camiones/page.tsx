'use client'
import { useState, useEffect } from 'react'
import { 
  Truck, Gauge, AlertTriangle, Plus, Search, 
  X, Loader2, CheckCircle2, Activity, 
  TrendingUp, History, Wrench, Settings2, Trash2, Calendar
} from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

export default function FleetCommandPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [camiones, setCamiones] = useState<any[]>([])
  const [search, setSearch] = useState('')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newCamion, setNewCamion] = useState({
    patente: '',
    modelo: '',
    km_actual: '',
    ultimo_cambio_aceite: '',
    vencimiento_rto: '' // Campo RTO
  })

  const supabase = getSupabase()

  useEffect(() => {
    setMounted(true)
    fetchFleetData()
  }, [])

  async function fetchFleetData() {
    const { data, error } = await supabase
      .from('camiones')
      .select('*, choferes(nombre), viajes(id)')
    
    if (!error) {
      const formattedData = data.map(c => ({
        ...c,
        total_viajes: c.viajes?.length || 0
      }))
      setCamiones(formattedData)
    }
    setLoading(false)
  }

  const handleAddCamion = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const { error } = await supabase
      .from('camiones')
      .insert([{
        patente: newCamion.patente.toUpperCase(),
        modelo: newCamion.modelo,
        km_actual: Number(newCamion.km_actual),
        ultimo_cambio_aceite: Number(newCamion.ultimo_cambio_aceite),
        vencimiento_rto: newCamion.vencimiento_rto
      }])

    if (error) {
      alert("Error en sistema: " + error.message)
    } else {
      setIsModalOpen(false)
      setNewCamion({ patente: '', modelo: '', km_actual: '', ultimo_cambio_aceite: '', vencimiento_rto: '' })
      fetchFleetData()
    }
    setIsSubmitting(false)
  }

  const handleDeleteCamion = async (id: string, patente: string) => {
    const confirmar = confirm(`¿ESTÁS SEGURO DE ELIMINAR LA UNIDAD [${patente}]?`)
    if (!confirmar) return

    const { error } = await supabase.from('camiones').delete().eq('id', id)
    if (!error) fetchFleetData()
  }

  const filteredFleet = camiones.filter(c => 
    c.patente.toLowerCase().includes(search.toLowerCase())
  )

  if (!mounted || loading) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-cyan-500 w-12 h-12 mb-4" />
        <p className="text-slate-500 font-black tracking-widest uppercase text-[10px] animate-pulse italic">Sincronizando Sistema...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-cyan-500/30 pb-20 relative">
      
      {/* CAPA DE INGENIERÍA */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:50px_50px]" />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-cyan-600/5 blur-[120px] rounded-full opacity-50" />
      </div>

      <div className="max-w-[1600px] mx-auto p-6 lg:p-10 pt-40 space-y-12 relative z-10">
        
        {/* HEADER */}
        <header className=" mt-18 flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_10px_#22d3ee]" />
              <span className="text-cyan-500 text-[10px] font-black uppercase tracking-[0.4em] italic text-xs">Fleet Performance Live</span>
            </div>
            <h1 className="text-7xl font-black italic tracking-tighter text-white uppercase leading-none">
              CENTRAL DE <span className="text-cyan-500 not-italic font-thin text-6xl">/</span> UNIDADES
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
            <div className="relative flex-1 xl:w-96 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-500 font-bold" size={20} />
              <input 
                type="text"
                placeholder="FILTRAR POR PATENTE..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-5 pl-12 pr-4 text-[11px] font-black tracking-widest text-white focus:outline-none focus:border-cyan-500/40 transition-all backdrop-blur-md italic font-bold"
              />
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-cyan-600/20 active:scale-95 flex items-center gap-3 italic"
            >
              <Plus size={18} strokeWidth={3} /> Nueva Unidad
            </button>
          </div>
        </header>

        {/* GRID DE UNIDADES */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredFleet.map((c) => {
            // Lógica de Aceite
            const kmDesdeServicio = c.km_actual - c.ultimo_cambio_aceite;
            const alertaCriticaAceite = kmDesdeServicio >= 29000;
            const progressAceite = Math.min(100, (kmDesdeServicio / 30000) * 100);

            // Lógica de RTO
            const hoy = new Date();
            const fechaRTO = new Date(c.vencimiento_rto);
            const unMesDesdeHoy = new Date();
            unMesDesdeHoy.setMonth(hoy.getMonth() + 1);
            
            const rtoVencida = fechaRTO < hoy;
            const alertaRTO = !rtoVencida && fechaRTO <= unMesDesdeHoy;

            return (
              <div key={c.id} className="group relative bg-slate-900/10 border border-white/5 rounded-[3.5rem] p-1 transition-all hover:scale-[1.01] duration-500">
                <div className="bg-[#020617]/90 backdrop-blur-3xl rounded-[3.4rem] p-10 border border-white/5 h-full flex flex-col justify-between overflow-hidden relative">
                  
                  {/* Badges de Alerta */}
                  <div className="absolute top-0 right-0 flex flex-col items-end">
                    <div className={`px-8 py-3 rounded-bl-[2rem] text-[9px] font-black uppercase tracking-widest border-l border-b border-white/5 ${rtoVencida ? 'bg-rose-500 text-white animate-pulse' : alertaRTO ? 'bg-amber-500 text-black' : 'bg-emerald-500/10 text-emerald-500'}`}>
                      RTO: {rtoVencida ? 'VENCIDA' : alertaRTO ? 'VENCE PRONTO' : 'AL DÍA'}
                    </div>
                  </div>

                  <div className="space-y-10">
                    <div className="flex justify-between items-start pt-4">
                      <div className={`p-5 rounded-3xl bg-slate-950 border border-white/10 ${alertaCriticaAceite || rtoVencida ? 'text-rose-500' : 'text-cyan-500'}`}>
                        <Truck size={36} strokeWidth={2.5} />
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">{c.modelo}</p>
                        <h2 className="text-5xl font-black text-white italic tracking-tighter uppercase leading-none">{c.patente}</h2>
                      </div>
                    </div>

                    {/* Datos RTO y KM */}
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-3xl p-5 border border-white/5 text-center">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">Odómetro</p>
                        <p className="text-2xl font-black text-white tabular-nums italic font-bold">{c.km_actual.toLocaleString()}<span className="text-[10px] ml-1">km</span></p>
                      </div>
                      <div className="bg-white/5 rounded-3xl p-5 border border-white/5 text-center">
                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2 italic flex items-center justify-center gap-1 leading-none">
                            <Calendar size={12} /> Vence RTO
                        </p>
                        <p className={`text-xl font-black italic leading-none pt-1 ${rtoVencida ? 'text-rose-500' : alertaRTO ? 'text-amber-500' : 'text-slate-300'}`}>
                          {fechaRTO.toLocaleDateString('es-AR')}
                        </p>
                      </div>
                    </div>

                    {/* Barra Aceite */}
                    <div className="space-y-4">
                      <div className="flex justify-between items-end px-1">
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic flex items-center gap-2">
                            <Wrench size={12} /> Vida Lubricante
                        </p>
                        <span className={`text-2xl font-black italic ${alertaCriticaAceite ? 'text-rose-500' : 'text-white'}`}>{progressAceite.toFixed(0)}%</span>
                      </div>
                      <div className="h-3 w-full bg-slate-950 rounded-full overflow-hidden p-1 border border-white/5 shadow-inner">
                        <div 
                          className={`h-full rounded-full transition-all duration-1000 ${alertaCriticaAceite ? 'bg-rose-500 shadow-[0_0_20px_#f43f5e]' : 'bg-cyan-600'}`}
                          style={{ width: `${progressAceite}%` }}
                        />
                      </div>
                    </div>
                  </div>

                  <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-indigo-400 border border-white/5 font-black text-lg italic shadow-inner">
                        {c.choferes?.nombre?.charAt(0) || '?'}
                      </div>
                      <div>
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest italic">Responsable</p>
                        <p className="text-[11px] font-bold text-slate-200 uppercase">{c.choferes?.nombre || 'SIN ASIGNAR'}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button className="p-4 bg-white/5 hover:bg-cyan-600 hover:text-white rounded-2xl transition-all border border-white/5">
                        <History size={20} />
                      </button>
                      <button 
                        onClick={() => handleDeleteCamion(c.id, c.patente)}
                        className="p-4 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-2xl transition-all border border-rose-500/20"
                      >
                        <Trash2 size={20} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* MODAL DE CARGA CON RTO */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-black/60 animate-in fade-in duration-300 font-bold italic uppercase">
          <div className="bg-[#020617] border border-white/10 w-full max-w-lg rounded-[3rem] p-10 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500 shadow-[0_0_15px_#22d3ee]" />
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">Nueva Unidad</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={28} />
              </button>
            </div>
            <form onSubmit={handleAddCamion} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Patente</label>
                  <input required placeholder="AF 123 BK" className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 px-5 text-sm text-white focus:outline-none focus:border-cyan-500/50 uppercase italic font-bold" value={newCamion.patente} onChange={(e) => setNewCamion({...newCamion, patente: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Vencimiento RTO</label>
                  <input required type="date" className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 px-5 text-sm text-white focus:outline-none focus:border-cyan-500/50 font-bold" value={newCamion.vencimiento_rto} onChange={(e) => setNewCamion({...newCamion, vencimiento_rto: e.target.value})} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Modelo / Año</label>
                <input required placeholder="Scania R450" className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 px-5 text-sm text-white focus:outline-none focus:border-cyan-500/50 italic font-bold" value={newCamion.modelo} onChange={(e) => setNewCamion({...newCamion, modelo: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Km Inicial</label>
                  <input required type="number" className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 px-5 text-sm text-white focus:outline-none focus:border-cyan-500/50 font-bold" value={newCamion.km_actual} onChange={(e) => setNewCamion({...newCamion, km_actual: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Km Último Aceite</label>
                  <input required type="number" className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 px-5 text-sm text-white focus:outline-none focus:border-cyan-500/50 font-bold" value={newCamion.ultimo_cambio_aceite} onChange={(e) => setNewCamion({...newCamion, ultimo_cambio_aceite: e.target.value})} />
                </div>
              </div>
              <button type="submit" disabled={isSubmitting} className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] transition-all shadow-xl shadow-cyan-600/20 flex items-center justify-center gap-3 active:scale-95 italic">
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <>Sincronizar Unidad <CheckCircle2 size={20} /></>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}