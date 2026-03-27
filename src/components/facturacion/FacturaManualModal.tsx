'use client'
import { useState } from 'react'
import { X, FileText, Loader2 } from 'lucide-react'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSave: (data: any) => void
  isSaving: boolean
  clientes: any[]
}

const today = () => new Date().toISOString().split('T')[0]

export function FacturaManualModal({ isOpen, onClose, onSave, isSaving, clientes }: Props) {
  const TIPO_MAP: Record<string, number> = { X: 6, B: 6, C: 11, A: 1 }

  const [form, setForm] = useState({
    cliente_id: '',
    fecha: today(),
    numero: '0001-00000001',
    tipo: 'X',
    descripcion: '',
    importe: '',
  })

  if (!isOpen) return null

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }))
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const parts = form.numero.split('-')
    const pv = parseInt(parts[0]) || 1
    const num = parseInt(parts[1]) || 1
    onSave({
      tipo_comprobante: TIPO_MAP[form.tipo] ?? 6,
      punto_venta: pv,
      numero_comprobante: num,
      fecha_comprobante: form.fecha,
      importe_total: parseFloat(form.importe),
      importe_neto: parseFloat(form.importe),
      importe_iva: 0,
      alicuota_iva: 0,
      condicion_iva_receptor: 'CF',
      cuit_receptor: '',
      concepto: 1,
      descripcion: form.descripcion,
      cliente_id: form.cliente_id || null,
      estado: 'manual',
    })
  }

  const inputClass = 'w-full bg-[#141c28] border border-slate-700/50 text-slate-100 rounded-xl px-4 py-2.5 text-sm font-bold outline-none focus:border-emerald-500/50 transition-colors placeholder:text-slate-600'
  const labelClass = 'text-[9px] font-black text-slate-500 uppercase tracking-[0.3em]'

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative w-full max-w-lg bg-[#1a2537] border border-slate-700/50 rounded-[2rem] shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-amber-500/10 rounded-xl border border-amber-500/20">
              <FileText size={16} className="text-amber-400" />
            </div>
            <div>
              <p className="text-[9px] font-black text-amber-400 uppercase tracking-[0.3em]">Registro Manual</p>
              <h2 className="text-lg font-black text-white uppercase tracking-tight">Factura Manual</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all"
          >
            <X size={16} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-8 space-y-5">
          {/* Cliente */}
          <div className="space-y-2">
            <label className={labelClass}>Cliente</label>
            <select
              name="cliente_id"
              value={form.cliente_id}
              onChange={handleChange}
              required
              className={inputClass + ' [color-scheme:dark]'}
            >
              <option value="">Seleccionar cliente...</option>
              {clientes.map((c: any) => (
                <option key={c.id} value={c.id}>{c.razon_social}</option>
              ))}
            </select>
          </div>

          {/* Fecha + Tipo */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className={labelClass}>Fecha</label>
              <input
                type="date"
                name="fecha"
                value={form.fecha}
                onChange={handleChange}
                required
                className={inputClass + ' [color-scheme:dark]'}
              />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Tipo</label>
              <select
                name="tipo"
                value={form.tipo}
                onChange={handleChange}
                className={inputClass + ' [color-scheme:dark]'}
              >
                <option value="X">X – Manual / Otro</option>
                <option value="B">B – Consumidor Final</option>
                <option value="C">C – Monotributo</option>
              </select>
            </div>
          </div>

          {/* Número de comprobante */}
          <div className="space-y-2">
            <label className={labelClass}>Número de comprobante</label>
            <input
              type="text"
              name="numero"
              value={form.numero}
              onChange={handleChange}
              required
              placeholder="0001-00000001"
              className={inputClass}
            />
          </div>

          {/* Importe */}
          <div className="space-y-2">
            <label className={labelClass}>Importe total ($)</label>
            <input
              type="number"
              name="importe"
              value={form.importe}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
              placeholder="0.00"
              className={inputClass}
            />
          </div>

          {/* Descripción */}
          <div className="space-y-2">
            <label className={labelClass}>Descripción / Concepto</label>
            <textarea
              name="descripcion"
              value={form.descripcion}
              onChange={handleChange}
              rows={3}
              placeholder="Detalle del servicio..."
              className={inputClass + ' resize-none'}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 rounded-xl bg-white/5 border border-slate-700/50 text-slate-400 hover:text-white hover:bg-white/10 text-[10px] font-black uppercase tracking-widest transition-all"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-[10px] font-black uppercase tracking-widest transition-all active:scale-95"
            >
              {isSaving ? <Loader2 size={14} className="animate-spin" /> : <FileText size={14} />}
              {isSaving ? 'Guardando...' : 'Registrar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
