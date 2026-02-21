'use client'
import { useState, useMemo } from 'react'
import { X, Flame, Gauge, Wrench, Activity, Calendar as CalIcon, FilterX } from 'lucide-react'

export function CamionStatsModal({ isOpen, onClose, camion, viajes = [], gastos = [] }: any) {
  if (!isOpen || !camion) return null

  // Modos de Filtro
  const [filterMode, setFilterMode] = useState<'mes' | 'año' | 'historico' | 'custom'>('mes')
  
  // Rango Custom
  const [dateStart, setDateStart] = useState<string>(() => {
    const d = new Date(); d.setDate(1); return d.toISOString().split('T')[0];
  })
  const [dateEnd, setDateEnd] = useState<string>(() => new Date().toISOString().split('T')[0])

  // Lógica de Filtrado Maestro
  const filterByDate = (fechaStr: string) => {
    if (!fechaStr) return false;
    const fecha = new Date(fechaStr);
    const hoy = new Date();
    
    switch (filterMode) {
      case 'historico':
        return true;
      case 'año':
        return fecha.getFullYear() === hoy.getFullYear();
      case 'mes':
        return fecha.getMonth() === hoy.getMonth() && fecha.getFullYear() === hoy.getFullYear();
      case 'custom':
        return fechaStr >= dateStart && fechaStr <= dateEnd;
      default:
        return true;
    }
  }

  // Filtrado de Viajes
  const viajesFiltrados = useMemo(() => {
    return viajes.filter((v: any) => v.camion_id === camion.id && filterByDate(v.fecha));
  }, [viajes, camion, filterMode, dateStart, dateEnd]);

  // Filtrado de Gastos
  const gastosFiltrados = useMemo(() => {
    return gastos.filter((g: any) => g.camion_id === camion.id && filterByDate(g.fecha));
  }, [gastos, camion, filterMode, dateStart, dateEnd]);

  // Cálculos Core
  const stats = useMemo(() => {
    let kmTotales = 0;
    let ltsTotales = 0;

    viajesFiltrados.forEach((v: any) => {
      kmTotales += Number(v.km_recorridos) || 0;
      ltsTotales += Number(v.lts_gasoil) || 0;
    });

    const visitasTaller = gastosFiltrados.length;
    const gastoTotal = gastosFiltrados.reduce((acc: number, g: any) => acc + (Number(g.monto) || 0), 0);
    
    // Promedio L/100km
    const rendimiento = kmTotales > 0 ? ((ltsTotales / kmTotales) * 100).toFixed(1) : '0.0';

    return { kmTotales, ltsTotales, visitasTaller, gastoTotal, rendimiento };
  }, [viajesFiltrados, gastosFiltrados]);

  // Colores dinámicos del consumo
  const numConsumo = Number(stats.rendimiento);
  const consumoColor = numConsumo === 0 ? 'text-slate-500' : 
                       numConsumo > 40 ? 'text-rose-500' : 
                       numConsumo > 35 ? 'text-amber-500' : 
                       'text-emerald-500';

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300 italic font-sans overflow-hidden">
      <div className="bg-[#020617] border border-white/10 w-full max-w-5xl rounded-[3rem] shadow-2xl relative overflow-hidden flex flex-col">
        
        {/* Glow de fondo */}
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/5 rounded-full blur-[100px] pointer-events-none" />

        {/* HEADER */}
        <div className="p-8 md:p-10 border-b border-white/5 relative z-10 flex flex-col xl:flex-row justify-between items-start xl:items-center gap-8 bg-slate-900/20">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              <p className="text-[10px] font-black text-sky-500 uppercase tracking-[0.3em]">Telemetría de Unidad</p>
            </div>
            <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
              {camion.patente}
            </h2>
            <p className="text-sm font-bold text-slate-500 uppercase mt-2 tracking-widest">{camion.modelo || 'MODELO NO REGISTRADO'}</p>
          </div>

          <div className="flex flex-col items-end gap-4 w-full xl:w-auto">
            <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-full text-slate-400 transition-colors absolute top-6 right-6 xl:relative xl:top-0 xl:right-0">
              <X size={20} />
            </button>
            
            {/* PANEL DE FILTROS V2 */}
            <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto bg-slate-950/50 p-2 rounded-[2rem] border border-white/5 backdrop-blur-md">
              
              <div className="flex gap-2">
                <FilterBtn active={filterMode === 'mes'} onClick={() => setFilterMode('mes')} label="Este Mes" />
                <FilterBtn active={filterMode === 'año'} onClick={() => setFilterMode('año')} label="Este Año" />
                <FilterBtn active={filterMode === 'historico'} onClick={() => setFilterMode('historico')} label="Histórico" />
                <FilterBtn active={filterMode === 'custom'} onClick={() => setFilterMode('custom')} icon={CalIcon} label="Rango" />
              </div>

              {/* Rango de Fechas Custom (Aparece si eligen 'Rango') */}
              {filterMode === 'custom' && (
                <div className="flex items-center gap-2 px-2 animate-in slide-in-from-left-4">
                  <input 
                    type="date" value={dateStart} onChange={(e) => setDateStart(e.target.value)}
                    className="bg-black/50 text-[10px] font-black text-sky-400 uppercase outline-none px-4 py-2 rounded-xl border border-sky-500/20 [color-scheme:dark]"
                  />
                  <span className="text-slate-600 text-xs font-black">/</span>
                  <input 
                    type="date" value={dateEnd} onChange={(e) => setDateEnd(e.target.value)}
                    className="bg-black/50 text-[10px] font-black text-sky-400 uppercase outline-none px-4 py-2 rounded-xl border border-sky-500/20 [color-scheme:dark]"
                  />
                </div>
              )}
            </div>

          </div>
        </div>

        {/* CONTENIDO DE STATS */}
        <div className="p-8 md:p-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* RENDIMIENTO PROMEDIO */}
          <div className="bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] relative group shadow-inner">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-white/5 rounded-2xl">
                <Flame size={24} className={consumoColor} />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Rendimiento Promedio</p>
            <p className={`text-4xl font-black italic tabular-nums tracking-tighter ${consumoColor}`}>
              {stats.rendimiento} <span className="text-sm not-italic opacity-50">L/100km</span>
            </p>
          </div>

          {/* TOTAL LITROS */}
          <div className="bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] relative group shadow-inner">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-cyan-500/10 rounded-2xl">
                <Activity size={24} className="text-cyan-400" />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Combustible Utilizado</p>
            <p className="text-3xl font-black italic tabular-nums text-white tracking-tighter">
              {stats.ltsTotales.toLocaleString()} <span className="text-sm text-cyan-500 not-italic">Lts</span>
            </p>
          </div>

          {/* TOTAL KM */}
          <div className="bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] relative group shadow-inner">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-emerald-500/10 rounded-2xl">
                <Gauge size={24} className="text-emerald-400" />
              </div>
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Distancia Recorrida</p>
            <p className="text-3xl font-black italic tabular-nums text-white tracking-tighter">
              {stats.kmTotales.toLocaleString()} <span className="text-sm text-emerald-500 not-italic">KM</span>
            </p>
          </div>

          {/* VISITAS A TALLER / GASTOS */}
          <div className="bg-slate-900/50 border border-white/5 p-6 rounded-[2rem] relative group shadow-inner">
            <div className="flex justify-between items-start mb-4">
              <div className="p-3 bg-amber-500/10 rounded-2xl">
                <Wrench size={24} className="text-amber-400" />
              </div>
              <span className="text-[10px] font-black px-2 py-1 rounded-md bg-white/5 text-amber-500">
                {stats.visitasTaller} Reportes
              </span>
            </div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Costos de Mantenimiento</p>
            <p className="text-3xl font-black italic tabular-nums text-amber-400 tracking-tighter">
              $ {stats.gastoTotal.toLocaleString()}
            </p>
          </div>

        </div>

        {/* MENSAJE DE ESPERA / VACÍO */}
        {viajesFiltrados.length === 0 && gastosFiltrados.length === 0 && (
          <div className="flex flex-col items-center justify-center pb-12 opacity-50">
             <FilterX size={32} className="text-slate-600 mb-3" />
             <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">No hay datos en el período seleccionado</p>
          </div>
        )}

      </div>
    </div>
  )
}

// Subcomponente para los botones de filtro
function FilterBtn({ active, onClick, label, icon: Icon }: any) {
  return (
    <button 
      onClick={onClick} 
      className={`px-4 py-3 rounded-[1.5rem] text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
        active 
          ? 'bg-sky-600 text-white shadow-[0_0_15px_rgba(2,132,199,0.4)]' 
          : 'bg-transparent text-slate-500 hover:text-slate-300 hover:bg-white/5'
      }`}
    >
      {Icon && <Icon size={12} />}
      {label}
    </button>
  )
}