'use client'
import { useState } from 'react'
import { X, CheckCircle2, Banknote } from 'lucide-react'

interface Props {
  cheque: any
  onClose: () => void
  onConfirm: (fechaCobro: string, registrarEnBanco: boolean) => Promise<void>
  isSaving: boolean
}

export function ChequeAccionModal({ cheque, onClose, onConfirm, isSaving }: Props) {
  const [fechaCobro, setFechaCobro] = useState(new Date().toISOString().split('T')[0])
  const [registrarEnBanco, setRegistrarEnBanco] = useState(true)

  const esRecibido = cheque.tipo === 'recibido'
  const accion = esRecibido ? 'Cobrar cheque' : 'Registrar pago de cheque'
  const color = esRecibido ? 'emerald' : 'rose'

  async function handleConfirm() {
    await onConfirm(fechaCobro, registrarEnBanco)
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-start sm:items-center justify-center overflow-y-auto p-4 bg-black/70 backdrop-blur-sm font-sans italic" onClick={onClose}>
      <div className="bg-[#1a2537] border border-white/10 rounded-[2rem] w-full max-w-md shadow-2xl max-h-[90vh] overflow-y-auto my-auto" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className={`p-2 bg-${color}-500/10 rounded-xl`}>
              <CheckCircle2 size={18} className={`text-${color}-400`} />
            </div>
            <h2 className="text-sm font-black text-white uppercase tracking-tight">{accion}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Info del cheque */}
          <div className="bg-[#243248] rounded-2xl p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Monto</span>
              <span className="text-lg font-black text-white tabular-nums">
                $ {Number(cheque.monto).toLocaleString('es-AR')}
              </span>
            </div>
            {cheque.clientes?.razon_social && (
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Cliente</span>
                <span className="text-sm font-bold text-slate-300">{cheque.clientes.razon_social}</span>
              </div>
            )}
            {cheque.destinatario && (
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Destinatario</span>
                <span className="text-sm font-bold text-slate-300">{cheque.destinatario}</span>
              </div>
            )}
            {cheque.numero_cheque && (
              <div className="flex justify-between items-center">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Nro. Cheque</span>
                <span className="text-sm font-bold text-slate-300">{cheque.numero_cheque}</span>
              </div>
            )}
          </div>

          {/* Fecha de cobro/pago */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Fecha de {esRecibido ? 'cobro' : 'pago'}
            </label>
            <input type="date" value={fechaCobro} onChange={e => setFechaCobro(e.target.value)}
              className="w-full bg-[#243248] border border-white/5 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500/50 transition-colors" />
          </div>

          {/* Opción registrar en banco */}
          <button type="button"
            onClick={() => setRegistrarEnBanco(p => !p)}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl border transition-all ${registrarEnBanco ? 'bg-sky-500/10 border-sky-500/30 text-sky-400' : 'bg-white/5 border-white/10 text-slate-500'}`}>
            <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${registrarEnBanco ? 'bg-sky-500 border-sky-500' : 'border-slate-600'}`}>
              {registrarEnBanco && <span className="text-white text-[10px] font-black">✓</span>}
            </div>
            <div className="flex items-center gap-2 flex-1">
              <Banknote size={14} />
              <span className="text-[9px] font-black uppercase tracking-widest">
                Registrar automáticamente en banco
              </span>
            </div>
          </button>

          {registrarEnBanco && (
            <p className="text-[9px] text-slate-600 font-bold px-2">
              Se va a crear un movimiento de {esRecibido ? 'ingreso' : 'egreso'} en banco por ${' '}
              <span className="text-slate-400">{Number(cheque.monto).toLocaleString('es-AR')}</span>
            </p>
          )}

          {/* Botones */}
          <div className="flex gap-3">
            <button onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-[9px] font-black uppercase tracking-widest transition-all">
              Cancelar
            </button>
            <button onClick={handleConfirm} disabled={isSaving}
              className={`flex-1 py-3 rounded-2xl text-white text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50 ${esRecibido ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-rose-600 hover:bg-rose-500'}`}>
              {isSaving ? 'Procesando...' : esRecibido ? 'Confirmar Cobro' : 'Confirmar Pago'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
