'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { 
  Truck, Users, DollarSign, Loader2, AlertTriangle, 
  TrendingUp, Bell, ArrowRight, Gauge, ShieldAlert 
} from 'lucide-react'
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer, CartesianGrid, YAxis } from 'recharts'
import { getSupabase } from '@/lib/supabase'

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>({ stats: {}, charts: [], alertas: [] })
  const supabase = getSupabase()

  useEffect(() => {
    setMounted(true)
    async function fetchDashboardData() {
      try {
        const [viajes, clientes, movimientos, camiones, choferes] = await Promise.all([
          supabase.from('viajes').select('monto_neto, fecha'),
          supabase.from('clientes').select('id, razon_social'),
          supabase.from('cuenta_corriente').select('debe, haber'),
          supabase.from('camiones').select('patente, km_actual, ultimo_cambio_aceite'),
          supabase.from('choferes').select('nombre, vencimiento_licencia')
        ])

        // 1. Gráfico de Facturación (Últimos meses)
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
        const revenueMap = (viajes.data || []).reduce((acc: any, v: any) => {
          const m = meses[new Date(v.fecha).getMonth()]
          acc[m] = (acc[m] || 0) + Number(v.monto_neto)
          return acc
        }, {})
        const chartData = meses.map(m => ({ name: m, total: revenueMap[m] || 0 }))

        // 2. Sistema de Alertas Inteligentes
        const alertas: any[] = []
        const hoy = new Date()

        // Chequeo de Service Camiones
        camiones.data?.forEach(c => {
          const kmDesdeService = (c.km_actual || 0) - (c.ultimo_cambio_aceite || 0)
          if (kmDesdeService >= 18000) {
            alertas.push({ 
              tipo: 'MANTENIMIENTO', 
              msg: `${c.patente}: Service en ${20000 - kmDesdeService}km`, 
              color: 'text-amber-500',
              icon: Gauge
            })
          }
        })

        // Chequeo de Licencias Choferes
        choferes.data?.forEach(ch => {
          if (ch.vencimiento_licencia) {
            const venc = new Date(ch.vencimiento_licencia)
            const diasParaVencer = Math.ceil((venc.getTime() - hoy.getTime()) / (1000 * 3600 * 24))
            if (diasParaVencer <= 30) {
              alertas.push({ 
                tipo: 'LEGAL', 
                msg: `${ch.nombre}: Carnet vence en ${diasParaVencer}d`, 
                color: 'text-rose-500',
                icon: ShieldAlert
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
          alertas: alertas.slice(0, 4)
        })
      } catch (err) {
        console.error("Dashboard Error:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchDashboardData()
  }, [supabase])

  if (!mounted || loading) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-cyan-500 w-12 h-12 mb-4" />
      <p className="text-slate-500 font-black tracking-[0.4em] animate-pulse uppercase italic text-[9px]">Sincronizando Terminal...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-6 lg:p-10 space-y-10 font-sans italic selection:bg-cyan-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:40px_40px]" />
      
      <header className=" relative z-10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div >
          <div className=" flex items-center gap-2 mb-3 uppercase text-[10px] font-black text-cyan-500 tracking-[0.4em]">
            <div className="w-2 h-2 bg-cyan-500 rounded-full animate-ping" /> Global Operations Control
          </div>
          <h1 className=" MT-15 text-7xl font-black italic tracking-tighter text-white uppercase leading-none">
            COMMAND <span className="text-cyan-500 font-thin">/</span> CENTER
          </h1>
        </div>
        <div className="flex gap-3">
          <a href="/viajes" className="px-6 py-3 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-2">
            Bitácora <ArrowRight size={14} />
          </a>
          <a href="/clientes" className="px-6 py-3 bg-cyan-600 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-cyan-500 transition-all shadow-lg shadow-cyan-900/20 flex items-center gap-2">
            Cuentas <ArrowRight size={14} />
          </a>
        </div>
      </header>

      {/* KPI GRID */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {[
          { label: 'Viajes Históricos', val: data.stats.viajes, icon: Truck, color: 'text-cyan-400' },
          { label: 'Cartera Clientes', val: data.stats.clientes, icon: Users, color: 'text-indigo-400' },
          { label: 'Deuda Total Clientes', val: `$${data.stats.capital.toLocaleString('es-AR')}`, icon: DollarSign, color: 'text-emerald-400' },
          { label: 'Incidentes / Alertas', val: data.stats.alertasCount, icon: AlertTriangle, color: 'text-rose-500' },
        ].map((s, i) => (
          <div key={i} className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl relative overflow-hidden group">
            <div className={`p-4 w-fit rounded-2xl bg-slate-950 border border-white/10 ${s.color} mb-6`}>
              <s.icon size={26} strokeWidth={2.5} />
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1">{s.label}</p>
            <p className="text-4xl font-black text-white italic tracking-tighter leading-none">{s.val}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
        {/* REVENUE CHART */}
        <div className="lg:col-span-2 bg-slate-900/20 border border-white/5 rounded-[3.5rem] p-10 backdrop-blur-md">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] flex items-center gap-3 italic">
              <TrendingUp size={18} className="text-cyan-500" /> Curva de Facturación Bruta
            </h2>
          </div>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.charts}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#475569" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#020617', borderRadius: '20px', border: '1px solid #ffffff10', fontSize: '12px' }}
                  itemStyle={{ color: '#0ea5e9' }}
                />
                <Area type="monotone" dataKey="total" stroke="#0ea5e9" strokeWidth={4} fill="#0ea5e9" fillOpacity={0.05} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* ALERTS PANEL */}
        <div className="bg-slate-900/40 border border-white/5 rounded-[3.5rem] p-10 flex flex-col shadow-2xl">
           <h2 className="text-[10px] font-black uppercase tracking-widest text-rose-500 mb-10 flex items-center gap-2 italic">
             <Bell size={18} /> Panel de Control de Riesgos
           </h2>
           <div className="space-y-4 flex-1">
              {data.alertas.length > 0 ? data.alertas.map((a: any, i: number) => (
                <div key={i} className="bg-slate-950/50 p-5 rounded-[2rem] border border-white/5 flex items-center gap-5 group hover:bg-white/5 transition-all">
                  <div className={`p-3 rounded-xl bg-slate-900 ${a.color}`}>
                    <a.icon size={20} />
                  </div>
                  <div>
                    <p className={`text-[9px] font-black uppercase tracking-widest ${a.color}`}>{a.tipo}</p>
                    <p className="text-xs font-bold text-white uppercase italic leading-tight">{a.msg}</p>
                  </div>
                </div>
              )) : (
                <div className="h-full flex flex-col items-center justify-center opacity-20">
                  <ShieldAlert size={60} className="mb-4" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Sistemas Estables</p>
                </div>
              )}
           </div>
           
           <div className="mt-10 p-6 bg-cyan-500/5 border border-cyan-500/10 rounded-[2rem]">
              <p className="text-[9px] font-black text-cyan-500 uppercase tracking-widest mb-1">Nota Técnica</p>
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed uppercase">
                Los datos reflejan la actividad consolidada de Rutas del Sur al {new Date().toLocaleDateString()}.
              </p>
           </div>
        </div>
      </div>
    </div>
  )
}