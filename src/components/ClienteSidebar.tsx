'use client'
import { Plus, Search, Loader2, Menu, X as CloseIcon } from 'lucide-react'

export function ClienteSidebar({ 
  clientes, selectedId, onSelect, loading, searchTerm, setSearchTerm, onAdd, isOpen, setIsOpen 
}: any) {
  return (
    <>
      {/* Botón flotante para móvil */}
      <button 
        onClick={() => setIsOpen(true)}
        className="lg:hidden fixed bottom-6 right-6 z-[60] bg-sky-600 text-white p-4 rounded-full shadow-2xl active:scale-90 transition-transform"
      >
        <Menu size={24} />
      </button>

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-[#020617] border-r border-white/5 flex flex-col transition-transform duration-300
        lg:relative lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        pt-24 lg:pt-28 
      `}>
        {/* El pt-24/28 asegura que el contenido empiece DEBAJO del Navbar */}
        
        <div className="p-6 border-b border-white/5 space-y-4">
          <div className="flex justify-between items-center">
            <h1 className="text-xl font-black tracking-tighter uppercase italic text-white">Clientes</h1>
            <button 
              onClick={onAdd} 
              className="p-2 bg-sky-600 text-white rounded-xl hover:bg-sky-500 shadow-lg active:scale-95 transition-all"
            >
              <Plus size={18} />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-500" size={16} />
            <input 
              type="text" placeholder="Buscar cliente..." 
              className="w-full pl-9 pr-4 py-2.5 bg-slate-950 border border-white/5 rounded-xl outline-none text-sm text-white focus:ring-1 focus:ring-sky-500/50 uppercase"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {loading ? (
            <div className="p-10 text-center"><Loader2 className="animate-spin mx-auto text-sky-500" /></div>
          ) : (
            clientes.map((c: any) => (
              <div 
                key={c.id} 
                onClick={() => { onSelect(c); setIsOpen(false); }} 
                className={`p-4 rounded-xl cursor-pointer transition-all flex justify-between items-center ${selectedId === c.id ? 'bg-sky-500/10 border-l-4 border-sky-600' : 'hover:bg-white/5 border-l-4 border-transparent'}`}
              >
                <div className="truncate pr-2">
                  <span className="font-bold text-white block text-xs truncate uppercase leading-none">{c.razon_social}</span>
                  <span className="text-[9px] text-slate-500 font-bold uppercase">{c.cuit}</span>
                </div>
                <p className={`text-[11px] font-black ${c.saldo > 0 ? 'text-rose-500' : 'text-emerald-400'}`}>
                  ${c.saldo.toLocaleString('es-AR')}
                </p>
              </div>
            ))
          )}
        </div>

        {/* Cierre para móvil al final */}
        <div className="lg:hidden p-4 border-t border-white/5 bg-slate-950/50">
          <button 
            onClick={() => setIsOpen(false)}
            className="w-full py-4 bg-white/5 text-slate-400 font-black rounded-2xl flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest"
          >
            <CloseIcon size={16} /> Cerrar Lista
          </button>
        </div>
      </aside>
    </>
  )
}