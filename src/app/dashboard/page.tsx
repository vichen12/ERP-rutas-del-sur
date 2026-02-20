'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { 
  TrendingUp, Wallet, Users, AlertTriangle, FileSpreadsheet, 
  X, BadgeDollarSign, Truck, FileText, ChevronRight, Loader2, 
  Calendar, DollarSign, PieChart as PieChartIcon, BarChart3,
  Gauge, Building2, ArrowUpRight, Navigation, Activity, Search
} from 'lucide-react'

import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar
} from 'recharts'

export default function MainDashboard() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>({ clientes: [], viajes: [], cc: [] })
  const [isDeudaModalOpen, setIsDeudaModalOpen] = useState(false)
  const [searchInModal, setSearchInModal] = useState('')
  
  const [dateStart, setDateStart] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
  })
  const [dateEnd, setDateEnd] = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => { fetchDashboardData() }, [])

  async function fetchDashboardData() {
    setLoading(true)
    try {
      const [cl, vj, cc] = await Promise.all([
        supabase.from('clientes').select('*').order('razon_social'),
        supabase.from('viajes').select('*'),
        supabase.from('cuenta_corriente').select('*')
      ])
      setData({ clientes: cl.data || [], viajes: vj.data || [], cc: cc.data || [] })
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }

  const stats = useMemo(() => {
    const { viajes, cc, clientes } = data;
    const filtrados = (viajes || []).filter((v: any) => v.fecha >= dateStart && v.fecha <= dateEnd);

    let bruta = 0, gasoil = 0, choferes = 0, descargas = 0, kmTotal = 0, ltsTotal = 0;
    
    filtrados.forEach((v: any) => {
      bruta += Number(v.tarifa_flete || 0);
      gasoil += (Number(v.lts_gasoil || 0) * Number(v.precio_gasoil || 0));
      choferes += Number(v.pago_chofer || 0);
      descargas += Number(v.costo_descarga || 0);
      kmTotal += Number(v.km_recorridos || 0);
      ltsTotal += Number(v.lts_gasoil || 0);
    });

    const neta = bruta - gasoil - choferes - descargas;
    const promedioGasoil = kmTotal > 0 ? ((ltsTotal / kmTotal) * 100).toFixed(1) : '0.0';
    const facturacionPromedio = filtrados.length > 0 ? (bruta / filtrados.length) : 0;

    const pieData = [
      { name: 'GASOIL', value: gasoil, color: '#f59e0b' },
      { name: 'CHOFERES', value: choferes, color: '#6366f1' },
      { name: 'MANTENIMIENTO', value: descargas, color: '#ec4899' },
      { name: 'UTILIDAD', value: neta > 0 ? neta : 0, color: '#10b981' }
    ];

    const totalCostos = pieData.reduce((acc, curr) => acc + curr.value, 0);

    const currentYear = new Date().getFullYear();
    const mesesAbv = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    const viajesPorMes = mesesAbv.map((mes, index) => {
      const cant = (viajes || []).filter((v:any) => {
        const d = new Date(v.fecha);
        return d.getFullYear() === currentYear && d.getMonth() === index;
      }).length;
      return { name: mes, cantidad: cant };
    });

    const saldos: Record<string, number> = {}
    ;(cc || []).forEach((m: any) => {
      if (!saldos[m.cliente_id]) saldos[m.cliente_id] = 0
      saldos[m.cliente_id] += (Number(m.debe || 0) - Number(m.haber || 0))
    })
    const listaSaldos = (clientes || []).map((c: any) => ({
      ...c,
      saldo: saldos[c.id] || 0
    })).sort((a: any, b: any) => b.saldo - a.saldo)

    // 🚀 FIX TYPESCRIPT: Agregamos tipos (c: any) y (acc: number) para Netlify
    const totalDeudaGlobal = listaSaldos
      .filter((c: any) => c.saldo > 0)
      .reduce((acc: number, c: any) => acc + c.saldo, 0)

    return { bruta, neta, pieData, totalCostos, viajesPorMes, totalDeudaGlobal, listaSaldos, totalViajes: filtrados.length, promedioGasoil, facturacionPromedio };
  }, [data, dateStart, dateEnd]);

  const setQuickFilter = (type: 'mes' | 'año') => {
    const d = new Date();
    if (type === 'mes') {
      setDateStart(new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]);
      setDateEnd(new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]);
    } else if (type === 'año') {
      setDateStart(new Date(d.getFullYear(), 0, 1).toISOString().split('T')[0]);
      setDateEnd(new Date(d.getFullYear(), 11, 31).toISOString().split('T')[0]);
    }
  };

  // 🚀 TOOLTIP CORREGIDO (DIV en lugar de P para evitar error de hidratación)
  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const entry = payload[0].payload;
      const pct = stats.totalCostos > 0 ? ((entry.value / stats.totalCostos) * 100).toFixed(1) : 0;
      return (
        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 p-4 rounded-3xl shadow-2xl min-w-[160px]">
          <div className="text-[10px] font-black uppercase text-slate-500 mb-2 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            {entry.name}
          </div>
          <div className="flex flex-col">
            <span className="text-xl font-black text-white tabular-nums">${entry.value.toLocaleString('es-AR')}</span>
            <span className="text-[10px] font-bold text-sky-400 uppercase">{pct}% del total</span>
          </div>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 p-4 rounded-3xl shadow-2xl">
          <div className="text-[10px] font-black text-slate-500 uppercase mb-1">{payload[0].payload.name}</div>
          <div className="text-xl font-black text-white">{payload[0].value} <span className="text-xs text-indigo-400 uppercase">Viajes</span></div>
        </div>
      );
    }
    return null;
  };

  if (loading) return <div className="h-screen bg-[#020617] flex items-center justify-center font-sans italic text-sky-500 uppercase tracking-[0.5em] animate-pulse text-[10px]">Cargando Dashboard...</div>

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-20 pt-28 px-4 lg:px-12 font-sans italic selection:bg-sky-500/30 overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none bg-[radial-gradient(circle_at_50%_-20%,#0f172a,transparent)] opacity-80" />

      <div className="max-w-[1600px] mx-auto space-y-8 relative z-10">
        
        {/* BARRA SUPERIOR */}
        <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-6 border-b border-white/5 pb-8">
          <div>
            <p className="text-[10px] font-black text-sky-500 uppercase tracking-[0.4em] mb-2 flex items-center gap-2"><Activity size={12} /> Operacional v3.1</p>
            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white uppercase leading-none">
              CONTROL <span className="text-slate-500 font-thin">/</span> DASHBOARD
            </h1>
          </div>
          
          <div className="flex flex-wrap items-center gap-3 bg-slate-900/50 p-2 rounded-3xl border border-white/5 backdrop-blur-xl">
            <button onClick={() => setQuickFilter('mes')} className="px-5 py-2.5 text-[9px] font-black uppercase text-slate-500 hover:text-white transition-all hover:bg-white/5 rounded-2xl">Este Mes</button>
            <button onClick={() => setQuickFilter('año')} className="px-5 py-2.5 text-[9px] font-black uppercase text-slate-500 hover:text-white transition-all hover:bg-white/5 rounded-2xl">Este Año</button>
            <div className="w-[1px] h-4 bg-white/10 mx-1" />
            <div className="flex items-center gap-2 px-2">
               <Calendar size={14} className="text-sky-500" />
               <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="bg-transparent text-[10px] font-black uppercase outline-none [color-scheme:dark]" />
               <span className="text-slate-700 text-xs">→</span>
               <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="bg-transparent text-[10px] font-black uppercase outline-none [color-scheme:dark]" />
            </div>
          </div>
        </div>

        {/* KPIs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <MetricCard label="Eficiencia Gasoil" value={`${stats.promedioGasoil}`} sub="LTS/100KM" icon={<Gauge size={20}/>} color="text-amber-500" />
          <MetricCard label="Ticket Promedio" value={`$${Math.round(stats.facturacionPromedio).toLocaleString()}`} sub="POR VIAJE" icon={<TrendingUp size={20}/>} color="text-sky-400" />
          <MetricCard label="Volumen Carga" value={stats.totalViajes} sub="VIAJES TOTALES" icon={<Navigation size={20}/>} color="text-indigo-400" />
          <MetricCard label="Utilidad Neta" value={`$${stats.neta.toLocaleString()}`} sub="ARS PERÍODO" icon={<BadgeDollarSign size={20}/>} color="text-emerald-400" />
        </div>

        {/* SECCION CENTRAL */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* DISTRIBUCIÓN COSTOS */}
          <div className="lg:col-span-4 bg-slate-900/20 border border-white/5 rounded-[3rem] p-8 backdrop-blur-md flex flex-col items-center">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] self-start text-slate-500 mb-8 flex items-center gap-2"><PieChartIcon size={14} /> Distribución de Costos</h3>
            <div className="relative w-full aspect-square max-h-[250px]">
               <ResponsiveContainer width="100%" height="100%">
                 <PieChart>
                   <Pie data={stats.pieData} innerRadius={70} outerRadius={100} paddingAngle={8} dataKey="value" stroke="none">
                     {stats.pieData.map((entry:any, index:number) => (
                       <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                   </Pie>
                   <Tooltip content={<CustomPieTooltip />} cursor={false} />
                 </PieChart>
               </ResponsiveContainer>
               <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Total</p>
                  <p className="text-lg font-black text-white italic tracking-tighter">${stats.totalCostos.toLocaleString()}</p>
               </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mt-8 w-full">
              {stats.pieData.map((item:any) => (
                <div key={item.name} className="p-2.5 bg-white/[0.02] border border-white/5 rounded-2xl">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-[8px] font-black text-slate-500 uppercase">{item.name}</span>
                  </div>
                  <p className="text-[10px] font-black text-white tabular-nums">${item.value.toLocaleString()}</p>
                </div>
              ))}
            </div>
          </div>

          {/* FLUJO VIAJES (RESTAURADO) */}
          <div className="lg:col-span-5 bg-slate-900/20 border border-white/5 rounded-[3rem] p-8 backdrop-blur-md flex flex-col">
            <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 mb-8 flex items-center gap-2"><BarChart3 size={14} /> Flujo Mensual {new Date().getFullYear()}</h3>
            <div className="flex-1 min-h-[300px]">
               <ResponsiveContainer width="100%" height="100%">
                 <BarChart data={stats.viajesPorMes}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#ffffff05" vertical={false} />
                    <XAxis dataKey="name" stroke="#475569" fontSize={9} axisLine={false} tickLine={false} />
                    <Tooltip content={<CustomBarTooltip />} cursor={{fill: '#ffffff05'}} />
                    <Bar dataKey="cantidad" fill="#6366f1" radius={[4, 4, 0, 0]} barSize={25} />
                 </BarChart>
               </ResponsiveContainer>
            </div>
          </div>

          {/* CARD DE DEUDA (ELEGANTE) */}
          <div className="lg:col-span-3">
            <button 
              onClick={() => setIsDeudaModalOpen(true)}
              className="w-full h-full bg-[#020617] border border-white/10 hover:border-sky-500/50 p-8 rounded-[3rem] flex flex-col justify-between transition-all group relative overflow-hidden text-left"
            >
              <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:scale-110 transition-transform duration-700"><FileSpreadsheet size={150} /></div>
              <div className="relative z-10">
                <div className="p-3 bg-white/5 rounded-2xl w-fit mb-6 text-slate-400 group-hover:text-sky-500 transition-all"><Users size={24} /></div>
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Cuentas Corrientes</p>
                <h2 className="text-4xl font-black text-white italic tabular-nums leading-tight tracking-tighter">${stats.totalDeudaGlobal.toLocaleString('es-AR')}</h2>
                <div className="flex items-center gap-2 mt-6">
                   <div className="px-3 py-1.5 bg-sky-500/10 rounded-full border border-sky-500/20 text-[8px] font-black text-sky-500 uppercase tracking-widest">Ver Planilla</div>
                   <ArrowUpRight size={14} className="text-slate-700 group-hover:text-sky-500 transition-all" />
                </div>
              </div>
            </button>
          </div>
        </div>

        {/* ACCESOS DIRECTOS */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 pt-4">
            <ShortcutLink href="/viajes" icon={<Truck size={22}/>} label="Viajes" color="sky" />
            <ShortcutLink href="/clientes" icon={<Users size={22}/>} label="Clientes" color="emerald" />
            <ShortcutLink href="/remitos" icon={<FileText size={22}/>} label="Remitos" color="amber" />
        </div>
      </div>

      {/* MODAL PLANILLA EXCEL */}
      {isDeudaModalOpen && (
        <div className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 sm:p-10 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-[#020617] border border-white/10 w-full max-w-7xl rounded-[4rem] shadow-2xl relative flex flex-col md:flex-row h-[85vh] overflow-hidden">
            <div className="flex-1 flex flex-col min-w-0 border-r border-white/5">
              <div className="p-10 border-b border-white/5 bg-black/20 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
                 <div>
                   <h2 className="text-4xl font-black italic uppercase text-white tracking-tighter">Planilla de Saldos</h2>
                   <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2 flex items-center gap-2"><Building2 size={12}/> Auditoría Global</p>
                 </div>
                 <div className="relative w-full lg:w-72 group">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-sky-500 transition-colors" size={14} />
                    <input type="text" placeholder="BUSCAR CLIENTE..." className="w-full bg-slate-900 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-[9px] font-black uppercase outline-none focus:border-sky-500/50" value={searchInModal} onChange={e => setSearchInModal(e.target.value)} />
                 </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar p-8">
                <div className="bg-slate-900/30 rounded-[3rem] border border-white/5 overflow-hidden">
                  <div className="grid grid-cols-2 bg-black/40 p-6 px-12 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
                    <span>Cliente</span>
                    <span className="text-right">Saldo Exigible</span>
                  </div>
                  <div className="divide-y divide-white/5">
                    {stats.listaSaldos.filter((c:any) => c.razon_social.toLowerCase().includes(searchInModal.toLowerCase())).map((c: any, i: number) => (
                      <div key={c.id} className="grid grid-cols-2 p-6 px-12 items-center hover:bg-white/[0.03] transition-colors group">
                        <div className="flex items-center gap-4 text-xs font-black text-slate-200 uppercase group-hover:text-sky-400 transition-colors">
                          <span className="text-[10px] text-slate-700">#{i+1}</span>
                          {c.razon_social}
                        </div>
                        <div className="text-right">
                          <span className={`text-base font-black italic tabular-nums ${c.saldo > 0 ? 'text-rose-500' : c.saldo < 0 ? 'text-emerald-400' : 'text-slate-600'}`}>
                            ${Math.abs(c.saldo).toLocaleString('es-AR')}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="w-full md:w-[400px] bg-slate-950 p-12 flex flex-col justify-between shrink-0 relative overflow-hidden">
               <div className="absolute top-0 right-0 p-4 opacity-5"><BadgeDollarSign size={300} className="text-emerald-500" /></div>
               <button onClick={() => setIsDeudaModalOpen(false)} className="absolute top-10 right-10 p-4 bg-white/5 hover:bg-rose-600 rounded-full text-white transition-all z-20 shadow-xl group"><X size={20} className="group-hover:rotate-90 transition-transform" /></button>
               <div className="relative z-10 space-y-10">
                  <h3 className="text-7xl font-black text-white italic tracking-tighter leading-none">TOTAL<br/>DEUDA</h3>
                  <div className="bg-emerald-500/10 border border-emerald-500/30 p-10 rounded-[3rem] shadow-[0_0_50px_rgba(16,185,129,0.1)]">
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Cartera Exigible</p>
                    <p className="text-5xl font-black text-emerald-400 tabular-nums tracking-tighter leading-none">${stats.totalDeudaGlobal.toLocaleString('es-AR')}</p>
                  </div>
               </div>
               <div className="relative z-10 pt-10 border-t border-white/10 opacity-40 italic"><p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.4em]">Rutas del Sur ERP v3.1</p></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function MetricCard({ label, value, sub, icon, color }: any) {
  return (
    <div className="bg-slate-900/40 border border-white/5 p-6 rounded-[2.5rem] flex items-center gap-5 group hover:bg-slate-900/60 transition-all h-full shadow-lg">
       <div className={`p-4 bg-white/5 rounded-2xl ${color} border border-white/5 shadow-inner group-hover:scale-110 transition-transform`}>{icon}</div>
       <div>
          <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest mb-0.5">{label}</p>
          <div className="flex items-baseline gap-2">
             <p className="text-2xl font-black text-white tabular-nums tracking-tight">{value}</p>
             <span className="text-[8px] font-black text-slate-500 uppercase whitespace-nowrap">{sub}</span>
          </div>
       </div>
    </div>
  )
}

function ShortcutLink({ href, icon, label, color }: any) {
  const colors:any = { sky: 'text-sky-500 hover:border-sky-500/40', emerald: 'text-emerald-500 hover:border-emerald-500/40', amber: 'text-amber-500 hover:border-amber-500/40' }
  return (
    <Link href={href} className={`bg-[#020617] border border-white/5 p-6 rounded-[2.5rem] flex flex-col items-center justify-center gap-4 transition-all hover:scale-105 shadow-xl group ${colors[color]}`}>
       <div className="p-3 bg-white/5 rounded-xl group-hover:scale-110 transition-transform">{icon}</div>
       <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 group-hover:text-white transition-colors">{label}</span>
    </Link>
  )
}