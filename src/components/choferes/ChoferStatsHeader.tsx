'use client'
import { Truck, AlertCircle, AlertTriangle, ShieldCheck, Calendar, Filter, X, ChevronDown, Clock, Activity } from 'lucide-react'

export function ChoferStatsHeader({ 
  chofer, 
  onClose, 
  selectedMonth, setSelectedMonth, 
  selectedYear, setSelectedYear, 
  showAllTime, setShowAllTime 
}: any) {
  
  // Lógica del Carnet (Actualizado a vto_licencia)
  const tieneVencimiento = Boolean(chofer.vto_licencia)
  const vencimiento = tieneVencimiento ? new Date(chofer.vto_licencia) : new Date()
  const hoy = new Date()
  const estaVencido = tieneVencimiento && vencimiento < hoy
  const vencePronto = tieneVencimiento && !estaVencido && (vencimiento.getTime() - hoy.getTime()) / (1000 * 3600 * 24) <= 30

  return (
    <div className="relative p-6 md:p-10 border-b border-white/5 bg-gradient-to-b from-slate-900/50 to-slate-950/80 flex flex-col gap-8 shrink-0">
      
      {/* --- BOTÓN CERRAR (ABSOLUTO) --- */}
      <button 
        onClick={onClose} 
        className="absolute top-4 right-4 md:top-8 md:right-8 p-3 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-all z-20"
      >
        <X size={24}/>
      </button>

      {/* --- BLOQUE SUPERIOR: INFO DEL CHOFER --- */}
      <div className="pr-10 relative z-10">
        
        {/* Badge Flotante */}
        <div className="mb-4 flex flex-wrap gap-2">
           {tieneVencimiento ? (
             <div className={`inline-flex items-center gap-3 px-5 py-2.5 rounded-2xl border text-[10px] font-black uppercase tracking-widest shadow-2xl backdrop-blur-md transition-all ${
                estaVencido ? 'bg-rose-500/10 border-rose-500/50 text-rose-400 shadow-rose-900/20' :
                vencePronto ? 'bg-amber-500/10 border-amber-500/50 text-amber-400 shadow-amber-900/20' :
                'bg-emerald-500/10 border-emerald-500/50 text-emerald-400 shadow-emerald-900/20'
             }`}>
                {estaVencido ? <AlertCircle size={14}/> : vencePronto ? <AlertTriangle size={14}/> : <ShieldCheck size={14}/>}
                <div className="flex flex-col leading-none gap-0.5">
                   <span>{estaVencido ? 'Licencia Vencida' : vencePronto ? 'Vence Pronto' : 'Licencia Al Día'}</span>
                   <span className="opacity-60 text-[8px] font-bold">{vencimiento.toLocaleDateString('es-AR')}</span>
                </div>
             </div>
           ) : (
             <div className="inline-flex items-center gap-2 px-4 py-2 rounded-2xl border border-slate-700 bg-slate-800/50 text-slate-400 text-[10px] uppercase font-black">
                <Calendar size={14}/> Sin Vencimiento
             </div>
           )}

           {/* NUEVO: Badge de Estado del Chofer V2.0 */}
           <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl border text-[10px] uppercase font-black ${
             chofer.estado === 'En Viaje' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' :
             chofer.estado === 'Franco' ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
             'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
           }`}>
              <Activity size={14}/> {chofer.estado || 'Disponible'}
           </div>
        </div>

        {/* Título y Subtítulo */}
        <div className="space-y-1">
            <div className="flex items-center gap-2 text-indigo-400 mb-1 opacity-80">
                <Truck size={14}/> <span className="text-[10px] font-black uppercase tracking-[0.2em]">Legajo Digital</span>
            </div>
            <h2 className="text-4xl sm:text-5xl md:text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white via-slate-200 to-slate-500 uppercase tracking-tighter leading-[0.9] break-words drop-shadow-sm">
                {chofer.nombre}
            </h2>
        </div>
      </div>
      
      {/* --- BLOQUE INFERIOR: FILTROS PREMIUM --- */}
      <div className="bg-black/20 p-2 md:p-3 rounded-[2.5rem] border border-white/5 backdrop-blur-xl shadow-inner">
         
         <div className="grid grid-cols-2 md:flex md:flex-wrap items-center gap-2 md:gap-3">
            
            {/* Label Desktop */}
            <div className="hidden md:flex items-center gap-2 px-4 text-slate-500">
                <Filter size={14}/>
                <span className="text-[10px] font-black uppercase tracking-widest">Filtrar:</span>
            </div>

            {/* Select Mes (Custom Style) */}
            <div className="relative group col-span-1 md:w-32">
                <select 
                    disabled={showAllTime} 
                    value={selectedMonth} 
                    onChange={(e) => setSelectedMonth(Number(e.target.value))} 
                    className="w-full bg-slate-900 border border-white/10 text-white font-bold text-xs uppercase outline-none py-3.5 pl-4 pr-10 rounded-2xl appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:border-indigo-500/50 transition-colors shadow-lg"
                >
                    {['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'].map((m, i) => <option key={i} value={i}>{m}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-hover:text-white transition-colors"/>
            </div>
            
            {/* Select Año (Custom Style) */}
            <div className="relative group col-span-1 md:w-28">
                <select 
                    disabled={showAllTime} 
                    value={selectedYear} 
                    onChange={(e) => setSelectedYear(Number(e.target.value))} 
                    className="w-full bg-slate-900 border border-white/10 text-white font-bold text-xs uppercase outline-none py-3.5 pl-4 pr-10 rounded-2xl appearance-none cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed hover:border-indigo-500/50 transition-colors shadow-lg"
                >
                    {[2024, 2025, 2026].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none group-hover:text-white transition-colors"/>
            </div>

            {/* Botón Histórico (Toggle Switch Look) */}
            <button 
                onClick={() => setShowAllTime(!showAllTime)} 
                className={`col-span-2 md:col-span-1 px-5 py-3.5 rounded-2xl text-[10px] font-black uppercase transition-all flex justify-center items-center gap-2 shadow-lg border ${
                    showAllTime 
                    ? 'bg-indigo-600 border-indigo-500 text-white shadow-indigo-500/20' 
                    : 'bg-white/5 border-transparent text-slate-400 hover:bg-white/10 hover:text-white'
                }`}
            >
                <Clock size={14} className={showAllTime ? 'animate-pulse' : ''} />
                {showAllTime ? 'Histórico' : 'Ver Todo'}
            </button>

         </div>
      </div>
    </div>
  )
}