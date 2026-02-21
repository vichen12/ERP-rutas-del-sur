'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import { 
  TrendingUp, Users, FileSpreadsheet, 
  X, BadgeDollarSign, Truck, FileText,
  Loader2, Calendar, PieChart as PieChartIcon, BarChart3,
  Gauge, Building2, ArrowUpRight, Activity, Search,
  Zap, Target, DollarSign, Fuel
} from 'lucide-react'

import { 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, AreaChart, Area
} from 'recharts'

export default function MainDashboard() {
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any>({ clientes: [], viajes: [], cc: [] })
  const [isDeudaModalOpen, setIsDeudaModalOpen] = useState(false)
  const [searchInModal, setSearchInModal] = useState('')
  const [activeKpi, setActiveKpi] = useState(0)
  
  const [dateStart, setDateStart] = useState(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
  })
  const [dateEnd, setDateEnd] = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => { fetchDashboardData() }, [])

  // Rotar KPI destacado
  useEffect(() => {
    const t = setInterval(() => setActiveKpi(p => (p + 1) % 4), 4000)
    return () => clearInterval(t)
  }, [])

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

    let bruta = 0, gasoil = 0, choferes = 0, descargas = 0, kmTotal = 0, ltsTotal = 0, desgasteTotal = 0;
    
    filtrados.forEach((v: any) => {
      bruta     += Number(v.tarifa_flete || 0);
      gasoil    += (Number(v.lts_gasoil || 0) * Number(v.precio_gasoil || 0));
      choferes  += Number(v.pago_chofer || 0);
      descargas += Number(v.costo_descarga || 0);
      kmTotal   += Number(v.km_recorridos || 0);
      ltsTotal  += Number(v.lts_gasoil || 0);
      desgasteTotal += (Number(v.km_recorridos || 0) * Number(v.desgaste_por_km || 0));
    });

    const costoTotal = gasoil + choferes + descargas + desgasteTotal;
    const neta = bruta - costoTotal;
    const margen = bruta > 0 ? ((neta / bruta) * 100) : 0;
    const promedioGasoil = kmTotal > 0 ? ((ltsTotal / kmTotal) * 100).toFixed(1) : '0.0';
    const facturacionPromedio = filtrados.length > 0 ? Math.round(bruta / filtrados.length) : 0;
    const utilidadPorKm = kmTotal > 0 ? (neta / kmTotal).toFixed(2) : '0';

    const pieData = [
      { name: 'GASOIL',      value: Math.round(gasoil),        color: '#f59e0b', pct: bruta > 0 ? ((gasoil / bruta) * 100).toFixed(1) : 0 },
      { name: 'CHOFERES',    value: Math.round(choferes),      color: '#818cf8', pct: bruta > 0 ? ((choferes / bruta) * 100).toFixed(1) : 0 },
      { name: 'OPERATIVO',   value: Math.round(descargas),     color: '#f472b6', pct: bruta > 0 ? ((descargas / bruta) * 100).toFixed(1) : 0 },
      { name: 'DESGASTE',    value: Math.round(desgasteTotal), color: '#38bdf8', pct: bruta > 0 ? ((desgasteTotal / bruta) * 100).toFixed(1) : 0 },
      { name: 'UTILIDAD',    value: neta > 0 ? Math.round(neta) : 0, color: '#34d399', pct: margen > 0 ? margen.toFixed(1) : 0 },
    ];

    const totalCostos = pieData.reduce((acc, curr) => acc + curr.value, 0);

    const currentYear = new Date().getFullYear();
    const mesesAbv = ['E','F','M','A','M','J','J','A','S','O','N','D'];
    const viajesPorMes = mesesAbv.map((mes, index) => {
      const vMes = (viajes || []).filter((v:any) => {
        const d = new Date(v.fecha);
        return d.getFullYear() === currentYear && d.getMonth() === index;
      });
      const facMes = vMes.reduce((acc:number, v:any) => acc + Number(v.tarifa_flete || 0), 0);
      return { name: mes, cantidad: vMes.length, facturacion: Math.round(facMes / 1000) };
    });

    const saldos: Record<string, number> = {}
    ;(cc || []).forEach((m: any) => {
      if (!saldos[m.cliente_id]) saldos[m.cliente_id] = 0
      saldos[m.cliente_id] += (Number(m.debe || 0) - Number(m.haber || 0))
    })
    const listaSaldos = (clientes || []).map((c: any) => ({
      ...c, saldo: saldos[c.id] || 0
    })).sort((a: any, b: any) => b.saldo - a.saldo)

    const totalDeudaGlobal = listaSaldos
      .filter((c: any) => c.saldo > 0)
      .reduce((acc: number, c: any) => acc + c.saldo, 0)

    return { 
      bruta, neta, margen, costoTotal, pieData, totalCostos, 
      viajesPorMes, totalDeudaGlobal, listaSaldos, 
      totalViajes: filtrados.length, 
      kmTotal, ltsTotal,
      promedioGasoil, facturacionPromedio, utilidadPorKm 
    };
  }, [data, dateStart, dateEnd]);

  const setQuickFilter = (type: 'mes' | 'año') => {
    const d = new Date();
    if (type === 'mes') {
      setDateStart(new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]);
      setDateEnd(new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]);
    } else {
      setDateStart(new Date(d.getFullYear(), 0, 1).toISOString().split('T')[0]);
      setDateEnd(new Date(d.getFullYear(), 11, 31).toISOString().split('T')[0]);
    }
  };

  const kpis = [
    { label: 'Facturación Bruta',   value: `$${Math.round(stats.bruta).toLocaleString('es-AR')}`,        sub: 'ARS PERÍODO',       icon: <DollarSign size={18}/>,   color: '#34d399', bg: 'from-emerald-500/10 to-emerald-500/5',   border: 'border-emerald-500/30' },
    { label: 'Utilidad Neta',        value: `$${Math.round(stats.neta).toLocaleString('es-AR')}`,          sub: `${Math.round(stats.margen)}% MARGEN`,  icon: <TrendingUp size={18}/>,   color: '#818cf8', bg: 'from-indigo-500/10 to-indigo-500/5',    border: 'border-indigo-500/30'  },
    { label: 'Km Recorridos',        value: `${stats.kmTotal.toLocaleString('es-AR')}`,                    sub: 'KM TOTALES',        icon: <Gauge size={18}/>,        color: '#38bdf8', bg: 'from-sky-500/10 to-sky-500/5',          border: 'border-sky-500/30'     },
    { label: 'Eficiencia Gasoil',    value: `${stats.promedioGasoil}`,                                     sub: 'LTS/100 KM',        icon: <Fuel size={18}/>,         color: '#f59e0b', bg: 'from-amber-500/10 to-amber-500/5',      border: 'border-amber-500/30'   },
  ];

  const CustomPieTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const e = payload[0].payload;
      return (
        <div className="bg-[#020617]/95 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: e.color }} />
            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{e.name}</span>
          </div>
          <p className="text-lg font-black text-white tabular-nums">${e.value.toLocaleString()}</p>
          <p className="text-[9px] font-bold text-slate-500 uppercase">{e.pct}% del total</p>
        </div>
      );
    }
    return null;
  };

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-[#020617]/95 border border-white/10 p-4 rounded-2xl shadow-2xl backdrop-blur-xl">
          <p className="text-[9px] font-black text-slate-500 uppercase mb-1">{payload[0].payload.name}</p>
          <p className="text-base font-black text-white">{payload[0].value} <span className="text-[9px] text-indigo-400">viajes</span></p>
          {payload[0].payload.facturacion > 0 && (
            <p className="text-[9px] font-bold text-emerald-400">${payload[0].payload.facturacion}K fact.</p>
          )}
        </div>
      );
    }
    return null;
  };

  if (loading) return (
    <div className="h-screen bg-[#020617] flex flex-col items-center justify-center gap-4">
      <div className="relative">
        <div className="w-16 h-16 border-2 border-white/5 rounded-full" />
        <div className="absolute inset-0 w-16 h-16 border-t-2 border-emerald-500 rounded-full animate-spin" />
      </div>
      <p className="text-[9px] font-black uppercase tracking-[0.6em] text-slate-600 animate-pulse">Cargando inteligencia operacional</p>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-24 pt-28 px-4 lg:px-10 font-sans italic selection:bg-emerald-500/20 overflow-x-hidden">
      
      {/* Fondo atmosférico */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-emerald-500/3 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[300px] bg-indigo-500/3 blur-[100px] rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:32px_32px]" />
      </div>

      <div className="max-w-[1600px] mx-auto space-y-8 relative z-10">
        
        {/* ═══ HEADER ═══ */}
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
          <div>
            <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[8px] font-black uppercase tracking-[0.4em] text-emerald-400">Sistema Activo · Tiempo Real</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tighter leading-none">
              <span className="text-white">PANEL</span>
              <span className="text-slate-700 font-thin mx-3">/</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">OPERACIONES</span>
            </h1>
            <p className="text-[10px] font-bold text-slate-600 uppercase tracking-[0.3em] mt-2">
              Rutas del Sur · ERP v3.1
            </p>
          </div>
          
          {/* Filtro de fechas */}
          <div className="flex flex-wrap items-center gap-2 bg-black/40 p-2 rounded-2xl border border-white/5 backdrop-blur-xl">
            <button onClick={() => setQuickFilter('mes')} className="px-4 py-2 text-[9px] font-black uppercase text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all tracking-widest">Mes</button>
            <button onClick={() => setQuickFilter('año')} className="px-4 py-2 text-[9px] font-black uppercase text-slate-500 hover:text-white hover:bg-white/5 rounded-xl transition-all tracking-widest">Año</button>
            <div className="w-px h-5 bg-white/10" />
            <div className="flex items-center gap-2 px-3">
              <Calendar size={12} className="text-slate-600" />
              <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="bg-transparent text-[9px] font-black uppercase outline-none [color-scheme:dark] text-slate-400" />
              <span className="text-slate-700">—</span>
              <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="bg-transparent text-[9px] font-black uppercase outline-none [color-scheme:dark] text-slate-400" />
            </div>
          </div>
        </div>

        {/* ═══ KPIs PRINCIPALES ═══ */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, i) => (
            <button 
              key={i} 
              onClick={() => setActiveKpi(i)}
              className={`relative text-left p-6 rounded-[2rem] border transition-all duration-500 overflow-hidden group ${
                activeKpi === i 
                  ? `bg-gradient-to-br ${kpi.bg} ${kpi.border}` 
                  : 'bg-black/20 border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${kpi.color}15`, color: kpi.color }}>
                  {kpi.icon}
                </div>
                {activeKpi === i && (
                  <div className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ backgroundColor: kpi.color }} />
                )}
              </div>
              <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-1">{kpi.label}</p>
              <p className="text-xl sm:text-2xl font-black tabular-nums" style={{ color: activeKpi === i ? kpi.color : '#e2e8f0' }}>
                {kpi.value}
              </p>
              <p className="text-[8px] font-bold uppercase tracking-widest text-slate-600 mt-1">{kpi.sub}</p>
            </button>
          ))}
        </div>

        {/* ═══ MÉTRICAS SECUNDARIAS (STRIP) ═══ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: 'Ticket Promedio',  value: `$${stats.facturacionPromedio.toLocaleString()}`, color: 'text-white' },
            { label: 'Utilidad / KM',    value: `$${stats.utilidadPorKm}`,                        color: 'text-sky-400' },
            { label: 'Total Litros',     value: `${stats.ltsTotal.toLocaleString()} lts`,          color: 'text-amber-400' },
            { label: 'Viajes Período',   value: stats.totalViajes,                                 color: 'text-indigo-400' },
          ].map((m, i) => (
            <div key={i} className="bg-black/30 border border-white/5 rounded-2xl px-5 py-4 flex items-center justify-between gap-4">
              <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">{m.label}</span>
              <span className={`text-sm font-black tabular-nums ${m.color}`}>{m.value}</span>
            </div>
          ))}
        </div>

        {/* ═══ SECCIÓN CENTRAL ═══ */}
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          
          {/* PIE CHART — Distribución */}
          <div className="xl:col-span-4 bg-black/30 border border-white/5 rounded-[2.5rem] p-8 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2">
                <PieChartIcon size={12} className="text-emerald-500" /> Distribución
              </h3>
              <span className="text-[8px] font-bold text-slate-600 uppercase">Del bruto</span>
            </div>

            <div className="relative w-full aspect-square max-h-[220px] mx-auto">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={stats.pieData} innerRadius={65} outerRadius={95} paddingAngle={4} dataKey="value" stroke="none">
                    {stats.pieData.map((entry: any, index: number) => (
                      <Cell key={index} fill={entry.color} opacity={0.9} />
                    ))}
                  </Pie>
                  <Tooltip content={<CustomPieTooltip />} cursor={false} />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Bruto</p>
                <p className="text-base font-black text-white tabular-nums">${Math.round(stats.bruta / 1000)}K</p>
                <p className="text-[8px] font-black text-emerald-400">{Math.round(stats.margen)}% neto</p>
              </div>
            </div>

            <div className="space-y-2 mt-6">
              {stats.pieData.map((item: any) => (
                <div key={item.name} className="flex items-center justify-between group">
                  <div className="flex items-center gap-2.5">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                    <span className="text-[9px] font-black text-slate-500 uppercase tracking-wider">{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Mini barra */}
                    <div className="w-16 h-1 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" 
                        style={{ width: `${item.pct}%`, backgroundColor: item.color }} />
                    </div>
                    <span className="text-[9px] font-black tabular-nums text-white w-12 text-right">${(item.value / 1000).toFixed(1)}K</span>
                    <span className="text-[8px] text-slate-600 w-8 text-right">{item.pct}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* BAR CHART — Actividad mensual */}
          <div className="xl:col-span-5 bg-black/30 border border-white/5 rounded-[2.5rem] p-8 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500 flex items-center gap-2">
                <BarChart3 size={12} className="text-indigo-400" /> Actividad {new Date().getFullYear()}
              </h3>
              <span className="text-[8px] font-bold text-slate-600 uppercase">Viajes / mes</span>
            </div>
            <div className="flex-1 min-h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.viajesPorMes} barSize={18}>
                  <CartesianGrid strokeDasharray="2 6" stroke="#ffffff04" vertical={false} />
                  <XAxis dataKey="name" stroke="#334155" fontSize={9} axisLine={false} tickLine={false} fontWeight="900" />
                  <YAxis stroke="#334155" fontSize={8} axisLine={false} tickLine={false} fontWeight="900" />
                  <Tooltip content={<CustomBarTooltip />} cursor={{ fill: '#ffffff04' }} />
                  <Bar dataKey="cantidad" radius={[6, 6, 2, 2]}>
                    {stats.viajesPorMes.map((entry: any, index: number) => {
                      const max = Math.max(...stats.viajesPorMes.map((v:any) => v.cantidad));
                      const intensity = max > 0 ? entry.cantidad / max : 0;
                      return <Cell key={index} fill={`rgba(99,102,241,${0.3 + intensity * 0.7})`} />;
                    })}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CARD DEUDA */}
          <div className="xl:col-span-3 flex flex-col gap-4">
            
            {/* Botón Cuentas Corrientes */}
            <button 
              onClick={() => setIsDeudaModalOpen(true)}
              className="flex-1 bg-black/30 border border-white/5 hover:border-indigo-500/30 p-8 rounded-[2.5rem] flex flex-col justify-between transition-all group relative overflow-hidden text-left"
            >
              <div className="absolute -right-6 -bottom-6 opacity-[0.03] group-hover:opacity-[0.06] group-hover:scale-110 transition-all duration-700">
                <FileSpreadsheet size={160} />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-5">
                  <div className="p-2 bg-indigo-500/10 rounded-xl text-indigo-400 group-hover:scale-110 transition-transform">
                    <Users size={18} />
                  </div>
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Cuentas Corrientes</span>
                </div>
                <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest mb-1">Cartera Exigible</p>
                <p className="text-3xl font-black text-white italic tabular-nums tracking-tighter leading-none">
                  ${Math.round(stats.totalDeudaGlobal).toLocaleString('es-AR')}
                </p>
                <div className="flex items-center gap-2 mt-5">
                  <span className="text-[8px] font-black uppercase tracking-widest text-indigo-400 border border-indigo-500/20 px-3 py-1 rounded-full bg-indigo-500/10">Ver planilla</span>
                  <ArrowUpRight size={12} className="text-slate-700 group-hover:text-indigo-400 transition-colors" />
                </div>
              </div>
            </button>

            {/* Accesos directos compactos */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { href: '/viajes',   icon: <Truck size={16}/>,    label: 'Viajes',   color: 'hover:border-sky-500/30 hover:text-sky-400' },
                { href: '/clientes', icon: <Users size={16}/>,    label: 'Clientes', color: 'hover:border-emerald-500/30 hover:text-emerald-400' },
                { href: '/remitos',  icon: <FileText size={16}/>, label: 'Remitos',  color: 'hover:border-amber-500/30 hover:text-amber-400' },
              ].map(s => (
                <Link key={s.href} href={s.href} className={`bg-black/30 border border-white/5 rounded-2xl p-4 flex flex-col items-center gap-2 transition-all group text-slate-500 ${s.color}`}>
                  <div className="transition-transform group-hover:scale-110">{s.icon}</div>
                  <span className="text-[7px] font-black uppercase tracking-widest">{s.label}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>

      </div>

      {/* ═══ MODAL PLANILLA ═══ */}
      {isDeudaModalOpen && (
        <div className="fixed inset-0 z-[999] bg-black/95 backdrop-blur-2xl flex items-center justify-center p-4 sm:p-8 animate-in fade-in zoom-in-95 duration-300">
          <div className="bg-[#020617] border border-white/10 w-full max-w-5xl rounded-[3rem] shadow-2xl relative flex flex-col lg:flex-row h-[88vh] overflow-hidden">
            
            {/* Lista */}
            <div className="flex-1 flex flex-col min-w-0">
              <div className="p-8 lg:p-10 border-b border-white/5 bg-black/30 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.4em] text-indigo-400 mb-1 flex items-center gap-1.5">
                    <Building2 size={10}/> Auditoría Global
                  </p>
                  <h2 className="text-3xl font-black italic uppercase text-white tracking-tighter">Planilla de Saldos</h2>
                </div>
                <div className="relative w-full lg:w-64">
                  <Search size={12} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                  <input 
                    type="text" placeholder="Buscar cliente..." 
                    className="w-full bg-white/5 border border-white/5 rounded-xl py-3 pl-10 pr-4 text-[10px] font-black uppercase outline-none focus:border-indigo-500/50 placeholder:text-slate-700" 
                    value={searchInModal} onChange={e => setSearchInModal(e.target.value)} 
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {/* Header tabla */}
                <div className="grid grid-cols-3 bg-white/[0.02] px-8 py-4 text-[8px] font-black text-slate-600 uppercase tracking-widest border-b border-white/5 sticky top-0">
                  <span>#</span>
                  <span>Cliente</span>
                  <span className="text-right">Saldo</span>
                </div>
                <div className="divide-y divide-white/[0.04]">
                  {stats.listaSaldos
                    .filter((c:any) => c.razon_social.toLowerCase().includes(searchInModal.toLowerCase()))
                    .map((c: any, i: number) => (
                      <div key={c.id} className="grid grid-cols-3 px-8 py-5 items-center hover:bg-white/[0.02] transition-colors group">
                        <span className="text-[9px] font-black text-slate-700">#{String(i+1).padStart(2,'0')}</span>
                        <span className="text-[10px] font-black text-slate-300 uppercase group-hover:text-white transition-colors truncate pr-4">
                          {c.razon_social}
                        </span>
                        <div className="text-right">
                          <span className={`text-sm font-black italic tabular-nums ${
                            c.saldo > 0 ? 'text-rose-400' : c.saldo < 0 ? 'text-emerald-400' : 'text-slate-700'
                          }`}>
                            {c.saldo === 0 ? '—' : `$${Math.abs(c.saldo).toLocaleString('es-AR')}`}
                          </span>
                          {c.saldo !== 0 && (
                            <p className="text-[7px] font-bold uppercase text-slate-600 mt-0.5">
                              {c.saldo > 0 ? 'DEBE' : 'A FAVOR'}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            {/* Panel lateral derecho */}
            <div className="w-full lg:w-72 bg-black/60 border-t lg:border-t-0 lg:border-l border-white/5 p-8 flex flex-col justify-between shrink-0">
              <button 
                onClick={() => setIsDeudaModalOpen(false)} 
                className="absolute top-6 right-6 p-3 bg-white/5 hover:bg-rose-500/20 hover:border-rose-500/30 border border-white/5 rounded-xl text-slate-400 hover:text-white transition-all"
              >
                <X size={16} />
              </button>
              
              <div className="space-y-6 mt-8">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-[0.4em] text-slate-600 mb-3">Resumen Cartera</p>
                  <div className="bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-2xl">
                    <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Exigible</p>
                    <p className="text-3xl font-black text-indigo-300 tabular-nums tracking-tighter leading-none">
                      ${Math.round(stats.totalDeudaGlobal).toLocaleString('es-AR')}
                    </p>
                  </div>
                </div>
                <div className="space-y-2">
                  {[
                    { label: 'Clientes con deuda', value: stats.listaSaldos.filter((c:any) => c.saldo > 0).length, color: 'text-rose-400' },
                    { label: 'Al día / a favor',   value: stats.listaSaldos.filter((c:any) => c.saldo <= 0).length, color: 'text-emerald-400' },
                    { label: 'Total clientes',      value: stats.listaSaldos.length, color: 'text-white' },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/[0.02] border border-white/5 px-4 py-3 rounded-xl">
                      <span className="text-[8px] font-black uppercase tracking-widest text-slate-600">{s.label}</span>
                      <span className={`text-sm font-black tabular-nums ${s.color}`}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <p className="text-[7px] font-black text-slate-700 uppercase tracking-[0.4em]">Rutas del Sur ERP v3.1</p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
