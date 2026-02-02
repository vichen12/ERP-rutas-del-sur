'use client'
import { useState, useEffect } from 'react'
import { Truck, UserCircle, AlertTriangle, Plus, PenLine, Settings2, Gauge, Calendar } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

export default function FlotaPage() {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'camiones' | 'choferes'>('camiones')
  const [loading, setLoading] = useState(true)
  const [choferes, setChoferes] = useState<any[]>([])
  const [camiones, setCamiones] = useState<any[]>([])
  const supabase = getSupabase()

  useEffect(() => {
    setMounted(true)
    fetchData()
  }, [])

  async function fetchData() {
    const [ch, ca] = await Promise.all([
      supabase.from('choferes').select('*'),
      supabase.from('camiones').select('*, choferes(nombre)')
    ])
    setChoferes(ch.data || [])
    setCamiones(ca.data || [])
    setLoading(false)
  }

  if (!mounted || loading) return <div className="p-10 text-cyan-500 animate-pulse font-black italic uppercase tracking-widest">Sincronizando Recursos...</div>

  return (
    <div className="p-6 lg:p-10 space-y-10 animate-in fade-in duration-500">
      
      {/* HEADER TÁCTICO */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <h1 className="text-5xl font-black italic tracking-tighter text-white uppercase leading-none">
            Gestión de <span className="text-cyan-500 font-light underline decoration-cyan-500/20">Recursos</span>
          </h1>
          <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.4em] mt-3">Rutas del Sur • Flota & Mantenimiento</p>
        </div>

        {/* SWITCH DE SECCIÓN */}
        <div className="flex bg-slate-900/50 p-1.5 rounded-2xl border border-white/5 backdrop-blur-md">
          <button 
            onClick={() => setActiveTab('camiones')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'camiones' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' : 'text-slate-500 hover:text-white'}`}
          >
            Camiones
          </button>
          <button 
            onClick={() => setActiveTab('choferes')}
            className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'choferes' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20' : 'text-slate-500 hover:text-white'}`}
          >
            Choferes
          </button>
        </div>
      </header>

      {/* VISTA DE CAMIONES */}
      {activeTab === 'camiones' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {camiones.map((c) => {
            const necesitaAceite = (c.km_actual - c.ultimo_cambio_aceite) >= 30000;
            return (
              <div key={c.id} className="group relative bg-slate-900/30 border border-white/5 p-8 rounded-[2.5rem] transition-all hover:bg-slate-900/50">
                <div className="flex justify-between items-start mb-6">
                  <div className="p-3 rounded-2xl bg-slate-950 border border-white/10 text-cyan-500">
                    <Truck size={24} />
                  </div>
                  {necesitaAceite && (
                    <div className="flex items-center gap-2 px-3 py-1 bg-rose-500/10 border border-rose-500/20 rounded-full animate-pulse">
                      <AlertTriangle size={12} className="text-rose-500" />
                      <span className="text-[9px] font-black text-rose-500 uppercase">Aceite Crítico</span>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <div>
                    <h3 className="text-2xl font-black italic text-white uppercase">{c.patente}</h3>
                    <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest">{c.modelo}</p>
                  </div>

                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-white/5">
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Kilometraje</p>
                      <p className="text-lg font-bold tabular-nums text-white flex items-center gap-2">
                        <Gauge size={14} className="text-cyan-500" /> {c.km_actual.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase mb-1">Chofer Asignado</p>
                      <p className="text-sm font-bold text-slate-300 italic">{c.choferes?.nombre || 'Sin asignar'}</p>
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* VISTA DE CHOFERES */}
      {activeTab === 'choferes' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {choferes.map((ch) => {
            const hoy = new Date();
            const vencimiento = new Date(ch.vencimiento_licencia);
            const estaVencido = vencimiento < hoy;
            return (
              <div key={ch.id} className="group bg-slate-900/30 border border-white/5 p-8 rounded-[2.5rem] relative overflow-hidden">
                <div className="flex justify-between items-center mb-6">
                  <div className="p-3 rounded-2xl bg-slate-950 border border-white/10 text-indigo-400 italic">
                    <UserCircle size={24} />
                  </div>
                  <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase ${estaVencido ? 'bg-rose-500/20 text-rose-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
                    {estaVencido ? 'Licencia Vencida' : 'Operativo'}
                  </span>
                </div>

                <div className="space-y-4">
                   <h3 className="text-2xl font-black text-white italic uppercase tracking-tighter">{ch.nombre}</h3>
                   <div className="space-y-2">
                      <div className="flex items-center justify-between text-[10px] font-bold">
                        <span className="text-slate-500 uppercase tracking-widest flex items-center gap-2"><Calendar size={12}/> Vencimiento LNH</span>
                        <span className={estaVencido ? 'text-rose-500' : 'text-slate-300'}>{new Date(ch.vencimiento_licencia).toLocaleDateString('es-AR')}</span>
                      </div>
                      <div className="h-1 w-full bg-slate-950 rounded-full overflow-hidden">
                        <div className={`h-full ${estaVencido ? 'bg-rose-500' : 'bg-indigo-500'} w-full opacity-30`} />
                      </div>
                   </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

    </div>
  )
}