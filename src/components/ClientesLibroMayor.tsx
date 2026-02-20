'use client'
import { 
  Inbox, TrendingUp, CheckCircle2, Hash, Edit3,
  Trash2, ArrowRight, Calendar, AlertTriangle, 
  FileEdit, Truck, Receipt, User, DollarSign, Wallet
} from 'lucide-react'

export function ClientesLibroMayor({ 
  gestion, aprobarViaje, eliminarOperacion, onCompletarRemito, onEditOperacion 
}: any) {

  const EmptyState = ({ message, icon: Icon }: { message: string, icon: any }) => (
    <div className="flex flex-col items-center justify-center py-16 px-4 border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
      <div className="p-6 bg-white/5 rounded-full mb-4">
        <Icon size={32} className="text-slate-600" />
      </div>
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 text-center">{message}</p>
    </div>
  )

  return (
    <div className="space-y-12 pb-32 font-sans italic">
      
      {/* --- SECCIÓN 1: BANDEJA DE ENTRADA --- */}
      <section className="relative p-8 md:p-12 rounded-[3.5rem] border bg-[#020617]/50 border-white/10 shadow-2xl backdrop-blur-md overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-sky-500 to-indigo-500 opacity-50" />
        
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-10 relative z-10">
          <div className="flex items-center gap-5">
            <div className="p-4 bg-sky-500/10 rounded-2xl text-sky-400 border border-sky-500/20">
              <Inbox size={26} strokeWidth={1.5} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter text-white leading-none">Bandeja de Entrada</h2>
              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1.5">Operaciones esperando remitos para ser cobradas</p>
            </div>
          </div>
          
          {/* BANNER DE SALDOS */}
          <div className="flex gap-4 p-4 bg-black/40 rounded-3xl border border-white/5 w-full md:w-auto">
            <div className="px-4 border-r border-white/10">
               <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">El Cliente Debe</p>
               <p className="text-2xl font-black italic tabular-nums text-emerald-500 leading-none">${gestion.saldoPendiente.toLocaleString()}</p>
            </div>
            <div className="px-4">
               <p className="text-[9px] text-slate-500 font-black uppercase tracking-widest mb-1">A Favor del Cliente</p>
               <p className="text-2xl font-black italic tabular-nums text-rose-500 leading-none">${gestion.saldoAFavor.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 relative z-10">
          {gestion.maestro.length > 0 ? (
            gestion.maestro.map((m: any) => {
              const remitoActual = m.remito || '';
              const esViaje = Boolean(m.viaje_id) || String(m.detalle).includes('FLETE');
              const faltaRemito = esViaje && (remitoActual === '' || remitoActual === 'PENDIENTE');

              return (
                <div key={m.id} className={`group relative p-[1px] rounded-[2.5rem] transition-all duration-300 shadow-xl ${
                    faltaRemito ? 'bg-gradient-to-b from-orange-500/40 to-transparent' : 'bg-gradient-to-b from-sky-500/30 to-transparent'
                  }`}
                >
                  <div className="bg-[#020617] rounded-[2.4rem] p-7 flex flex-col md:flex-row justify-between items-center gap-6 h-full relative overflow-hidden">
                    {faltaRemito && <div className="absolute top-0 right-0 w-64 h-64 bg-orange-500/10 blur-[60px] rounded-full pointer-events-none" />}

                    <div className="flex items-center gap-6 w-full relative z-10">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                           {faltaRemito ? (
                             <span className="flex items-center gap-1.5 bg-orange-500/10 px-3 py-1.5 rounded-xl text-orange-400 text-[9px] font-black uppercase border border-orange-500/30 animate-pulse">
                               <AlertTriangle size={12} strokeWidth={2.5} /> Requiere Remito
                             </span>
                           ) : (
                             <span className="flex items-center gap-1.5 bg-sky-500/10 px-3 py-1.5 rounded-xl text-sky-400 text-[10px] font-black uppercase border border-sky-500/20">
                               <Hash size={12} /> {m.remito || 'SIN REMITO'}
                             </span>
                           )}
                           <span className="text-[10px] text-slate-500 font-bold flex items-center gap-1.5">
                              <Calendar size={12} /> {new Date(m.fecha).toLocaleDateString('es-AR', { timeZone: 'UTC' })}
                           </span>
                        </div>
                        
                        <div>
                          <p className="text-xs text-slate-300 font-bold uppercase flex items-center gap-2 mb-2">
                            {esViaje ? <Truck size={14} className={faltaRemito ? "text-orange-400" : "text-emerald-400"}/> : <Receipt size={14} className="text-sky-400"/>} 
                            {m.detalle}
                          </p>
                          <p className="text-4xl font-black italic tracking-tighter tabular-nums text-white">
                            ${Number(m.debe).toLocaleString('es-AR')}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="flex flex-wrap md:flex-col lg:flex-row items-center gap-3 w-full md:w-auto relative z-10">
                        <div className="flex bg-white/5 rounded-2xl border border-white/5">
                          <button onClick={() => onCompletarRemito(m.id, remitoActual)} className="p-5 text-slate-400 hover:text-sky-400 hover:bg-white/5 rounded-l-2xl transition-all" title="Editar Remito/Foto">
                            <Edit3 size={20}/>
                          </button>
                          <div className="w-[1px] bg-white/10" />
                          <button onClick={() => eliminarOperacion(m.id)} className="p-5 text-slate-400 hover:text-rose-400 hover:bg-white/5 rounded-r-2xl transition-all" title="Eliminar viaje">
                            <Trash2 size={20}/>
                          </button>
                        </div>

                        {faltaRemito ? (
                          <button onClick={() => onCompletarRemito(m.id, remitoActual)} className="flex-[3] md:flex-none px-8 py-5 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(234,88,12,0.3)] active:scale-95 transition-all border border-orange-400/50">
                            <FileEdit size={16} strokeWidth={2.5} /> Cargar Datos
                          </button>
                        ) : (
                          <button onClick={() => aprobarViaje(m.id)} className="flex-[3] md:flex-none px-8 py-5 bg-sky-600 hover:bg-sky-500 text-white rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] flex items-center justify-center gap-3 shadow-[0_0_20px_rgba(14,165,233,0.3)] active:scale-95 transition-all border border-sky-400/50">
                            Aprobar Viaje <ArrowRight size={18} strokeWidth={2.5} />
                          </button>
                        )}
                    </div>
                  </div>
                </div>
              )
            })
          ) : <EmptyState message="No hay viajes pendientes de revisión" icon={Inbox} />}
        </div>
      </section>

      {/* --- SECCIÓN 2: LAS 3 COLUMNAS --- */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* COLUMNA 1: PAGOS DEL CLIENTE */}
        <div className="p-6 rounded-[3rem] border bg-emerald-950/10 border-emerald-500/20 flex flex-col h-[600px]">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-emerald-500/10">
            <h3 className="text-emerald-400 font-black uppercase text-sm italic flex items-center gap-2">
              <DollarSign size={18} /> Pagos Recibidos
            </h3>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {gestion.pagos.length > 0 ? (
              gestion.pagos.map((m: any) => (
                <div key={m.id} className="bg-emerald-900/10 p-5 rounded-3xl border border-emerald-500/10 flex justify-between items-center group relative overflow-hidden">
                  <div className="absolute left-0 top-0 w-1 h-full bg-emerald-500" />
                  <div className="pl-2">
                    <p className="text-[9px] text-emerald-500/70 font-black uppercase tracking-widest">{new Date(m.fecha).toLocaleDateString('es-AR', { timeZone: 'UTC' })}</p>
                    <p className="text-[10px] text-emerald-100 font-bold uppercase mt-1">{m.detalle || 'TRANSFERENCIA'}</p>
                    <p className="text-2xl font-black italic tracking-tighter tabular-nums text-emerald-400">+${Number(m.haber).toLocaleString('es-AR')}</p>
                  </div>
                  {/* 🚀 BOTONES VISIBLES EN CELULAR SIEMPRE */}
                  <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => onEditOperacion(m)} className="p-3 text-slate-500 hover:text-sky-400 hover:bg-white/5 rounded-xl transition-all"><Edit3 size={16}/></button>
                    <button onClick={() => eliminarOperacion(m.id)} className="p-3 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl transition-all"><Trash2 size={16}/></button>
                  </div>
                </div>
              ))
            ) : <EmptyState message="Sin pagos" icon={Wallet} />}
          </div>
        </div>

        {/* COLUMNA 2: DEUDA ACTIVA */}
        <div className="p-6 rounded-[3rem] border bg-emerald-950/10 border-emerald-500/20 flex flex-col h-[600px]">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-emerald-500/10">
            <h3 className="text-emerald-400 font-black uppercase text-sm italic flex items-center gap-2">
              <TrendingUp size={18} /> Deuda Activa
            </h3>
            <span className="text-[9px] font-black text-emerald-500/40 uppercase bg-emerald-500/5 px-2 py-1 rounded-md border border-emerald-500/10">A Cobrar</span>
          </div>
          <div className="space-y-4 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {gestion.deudaActiva.length > 0 ? (
              gestion.deudaActiva.map((m: any) => {
                const totalViaje = Number(m.debe);
                const porcentajePagado = m.pagado > 0 ? (m.pagado / totalViaje) * 100 : 0;
                
                const patente = m.viajes?.camiones?.patente || null;
                const chofer = m.viajes?.choferes?.nombre || null;
                const fechaViaje = m.fecha ? new Date(m.fecha).toLocaleDateString('es-AR', { timeZone: 'UTC' }) : null;

                return (
                  <div key={m.id} className="bg-[#020617] p-6 rounded-3xl border border-white/5 relative overflow-hidden shadow-lg group">
                    <div className="flex justify-between items-start relative z-10">
                      <div>
                        <div className="flex gap-2 items-center flex-wrap">
                           <span className="text-[9px] font-black text-slate-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-md uppercase italic">REM: {m.remito}</span>
                           {fechaViaje && <span className="text-[9px] font-black text-slate-500 flex items-center gap-1"><Calendar size={10}/> {fechaViaje}</span>}
                        </div>
                        <p className="text-[10px] text-slate-300 font-bold uppercase mt-2 line-clamp-1">{m.detalle}</p>
                        
                        {(patente || chofer) && (
                           <div className="flex items-center gap-1 mt-2">
                             {patente && <span className="flex items-center gap-1 text-[8px] bg-slate-900 border border-white/10 px-1.5 py-0.5 rounded text-slate-500 font-black uppercase"><Truck size={8}/> {patente}</span>}
                             {chofer && <span className="flex items-center gap-1 text-[8px] bg-slate-900 border border-white/10 px-1.5 py-0.5 rounded text-slate-500 font-black uppercase truncate max-w-[100px]"><User size={8}/> {chofer}</span>}
                           </div>
                        )}
                      </div>
                      <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                         <button onClick={() => onCompletarRemito(m.id, m.remito)} className="p-2 text-slate-600 hover:text-sky-400"><Edit3 size={14}/></button>
                         <button onClick={() => eliminarOperacion(m.id)} className="p-2 text-slate-600 hover:text-rose-500"><Trash2 size={14}/></button>
                      </div>
                    </div>
                    
                    <div className="relative z-10 mt-4 pt-4 border-t border-white/5">
                      <div className="flex items-end justify-between mb-2">
                         <div>
                            <p className="text-[9px] font-black uppercase tracking-widest text-emerald-500/80 mb-0.5">Pendiente de Cobro</p>
                            <p className="text-3xl font-black italic tracking-tighter tabular-nums text-white leading-none">
                              ${m.falta.toLocaleString('es-AR')}
                            </p>
                         </div>
                         <div className="text-right">
                            <p className="text-[8px] font-black uppercase tracking-widest text-slate-600 mb-0.5">Total Viaje</p>
                            <p className="text-[11px] font-black italic tabular-nums text-slate-400">
                              ${totalViaje.toLocaleString('es-AR')}
                            </p>
                         </div>
                      </div>
                      
                      {m.pagado > 0 && (
                         <>
                            <div className="w-full bg-slate-900 h-1.5 rounded-full overflow-hidden border border-white/5 mt-3 mb-1.5">
                              <div className="h-full bg-emerald-500 transition-all duration-1000" style={{ width: `${porcentajePagado}%` }} />
                            </div>
                            <div className="flex justify-between text-[8px] font-black uppercase">
                               <span className="text-emerald-500">Abonado: ${m.pagado.toLocaleString('es-AR')}</span>
                               <span className="text-slate-500">{porcentajePagado.toFixed(0)}% Completado</span>
                            </div>
                         </>
                      )}
                    </div>
                  </div>
                )
              })
            ) : <EmptyState message="Sin deudas pendientes" icon={TrendingUp} />}
          </div>
        </div>

        {/* COLUMNA 3: HISTORIAL LIQUIDADOS */}
        <div className="p-6 rounded-[3rem] border bg-slate-900/20 border-white/5 flex flex-col h-[600px]">
          <div className="flex items-center justify-between mb-6 pb-4 border-b border-white/5">
            <h3 className="text-slate-400 font-black uppercase text-sm italic flex items-center gap-2">
              <CheckCircle2 size={18} /> Historial
            </h3>
            <span className="text-[9px] font-black text-slate-600 uppercase bg-white/5 px-2 py-1 rounded-md border border-white/5">Pagados 100%</span>
          </div>
          <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
            {gestion.historial.length > 0 ? (
              gestion.historial.map((m: any) => {
                const patente = m.viajes?.camiones?.patente || null;
                const chofer = m.viajes?.choferes?.nombre || null;
                const fechaViaje = m.fecha ? new Date(m.fecha).toLocaleDateString('es-AR', { timeZone: 'UTC' }) : null;

                return (
                  <div key={m.id} className="bg-white/[0.02] p-5 rounded-3xl border border-white/5 flex flex-col gap-3 opacity-80 md:opacity-60 hover:opacity-100 transition-all group">
                    <div className="flex justify-between items-start">
                       <div className="flex gap-2 items-center flex-wrap">
                          <p className="text-[9px] font-black text-slate-500 uppercase italic">REM: {m.remito || 'S/N'}</p>
                          {fechaViaje && <span className="text-[8px] font-black text-slate-600 flex items-center gap-1"><Calendar size={8}/> {fechaViaje}</span>}
                       </div>
                       <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                           <button onClick={() => onCompletarRemito(m.id, m.remito)} className="text-slate-600 hover:text-sky-400"><Edit3 size={12}/></button>
                           <button onClick={() => eliminarOperacion(m.id)} className="text-slate-600 hover:text-rose-500"><Trash2 size={12}/></button>
                       </div>
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase truncate max-w-full">{m.detalle}</p>
                      
                      {(patente || chofer) && (
                         <div className="flex items-center gap-1 mt-1.5">
                           {patente && <span className="text-[8px] text-slate-600 font-black uppercase flex items-center gap-1"><Truck size={8}/>{patente}</span>}
                           {patente && chofer && <span className="text-slate-700 mx-1">•</span>}
                           {chofer && <span className="text-[8px] text-slate-600 font-black uppercase truncate max-w-[100px] flex items-center gap-1"><User size={8}/>{chofer}</span>}
                         </div>
                      )}
                      
                      <p className="text-lg font-black italic tracking-tighter tabular-nums text-slate-500 line-through decoration-emerald-500/50 mt-1">
                        ${Number(m.debe).toLocaleString('es-AR')}
                      </p>
                    </div>
                  </div>
                )
              })
            ) : <EmptyState message="Historial vacío" icon={CheckCircle2} />}
          </div>
        </div>

      </div>
    </div>
  )
}