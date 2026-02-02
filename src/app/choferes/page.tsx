'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { 
  UserCircle, Calendar, Phone, Plus, Search, 
  X, Loader2, CheckCircle2, AlertTriangle, 
  ShieldCheck, Settings2, Truck, ChevronRight,
  Trash2 // <--- Importado
} from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

export default function ChoferesPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [choferes, setChoferes] = useState<any[]>([])
  const [camiones, setCamiones] = useState<any[]>([])
  const [search, setSearch] = useState('')
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [newChofer, setNewChofer] = useState({
    nombre: '',
    licencia: '',
    vencimiento_licencia: '',
    telefono: '',
    camion_asignado: '' 
  })

  const supabase = getSupabase()

  useEffect(() => {
    setMounted(true)
    fetchData()
  }, [])

  async function fetchData() {
    const [ch, ca] = await Promise.all([
      supabase.from('choferes').select('*').order('nombre', { ascending: true }),
      supabase.from('camiones').select('id, patente, modelo')
    ])
    
    if (!ch.error) setChoferes(ch.data)
    if (!ca.error) setCamiones(ca.data)
    setLoading(false)
  }

  // --- NUEVA FUNCIÓN DE ELIMINACIÓN ---
  const handleDeleteChofer = async (id: string) => {
    if (!confirm('¿Seguro que desea eliminar este chofer? Esta acción no se puede deshacer.')) return;
    
    const { error } = await supabase
      .from('choferes')
      .delete()
      .eq('id', id);

    if (error) {
      alert("Error al eliminar: " + error.message);
    } else {
      fetchData();
    }
  }

  const handleAddChofer = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const { data: driverData, error: driverError } = await supabase
      .from('choferes')
      .insert([{
        nombre: newChofer.nombre.toUpperCase(),
        licencia: newChofer.licencia,
        vencimiento_licencia: newChofer.vencimiento_licencia,
        telefono: newChofer.telefono
      }])
      .select()

    if (!driverError && newChofer.camion_asignado) {
      await supabase
        .from('camiones')
        .update({ chofer_id: driverData[0].id })
        .eq('id', newChofer.camion_asignado)
    }

    if (driverError) {
      alert("Error en sistema: " + driverError.message)
    } else {
      setIsModalOpen(false)
      setNewChofer({ nombre: '', licencia: '', vencimiento_licencia: '', telefono: '', camion_asignado: '' })
      fetchData()
    }
    setIsSubmitting(false)
  }

  const filteredChoferes = choferes.filter(ch => 
    ch.nombre.toLowerCase().includes(search.toLowerCase())
  )

  if (!mounted || loading) return <div className="min-h-screen bg-[#020617]" />

  return (
    <div className=" min-h-screen bg-[#020617] text-slate-200 selection:bg-indigo-500/30 pb-20 relative">
      
      <div className="fixed inset-0 pointer-events-none ">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff05_1px,transparent_1px),linear-gradient(to_bottom,#ffffff05_1px,transparent_1px)] bg-[size:50px_50px]" />
      </div>

      <div className="max-w-[1600px]  mx-auto p-6 lg:p-10 pt-40 space-y-12 relative z-10">
        
        <header className=" mt-18 flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-indigo-500 rounded-full animate-pulse shadow-[0_0_10px_#6366f1]" />
              <span className="text-indigo-400 text-[10px] font-black uppercase tracking-[0.4em] italic">Resource Operations Management</span>
            </div>
            <h1 className="text-7xl font-black italic tracking-tighter text-white uppercase leading-none">
              LEGAJO DE <span className="text-indigo-500 not-italic font-thin text-6xl">/</span> CHOFERES
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-4 w-full xl:w-auto">
            <div className="relative flex-1 xl:w-96">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={20} />
              <input 
                type="text"
                placeholder="FILTRAR POR NOMBRE..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950/50 border border-white/5 rounded-2xl py-5 pl-12 pr-4 text-[11px] font-black tracking-widest text-white focus:outline-none focus:border-indigo-500/40 transition-all backdrop-blur-md shadow-2xl"
              />
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-8 py-5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl transition-all font-black uppercase text-[10px] tracking-widest shadow-2xl shadow-indigo-600/20 active:scale-95 flex items-center gap-3"
            >
              <Plus size={18} strokeWidth={3} /> Alta de Chofer
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filteredChoferes.map((ch) => {
            const vencimiento = new Date(ch.vencimiento_licencia);
            const hoy = new Date();
            const estaVencido = vencimiento < hoy;
            const proximoAVencer = !estaVencido && (vencimiento.getTime() - hoy.getTime()) / (1000 * 3600 * 24) <= 30;
            const camionAsociado = camiones.find(c => c.chofer_id === ch.id);

            return (
              <div key={ch.id} className="group relative bg-slate-900/10 border border-white/5 rounded-[3.5rem] p-1 transition-all hover:scale-[1.01] duration-500">
                <div className="bg-[#020617]/90 backdrop-blur-3xl rounded-[3.4rem] p-10 border border-white/5 h-full flex flex-col justify-between overflow-hidden relative">
                  
                  <div className={`absolute top-0 right-0 px-8 py-3 rounded-bl-[2rem] text-[9px] font-black uppercase tracking-widest border-l border-b border-white/5 ${estaVencido ? 'bg-rose-500 text-white animate-pulse' : proximoAVencer ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                    {estaVencido ? 'Inhabilitado' : proximoAVencer ? 'Vence en menos de 30 días' : 'Licencia al día'}
                  </div>

                  <div className="space-y-8 pt-4">
                    <div className="flex justify-between items-start">
                      <div className={`p-5 rounded-3xl bg-slate-950 border border-white/10 ${estaVencido ? 'text-rose-500' : 'text-indigo-400'}`}>
                        <UserCircle size={36} strokeWidth={2.5} />
                      </div>
                      <div className="text-right space-y-1">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest italic">{ch.licencia}</p>
                        <h2 className="text-4xl font-black text-white italic tracking-tighter uppercase leading-none">{ch.nombre}</h2>
                      </div>
                    </div>

                    <div className="space-y-3">
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Unidad Asignada</span>
                            <div className="flex items-center gap-2">
                                <Truck size={14} className="text-cyan-500" />
                                <span className="text-xs font-bold text-slate-200 uppercase">{camionAsociado?.patente || 'SIN UNIDAD'}</span>
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest text-rose-400">Vencimiento LNH</span>
                            <span className={`text-xs font-bold ${estaVencido ? 'text-rose-500' : 'text-slate-200'}`}>
                                {new Date(ch.vencimiento_licencia).toLocaleDateString('es-AR')}
                            </span>
                        </div>
                    </div>

                    {estaVencido && (
                      <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl flex items-center gap-3 text-rose-500">
                        <AlertTriangle size={18} className="animate-bounce" />
                        <p className="text-[10px] font-black uppercase italic tracking-tighter leading-tight">Acceso bloqueado: Actualizar documentación para operar</p>
                      </div>
                    )}
                  </div>

                  <div className="mt-10 pt-8 border-t border-white/5 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-slate-950 flex items-center justify-center text-cyan-500 border border-white/5 font-black text-lg italic shadow-inner">
                        <ShieldCheck size={20} />
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Contacto</p>
                        <p className="text-[11px] font-bold text-slate-200 uppercase">{ch.telefono || '--'}</p>
                      </div>
                    </div>
                    
                    {/* BOTONES DE ACCIÓN */}
                    <div className="flex items-center gap-2">
                      <button 
                        onClick={() => handleDeleteChofer(ch.id)}
                        className="p-4 bg-white/5 hover:bg-rose-600/20 hover:text-rose-500 rounded-2xl transition-all border border-white/5 text-slate-500"
                        title="Eliminar Chofer"
                      >
                        <Trash2 size={20} />
                      </button>
                      <button className="p-4 bg-white/5 hover:bg-indigo-600 hover:text-white rounded-2xl transition-all border border-white/5">
                        <Settings2 size={20} />
                      </button>
                    </div>

                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-black/60 animate-in fade-in duration-300">
          <div className="bg-[#020617] border border-white/10 w-full max-w-lg rounded-[3rem] p-10 shadow-[0_0_50px_rgba(0,0,0,0.8)] relative">
            <div className="absolute top-0 left-0 w-full h-1 bg-indigo-500 shadow-[0_0_15px_#6366f1]" />
            
            <div className="flex justify-between items-center mb-10">
              <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">Nuevo Chofer</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-500 hover:text-white transition-colors">
                <X size={28} />
              </button>
            </div>

            <form onSubmit={handleAddChofer} className="space-y-6">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Nombre Completo</label>
                <input 
                  required
                  placeholder="JUAN PEREZ"
                  className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 px-5 text-sm text-white focus:outline-none focus:border-indigo-500/50 uppercase italic font-bold"
                  value={newChofer.nombre}
                  onChange={(e) => setNewChofer({...newChofer, nombre: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Vencimiento Licencia</label>
                  <input 
                    required
                    type="date"
                    className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 px-5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                    value={newChofer.vencimiento_licencia}
                    onChange={(e) => setNewChofer({...newChofer, vencimiento_licencia: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Unidad Asignada</label>
                  <select 
                    className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 px-5 text-sm text-white focus:outline-none focus:border-indigo-500/50 italic font-bold appearance-none cursor-pointer"
                    value={newChofer.camion_asignado}
                    onChange={(e) => setNewChofer({...newChofer, camion_asignado: e.target.value})}
                  >
                    <option value="">SIN ASIGNAR</option>
                    {camiones.map(c => (
                        <option key={c.id} value={c.id}>{c.patente} - {c.modelo}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-1">Teléfono de Contacto</label>
                <input 
                  required
                  placeholder="+54 261 ..."
                  className="w-full bg-slate-950 border border-white/5 rounded-2xl py-4 px-5 text-sm text-white focus:outline-none focus:border-indigo-500/50"
                  value={newChofer.telefono}
                  onChange={(e) => setNewChofer({...newChofer, telefono: e.target.value})}
                />
              </div>

              <button 
                type="submit" 
                disabled={isSubmitting}
                className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] transition-all shadow-xl shadow-indigo-600/20 flex items-center justify-center gap-3 disabled:bg-slate-800 active:scale-95 italic"
              >
                {isSubmitting ? <Loader2 className="animate-spin" size={20} /> : <>Registrar Legajo <CheckCircle2 size={20} /></>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}