'use client'
import { Plus, Search, TrendingUp, DollarSign } from 'lucide-react'

export function ViajesHeader({ search, setSearch, onOpenModal, totalKm, totalFacturado }: any) {
  return (
    <div className="space-y-12">
      <header className="flex flex-col xl:flex-row justify-between items-end gap-8">
        <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.8]">
          LOGÍSTICA <br/> <span className="text-emerald-500 font-thin">/</span> VIAJES
        </h1>
        <div className="flex gap-4 w-full xl:w-auto">
          <div className="relative flex-1 xl:w-96">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" />
            <input 
              value={search} 
              onChange={e => setSearch(e.target.value)} 
              placeholder="FILTRAR DESTINO..." 
              className="w-full bg-slate-950 border border-white/10 rounded-3xl py-5 pl-14 text-white font-bold outline-none focus:border-emerald-500 uppercase italic" 
            />
          </div>
          <button onClick={onOpenModal} className="px-8 bg-emerald-600 hover:bg-emerald-500 text-white rounded-3xl font-black uppercase tracking-widest transition-all active:scale-95 flex items-center gap-2 border border-emerald-400/20">
            <Plus size={20} /> Nuevo
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-slate-900/40 p-10 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-sm relative overflow-hidden group">
          <TrendingUp className="absolute -right-4 -top-4 w-32 h-32 text-emerald-500 opacity-5 group-hover:scale-110 transition-transform" />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Recorrido Global</p>
          <p className="text-5xl font-black text-white italic tracking-tighter">
            {totalKm.toLocaleString()} <span className="text-emerald-500 text-xl not-italic uppercase ml-2">km</span>
          </p>
        </div>
        <div className="bg-slate-900/40 p-10 rounded-[2.5rem] border border-white/5 shadow-2xl backdrop-blur-sm relative overflow-hidden group">
          <DollarSign className="absolute -right-4 -top-4 w-32 h-32 text-emerald-500 opacity-5 group-hover:scale-110 transition-transform" />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Total Neto Facturado</p>
          <p className="text-5xl font-black text-white italic tracking-tighter">
            $ {totalFacturado.toLocaleString()}
          </p>
        </div>
      </div>
    </div>
  )
}