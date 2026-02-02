'use client'
import { useState, useEffect } from 'react'
import { 
  Navigation, Calendar, User, Truck, Plus, Search, 
  X, Loader2, CheckCircle2, MapPin, 
  ArrowUpRight, Building2, AlertCircle, DollarSign,
  TrendingUp, Activity, Globe
} from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

export default function ViajesPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  
  const [viajes, setViajes] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [choferes, setChoferes] = useState<any[]>([])
  const [camiones, setCamiones] = useState<any[]>([])
  
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [search, setSearch] = useState('')

  const [newViaje, setNewViaje] = useState({
    cliente_id: '',
    chofer_id: '',
    camion_id: '',
    origen: '',
    destino: '',
    monto_neto: 0,
    km_recorridos: 0,
    fecha: new Date().toISOString().split('T')[0],
    estado: 'Pendiente'
  })

  const supabase = getSupabase()

  useEffect(() => {
    setMounted(true)
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [vi, cl, ch, ca] = await Promise.all([
        supabase.from('viajes').select(`
          *, 
          clientes(razon_social), 
          choferes(nombre), 
          camiones(patente, km_actuales)
        `).order('fecha', { ascending: false }),
        supabase.from('clientes').select('id, razon_social').order('razon_social', { ascending: true }),
        supabase.from('choferes').select('id, nombre').order('nombre', { ascending: true }),
        supabase.from('camiones').select('id, patente, modelo, km_actuales').order('patente', { ascending: true })
      ])

      setViajes(vi.data || [])
      setClientes(cl.data || [])
      setChoferes(ch.data || [])
      setCamiones(ca.data || [])
    } catch (err) {
      console.error("Error en fetchData:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleAddViaje = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    const { error: voyageError } = await supabase
      .from('viajes')
      .insert([{
        cliente_id: newViaje.cliente_id,
        chofer_id: newViaje.chofer_id,
        camion_id: newViaje.camion_id,
        origen: newViaje.origen.toUpperCase(),
        destino: newViaje.destino.toUpperCase(),
        monto_neto: Number(newViaje.monto_neto),
        km_recorridos: Number(newViaje.km_recorridos),
        fecha: newViaje.fecha,
        estado: 'Pendiente'
      }])

    if (voyageError) {
      alert("Error: " + voyageError.message)
    } else {
      const camionSel = camiones.find(c => c.id === newViaje.camion_id)
      if (camionSel) {
        const nuevosKm = Number(camionSel.km_actuales || 0) + Number(newViaje.km_recorridos)
        await supabase.from('camiones').update({ km_actuales: nuevosKm }).eq('id', newViaje.camion_id)
      }

      setIsModalOpen(false)
      setNewViaje({ 
        cliente_id: '', chofer_id: '', camion_id: '', origen: '', 
        destino: '', monto_neto: 0, km_recorridos: 0, 
        fecha: new Date().toISOString().split('T')[0], estado: 'Pendiente'
      })
      fetchData()
    }
    setIsSubmitting(false)
  }

  const filteredViajes = viajes.filter(v => 
    v.clientes?.razon_social?.toLowerCase().includes(search.toLowerCase()) ||
    v.destino?.toLowerCase().includes(search.toLowerCase())
  )

  // CÁLCULOS PARA STATS
  const totalKm = viajes.reduce((acc, curr) => acc + (curr.km_recorridos || 0), 0)
  const totalFacturado = viajes.reduce((acc, curr) => acc + (Number(curr.monto_neto) || 0), 0)

  if (!mounted || loading) return <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white font-black italic tracking-[0.5em] animate-pulse">SISTEMA DE RUTAS / ACCEDIENDO...</div>

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 selection:bg-emerald-500/30 pb-20 relative overflow-x-hidden">
      
      {/* BACKGROUND BLOBS PARA DAR PROFUNDIDAD */}
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] bg-emerald-500/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      {/* GRID DE FONDO */}
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="max-w-[1600px] mx-auto p-6 lg:p-10 pt-48 space-y-16 relative z-10">
        
        {/* HEADER SECCION */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10">
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-[1px] w-12 bg-emerald-500/50" />
              <span className="text-emerald-400 text-[10px] font-black uppercase tracking-[0.5em] italic">Fleet Management Systems v2.0</span>
            </div>
            <h1 className="mt-14 text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.8]">
              BITÁCORA <br />
              <span className="text-emerald-500 not-italic font-thin text-7xl">/</span> VIAJES
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-6 w-full xl:w-auto">
            <div className="relative flex-1 xl:w-[450px] group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-emerald-500 transition-colors" size={22} />
              <input 
                type="text"
                placeholder="FILTRAR POR CLIENTE O DESTINO..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-950/40 border border-white/5 rounded-3xl py-6 pl-16 pr-6 text-[11px] font-black tracking-widest text-white focus:outline-none focus:border-emerald-500/40 focus:bg-slate-950/80 transition-all backdrop-blur-xl shadow-2xl"
              />
            </div>
            <button 
              onClick={() => setIsModalOpen(true)}
              className="px-10 py-6 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl transition-all font-black uppercase text-[11px] tracking-[0.2em] shadow-[0_20px_50px_rgba(16,185,129,0.2)] active:scale-95 flex items-center gap-4 border border-emerald-400/20"
            >
              <Plus size={20} strokeWidth={3} /> Nuevo Despacho
            </button>
          </div>
        </header>

        {/* STATS QUICK VIEW */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {[
            { label: 'Viajes Activos', value: viajes.length, icon: Activity, color: 'text-indigo-400' },
            { label: 'Recorrido Total', value: `${totalKm.toLocaleString()} KM`, icon: TrendingUp, color: 'text-emerald-400' },
            { label: 'Facturación Neto', value: `$${totalFacturado.toLocaleString()}`, icon: DollarSign, color: 'text-amber-400' },
          ].map((stat, i) => (
            <div key={i} className="bg-slate-900/20 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-md flex items-center justify-between group hover:border-white/10 transition-all">
              <div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{stat.label}</p>
                <h3 className="text-4xl font-black text-white italic tracking-tighter">{stat.value}</h3>
              </div>
              <div className={`p-4 rounded-2xl bg-slate-950 border border-white/5 ${stat.color}`}>
                <stat.icon size={28} />
              </div>
            </div>
          ))}
        </div>

        {/* TABLA MEJORADA */}
        <div className="relative group">
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/20 to-indigo-500/20 rounded-[3.5rem] blur opacity-25 group-hover:opacity-40 transition duration-1000"></div>
          <div className="relative bg-[#020617]/80 border border-white/5 rounded-[3rem] overflow-hidden backdrop-blur-3xl shadow-2xl">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/5 bg-white/[0.02]">
                  <th className="p-10 text-[10px] font-black text-slate-500 uppercase tracking-widest">Fecha Operativa</th>
                  <th className="p-10 text-[10px] font-black text-slate-500 uppercase tracking-widest">Ruta & Cliente</th>
                  <th className="p-10 text-[10px] font-black text-slate-500 uppercase tracking-widest text-center">Recursos</th>
                  <th className="p-10 text-[10px] font-black text-slate-500 uppercase tracking-widest text-right">Métrica Final</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredViajes.map((viaje) => (
                  <tr key={viaje.id} className="hover:bg-emerald-500/[0.02] transition-colors">
                    <td className="p-10">
                      <div className="flex flex-col">
                        <span className="text-white font-black italic text-2xl tracking-tighter">
                          {new Date(viaje.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                        </span>
                        <span className="text-[9px] text-slate-600 font-bold uppercase tracking-widest">Año 2026</span>
                      </div>
                    </td>
                    <td className="p-10">
                      <div className="space-y-2">
                        <div className="text-emerald-400 font-black text-2xl italic uppercase tracking-tighter leading-none">
                          {viaje.clientes?.razon_social}
                        </div>
                        <div className="flex items-center gap-3 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                          <MapPin size={12} className="text-emerald-500" /> {viaje.origen} 
                          <ArrowUpRight size={14} className="text-slate-600" /> 
                          <span className="text-white">{viaje.destino}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-10">
                      <div className="flex flex-col items-center gap-3">
                        <div className="flex items-center gap-3 bg-slate-950/50 px-4 py-2 rounded-full border border-white/5">
                           <User size={12} className="text-indigo-400" />
                           <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">{viaje.choferes?.nombre}</span>
                        </div>
                        <div className="flex items-center gap-3 bg-slate-950/50 px-4 py-2 rounded-full border border-white/5">
                           <Truck size={12} className="text-indigo-400" />
                           <span className="text-[10px] font-black text-slate-300 uppercase tracking-tighter">{viaje.camiones?.patente}</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-10 text-right">
                      <div className="inline-flex flex-col items-end">
                        <div className="text-3xl font-black text-white italic tracking-tighter leading-none mb-1">
                          +{viaje.km_recorridos} <span className="text-xs text-emerald-500 not-italic uppercase ml-1">km</span>
                        </div>
                        <div className="text-lg font-bold text-slate-500 italic">
                          ${Number(viaje.monto_neto).toLocaleString()}
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* MODAL DE CARGA - Estilo mejorado */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 backdrop-blur-md bg-black/80 animate-in fade-in zoom-in duration-300">
          <div className="bg-[#020617] border border-white/10 w-full max-w-2xl rounded-[4rem] p-12 shadow-[0_0_100px_rgba(0,0,0,0.9)] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 to-indigo-500" />
            
            <div className="flex justify-between items-center mb-12">
              <div>
                <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter">Registrar Viaje</h2>
                <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mt-2">Nueva Orden de Transporte</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="p-4 bg-white/5 rounded-full text-slate-500 hover:text-white hover:bg-white/10 transition-all">
                <X size={28} />
              </button>
            </div>

            <form onSubmit={handleAddViaje} className="space-y-8">
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Cliente / Entidad</label>
                  <select required className="w-full bg-slate-950 border border-white/10 rounded-[2rem] py-5 px-6 text-sm text-white font-bold focus:border-emerald-500/50 focus:outline-none appearance-none cursor-pointer shadow-inner"
                    value={newViaje.cliente_id}
                    onChange={(e) => setNewViaje({...newViaje, cliente_id: e.target.value})}
                  >
                    <option value="">-- SELECCIONAR --</option>
                    {clientes.map(cl => <option key={cl.id} value={cl.id}>{cl.razon_social}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-2">Monto Neto Pactado</label>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-6 top-1/2 -translate-y-1/2 text-emerald-500" />
                    <input required type="number" className="w-full bg-slate-950 border border-white/10 rounded-[2rem] py-5 pl-14 pr-6 text-sm text-white font-black focus:border-emerald-500/50 focus:outline-none shadow-inner"
                      value={newViaje.monto_neto}
                      onChange={(e) => setNewViaje({...newViaje, monto_neto: Number(e.target.value)})}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-8">
                <input required placeholder="ORIGEN (PUNTO A)" className="w-full bg-slate-950 border border-white/10 rounded-[2rem] py-5 px-8 text-sm text-white font-black uppercase italic tracking-widest focus:border-emerald-500/50 focus:outline-none"
                  value={newViaje.origen} onChange={(e) => setNewViaje({...newViaje, origen: e.target.value})} />
                <input required placeholder="DESTINO (PUNTO B)" className="w-full bg-slate-950 border border-white/10 rounded-[2rem] py-5 px-8 text-sm text-white font-black uppercase italic tracking-widest focus:border-emerald-500/50 focus:outline-none"
                  value={newViaje.destino} onChange={(e) => setNewViaje({...newViaje, destino: e.target.value})} />
              </div>

              <div className="grid grid-cols-3 gap-6">
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-2">Camión</label>
                  <select required className="w-full bg-slate-950 border border-white/10 rounded-[1.5rem] py-5 px-6 text-[10px] text-white font-bold focus:border-emerald-500/50 outline-none"
                    value={newViaje.camion_id} onChange={(e) => setNewViaje({...newViaje, camion_id: e.target.value})}>
                    <option value="">EQUIPO...</option>
                    {camiones.map(c => <option key={c.id} value={c.id}>{c.patente}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-2">Operador</label>
                  <select required className="w-full bg-slate-950 border border-white/10 rounded-[1.5rem] py-5 px-6 text-[10px] text-white font-bold focus:border-emerald-500/50 outline-none"
                    value={newViaje.chofer_id} onChange={(e) => setNewViaje({...newViaje, chofer_id: e.target.value})}>
                    <option value="">CHOFER...</option>
                    {choferes.map(ch => <option key={ch.id} value={ch.id}>{ch.nombre}</option>)}
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-slate-600 uppercase tracking-widest ml-2">Kilometraje</label>
                  <input required type="number" placeholder="KM" className="w-full bg-slate-950 border border-white/10 rounded-[1.5rem] py-5 px-6 text-sm text-white font-black focus:border-emerald-500/50 outline-none"
                    value={newViaje.km_recorridos} onChange={(e) => setNewViaje({...newViaje, km_recorridos: Number(e.target.value)})} />
                </div>
              </div>

              <button type="submit" disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-6 rounded-[2rem] font-black uppercase text-xs tracking-[0.4em] shadow-2xl shadow-emerald-600/30 transition-all active:scale-[0.98] flex items-center justify-center gap-4 border border-emerald-400/20">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <>PROCESAR DESPACHO <CheckCircle2 size={18} /></>}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}