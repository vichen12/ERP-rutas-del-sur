'use client'
import { Landmark, Mail, Trash2, Plus, ShieldCheck } from 'lucide-react'

export function ClienteHeader({ selected, onBackup, onDelete, onNuevaOp, backupLoading }: any) {
  return (
    <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end bg-slate-900/40 p-8 lg:p-12 rounded-[3.5rem] border border-white/5 gap-8 backdrop-blur-xl relative overflow-hidden group italic">
      
      {/* Decoración de fondo sutil */}
      <div className="absolute -right-20 -bottom-20 w-64 h-64 bg-sky-500/5 blur-[100px] rounded-full group-hover:bg-sky-500/10 transition-all duration-700" />

      <div className="flex items-center gap-6 lg:gap-8 relative z-10">
        <div className="p-5 bg-sky-600/10 text-sky-500 rounded-3xl shrink-0 shadow-2xl border border-sky-500/20">
          <Landmark size={36} strokeWidth={2.5} />
        </div>
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-[0.2em] rounded-full border border-emerald-500/20 flex items-center gap-1">
              <ShieldCheck size={10} /> Cuenta Verificada
            </span>
          </div>
          <h2 className="text-4xl lg:text-6xl font-black text-white tracking-tighter uppercase leading-[0.8] mb-3">
            {selected.razon_social}
          </h2>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] flex flex-wrap gap-x-4 gap-y-1">
            <span>CUIT: {selected.cuit}</span>
            <span className="text-slate-700">|</span>
            <span>DIR: {selected.direccion || 'MENDOZA, ARGENTINA'}</span>
          </p>
        </div>
      </div>

      <div className="flex gap-3 w-full lg:w-auto relative z-10">
        {/* Botón Backup / Mail */}
        <button 
          onClick={onBackup} 
          title="Enviar Resumen por Mail"
          className="flex-1 lg:flex-none p-5 bg-white/5 text-slate-400 rounded-[1.5rem] border border-white/5 hover:bg-white/10 hover:text-white active:scale-95 transition-all flex items-center justify-center"
        >
          {backupLoading ? <span className="animate-pulse font-black text-[10px]">...</span> : <Mail size={22} />}
        </button>

        {/* Botón Eliminar Cliente */}
        <button 
          onClick={onDelete} 
          title="Dar de baja cliente"
          className="flex-1 lg:flex-none p-5 bg-rose-500/5 text-rose-500/50 rounded-[1.5rem] border border-rose-500/10 hover:bg-rose-600 hover:text-white active:scale-95 transition-all flex items-center justify-center"
        >
          <Trash2 size={22} />
        </button>

        {/* Botón Acción Principal */}
        <button 
          onClick={onNuevaOp}
          className="flex-[3] lg:flex-none bg-sky-600 hover:bg-sky-500 text-white px-10 py-5 rounded-[1.5rem] font-black text-[11px] transition-all shadow-2xl shadow-sky-900/40 uppercase tracking-[0.2em] active:scale-95 flex items-center justify-center gap-3 border border-sky-400/20"
        >
          <Plus size={18} strokeWidth={3} /> Nueva Factura
        </button>
      </div>
    </div>
  )
}