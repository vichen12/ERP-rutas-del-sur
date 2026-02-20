'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { 
  Truck, Users, DollarSign, Loader2, AlertTriangle, 
  TrendingUp, Bell, Gauge, ShieldAlert, 
  Activity, Zap, Map as MapIcon, ChevronRight
} from 'lucide-react'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, YAxis } from 'recharts'
import { supabase } from '@/lib/supabase'

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>({ stats: {}, charts: [], alertas: [] })

  useEffect(() => {
    setMounted(true)
    async function fetchDashboardData() {
      try {
        const [viajes, clientes, movimientos, camiones, choferes] = await Promise.all([
          supabase.from('viajes').select('tarifa_flete, fecha'),
          supabase.from('clientes').select('id, razon_social'),
          supabase.from('cuenta_corriente').select('debe, haber'),
          supabase.from('camiones').select('patente, km_actual, ultimo_cambio_aceite'),
          supabase.from('choferes').select('nombre, vencimiento_licencia')
        ])

        // 1. Motor de Gráficos (Agregado por mes)
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
        const revenueMap = (viajes.data || []).reduce((acc: any, v: any) => {
          const m = meses[new Date(v.fecha).getMonth()]
          acc[m] = (acc[m] || 0) + (Number(v.tarifa_flete) || 0)
          return acc
        }, {})
        const chartData = meses.map(m => ({ name: m, total: revenueMap[m] || 0 }))

        // 2. Sistema de Alertas de Alta Prioridad
        const alertas: any[] = []
        const hoy = new Date()

        camiones.data?.forEach(c => {
          const kmDesdeService = (Number(c.km_actual) || 0) - (Number(c.ultimo_cambio_aceite) || 0)
          if (kmDesdeService >= 15000) { // Umbral preventivo
            alertas.push({ 
              tipo: 'MANTENIMIENTO', 
              msg: `${c.patente}: Service Crítico en ${Math.max(0, 32000 - kmDesdeService)}km`, 
              color: 'text-amber-500', icon: Gauge, status: 'preventivo'
            })
          }
        })

        choferes.data?.forEach(ch => {
          if (ch.vencimiento_licencia) {
            const venc = new Date(ch.vencimiento_licencia)
            const diasParaVencer = Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 3600 * 24))
            if (diasParaVencer <= 30) {
              alertas.push({ 
                tipo: 'LEGAL', 
                msg: `${ch.nombre}: Carnet vence en ${diasParaVencer} días`, 
                color: 'text-rose-500', icon: ShieldAlert, status: 'urgente'
              })
            }
          }
        })

        setData({
          stats: {
            viajes: viajes.data?.length || 0,
            clientes: clientes.data?.length || 0,
            capital: (movimientos.data || []).reduce((acc, m) => acc + (Number(m.debe) - Number(m.haber)), 0),
            alertasCount: alertas.length
          },
          charts: chartData,
          alertas: alertas.sort((a, b) => a.status === 'urgente' ? -1 : 1).slice(0, 5)
        })
      } catch (err) { console.error("Dashboard Error:", err) } finally { setLoading(false) }
    }
    fetchDashboardData()
  }, []) // Removed supabase from dependency array to prevent unnecessary re-renders

  if (!mounted || loading) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center">
      <div className="relative">
        <div className="w-24 h-24 border-2 border-cyan-500/20 rounded-full animate-ping absolute inset-0" />
        <Loader2 className="animate-spin text-cyan-500 w-24 h-24 relative z-10" strokeWidth={1} />
      </div>
      <p className="text-slate-500 font-black tracking-[0.8em] animate-pulse uppercase italic text-[10px] mt-12">Sincronizando Inteligencia...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-20 font-sans italic selection:bg-cyan-500/30 relative overflow-hidden">
      
      {/* --- BACKGROUND ENGINE --- */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_-20%,#1e1b4b,transparent)] opacity-50" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
      </div>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-16 md:pt-24 space-y-12 relative z-10">
        
        {/* --- HEADER V3 --- */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full flex items-center gap-2">
                <Zap size={12} className="text-cyan-400 animate-pulse" />
                <span className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em]">Sistema Operativo Live</span>
              </div>
              <span className="text-slate-600 text-[10px] font-black uppercase tracking-[0.3em]">Rutas del Sur ERP</span>
            </div>
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.8] group">
              CONTROL <br/> 
              <span className="text-cyan-500 font-thin transition-all group-hover:pl-4 duration-700">/ CENTER</span>
            </h1>
          </div>
          
          <div className="flex flex-wrap gap-4 w-full md:w-auto">
            <NavBtn href="/viajes" label="Bitácora" icon={MapIcon} color="bg-white/5 text-slate-400" />
            <NavBtn href="/clientes" label="Finanzas" icon={Activity} color="bg-cyan-600 text-white shadow-[0_0_20px_rgba(8,145,178,0.3)]" />
          </div>
        </header>

        {/* --- KPI BENTO GRID --- */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <StatCard label="Cargas Registradas" val={data.stats.viajes} icon={Truck} color="text-cyan-400" />
          <StatCard label="Cartera Activa" val={data.stats.clientes} icon={Users} color="text-indigo-400" />
          <StatCard label="Deuda en Calle" val={`$${data.stats.capital.toLocaleString('es-AR')}`} icon={DollarSign} color="text-emerald-400" />
          <StatCard label="Alertas de Riesgo" val={data.stats.alertasCount} icon={AlertTriangle} color="text-rose-500" highlight={data.stats.alertasCount > 0} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          
          {/* --- MAIN CHART: GLASS EFFECT --- */}
          <div className="xl:col-span-2 bg-slate-950/40 border border-white/10 rounded-[3rem] p-8 md:p-12 backdrop-blur-xl shadow-2xl relative group overflow-hidden">
            <div className="absolute top-0 right-0 p-12 opacity-[0.02] group-hover:scale-110 transition-transform duration-1000">
               <TrendingUp size={300} />
            </div>
            <div className="flex justify-between items-center mb-12 relative z-10">
              <div>
                <h2 className="text-lg font-black uppercase tracking-[0.2em] flex items-center gap-3">
                  <TrendingUp size={20} className="text-cyan-500" /> Curva de Ingresos
                </h2>
                <p className="text-[10px] text-slate-500 uppercase font-bold mt-1">Facturación Bruta Anual Consolidada</p>
              </div>
              <div className="hidden sm:flex gap-2">
                 <div className="w-3 h-3 rounded-full bg-cyan-500/20 border border-cyan-500/40" />
                 <div className="w-3 h-3 rounded-full bg-cyan-500" />
              </div>
            </div>
            
            <div className="h-[400px] w-full relative z-10">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.charts}>
                  <defs>
                    <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.15}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                  <XAxis dataKey="name" stroke="#475569" fontSize={10} fontWeight="900" axisLine={false} tickLine={false} tick={{dy: 10}} />
                  <YAxis hide domain={['auto', 'auto']} />
                  <Tooltip 
                    content={<CustomTooltip />}
                    cursor={{ stroke: '#0ea5e9', strokeWidth: 2, strokeDasharray: '5 5' }}
                  />
                  <Area type="monotone" dataKey="total" stroke="#0ea5e9" strokeWidth={5} fillOpacity={1} fill="url(#colorTotal)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* --- ALERTS PANEL: GLASS EFFECT --- */}
          <div className="bg-slate-900/60 border border-white/10 rounded-[3rem] p-8 md:p-10 flex flex-col shadow-2xl backdrop-blur-md relative overflow-hidden">
            <div className="flex items-center justify-between mb-10">
              <h2 className="text-[11px] font-black uppercase tracking-[0.3em] text-rose-500 flex items-center gap-3">
                <Bell size={18} className="animate-bounce" /> Radar de Seguridad
              </h2>
              <span className="text-[8px] font-black text-slate-600 border border-white/5 px-2 py-1 rounded-md">REAL TIME</span>
            </div>
            
            <div className="space-y-4 flex-1">
              {data.alertas.length > 0 ? data.alertas.map((a: any, i: number) => (
                <div key={i} className="bg-slate-950/80 p-5 rounded-[2.2rem] border border-white/5 flex items-center gap-5 group hover:border-white/20 transition-all cursor-default">
                  <div className={`p-4 rounded-2xl bg-[#020617] ${a.color} border border-white/5 shadow-inner group-hover:scale-110 transition-transform`}>
                    <a.icon size={22} strokeWidth={2.5} />
                  </div>
                  <div>
                    <p className={`text-[8px] font-black uppercase tracking-widest ${a.color} mb-1`}>{a.tipo}</p>
                    <p className="text-xs font-black text-white uppercase italic leading-tight tracking-tight group-hover:text-cyan-400 transition-colors">{a.msg}</p>
                  </div>
                </div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center opacity-10">
                  <ShieldAlert size={100} className="mb-6" />
                  <p className="text-xs font-black uppercase tracking-[0.5em]">Perímetro Seguro</p>
                </div>
              )}
            </div>

            <button className="mt-10 w-full py-4 bg-white/5 border border-white/10 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/10 transition-all flex items-center justify-center gap-3">
              Ver Protocolos de Acción <ChevronRight size={14} />
            </button>
          </div>

        </div>
      </div>
    </div>
  )
}

// --- SUBCOMPONENTS ---

function StatCard({ label, val, icon: Icon, color, highlight }: any) {
  return (
    <div className={`bg-slate-950/40 border transition-all duration-500 p-8 rounded-[3rem] backdrop-blur-xl relative overflow-hidden group ${highlight ? 'border-rose-500/30 bg-rose-500/5 shadow-[0_0_40px_rgba(244,63,94,0.1)]' : 'border-white/5 hover:border-white/20'}`}>
      <Icon className={`absolute -right-4 -top-4 w-32 h-32 text-white opacity-[0.02] group-hover:scale-110 group-hover:rotate-12 transition-all duration-1000`} />
      <div className={`p-4 w-fit rounded-2xl bg-slate-950 border border-white/10 ${color} mb-8 shadow-inner group-hover:-translate-y-1 transition-transform`}>
        <Icon size={28} strokeWidth={2.5} />
      </div>
      <p className="text-slate-500 text-[10px] font-black uppercase tracking-[0.3em] mb-2">{label}</p>
      <p className="text-4xl lg:text-5xl font-black text-white italic tracking-tighter leading-none">{val}</p>
    </div>
  )
}

function NavBtn({ href, label, icon: Icon, color }: any) {
  return (
    <a href={href} className={`px-8 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-[0.3em] transition-all flex items-center gap-3 active:scale-95 border border-white/10 ${color}`}>
      <Icon size={16} /> {label}
    </a>
  )
}

function CustomTooltip({ active, payload, label }: any) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#020617] border border-cyan-500/30 p-6 rounded-[2rem] shadow-2xl backdrop-blur-xl">
        <p className="text-[10px] font-black text-slate-500 uppercase mb-2 tracking-widest">{label}</p>
        <p className="text-2xl font-black text-cyan-400 italic tabular-nums">
          ${Number(payload[0].value).toLocaleString('es-AR')}
        </p>
        <div className="w-full h-1 bg-cyan-500/20 mt-4 rounded-full overflow-hidden">
           <div className="w-1/2 h-full bg-cyan-500 animate-shimmer" />
        </div>
      </div>
    )
  }
  return null
}