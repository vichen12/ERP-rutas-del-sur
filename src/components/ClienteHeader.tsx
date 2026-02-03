'use client'
import { Landmark, Mail, Trash2 } from 'lucide-react'

export function ClienteHeader({ selected, onBackup, onDelete, onNuevaOp, backupLoading }: any) {
  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center bg-slate-900/40 p-6 lg:p-10 rounded-[2.5rem] border border-white/5 gap-6 backdrop-blur-md">
      <div className="flex items-center gap-4 lg:gap-6">
        <div className="p-4 bg-sky-500/10 text-sky-400 rounded-2xl shrink-0 shadow-inner"><Landmark size={30}/></div>
        <div>
          <h2 className="text-2xl lg:text-4xl font-black text-white tracking-tighter uppercase italic leading-tight">{selected.razon_social}</h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-1 italic">{selected.cuit} • {selected.direccion}</p>
        </div>
      </div>
      <div className="flex gap-2 w-full lg:w-auto">
        <button onClick={onBackup} className="flex-1 lg:flex-none p-4 bg-white/5 text-slate-300 rounded-2xl border border-white/5 active:scale-95 transition-all">
          {backupLoading ? <span className="animate-pulse">...</span> : <Mail size={20} />}
        </button>
        <button onClick={onDelete} className="flex-1 lg:flex-none p-4 bg-rose-500/10 text-rose-500 rounded-2xl border border-rose-500/10 active:scale-95 transition-all">
          <Trash2 size={20} />
        </button>
        <button 
          onClick={onNuevaOp}
          className="flex-[2] lg:flex-none bg-sky-600 hover:bg-sky-500 text-white px-8 py-4 rounded-2xl font-black text-xs transition-all shadow-xl shadow-sky-900/20 uppercase tracking-widest active:scale-95"
        >
          Nueva Operación
        </button>
      </div>
    </div>
  )
}