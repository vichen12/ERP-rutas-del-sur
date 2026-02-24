'use client'
// src/components/clientes/ClienteViewSelector.tsx
// Agregado el tab "Ubicaciones" al switcher existente
import { LayoutDashboard, UserCircle2, BarChart3, Users2, ShieldCheck, Bell, Map } from 'lucide-react'

export function ClienteViewSelector({ viewMode, setViewMode, hasSelected, totalAlertas = 0 }: any) {
  return (
    <div className="sticky top-0 z-[100] px-6 py-4 bg-[#020617]/80 backdrop-blur-2xl border-b border-white/5 flex flex-col md:flex-row justify-between items-center gap-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)] font-sans italic">
      
      {/* BRANDING */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="absolute inset-0 bg-sky-500 blur-lg opacity-20 animate-pulse" />
          <div className="relative p-3 bg-gradient-to-br from-slate-800 to-slate-900 rounded-2xl border border-white/10 shadow-2xl">
            <BarChart3 size={22} className="text-sky-400" />
          </div>
        </div>
        <div>
          <h2 className="text-lg font-black text-white uppercase italic tracking-tighter leading-none">
            Consola de <span className="text-sky-500">Mando</span>
          </h2>
          <div className="flex items-center gap-2 mt-1">
            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-emerald-500/10 rounded-md border border-emerald-500/20">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
               <p className="text-[7px] font-black text-emerald-500 uppercase tracking-[0.2em]">Sincronizado V2.0</p>
            </div>
            <p className="text-[7px] font-black text-slate-600 uppercase tracking-[0.4em]">Rutas del Sur ERP</p>
          </div>
        </div>
      </div>

      {/* SWITCHER DE VISTA */}
      <div className="p-1.5 bg-slate-950/80 rounded-[1.5rem] border border-white/5 flex gap-1.5 shadow-inner overflow-x-auto no-scrollbar">
        {/* Visión Global */}
        <button 
          onClick={() => setViewMode('general')}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 whitespace-nowrap ${
            viewMode === 'general' 
            ? 'bg-sky-600 text-white shadow-[0_0_20px_rgba(2,132,199,0.3)] scale-105 border border-sky-400/20' 
            : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'
          }`}
        >
          <Users2 size={14} strokeWidth={2.5} />
          Visión Global
        </button>

        {/* Perfil Individual */}
        <button 
          onClick={() => hasSelected && setViewMode('individual')}
          disabled={!hasSelected}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 whitespace-nowrap ${
            viewMode === 'individual' 
            ? 'bg-emerald-600 text-white shadow-[0_0_20px_rgba(16,185,129,0.3)] scale-105 border border-emerald-400/20' 
            : hasSelected 
              ? 'text-slate-500 hover:text-slate-300 hover:bg-white/5' 
              : 'opacity-20 grayscale cursor-not-allowed text-slate-700'
          }`}
        >
          <UserCircle2 size={14} strokeWidth={2.5} />
          Perfil
        </button>

        {/* ★ NUEVO: Ubicaciones */}
        <button 
          onClick={() => hasSelected && setViewMode('ubicaciones')}
          disabled={!hasSelected}
          className={`flex items-center gap-2 px-5 py-3 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all duration-300 whitespace-nowrap ${
            viewMode === 'ubicaciones' 
            ? 'bg-violet-600 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)] scale-105 border border-violet-400/20' 
            : hasSelected 
              ? 'text-slate-500 hover:text-slate-300 hover:bg-white/5' 
              : 'opacity-20 grayscale cursor-not-allowed text-slate-700'
          }`}
        >
          <Map size={14} strokeWidth={2.5} />
          Ubicaciones
        </button>
      </div>

      {/* CAMPANA + ACCESO SEGURO */}
      <div className="hidden xl:flex items-center gap-3">
        <div className="relative p-2 bg-white/5 rounded-xl border border-white/10">
          <Bell 
            size={20} 
            className={totalAlertas > 0 ? "text-orange-500 animate-pulse" : "text-slate-500"} 
          />
          {totalAlertas > 0 && (
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-orange-500 rounded-full shadow-[0_0_8px_orange]" />
          )}
        </div>
        <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/5">
          <ShieldCheck size={14} className="text-slate-600" />
          <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Acceso Encriptado</span>
        </div>
      </div>
    </div>
  )
}