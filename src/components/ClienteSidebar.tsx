'use client'
import { Plus, Search, Loader2, Menu, X as CloseIcon, User, Users } from 'lucide-react'

export function ClienteSidebar({ 
  clientes, selectedId, onSelect, loading, searchTerm, setSearchTerm, onAdd, isOpen, setIsOpen 
}: any) {
  return (
    <>
      {/* Botón flotante para móvil - Posicionado para evitar el Navbar del celular */}
      {!isOpen && (
        <button 
          onClick={() => setIsOpen(true)}
          className="lg:hidden fixed bottom-8 right-6 z-[100] bg-sky-600 text-white p-5 rounded-full shadow-[0_0_20px_rgba(2,132,199,0.5)] active:scale-90 transition-all border border-sky-400/30 flex items-center justify-center"
        >
          <Users size={28} />
        </button>
      )}

      {/* Backdrop para móvil */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110] lg:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-[120] w-80 bg-[#020617] border-r border-white/5 flex flex-col transition-transform duration-300
        lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        pt-10 lg:pt-28 
      `}>
        
        <div className="mt-10 p-6 border-b border-white/5 space-y-5 ">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-black tracking-tighter uppercase italic text-white flex items-center gap-2">
              <User size={20} className="text-sky-500" /> Clientes
            </h1>
            <div className="flex gap-2">
                <button 
                  onClick={onAdd} 
                  className="p-2.5 bg-sky-600 text-white rounded-xl hover:bg-sky-500 shadow-lg active:scale-95 transition-all border border-sky-400/20"
                >
                  <Plus size={18} strokeWidth={3} />
                </button>
                <button 
                  onClick={() => setIsOpen(false)}
                  className="lg:hidden p-2.5 bg-white/5 text-slate-400 rounded-xl border border-white/10"
                >
                  <CloseIcon size={18} />
                </button>
            </div>
          </div>
          
          <div className="relative">
            <Search className="absolute left-3 top-3 text-slate-500" size={16} />
            <input 
              type="text" placeholder="BUSCAR RAZÓN SOCIAL..." 
              className="w-full pl-10 pr-4 py-3 bg-slate-950 border border-white/10 rounded-2xl outline-none text-[11px] text-white focus:ring-1 focus:ring-sky-500/50 uppercase font-bold italic tracking-wider placeholder:text-slate-700"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
          {loading ? (
            <div className="p-10 text-center flex flex-col items-center gap-3">
              <Loader2 className="animate-spin text-sky-500" size={30} />
              <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest animate-pulse">Sincronizando...</p>
            </div>
          ) : (
            clientes.map((c: any) => {
              const saldoActual = c.saldo || 0;
              const tieneDeuda = saldoActual > 0;

              return (
                <div 
                  key={c.id} 
                  onClick={() => { onSelect(c); setIsOpen(false); }} 
                  className={`p-5 rounded-2xl cursor-pointer transition-all flex justify-between items-center group relative overflow-hidden ${
                    selectedId === c.id 
                    ? 'bg-sky-600/10 border border-sky-500/30' 
                    : 'hover:bg-white/5 border border-transparent'
                  }`}
                >
                  <div className="truncate pr-2 relative z-10">
                    <span className="font-black text-white block text-xs truncate uppercase leading-none tracking-tighter italic">
                      {c.razon_social}
                    </span>
                    <span className="text-[9px] text-slate-600 font-bold uppercase mt-1 block">
                      CUIT: {c.cuit || '---'}
                    </span>
                  </div>
                  <div className="text-right relative z-10">
                    <p className={`text-[11px] font-black tabular-nums ${tieneDeuda ? 'text-emerald-500' : 'text-slate-500'}`}>
                      $ {saldoActual.toLocaleString('es-AR')}
                    </p>
                    <div className={`h-1 w-1 rounded-full ml-auto mt-1 ${tieneDeuda ? 'bg-emerald-500 animate-pulse' : 'bg-slate-800'}`} />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Cierre para móvil con margen extra para evitar el navbar del celular */}
        <div className="lg:hidden p-6 pb-12 border-t border-white/5 bg-slate-950/50">
          <button 
            onClick={() => setIsOpen(false)}
            className="w-full py-4 bg-rose-500/10 text-rose-500 font-black rounded-2xl flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest border border-rose-500/20 active:bg-rose-500 active:text-white transition-all"
          >
            <CloseIcon size={16} /> Cerrar Terminal
          </button>
        </div>
      </aside>
    </>
  )
}