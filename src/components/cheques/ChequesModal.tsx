'use client'
import { useState, useEffect } from 'react'
import { X, FileCheck } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => Promise<void>
  isSaving: boolean
  editingCheque: any | null
  clientes: { id: string; razon_social: string }[]
}

const EMPTY: any = {
  tipo: 'recibido',
  cliente_id: '',
  destinatario: '',
  numero_cheque: '',
  banco: '',
  monto: '',
  fecha_emision: new Date().toISOString().split('T')[0],
  fecha_vencimiento: '',
  notas: '',
}

export function ChequesModal({ isOpen, onClose, onSubmit, isSaving, editingCheque, clientes }: Props) {
  const [form, setForm] = useState(EMPTY)

  useEffect(() => {
    if (editingCheque) {
      setForm({
        tipo: editingCheque.tipo || 'recibido',
        cliente_id: editingCheque.cliente_id || '',
        destinatario: editingCheque.destinatario || '',
        numero_cheque: editingCheque.numero_cheque || '',
        banco: editingCheque.banco || '',
        monto: editingCheque.monto?.toString() || '',
        fecha_emision: editingCheque.fecha_emision || new Date().toISOString().split('T')[0],
        fecha_vencimiento: editingCheque.fecha_vencimiento || '',
        notas: editingCheque.notas || '',
      })
    } else {
      setForm(EMPTY)
    }
  }, [editingCheque, isOpen])

  if (!isOpen) return null

  function set(field: string, value: string) {
    setForm((p: any) => ({ ...p, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.monto || Number(form.monto) <= 0) return
    await onSubmit(form)
  }

  const esRecibido = form.tipo === 'recibido'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm font-sans italic">
      <div className="bg-[#1a2537] border border-white/10 rounded-[2rem] w-full max-w-lg shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-500/10 rounded-xl">
              <FileCheck size={18} className="text-indigo-400" />
            </div>
            <div>
              <h2 className="text-sm font-black text-white uppercase tracking-tight">
                {editingCheque ? 'Editar Cheque' : 'Nuevo Cheque'}
              </h2>
              <p className="text-[9px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
                Completá los datos del cheque
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
            <X size={16} className="text-slate-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Tipo */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Tipo de cheque *
            </label>
            <div className="flex bg-[#243248] p-1 rounded-2xl gap-1">
              <button type="button" onClick={() => set('tipo', 'recibido')}
                className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${form.tipo === 'recibido' ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}>
                Recibido (nos dan)
              </button>
              <button type="button" onClick={() => set('tipo', 'emitido')}
                className={`flex-1 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${form.tipo === 'emitido' ? 'bg-rose-600 text-white shadow' : 'text-slate-500 hover:text-white'}`}>
                Emitido (damos)
              </button>
            </div>
          </div>

          {/* Cliente (opcional) */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
              {esRecibido ? 'Cliente que entrega' : 'Cliente destinatario'} (opcional)
            </label>
            <select value={form.cliente_id} onChange={e => set('cliente_id', e.target.value)}
              className="w-full bg-[#243248] border border-white/5 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50 transition-colors">
              <option value="">— Sin cliente asociado —</option>
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.razon_social}</option>
              ))}
            </select>
          </div>

          {/* Destinatario libre (si emitido y sin cliente) */}
          {!esRecibido && !form.cliente_id && (
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Destinatario (texto libre)
              </label>
              <input type="text" value={form.destinatario} onChange={e => set('destinatario', e.target.value)}
                placeholder="Nombre del destinatario..."
                className="w-full bg-[#243248] border border-white/5 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50 transition-colors" />
            </div>
          )}

          {/* Fila: Nro Cheque + Banco */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Nro. Cheque
              </label>
              <input type="text" value={form.numero_cheque} onChange={e => set('numero_cheque', e.target.value)}
                placeholder="Ej: 00012345"
                className="w-full bg-[#243248] border border-white/5 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50 transition-colors" />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Banco
              </label>
              <input type="text" value={form.banco} onChange={e => set('banco', e.target.value)}
                placeholder="Ej: Galicia, BBVA..."
                className="w-full bg-[#243248] border border-white/5 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50 transition-colors" />
            </div>
          </div>

          {/* Monto */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Monto *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 font-black text-sm">$</span>
              <input type="number" value={form.monto} onChange={e => set('monto', e.target.value)}
                placeholder="0" min="0" step="0.01" required
                className="w-full bg-[#243248] border border-white/5 rounded-2xl pl-8 pr-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50 transition-colors" />
            </div>
          </div>

          {/* Fila: Fechas */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Fecha Emisión
              </label>
              <input type="date" value={form.fecha_emision} onChange={e => set('fecha_emision', e.target.value)}
                className="w-full bg-[#243248] border border-white/5 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500/50 transition-colors" />
            </div>
            <div>
              <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
                Fecha Vencimiento / Cobro
              </label>
              <input type="date" value={form.fecha_vencimiento} onChange={e => set('fecha_vencimiento', e.target.value)}
                className="w-full bg-[#243248] border border-white/5 rounded-2xl px-4 py-3 text-sm text-white focus:outline-none focus:border-sky-500/50 transition-colors" />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">
              Notas (opcional)
            </label>
            <textarea value={form.notas} onChange={e => set('notas', e.target.value)}
              placeholder="Observaciones..."
              rows={2}
              className="w-full bg-[#243248] border border-white/5 rounded-2xl px-4 py-3 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-sky-500/50 transition-colors resize-none" />
          </div>

          {/* Botones */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="flex-1 py-3 rounded-2xl border border-white/10 text-slate-400 hover:text-white hover:bg-white/5 text-[9px] font-black uppercase tracking-widest transition-all">
              Cancelar
            </button>
            <button type="submit" disabled={isSaving}
              className="flex-1 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50">
              {isSaving ? 'Guardando...' : editingCheque ? 'Actualizar' : 'Guardar Cheque'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
