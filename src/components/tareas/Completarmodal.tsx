'use client'
import { X, Banknote, CheckCircle2, XCircle, DollarSign } from 'lucide-react'

interface Props {
  tarea: any
  onClose: () => void
  onCompletarConCaja: () => void
  onCompletarSinCaja: () => void
}

export function CompletarModal({ tarea, onClose, onCompletarConCaja, onCompletarSinCaja }: Props) {
  if (!tarea) return null

  const monto = Number(tarea.monto) || 0

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 font-sans italic">
      <div className="bg-[#020617] w-full max-w-sm rounded-[2rem] border border-white/10 p-7 shadow-2xl relative animate-in fade-in zoom-in-95 duration-300">

        <div className="absolute top-0 left-0 w-full h-1 rounded-t-[2rem] bg-emerald-500" />

        {/* HEADER */}
        <div className="flex justify-between items-start mb-5">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-emerald-400 mb-1">Completar Tarea</p>
            <h2 className="text-lg font-black text-white uppercase tracking-tight leading-tight">{tarea.titulo}</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-slate-500 hover:text-white hover:rotate-90 transition-all">
            <X size={16} />
          </button>
        </div>

        {/* INFO MONTO */}
        <div className="flex items-center gap-3 p-4 bg-emerald-500/[0.06] border border-emerald-500/15 rounded-xl mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/15 flex items-center justify-center shrink-0">
            <DollarSign size={18} className="text-emerald-400" />
          </div>
          <div>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Monto asociado</p>
            <p className="text-2xl font-black text-emerald-400 tabular-nums tracking-tight">
              $ {monto.toLocaleString('es-AR')}
            </p>
          </div>
        </div>

        {/* 3 BOTONES */}
        <div className="space-y-2.5">

          {/* Opción 1: Cumplir + Descontar */}
          <button
            onClick={onCompletarConCaja}
            className="w-full flex items-center gap-3 px-5 py-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black uppercase text-[9px] tracking-widest transition-all active:scale-[0.98] shadow-xl"
          >
            <Banknote size={18} />
            <div className="text-left">
              <p>Cumplir y descontar de caja</p>
              <p className="text-[7px] font-bold text-emerald-200/60 normal-case tracking-normal mt-0.5">
                Se registra el egreso de ${monto.toLocaleString('es-AR')} en movimientos
              </p>
            </div>
          </button>

          {/* Opción 2: Cumplir SIN descontar */}
          <button
            onClick={onCompletarSinCaja}
            className="w-full flex items-center gap-3 px-5 py-4 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white font-black uppercase text-[9px] tracking-widest transition-all active:scale-[0.98]"
          >
            <CheckCircle2 size={18} className="text-violet-400" />
            <div className="text-left">
              <p>Cumplir sin descontar</p>
              <p className="text-[7px] font-bold text-slate-500 normal-case tracking-normal mt-0.5">
                Se marca como hecha pero no se toca la caja
              </p>
            </div>
          </button>

          {/* Opción 3: Cancelar */}
          <button
            onClick={onClose}
            className="w-full flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-slate-500 hover:text-slate-300 font-black uppercase text-[9px] tracking-widest transition-all"
          >
            <XCircle size={14} />
            Cancelar
          </button>
        </div>
      </div>
    </div>
  )
}