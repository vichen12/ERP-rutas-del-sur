'use client'
import { useState } from 'react'
import { ArrowRight, ArrowLeft, Globe, Droplets, UserCheck, DollarSign, Calculator, TrendingUp, Percent } from 'lucide-react'

export function ViajesGeneral({ stats }: { stats: any }) {
  // Estado para controlar qué vista mostrar: 'ida', 'retorno' o 'total'
  const [activeView, setActiveView] = useState<'ida' | 'retorno' | 'total'>('total')

  const views = [
    { id: 'ida', label: 'Operación Ida', icon: <ArrowRight size={14} />, color: 'emerald' },
    { id: 'retorno', label: 'Operación Retorno', icon: <ArrowLeft size={14} />, color: 'indigo' },
    { id: 'total', label: 'Balance General', icon: <Globe size={14} />, color: 'cyan' },
  ] as const;

  const currentData = stats[activeView]
  const currentColor = activeView === 'ida' ? 'emerald' : activeView === 'retorno' ? 'indigo' : 'cyan'

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* SELECTOR DE VISTA (TABS) */}
      <div className="flex p-1.5 bg-slate-900/60 border border-white/5 rounded-[2rem] w-fit backdrop-blur-md mx-auto lg:mx-0">
        {views.map((view) => (
          <button
            key={view.id}
            onClick={() => setActiveView(view.id)}
            className={`
              flex items-center gap-3 px-6 py-3 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300
              ${activeView === view.id 
                ? `bg-${view.color}-600 text-white shadow-lg shadow-${view.color}-900/20` 
                : 'text-slate-500 hover:text-slate-300 hover:bg-white/5'}
            `}
          >
            {view.icon}
            {view.label}
          </button>
        ))}
      </div>

      {/* TARJETA DINÁMICA DE RESULTADOS */}
      <div className={`
        relative bg-slate-900/40 rounded-[3rem] border p-8 lg:p-12 backdrop-blur-xl transition-all duration-500 overflow-hidden
        ${activeView === 'total' ? 'border-cyan-500/30 ring-1 ring-cyan-500/10 shadow-2xl shadow-cyan-900/20' : 'border-white/5'}
      `}>
        
        {/* Decoración de fondo dinámica */}
        <div className={`absolute -right-10 -top-10 opacity-[0.03] transition-colors duration-500 text-${currentColor}-400`}>
           {activeView === 'total' ? <Globe size={300} /> : activeView === 'ida' ? <ArrowRight size={300} /> : <ArrowLeft size={300} />}
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* LADO IZQUIERDO: MÉTRICAS OPERATIVAS */}
          <div className="space-y-8">
            <div>
              <h3 className={`text-xs font-black uppercase tracking-[0.3em] mb-1 text-${currentColor}-400`}>Resumen Detallado</h3>
              <p className="text-4xl font-black italic text-white uppercase tracking-tighter">
                {activeView === 'total' ? 'Estado Global' : activeView === 'ida' ? 'Logística de Carga' : 'Logística de Retorno'}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <MetricBox label="Distancia Recorrida" value={currentData.km} suffix=" KM" icon={<TrendingUp size={16}/>} />
              <MetricBox label="Combustible Consumido" value={currentData.totalLts} suffix=" LTS" icon={<Droplets size={16}/>} />
              <MetricBox label="Pagos a Choferes" value={currentData.totalChofer} prefix="$ " icon={<UserCheck size={16}/>} />
              <MetricBox label="Gastos Operativos" value={currentData.totalCostos} prefix="$ " icon={<Calculator size={16}/>} />
            </div>
          </div>

          {/* LADO DERECHO: RESULTADO FINANCIERO */}
          <div className={`bg-white/[0.02] border border-white/5 rounded-[2.5rem] p-8 lg:p-10 flex flex-col justify-center space-y-8`}>
            
            <div className="flex justify-between items-end border-b border-white/5 pb-6">
              <div className="space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Ingreso Bruto</span>
                <p className="text-2xl font-bold text-white tracking-tighter">$ {Math.round(currentData.bruta).toLocaleString()}</p>
              </div>
              <div className="text-right space-y-1">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Margen s/IVA</span>
                <p className="text-lg font-black text-slate-400 italic">$ {Math.round(currentData.siva).toLocaleString()}</p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-2 h-2 rounded-full bg-${currentColor}-500 animate-pulse`} />
                <span className={`text-[11px] font-black uppercase tracking-[0.2em] text-${currentColor}-500`}>Resultado Neto Final</span>
              </div>
              <p className={`text-6xl lg:text-7xl font-black italic tracking-tighter text-white`}>
                $ {Math.round(currentData.neta).toLocaleString()}
              </p>
            </div>

            <div className="pt-4 flex items-center gap-4">
               <div className={`px-4 py-2 rounded-xl bg-${currentColor}-500/10 border border-${currentColor}-500/20 flex items-center gap-2`}>
                  <Percent size={14} className={`text-${currentColor}-400`} />
                  <span className={`text-[10px] font-bold text-${currentColor}-400 uppercase`}>
                    Eficiencia: {Math.round((currentData.neta / currentData.bruta) * 100 || 0)}%
                  </span>
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
    <div className="bg-slate-950/40 border border-white/5 p-5 rounded-2xl group hover:bg-slate-900/80 transition-all">
      <div className="flex items-center gap-3 text-slate-500 mb-2 group-hover:text-slate-300 transition-colors">
        {icon}
        <span className="text-[9px] font-black uppercase tracking-widest">{label}</span>
      </div>
      <p className="text-xl font-black text-white italic tracking-tight">
        {prefix}{Math.round(value).toLocaleString()}{suffix}
      </p>
    </div>
  )
}