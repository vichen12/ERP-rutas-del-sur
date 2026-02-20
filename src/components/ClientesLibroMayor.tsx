'use client'
import { 
  Inbox, TrendingUp, CheckCircle2, GripVertical, Hash, 
  Trash2, ArrowRight, RotateCcw, ArrowLeft, Calendar,
  AlertTriangle, ChevronLeft, FileEdit, Truck, Receipt
} from 'lucide-react'

export function ClientesLibroMayor({ 
  gestion, isOverBox, setIsOverBox, onDragStart, onDragEnd, onDrop, moverOperacion, eliminarOperacion,
  onCompletarRemito 
}: any) {

  const EmptyState = ({ message, icon: Icon }: { message: string, icon: any }) => (
    <div className="flex flex-col items-center justify-center py-12 px-4 border-2 border-dashed border-white/5 rounded-[2.5rem] bg-white/[0.01]">
      <Icon size={30} className="mb-3 text-slate-700 opacity-20" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-600 text-center">{message}</p>
    </div>
  )

  return (
    <div className="space-y-10 pb-32 font-sans italic">
      
      {/* --- SECCIÓN 1: BANDEJA DE ENTRADA (MAESTRO) --- */}
      <section 
        className={`relative p-6 md:p-10 rounded-[3rem] border transition-all duration-500 ${
          isOverBox === 'maestro' 
          ? 'bg-sky-500/10 border-sky-500 shadow-[0_0_50px_rgba(14,165,233,0.1)] scale-[1.01]' 
          : 'bg-white/[0.02] border-white/5'
        }`}
        onDragOver={(e) => {e.preventDefault(); setIsOverBox('maestro')}} 
        onDragLeave={() => setIsOverBox(null)} 
        onDrop={(e) => { onDrop(e, 'maestro'); onDragEnd(); }}
      >
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-sky-500/10 rounded-2xl text-sky-500 shadow-inner">
              <Inbox size={22} />
            </div>
            <div>
              <h2 className="text-sm font-black uppercase tracking-[0.4em] text-white">Bandeja de Entrada</h2>
              <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1 text-balance">Operaciones pendientes de procesamiento</p>
            </div>
          </div>
          <div className="hidden md:flex gap-2">
             <div className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
             <div className="w-2 h-2 rounded-full bg-sky-500/30" />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {gestion.maestro.length > 0 ? (
            gestion.maestro.map((m: any) => {
              // 🚀 LÓGICA V2.0: Detectamos falta de remito mirando la relación con la tabla remitos
              const tieneRemito = m.remitos && m.remitos.numero_remito;
              const esViaje = m.tipo_movimiento === 'Cargo por Flete';
              const faltaRemito = esViaje && !tieneRemito;

              return (
                <div 
                  key={m.id} draggable onDragStart={(e) => onDragStart(e, m.id)} onDragEnd={onDragEnd}
                  className={`group backdrop-blur-md p-6 rounded-[2.2rem] border flex flex-col md:flex-row justify-between items-center gap-6 transition-all shadow-xl
                    ${faltaRemito 
                      ? 'bg-orange-500/10 border-orange-500/50 hover:border-orange-500' 
                      : 'bg-slate-900/40 border-white/5 hover:border-sky-500/30 hover:bg-slate-900/80'
                    }`}
                >
                  <div className="flex items-center gap-6 w-full">
                    <GripVertical size={20} className="text-slate-800 hidden md:block cursor-grab active:cursor-grabbing group-hover:text-sky-500/50" />
                    
                    <div className="flex-1 space-y-3">
                      <div className="flex items-center gap-3 flex-wrap">
                         
                         {/* ETIQUETA DINÁMICA V2.0 */}
                         {faltaRemito ? (
                           <span className="flex items-center gap-1.5 bg-orange-600 px-3 py-1.5 rounded-lg text-white text-[9px] font-black uppercase animate-pulse">
                             <AlertTriangle size={12} /> FALTA NÚMERO DE REMITO
                           </span>
                         ) : (
                           <span className="flex items-center gap-1.5 bg-sky-500/10 px-3 py-1.5 rounded-lg text-sky-500 text-[10px] font-black uppercase border border-sky-500/20">
                             <Hash size={12} /> {m.remitos?.numero_remito || m.tipo_movimiento}
                           </span>
                         )}

                         <span className="text-[9px] text-slate-500 font-bold flex items-center gap-1">
                            <Calendar size={12} /> {new Date(m.fecha).toLocaleDateString('es-AR')}
                         </span>
                      </div>
                      
                      <div>
                        <p className="text-[10px] text-slate-400 font-bold uppercase flex items-center gap-1.5 mb-1">
                          {esViaje ? <Truck size={12} className="text-emerald-500"/> : <Receipt size={12} className="text-sky-500"/>} 
                          {m.detalle}
                        </p>
                        <p className={`text-3xl font-black italic tracking-tighter tabular-nums ${Number(m.haber) > 0 ? 'text-emerald-500' : 'text-white'}`}>
                          {Number(m.haber) > 0 ? '+' : ''}$ {Number(m.debe || m.haber).toLocaleString('es-AR')}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
                      <button 
                        onClick={() => eliminarOperacion(m.id)} 
                        className="p-4 text-slate-600 hover:text-rose-500 hover:bg-rose-500/10 rounded-2xl transition-all"
                        title="Eliminar movimiento"
                      >
                        <Trash2 size={20}/>
                      </button>

                      {/* BOTÓN DE ACCIÓN INTELIGENTE */}
                      {faltaRemito ? (
                        <button 
                          onClick={() => onCompletarRemito && onCompletarRemito(m.id)} 
                          className="flex-[3] md:flex-none px-6 py-4 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 shadow-lg shadow-orange-900/40 active:scale-95 transition-all"
                        >
                          <FileEdit size={16} /> Completar Datos
                        </button>
                      ) : (
                        <button 
                          onClick={() => moverOperacion(m.id, 'por_cobrar')} 
                          className="flex-[3] md:flex-none px-8 py-4 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 shadow-lg shadow-sky-900/40 active:scale-95 transition-all"
                        >
                          Enviar a Deuda <ArrowRight size={18} />
                        </button>
                      )}
                  </div>
                </div>
              )
            })
          ) : <EmptyState message="Bandeja de entrada vacía" icon={Inbox} />}
        </div>
      </section>

      {/* --- SECCIÓN 2: KANBAN DE GESTIÓN (COBRO) --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* COLUMNA: POR COBRAR (DEUDA ACTIVA) */}
        <div 
          onDragOver={(e) => {e.preventDefault(); setIsOverBox('por_cobrar')}} 
          onDragLeave={() => setIsOverBox(null)} 
          onDrop={(e) => { onDrop(e, 'por_cobrar'); onDragEnd(); }}
          className={`p-8 rounded-[3.5rem] border transition-all duration-500 min-h-[450px] flex flex-col ${
            isOverBox === 'por_cobrar' ? 'bg-emerald-500/10 border-emerald-500 shadow-2xl' : 'bg-emerald-500/[0.03] border-emerald-500/10'
          }`}
        >
          <div className="flex items-center justify-between mb-8 border-b border-emerald-500/10 pb-6">
            <h3 className="text-emerald-500 font-black uppercase text-sm italic tracking-[0.2em] flex items-center gap-3">
              <TrendingUp size={20} /> Deuda Activa
            </h3>
            <span className="text-[10px] font-black text-emerald-500/50">SEGUIMIENTO</span>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {gestion.porCobrar.length > 0 ? (
              gestion.porCobrar.map((m: any) => (
                <div key={m.id} draggable onDragStart={(e) => onDragStart(e, m.id)} onDragEnd={onDragEnd} className="group bg-slate-950/60 p-5 rounded-[2rem] border border-emerald-500/10 flex flex-col gap-4 transition-all hover:border-emerald-500/40">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                       <p className="text-[9px] font-black text-emerald-500/60 uppercase italic">
                         REM: {m.remitos?.numero_remito || 'S/N'}
                       </p>
                       <p className="text-[10px] text-slate-400 font-bold truncate max-w-[200px]">{m.detalle}</p>
                       <p className="text-2xl font-black italic tracking-tighter text-white tabular-nums">${Number(m.debe).toLocaleString('es-AR')}</p>
                    </div>
                    <GripVertical size={18} className="text-slate-800 hidden md:block group-hover:text-emerald-500/30 cursor-grab" />
                  </div>
                  
                  <div className="flex items-center gap-2 pt-3 border-t border-white/5">
                    <button onClick={() => moverOperacion(m.id, 'maestro')} className="p-3 text-slate-600 hover:text-sky-500 transition-colors" title="Devolver a bandeja">
                      <RotateCcw size={16} />
                    </button>
                    <button onClick={() => moverOperacion(m.id, 'cobrado')} className="flex-1 py-3 bg-emerald-500/10 text-emerald-500 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-900/20">
                      Confirmar Cobro <CheckCircle2 size={14} />
                    </button>
                  </div>
                </div>
              ))
            ) : <EmptyState message="Sin deudas pendientes" icon={TrendingUp} />}
          </div>
        </div>

        {/* COLUMNA: COBRADOS (HISTORIAL RECIENTE) */}
        <div 
          onDragOver={(e) => {e.preventDefault(); setIsOverBox('cobrado')}} 
          onDragLeave={() => setIsOverBox(null)} 
          onDrop={(e) => { onDrop(e, 'cobrado'); onDragEnd(); }}
          className={`p-8 rounded-[3.5rem] border transition-all duration-500 min-h-[450px] flex flex-col ${
            isOverBox === 'cobrado' ? 'bg-slate-800/50 border-slate-500 shadow-2xl' : 'bg-white/[0.01] border-white/5'
          }`}
        >
          <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-6">
            <h3 className="text-slate-500 font-black uppercase text-sm italic tracking-[0.2em] flex items-center gap-3">
              <CheckCircle2 size={20} /> Historial
            </h3>
            <span className="text-[10px] font-black text-slate-700 uppercase">LIQUIDADOS</span>
          </div>

          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {gestion.cobrados.length > 0 ? (
              gestion.cobrados.map((m: any) => (
                <div key={m.id} draggable onDragStart={(e) => onDragStart(e, m.id)} onDragEnd={onDragEnd} className="bg-slate-950/30 p-5 rounded-[2rem] border border-white/5 flex flex-col gap-3 opacity-60 hover:opacity-100 transition-all">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-[9px] font-black text-slate-500 uppercase italic">REM: {m.remitos?.numero_remito || 'S/N'}</p>
                      <p className={`text-xl font-black italic tracking-tighter tabular-nums ${Number(m.haber) > 0 ? 'text-emerald-500' : 'text-slate-400'}`}>
                         {Number(m.haber) > 0 ? '+' : ''}${Number(m.debe || m.haber).toLocaleString('es-AR')}
                      </p>
                    </div>
                    <GripVertical size={18} className="text-slate-800 hidden md:block cursor-grab" />
                  </div>
                  <div className="flex items-center gap-2 pt-2 border-t border-white/5">
                    <button onClick={() => moverOperacion(m.id, 'por_cobrar')} className="flex-1 py-2.5 bg-white/5 rounded-xl text-slate-400 text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:border-emerald-500/30 hover:text-emerald-500 transition-all">
                      <ChevronLeft size={14} /> Revertir a Deuda
                    </button>
                  </div>
                </div>
              ))
            ) : <EmptyState message="Historial de cobros vacío" icon={CheckCircle2} />}
          </div>
        </div>

      </div>
    </div>
  )
}