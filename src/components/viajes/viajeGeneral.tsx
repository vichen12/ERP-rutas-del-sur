'use client'
import { useState } from 'react'
import { 
  ArrowRight, ArrowLeft, Globe, Droplets, UserCheck, 
  DollarSign, Calculator, TrendingUp, Percent, Gauge 
} from 'lucide-react'

const THEMES = {
  ida: {
    bgActive: 'bg-emerald-600 shadow-emerald-600/30 text-white',
    textMain: 'text-emerald-400',
    textIcon: 'text-emerald-500',
    border: 'border-emerald-500/30',
    ring: 'ring-emerald-500/10',
    shadow: 'shadow-emerald-900/20',
    badgeBg: 'bg-emerald-500/10',
    badgeBorder: 'border-emerald-500/20'
  },
  retorno: {
    bgActive: 'bg-indigo-600 shadow-indigo-600/30 text-white',
    textMain: 'text-indigo-400',
    textIcon: 'text-indigo-500',
    border: 'border-indigo-500/30',
    ring: 'ring-indigo-500/10',
    shadow: 'shadow-indigo-900/20',
    badgeBg: 'bg-indigo-500/10',
    badgeBorder: 'border-indigo-500/20'
  },
  total: {
    bgActive: 'bg-cyan-600 shadow-cyan-600/30 text-white',
    textMain: 'text-cyan-400',
    textIcon: 'text-cyan-500',
    border: 'border-cyan-500/30',
    ring: 'ring-cyan-500/10',
    shadow: 'shadow-cyan-900/20',
    badgeBg: 'bg-cyan-500/10',
    badgeBorder: 'border-cyan-500/20'
  }
}

// ✅ FIX #9: Definimos la interfaz correcta que recibe stats como objeto plano
// y calculamos las vistas por separado desde los viajes
interface ViajesGeneralProps {
  // Stats plano (todos los viajes filtrados consolidados)
  stats: {
    km: number;
    bruta: number;
    neta: number;
    totalSiva: number;
    totalLts: number;
    totalChofer: number;
    totalCostos: number;
  };
  // Viajes filtrados para calcular ida/retorno por separado
  viajes: any[];
  precioGasoil: number;
}

export function ViajesGeneral({ stats, viajes = [], precioGasoil = 0 }: ViajesGeneralProps) {
  const [activeView, setActiveView] = useState<'ida' | 'retorno' | 'total'>('total')

  const views = [
    { id: 'ida', label: 'Operación Ida', icon: <ArrowRight size={14} /> },
    { id: 'total', label: 'Consolidado', icon: <Globe size={14} /> },
    { id: 'retorno', label: 'Operación Retorno', icon: <ArrowLeft size={14} /> },
  ] as const;

  // ✅ FIX #9: Calculamos stats por tramo desde los viajes directamente
  const calcularStats = (viajesFiltrados: any[]) => {
    return viajesFiltrados.reduce((acc, v) => {
      const bruta = Number(v.tarifa_flete_calculada) || 0;
      const pagoCh = Number(v.pago_chofer) || 0;
      const costoGas = (Number(v.lts_gasoil) || 0) * (Number(v.precio_gasoil) || precioGasoil);
      const descarga = Number(v.costo_descarga) || 0;
      const costoDesgaste = (Number(v.km_recorridos) || 0) * (Number(v.desgaste_por_km) || 0);
      const neta = bruta - pagoCh - costoGas - descarga - costoDesgaste;

      return {
        km: acc.km + (Number(v.km_recorridos) || 0),
        bruta: acc.bruta + bruta,
        neta: acc.neta + neta,
        siva: acc.siva + (neta / 1.21),
        totalLts: acc.totalLts + (Number(v.lts_gasoil) || 0),
        totalChofer: acc.totalChofer + pagoCh,
        totalCostos: acc.totalCostos + costoGas + descarga + costoDesgaste,
      }
    }, { km: 0, bruta: 0, neta: 0, siva: 0, totalLts: 0, totalChofer: 0, totalCostos: 0 })
  }

  const viajesIda = viajes.filter(v => !v.es_retorno)
  const viajesRetorno = viajes.filter(v => v.es_retorno)

  const statsIda = calcularStats(viajesIda)
  const statsRetorno = calcularStats(viajesRetorno)
  const statsTotal = {
    ...stats,
    siva: stats.totalSiva,
  }

  const viewData: Record<string, any> = {
    ida: statsIda,
    retorno: statsRetorno,
    total: statsTotal,
  }

  const currentData = viewData[activeView] || { km: 0, totalLts: 0, totalChofer: 0, totalCostos: 0, bruta: 0, siva: 0, neta: 0 }
  const t = THEMES[activeView]
  
  const eficiencia = currentData.bruta > 0 ? (currentData.neta / currentData.bruta) * 100 : 0
  const rendimientoCombustible = currentData.km > 0 ? (currentData.totalLts / currentData.km) * 100 : 0

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 italic font-sans">
      
      {/* SELECTOR TÁCTICO */}
      <div className="flex flex-col sm:flex-row p-1.5 bg-slate-950/80 border border-white/5 rounded-[2rem] w-full sm:w-fit backdrop-blur-md mx-auto lg:mx-0 shadow-2xl">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id)}
            className={`
              flex-1 sm:flex-none flex justify-center items-center gap-3 px-6 py-4 md:py-3 rounded-[1.5rem] text-[9px] md:text-[10px] font-black uppercase tracking-widest transition-all duration-500
              ${activeView === view.id ? t.bgActive : 'text-slate-600 hover:text-slate-300 hover:bg-white/5'}
            `}
          >
            {view.icon}
            {view.label}
          </button>
        ))}
      </div>

      {/* PANEL DE CONTROL */}
      <div className={`
        relative bg-slate-900/40 rounded-[2.5rem] md:rounded-[3.5rem] border p-6 md:p-10 lg:p-14 backdrop-blur-xl transition-all duration-700 overflow-hidden shadow-2xl
        ${activeView === 'total' ? `${t.border} ring-1 ${t.ring} ${t.shadow}` : 'border-white/5'}
      `}>
        
        <div className={`absolute -right-10 -top-10 opacity-[0.04] transition-colors duration-700 ${t.textMain} pointer-events-none`}>
           {activeView === 'total' ? <Globe size={300}/> : activeView === 'ida' ? <ArrowRight size={300}/> : <ArrowLeft size={300}/>}
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          
          {/* MÉTRICAS DE CAMPO */}
          <div className="space-y-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                 <span className={`w-1.5 h-1.5 rounded-full ${t.bgActive.split(' ')[0]} animate-pulse`} />
                 <h3 className={`text-[10px] md:text-xs font-black uppercase tracking-[0.4em] ${t.textMain}`}>Análisis Operativo</h3>
              </div>
              <p className="text-4xl md:text-5xl lg:text-6xl font-black italic text-white uppercase tracking-tighter leading-none">
                {activeView === 'total' ? 'Balance General' : activeView === 'ida' ? 'Sentido Ida' : 'Sentido Retorno'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <MetricBox label="Kilometraje" value={currentData.km} suffix=" KM" icon={<TrendingUp size={16}/>} />
              <MetricBox label="Gasoil Consumido" value={currentData.totalLts} suffix=" LTS" icon={<Droplets size={16}/>} />
              <MetricBox label="Viáticos Chofer" value={currentData.totalChofer} prefix="$ " icon={<UserCheck size={16}/>} />
              <MetricBox label="Costos / Desgaste" value={currentData.totalCostos} prefix="$ " icon={<Calculator size={16}/>} />
            </div>

            <div className="p-4 bg-white/[0.02] border border-white/5 rounded-2xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Gauge size={16} className="text-slate-500" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Rendimiento Promedio</span>
                </div>
                <span className="text-sm font-black text-slate-300 italic">{rendimientoCombustible.toFixed(1)} Lts / 100km</span>
            </div>
          </div>

          {/* BALANCE FINANCIERO */}
          <div className="bg-slate-950/80 border border-white/10 rounded-[2.5rem] md:rounded-[3rem] p-8 md:p-12 flex flex-col justify-center space-y-10 shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
              <DollarSign size={100} className="text-white" />
            </div>
            
            <div className="flex justify-between items-end border-b border-white/5 pb-8">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <DollarSign size={14} className={t.textIcon} /> Facturación Bruta
                </span>
                <p className="text-3xl md:text-4xl font-bold text-white tracking-tighter tabular-nums">$ {Math.round(currentData.bruta).toLocaleString('es-AR')}</p>
              </div>
              <div className="text-right space-y-1">
                <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Utilidad s/IVA</span>
                <p className="text-xl md:text-2xl font-black text-slate-400 italic tabular-nums">$ {Math.round(currentData.siva || 0).toLocaleString('es-AR')}</p>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <div className={`p-1.5 rounded-md ${t.bgActive.split(' ')[0]} bg-opacity-20`}>
                   <TrendingUp size={14} className={t.textMain} />
                </div>
                <span className={`text-[11px] font-black uppercase tracking-[0.3em] ${t.textIcon}`}>Margen Neto Final</span>
              </div>
              <p className={`text-6xl sm:text-7xl lg:text-8xl font-black italic tracking-tighter leading-none ${currentData.neta >= 0 ? 'text-white' : 'text-rose-500 animate-pulse'}`}>
                $ {Math.round(currentData.neta).toLocaleString('es-AR')}
              </p>
            </div>

            <div className="pt-4 flex flex-wrap items-center gap-5">
               <div className={`px-5 py-3 rounded-2xl ${t.badgeBg} ${t.badgeBorder} border flex items-center gap-3 shadow-lg`}>
                  <Percent size={18} className={t.textMain} />
                  <div className="flex flex-col">
                    <span className="text-[8px] font-black text-slate-500 uppercase">Eficiencia Operativa</span>
                    <span className={`text-sm font-black ${t.textMain} tracking-tighter`}>
                      {Math.round(eficiencia)}%
                    </span>
                  </div>
               </div>
               
               <div className="flex-1">
                 <p className={`text-[9px] font-black uppercase tracking-widest ${eficiencia > 30 ? 'text-emerald-500' : eficiencia > 15 ? 'text-amber-500' : 'text-rose-500'}`}>
                   {eficiencia > 30 ? 'Rentabilidad Excepcional' : eficiencia > 15 ? 'Margen Operativo Saludable' : 'Alerta de Rentabilidad Crítica'}
                 </p>
                 <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-1000 ${eficiencia > 30 ? 'bg-emerald-500' : eficiencia > 15 ? 'bg-amber-500' : 'bg-rose-500'}`}
                      style={{ width: `${Math.min(Math.max(eficiencia, 0), 100)}%` }}
                    />
                 </div>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricBox({ label, value, prefix = "", suffix = "", icon }: any) {
  return (
    <div className="bg-slate-950/40 border border-white/5 p-5 md:p-6 rounded-[2rem] group hover:bg-slate-900/80 transition-all shadow-inner relative overflow-hidden">
      <div className="flex items-center gap-3 text-slate-500 mb-2 group-hover:text-slate-300 transition-colors">
        <span className="p-1.5 bg-white/5 rounded-lg">{icon}</span>
        <span className="text-[9px] font-black uppercase tracking-widest truncate">{label}</span>
      </div>
      <p className="text-2xl font-black text-white italic tracking-tighter tabular-nums">
        {prefix}{Math.round(value).toLocaleString('es-AR')}<span className="text-[10px] ml-1 text-slate-600 not-italic uppercase">{suffix}</span>
      </p>
      <div className="absolute bottom-0 left-0 h-0.5 w-0 group-hover:w-full bg-sky-500/30 transition-all duration-500" />
    </div>
  )
}
