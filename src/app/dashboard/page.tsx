'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useMemo } from 'react'
import { Truck, Users, DollarSign, ClipboardList, Loader2, Activity, ArrowUpRight, TrendingUp } from 'lucide-react'
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts'
import { getSupabase } from '@/lib/supabase'

export default function DashboardPage() {
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>({ stats: {}, charts: [] })
  const supabase = getSupabase()

  useEffect(() => {
    setMounted(true)
    async function fetchAllData() {
      try {
        const [viajes, clientes, pagos] = await Promise.all([
          supabase.from('viajes').select('monto, estado, fecha'),
          supabase.from('clientes').select('id, razon_social, saldo'),
          supabase.from('pagos').select('monto, fecha')
        ])

        // 1. Procesamiento para Gráfico de Facturación (Últimos 6 meses)
        const meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']
        const revenueData = (viajes.data || []).reduce((acc: any, v: any) => {
          const mesIdx = new Date(v.fecha).getMonth()
          const mesNom = meses[mesIdx]
          acc[mesNom] = (acc[mesNom] || 0) + Number(v.monto)
          return acc
        }, {})

        const chartData = meses.map(m => ({ name: m, total: revenueData[m] || 0 }))

        // 2. Procesamiento para Top Deudores
        const deudoresData = (clientes.data || [])
          .filter((c: any) => c.saldo > 0)
          .sort((a: any, b: any) => b.saldo - a.saldo)
          .slice(0, 5)

        setData({
          stats: {
            activos: viajes.data?.filter(v => v.estado === 'En Viaje').length || 0,
            clientes: clientes.data?.length || 0,
            saldoTotal: clientes.data?.reduce((acc, c) => acc + (Number(c.saldo) || 0), 0) || 0,
            pendientes: viajes.data?.filter(v => v.estado === 'Pendiente').length || 0
          },
          charts: chartData,
          deudores: deudoresData
        })
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    fetchAllData()
  }, [mounted, supabase])

  if (!mounted || loading) return (
    <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-cyan-500 w-10 h-10 mb-4" />
      <p className="text-slate-500 font-black tracking-widest animate-pulse uppercase italic text-[10px]">Sincronizando Analíticas...</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 p-6 lg:p-10 space-y-10 selection:bg-cyan-500/30">
      
      {/* HEADER TÁCTICO */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse shadow-[0_0_10px_#22d3ee]" />
            <span className="text-cyan-500 text-[10px] font-black tracking-[0.3em] uppercase italic">Operaciones de Ingeniería Live</span>
          </div>
          <h1 className="mt-10 text-5xl font-black italic tracking-tighter text-white uppercase leading-none">
            COMMAND <span className="text-cyan-500 font-light underline decoration-cyan-500/20 underline-offset-8">CENTER</span>
          </h1>
        </div>
      </header>

      {/* MÉTRICAS PRINCIPALES */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Unidades en Ruta', val: data.stats.activos, icon: Truck, color: 'text-cyan-400', bg: 'from-cyan-500/10' },
          { label: 'Cartera Clientes', val: data.stats.clientes, icon: Users, color: 'text-indigo-400', bg: 'from-indigo-500/10' },
          { label: 'Capital en Calle', val: `$${data.stats.saldoTotal.toLocaleString('es-AR')}`, icon: DollarSign, color: 'text-emerald-400', bg: 'from-emerald-500/10' },
          { label: 'Fletes Pendientes', val: data.stats.pendientes, icon: ClipboardList, color: 'text-rose-400', bg: 'from-rose-500/10' },
        ].map((s, i) => (
          <div key={i} className="bg-slate-900/40 border border-white/5 p-8 rounded-[2.5rem] backdrop-blur-xl relative overflow-hidden group">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${s.bg} to-transparent blur-3xl opacity-50`} />
            <div className={`p-4 w-fit rounded-2xl bg-slate-950 border border-white/10 ${s.color} mb-6 shadow-2xl`}>
              <s.icon size={26} strokeWidth={2.5} />
            </div>
            <p className="text-slate-500 text-[10px] font-black uppercase tracking-widest mb-1 italic">{s.label}</p>
            <p className="text-4xl font-black text-white italic tracking-tighter">{s.val}</p>
          </div>
        ))}
      </div>

      {/* ANALÍTICAS AVANZADAS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Gráfico de Tendencia de Facturación */}
        <div className="lg:col-span-2 bg-slate-900/20 border border-white/5 rounded-[3rem] p-10 backdrop-blur-md relative overflow-hidden">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-sm font-black uppercase tracking-[0.3em] flex items-center gap-3 italic">
              <TrendingUp size={18} className="text-cyan-500" /> Rendimiento Mensual
            </h2>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.charts}>
                <defs>
                  <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                <XAxis dataKey="name" stroke="#64748b" fontSize={10} fontWeight="bold" axisLine={false} tickLine={false} />
                <YAxis hide />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0f172a', borderRadius: '15px', border: '1px solid #ffffff10', fontSize: '12px' }}
                  itemStyle={{ color: '#0ea5e9', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="total" stroke="#0ea5e9" strokeWidth={4} fillOpacity={1} fill="url(#colorTotal)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Top Deudores (Bar Chart Vertical) */}
        <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8">
           <h2 className="text-xs font-black uppercase tracking-widest text-indigo-400 mb-8 flex items-center gap-2 italic text-center justify-center">
             <Activity size={16} /> Mayores Deudores
           </h2>
           <div className="space-y-6">
              {data.deudores?.map((c: any, i: number) => (
                <div key={i} className="space-y-2">
                  <div className="flex justify-between text-[10px] font-black uppercase tracking-tighter">
                    <span className="text-slate-400">{c.razon_social}</span>
                    <span className="text-white italic">${c.saldo.toLocaleString('es-AR')}</span>
                  </div>
                  <div className="h-1.5 w-full bg-slate-950 rounded-full overflow-hidden border border-white/5">
                    <div 
                      className="h-full bg-gradient-to-r from-cyan-600 to-indigo-600 rounded-full" 
                      style={{ width: `${(c.saldo / data.stats.saldoTotal) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
           </div>
           <button className="w-full mt-12 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] transition-all shadow-lg shadow-cyan-600/20 italic">
              Ver Reporte Contable Completo
           </button>
        </div>

      </div>
    </div>
  )
}