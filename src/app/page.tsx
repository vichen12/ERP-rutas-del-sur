'use client'
import { useState, useEffect } from 'react'
import { Truck, Users, DollarSign, ClipboardList, Loader2 } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

export default function Dashboard() {
  const [loading, setLoading] = useState(true)
  const [time, setTime] = useState(new Date())
  const [data, setData] = useState({ activos: 0, clientes: 0, saldo: 0, remitos: 0 })
  const supabase = getSupabase()

  // 1. Reloj en tiempo real (Formato Argentina)
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(timer)
  }, [])

  // 2. Fetch de datos reales desde Supabase
  useEffect(() => {
    async function fetchStats() {
      try {
        const [viajes, clientes, pagos] = await Promise.all([
          supabase.from('viajes').select('monto, estado'),
          supabase.from('clientes').select('id', { count: 'exact' }),
          supabase.from('pagos').select('monto')
        ])

        // Lógica de cálculo (Saldo = Σ Debe - Σ Haber)
        const totalDebe = viajes.data?.reduce((acc, v) => acc + (v.monto || 0), 0) || 0
        const totalHaber = pagos.data?.reduce((acc, p) => acc + (p.monto || 0), 0) || 0
        const viajesActivos = viajes.data?.filter(v => v.estado === 'En Viaje').length || 0

        setData({
          activos: viajesActivos,
          clientes: clientes.count || 0,
          saldo: totalDebe - totalHaber,
          remitos: viajes.data?.filter(v => v.estado === 'Pendiente').length || 0
        })
      } catch (err) {
        console.error("Error en Dashboard:", err)
      } finally {
        setLoading(false)
      }
    }
    fetchStats()
  }, [])

  const stats = [
    { label: 'Viajes Activos', value: data.activos, icon: Truck, color: 'text-sky-500', bg: 'bg-sky-500/10' },
    { label: 'Clientes Totales', value: data.clientes, icon: Users, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { label: 'Saldo a Cobrar', value: `$${data.saldo.toLocaleString('es-AR')}`, icon: DollarSign, color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { label: 'Remitos Pendientes', value: data.remitos, icon: ClipboardList, color: 'text-rose-500', bg: 'bg-rose-500/10' },
  ]

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-[#020617]"><Loader2 className="animate-spin text-sky-500 w-10 h-10" /></div>

  return (
    <div className="p-8 space-y-8 max-w-7xl mx-auto font-[family-name:var(--font-geist-sans)]">
      <header className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-black text-white italic tracking-tighter">DASHBOARD</h1>
          <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.2em]">Rutas del Sur ERP</p>
        </div>
        <div className="text-right">
          <p className="text-slate-500 text-xs font-bold uppercase">
            {time.toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
          <p className="text-sky-500 font-black text-2xl tabular-nums">
            {time.toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <div key={i} className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl backdrop-blur-xl transition-all hover:bg-slate-900/60">
            <div className={`p-3 w-fit rounded-2xl ${stat.bg} ${stat.color} mb-4`}>
              <stat.icon size={24} />
            </div>
            <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest">{stat.label}</p>
            <p className="text-3xl font-black text-white mt-1">{stat.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}