'use client'
import { Plus, Search, Loader2, User, Users, Phone, MapPin, FileStack, ArrowRight } from 'lucide-react'

export function ClienteSidebar({ 
  clientes, selectedId, onSelect, loading, searchTerm, setSearchTerm, onAdd, isOpen, setIsOpen 
}: any) {
  return (
    <>
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="lg:hidden fixed bottom-8 right-6 z-[100] bg-sky-600 text-white p-5 rounded-full shadow-[0_0_30px_rgba(2,132,199,0.3)] active:scale-95 transition-all border border-sky-400/30"
        >
          <Users size={28} />
        </button>
      )}

      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md z-[110] lg:hidden animate-in fade-in duration-300" onClick={() => setIsOpen(false)} />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-[120] w-80 md:w-96 bg-[#020617] border-r border-white/5 flex flex-col transition-transform duration-500 ease-in-out font-sans italic
        lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        pt-10 lg:pt-20 
      `}>
        
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
               <h1 className="text-xl font-black tracking-tighter uppercase italic text-white leading-none">
                 Terminal <span className="text-sky-500">Logística</span>
               </h1>
               <p className="text-[8px] font-bold text-slate-500 uppercase tracking-[0.3em] mt-1.5 text-balance">Mendoza • Rutas del Sur ERP</p>
            </div>
            <button onClick={onAdd} className="p-3 bg-sky-600/10 text-sky-500 rounded-2xl hover:bg-sky-600 hover:text-white transition-all border border-sky-500/20 group">
              <Plus size={20} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
            </button>
          </div>
          
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-sky-500 transition-colors" size={14} />
            <input 
              type="text" placeholder="BUSCAR POR NOMBRE O CUIT..." 
              className="w-full pl-11 pr-4 py-4 bg-slate-900/30 border border-white/5 rounded-[1.5rem] outline-none text-[10px] text-white focus:border-sky-500/50 uppercase font-black italic tracking-widest placeholder:text-slate-800 transition-all shadow-inner"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-4 space-y-3 custom-scrollbar pb-24">
          {loading ? (
            <div className="p-10 text-center flex flex-col items-center gap-3 opacity-20">
              <Loader2 className="animate-spin text-sky-500" size={30} />
            </div>
          ) : (
            clientes.map((c: any) => {
              const saldoActual = Number(c.saldo) || 0;
              const tieneDeuda = saldoActual > 0;
              const isSelected = selectedId === c.id;
              const cantPendientes = c.cuenta_corriente?.filter((f:any) => Number(f.debe) > 0 && Number(f.haber) === 0).length || 0;

              return (
                <div 
                  key={c.id} 
                  onClick={() => { onSelect(c); setIsOpen(false); }} 
                  className={`group relative p-6 rounded-[2.2rem] cursor-pointer transition-all duration-300 border ${
                    isSelected 
                    ? 'bg-sky-600/5 border-sky-500/40 shadow-[0_10px_40px_rgba(0,0,0,0.3)]' 
                    : 'bg-white/[0.01] border-transparent hover:bg-white/[0.03] hover:border-white/5'
                  }`}
                >
                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 truncate flex items-center gap-2">
                        {/* 🚀 CAMBIO 3: Puntito naranja si tiene alertaRemito */}
                        {c.alertaRemito && (
                          <span 
                            className="shrink-0 w-2 h-2 rounded-full bg-orange-500 shadow-[0_0_6px_rgba(249,115,22,0.8)] animate-pulse" 
                            title="Remito pendiente"
                          />
                        )}
                        <div className="truncate">
                          <h3 className={`font-black text-xs uppercase leading-tight italic truncate ${isSelected ? 'text-sky-400' : 'text-slate-200 group-hover:text-white'}`}>
                            {c.razon_social}
                          </h3>
                          <p className="text-[8px] text-slate-600 font-bold mt-1.5 uppercase tracking-tighter">{c.cuit || 'S/ CUIT'}</p>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className={`text-sm font-black tabular-nums ${tieneDeuda ? 'text-emerald-500' : 'text-slate-700'}`}>
                          ${saldoActual.toLocaleString('es-AR')}
                        </p>
                        <div className="flex items-center gap-1 justify-end mt-1">
                            <FileStack size={10} className="text-slate-800" />
                            <span className="text-[8px] font-black text-slate-700 uppercase">{cantPendientes} Doc.</span>
                        </div>
                      </div>
                    </div>

                    <div className={`p-3 rounded-2xl border flex items-center justify-between text-[9px] font-black uppercase tracking-tighter transition-all ${
                        isSelected ? 'bg-sky-500/10 border-sky-500/20 text-sky-300' : 'bg-black/30 border-white/5 text-slate-500'
                    }`}>
                        <div className="flex items-center gap-2 truncate">
                          <MapPin size={12} className={isSelected ? 'text-sky-400' : 'text-slate-700'} />
                          <span className="truncate">{c.ruta_origen || 'S/O'}</span>
                        </div>
                        <ArrowRight size={10} className="mx-2 opacity-20 shrink-0" />
                        <span className="truncate text-right">{c.ruta_destino || 'S/D'}</span>
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-white/[0.02] mt-2">
                       <div className="flex items-center gap-2 truncate">
                          <User size={12} className="text-slate-700" />
                          <span className="text-[9px] font-bold text-slate-600 uppercase truncate">
                            {c.nombre_contacto || 'S/ CONTACTO'}
                          </span>
                       </div>
                       <div className="flex items-center gap-2 shrink-0">
                          <Phone size={12} className="text-emerald-600/50" />
                          <span className="text-[9px] font-black text-slate-400 tabular-nums">
                            {c.telefono || 'S/N'}
                          </span>
                       </div>
                    </div>
                  </div>
                  
                  {isSelected && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-12 bg-sky-500 rounded-r-full shadow-[0_0_15px_rgba(14,165,233,0.5)]" />
                  )}
                </div>
              );
            })
          )}
        </div>

        <div className="lg:hidden p-6 pb-12 border-t border-white/5 bg-slate-950/50">
           <button onClick={() => setIsOpen(false)} className="w-full py-4 bg-white/5 text-slate-600 font-black rounded-3xl uppercase text-[9px] tracking-[0.4em] border border-white/5 active:bg-rose-500/10 active:text-rose-500 transition-all">
             Cerrar Terminal
           </button>
        </div>
      </aside>
    </>
  )
}
