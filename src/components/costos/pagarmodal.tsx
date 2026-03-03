'use client'
import { useState, useEffect, useMemo } from 'react'
import { X, Loader2, Banknote, DollarSign, AlertCircle } from 'lucide-react'
import type { VariableContext } from '@/app/costos-multas/page'
import { evaluarFormula, labelFrecuencia } from '@/app/costos-multas/page'

interface Props {
  isOpen: boolean
  onClose: () => void
  onConfirm: (item: any, montoFinal: number) => void
  isSaving: boolean
  item: any
  variableContext: VariableContext
}

export function PagarModal({ isOpen, onClose, onConfirm, isSaving, item, variableContext }: Props) {
  const [montoStr, setMontoStr] = useState('')

  // Calcular monto sugerido
  const montoSugerido = useMemo(() => {
    if (!item) return 0
    const val = evaluarFormula(item.monto, variableContext)
    return (val ?? Number(item.monto)) || 0
  }, [item, variableContext])

  useEffect(() => {
    if (isOpen && item) {
      setMontoStr(String(montoSugerido))
    }
  }, [isOpen, item, montoSugerido])

  if (!isOpen || !item) return null

  const montoFinal = Number(montoStr) || 0
  const diferencia = montoFinal - montoSugerido
  const esFormula = isNaN(Number(item.monto)) && item.monto?.trim() !== ''

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 font-sans italic">
      <div className="bg-[#020617] w-full max-w-sm rounded-[2rem] border border-white/10 p-7 shadow-2xl relative animate-in fade-in zoom-in-95 duration-300">

        <div className="absolute top-0 left-0 w-full h-1 rounded-t-[2rem] bg-emerald-500" />

        {/* Header */}
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-emerald-400 mb-1">Confirmar Pago</p>
            <h2 className="text-lg font-black text-white uppercase tracking-tight">{item.nombre}</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-slate-500 hover:text-white hover:rotate-90 transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Info del item */}
        <div className="bg-slate-900/60 rounded-xl p-4 mb-5 space-y-2">
          <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
            <span className="text-slate-500">Tipo</span>
            <span className={item.tipo === 'impuesto' ? 'text-violet-400' : 'text-orange-400'}>
              {item.tipo === 'impuesto' ? 'Impuesto' : item.recurrente ? 'Costo Recurrente' : 'Costo Único'}
            </span>
          </div>
          {item.frecuencia && (
            <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
              <span className="text-slate-500">Frecuencia</span>
              <span className="text-slate-300">{labelFrecuencia(item.frecuencia)}</span>
            </div>
          )}
          {esFormula && (
            <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
              <span className="text-slate-500">Fórmula</span>
              <code className="text-violet-300 font-mono">{item.monto}</code>
            </div>
          )}
          <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
            <span className="text-slate-500">Monto Calculado</span>
            <span className="text-white">$ {montoSugerido.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</span>
          </div>
          {item.monto_ultimo_pago && (
            <div className="flex justify-between text-[9px] font-bold uppercase tracking-widest">
              <span className="text-slate-500">Último Pago</span>
              <span className="text-slate-400">$ {Number(item.monto_ultimo_pago).toLocaleString('es-AR')}</span>
            </div>
          )}
        </div>

        {/* MONTO EDITABLE */}
        <div className="space-y-1.5 mb-5">
          <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">
            Monto a Pagar (modificable)
          </label>
          <div className="relative">
            <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={18} />
            <input
              type="number" step="0.01" min="0"
              value={montoStr}
              onChange={e => setMontoStr(e.target.value)}
              className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl py-4 pl-12 pr-5 text-emerald-400 font-black text-2xl tabular-nums outline-none focus:border-emerald-500 transition-all"
            />
          </div>
          {/* Diferencia con el sugerido */}
          {diferencia !== 0 && montoFinal > 0 && (
            <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest ${
              diferencia < 0
                ? 'bg-sky-500/10 text-sky-400 border border-sky-500/10'
                : 'bg-amber-500/10 text-amber-400 border border-amber-500/10'
            }`}>
              <AlertCircle size={11} />
              {diferencia < 0
                ? `Descuento de $ ${Math.abs(diferencia).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
                : `Ajuste de + $ ${diferencia.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
              }
            </div>
          )}
        </div>

        {/* BOTONES */}
        <div className="flex gap-3">
          <button onClick={onClose}
            className="flex-1 py-3.5 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 font-black uppercase text-[9px] tracking-widest transition-all border border-white/5">
            Cancelar
          </button>
          <button
            onClick={() => montoFinal > 0 && onConfirm(item, montoFinal)}
            disabled={isSaving || montoFinal <= 0}
            className="flex-1 py-3.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:bg-slate-800 text-white disabled:text-slate-600 font-black uppercase text-[9px] tracking-widest transition-all active:scale-[0.98] flex items-center justify-center gap-2 shadow-xl">
            {isSaving ? <Loader2 className="animate-spin" size={16} /> : <><Banknote size={16} />Confirmar Pago</>}
          </button>
        </div>
      </div>
    </div>
  )
}