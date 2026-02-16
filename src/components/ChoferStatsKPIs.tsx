'use client'
import { Droplets, Gauge } from 'lucide-react'

export function ChoferStatsKPIs({ stats, consumoPromedio, showAllTime }: any) {
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 p-6 md:p-8 border-b border-white/5 bg-white/[0.01] shrink-0">
      <div className="bg-rose-500/10 border border-rose-500/20 p-6 rounded-[2.5rem] flex flex-col justify-center">
         <p className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-1">Deuda Pendiente</p>
         <p className="text-2xl md:text-3xl font-black text-white italic tracking-tighter">$ {stats.totalDeuda.toLocaleString()}</p>
      </div>
      <div className="bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-[2.5rem] flex flex-col justify-center">
         <p className="text-[9px] font-black text-indigo-500 uppercase tracking-widest mb-1">Ganancia ({showAllTime ? 'Total' : 'Mes'})</p>
         <p className="text-2xl md:text-3xl font-black text-white italic tracking-tighter">$ {stats.totalPlata.toLocaleString()}</p>
      </div>
      <div className="bg-slate-900/40 border border-white/5 p-6 rounded-[2.5rem] flex flex-col justify-center relative">
         <div className="flex justify-between items-start mb-2"><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Litros Gasoil</p><Droplets size={14} className="text-cyan-500"/></div>
         <p className="text-2xl font-black text-white italic tracking-tighter">{stats.totalLts.toLocaleString()} <span className="text-xs text-slate-600">LTS</span></p>
      </div>
      <div className="bg-slate-900/40 border border-white/5 p-6 rounded-[2.5rem] flex flex-col justify-center relative">
         <div className="flex justify-between items-start mb-2"><p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Rendimiento</p><Gauge size={14} className="text-emerald-500"/></div>
         <p className="text-2xl font-black text-white italic tracking-tighter">{consumoPromedio} <span className="text-xs text-slate-600">L/100</span></p>
      </div>
    </div>
  )
}