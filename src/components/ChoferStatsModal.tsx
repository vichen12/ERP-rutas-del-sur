'use client'
import { useState, useMemo } from 'react'
import { X, Calendar as CalIcon, FilterX, Droplets, Gauge, Wallet, Milestone, Flame } from 'lucide-react'

export function ChoferStatsModal({ isOpen, onClose, chofer, viajes = [] }: any) {
  if (!isOpen || !chofer) return null

  // --- MOTORES DE FILTRO DE TIEMPO ---
  const [filterMode, setFilterMode] = useState<'mes' | 'año' | 'historico' | 'custom'>('mes')
  const [dateStart, setDateStart] = useState<string>(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
  })
  const [dateEnd, setDateEnd] = useState<string>(() => new Date().toISOString().split('T')[0])

  const filterByDate = (fechaStr: string) => {
    if (!fechaStr) return false;
    const fecha = new Date(fechaStr);
    const hoy = new Date();
    
    switch (filterMode) {
      case 'historico': return true;
      case 'año': return fecha.getFullYear() === hoy.getFullYear();
      case 'mes': return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
      case 'custom': return fechaStr >= dateStart && fechaStr <= dateEnd;
      default: return true;
    }
  }

  // --- FILTRADO DE VIAJES DEL CHOFER ---
  const viajesFiltrados = useMemo(() => {
    return viajes.filter((v: any) => v.chofer_id === chofer.id && filterByDate(v.fecha));
  }, [viajes, chofer, filterMode, dateStart, dateEnd]);

  // --- CÁLCULOS MATEMÁTICOS EXACTOS ---
  const stats = useMemo(() => {
    let totalKm = 0;
    let totalLts = 0;
    let totalPlata = 0; // Ganancia / Pago al chofer

    viajesFiltrados.forEach((v: any) => {
      totalKm += Number(v.km_recorridos) || 0;
      totalLts += Number(v.lts_gasoil) || 0;
      totalPlata += Number(v.pago_chofer) || 0;
    });

    // Fórmula: (Litros / Kilómetros) * 100
    const rendimiento = totalKm > 0 ? ((totalLts / totalKm) * 100).toFixed(1) : '0.0';

    return { totalKm, totalLts, totalPlata, rendimiento };
  }, [viajesFiltrados]);

  // Colores dinámicos para el rendimiento
  const numConsumo = Number(stats.rendimiento);
  const consumoColor = numConsumo === 0 ? 'text-slate-500' : 
                       numConsumo > 40 ? 'text-rose-500' : 
                       numConsumo > 35 ? 'text-amber-500' : 
                       'text-emerald-500';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 italic font-sans overflow-hidden">
      <div className="bg-[#020617] border border-white/10 w-full max-w-6xl rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/5 rounded-full blur-[100px] pointer-events-none" />

        {/* --- HEADER Y FILTROS --- */}
        <div className="p-8 md:p-10 border-b border-white/5 relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 bg-slate-900/20">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
              <p className="text-[10px] font-black text-indigo-500 uppercase tracking-[0.3em]">Auditoría de Operador</p>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
              {chofer.nombre}
            </h2>
          </div>

          <div className="flex flex-col items-end gap-4 w-full xl:w-auto">
            <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 transition-colors absolute top-6 right-6 xl:relative xl:top-0 xl:right-0">
              <X size={20} />
            </button>
            
            {/* PANEL DE FILTROS */}
            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto bg-slate-950/50 p-2 rounded-[2rem] border border-white/5 backdrop-blur-md">
              <div className="flex gap-2">
                <FilterBtn active={filterMode === 'mes'} onClick={() => setFilterMode('mes')} label="Este Mes" />
                <FilterBtn active={filterMode === 'año'} onClick={() => setFilterMode('año')} label="Este Año" />
                <FilterBtn active={filterMode === 'historico'} onClick={() => setFilterMode('historico')} label="Histórico" />
                <FilterBtn active={filterMode === 'custom'} onClick={() => setFilterMode('custom')} icon={CalIcon} label="Rango" />
              </div>

              {filterMode === 'custom' && (
                <div className="flex items-center gap-2 px-2 animate-in slide-in-from-left-4">
                  <input type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)} className="bg-black/50 text-[10px] font-black text-indigo-400 uppercase outline-none px-4 py-2 rounded-xl border border-indigo-500/20 [color-scheme:dark]" />
                  <span className="text-slate-600 text-xs font-black">/</span>
                  <input type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)} className="bg-black/50 text-[10px] font-black text-indigo-400 uppercase outline-none px-4 py-2 rounded-xl border border-indigo-500/20 [color-scheme:dark]" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* --- GRID DE KPIs --- */}
        <div className="p-8 md:p-10 grid grid-cols-2 lg:grid-cols-4 gap-4 bg-white/[0.01] shrink-0 border-b border-white/5">
          
          <div className="bg-indigo-500/10 border border-indigo-500/20 p-6 rounded-[2.5rem] flex flex-col justify-center">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest">Liquidación</p>
              <Wallet size={14} className="text-indigo-500" />
            </div>
            <p className="text-2xl md:text-3xl font-black text-white italic tracking-tighter">$ {stats.totalPlata.toLocaleString()}</p>
          </div>

          <div className="bg-slate-900/60 border border-white/5 p-6 rounded-[2.5rem] flex flex-col justify-center">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Distancia</p>
              <Milestone size={14} className="text-sky-500" />
            </div>
            <p className="text-2xl md:text-3xl font-black text-white italic tracking-tighter">{stats.totalKm.toLocaleString()} <span className="text-xs text-slate-600">KM</span></p>
          </div>

          <div className="bg-slate-900/60 border border-white/5 p-6 rounded-[2.5rem] flex flex-col justify-center">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Gasoil Utilizado</p>
              <Droplets size={14} className="text-cyan-500" />
            </div>
            <p className="text-2xl md:text-3xl font-black text-white italic tracking-tighter">{stats.totalLts.toLocaleString()} <span className="text-xs text-slate-600">LTS</span></p>
          </div>

          <div className="bg-slate-900/60 border border-white/5 p-6 rounded-[2.5rem] flex flex-col justify-center shadow-inner">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Rendimiento</p>
              <Flame size={14} className={consumoColor} />
            </div>
            <p className={`text-2xl md:text-3xl font-black italic tracking-tighter ${consumoColor}`}>
              {stats.rendimiento} <span className="text-xs text-slate-600">L/100km</span>
            </p>
          </div>

        </div>

        {/* --- LISTA DE VIAJES DEL PERÍODO --- */}
        <div className="flex-1 overflow-y-auto p-8 md:p-10 custom-scrollbar">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Detalle de Viajes en el período</h3>
          
          {viajesFiltrados.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 opacity-50">
               <FilterX size={32} className="text-slate-600 mb-3" />
               <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">No hay viajes registrados</p>
            </div>
          ) : (
            <div className="space-y-3">
              {viajesFiltrados.map((v: any, i: number) => (
                <div key={i} className="flex flex-col sm:flex-row justify-between items-center bg-slate-950/50 p-5 rounded-2xl border border-white/5 hover:bg-white/5 transition-colors gap-4">
                  <div className="flex items-center gap-4 w-full sm:w-auto">
                    <div className="bg-indigo-500/10 p-3 rounded-xl text-indigo-400">
                      <CalIcon size={16} />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold text-slate-500">{new Date(v.fecha).toLocaleDateString('es-AR', { timeZone: 'UTC' })}</p>
                      <p className="text-sm font-black text-white uppercase mt-0.5">{Number(v.km_recorridos)} KM</p>
                    </div>
                  </div>
                  <div className="flex gap-6 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-left sm:text-right">
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Litros</p>
                      <p className="text-sm font-black text-cyan-400 tabular-nums">{Number(v.lts_gasoil)} L</p>
                    </div>
                    <div className="text-left sm:text-right">
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Liquidación</p>
                      <p className="text-sm font-black text-emerald-400 tabular-nums">$ {Number(v.pago_chofer).toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

function FilterBtn({ active, onClick, label, icon: Icon }: any) {
  return (
    <button 
      onClick={onClick} 
      className={`px-4 py-3 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
        active ? 'bg-indigo-600 text-white shadow-[0_0_15px_rgba(79,70,229,0.4)]' : 'bg-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'
      }`}
    >
      {Icon && <Icon size={12} />}
      {label}
    </button>
  )
}