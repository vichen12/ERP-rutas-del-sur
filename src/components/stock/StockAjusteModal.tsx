'use client'
import { useState } from 'react'
import { X, TrendingUp, TrendingDown, RefreshCw, Package, Banknote, Landmark } from 'lucide-react'

interface StockAjusteModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: {
    tipo: string
    cantidad: number
    motivo: string
    notas: string
    impactaCaja?: boolean
    monto?: number
    tipo_cuenta?: 'caja' | 'banco'
  }) => Promise<void>
  item: any
}

type TipoMovimiento = 'entrada' | 'salida' | 'ajuste'

const MOTIVOS: Record<TipoMovimiento, string[]> = {
  entrada: ['Compra a proveedor', 'Devolución de unidad', 'Transferencia interna', 'Ajuste de inventario', 'Otro'],
  salida: ['Uso en mantenimiento', 'Uso en camión', 'Rotura / pérdida', 'Entrega a taller', 'Ajuste de inventario', 'Otro'],
  ajuste: ['Recuento físico', 'Corrección de error', 'Merma', 'Diferencia de inventario', 'Otro'],
}

export function StockAjusteModal({ open, onClose, onSave, item }: StockAjusteModalProps) {
  const [tipo, setTipo] = useState<TipoMovimiento>('entrada')
  const [cantidad, setCantidad] = useState<number>(1)
  const [motivo, setMotivo] = useState('')
  const [notas, setNotas] = useState('')
  const [saving, setSaving] = useState(false)

  // Caja fields
  const [impactaCaja, setImpactaCaja] = useState(false)
  const [monto, setMonto] = useState<string>('')
  const [tipo_cuenta, setTipoCuenta] = useState<'caja' | 'banco'>('caja')

  function reset() {
    setTipo('entrada')
    setCantidad(1)
    setMotivo('')
    setNotas('')
    setImpactaCaja(false)
    setMonto('')
    setTipoCuenta('caja')
  }

  function handleClose() {
    reset()
    onClose()
  }

  async function handleSubmit() {
    if (cantidad <= 0 || !motivo) return
    setSaving(true)
    try {
      await onSave({
        tipo,
        cantidad,
        motivo,
        notas,
        impactaCaja: tipo === 'entrada' ? impactaCaja : false,
        monto: impactaCaja ? Number(monto) || 0 : undefined,
        tipo_cuenta: impactaCaja ? tipo_cuenta : undefined,
      })
      handleClose()
    } finally {
      setSaving(false)
    }
  }

  if (!open || !item) return null

  const cantidadResultante =
    tipo === 'entrada'
      ? (item.cantidad_actual || 0) + cantidad
      : tipo === 'salida'
      ? (item.cantidad_actual || 0) - cantidad
      : cantidad

  const tipoConfig = {
    entrada: { label: 'Entrada', icon: TrendingUp,  color: 'emerald', bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', text: 'text-emerald-400', active: 'bg-emerald-600 border-emerald-500 text-white' },
    salida:  { label: 'Salida',  icon: TrendingDown, color: 'rose',    bg: 'bg-rose-500/15',    border: 'border-rose-500/30',    text: 'text-rose-400',    active: 'bg-rose-600 border-rose-500 text-white' },
    ajuste:  { label: 'Ajuste',  icon: RefreshCw,   color: 'sky',     bg: 'bg-sky-500/15',     border: 'border-sky-500/30',     text: 'text-sky-400',     active: 'bg-sky-600 border-sky-500 text-white' },
  }

  const montoSugerido = (item.precio_unitario || 0) * cantidad

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={handleClose} />
      <div className="relative z-10 w-full max-w-md bg-[#1a2537] border border-white/10 rounded-[2rem] shadow-2xl max-h-[90vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-5 sm:p-6 border-b border-white/5 bg-[#243248]/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/15 border border-teal-500/30 rounded-xl">
              <Package size={18} className="text-teal-400" />
            </div>
            <div>
              <h2 className="font-black text-sm uppercase tracking-widest text-white">Mover Stock</h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider truncate max-w-[160px]">{item.nombre}</p>
            </div>
          </div>
          <button onClick={handleClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
            <X size={18} />
          </button>
        </div>

        <div className="p-5 sm:p-6 space-y-5">

          {/* Stock actual */}
          <div className="bg-[#243248] rounded-2xl p-4 flex items-center justify-between">
            <div>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Stock Actual</p>
              <p className="text-2xl font-black text-white">{item.cantidad_actual ?? 0} <span className="text-sm text-slate-500 font-normal">{item.unidad}</span></p>
            </div>
            <div className="text-right">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Resultante</p>
              <p className={`text-2xl font-black ${cantidadResultante < (item.cantidad_minima || 0) ? 'text-rose-400' : 'text-emerald-400'}`}>
                {cantidadResultante} <span className="text-sm font-normal opacity-60">{item.unidad}</span>
              </p>
            </div>
          </div>

          {/* Tipo de movimiento */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Tipo de Movimiento</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(tipoConfig) as TipoMovimiento[]).map(t => {
                const cfg = tipoConfig[t]
                const Icon = cfg.icon
                const isActive = tipo === t
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => { setTipo(t); setMotivo(''); if (t !== 'entrada') setImpactaCaja(false) }}
                    className={`flex flex-col items-center gap-2 py-3 sm:py-4 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${
                      isActive ? cfg.active : `${cfg.bg} ${cfg.border} ${cfg.text} hover:opacity-80`
                    }`}
                  >
                    <Icon size={18} />
                    {cfg.label}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Cantidad */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Cantidad ({item.unidad})
            </label>
            <input
              type="number"
              min="0.01"
              step="0.01"
              value={cantidad}
              onChange={e => {
                const v = Math.max(0, Number(e.target.value))
                setCantidad(v)
                if (impactaCaja && item.precio_unitario > 0) setMonto(String(item.precio_unitario * v))
              }}
              className="w-full bg-[#243248] border border-white/10 rounded-xl py-3 px-4 text-xl font-bold text-white text-center focus:outline-none focus:border-teal-500/50 transition-colors"
            />
          </div>

          {/* Motivo */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Motivo *</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MOTIVOS[tipo].map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setMotivo(m)}
                  className={`py-2.5 px-3 rounded-xl border text-[11px] font-bold transition-all text-left ${
                    motivo === m
                      ? 'bg-teal-600 border-teal-500 text-white'
                      : 'bg-[#243248] border-white/10 text-slate-400 hover:text-white hover:border-white/20'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Notas (opcional)</label>
            <input
              value={notas}
              onChange={e => setNotas(e.target.value)}
              placeholder="Ej: Factura nro 00123, Camión ABC 123..."
              className="w-full bg-[#243248] border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50 transition-colors"
            />
          </div>

          {/* IMPACTO EN CAJA — solo entrada */}
          {tipo === 'entrada' && (
            <div className="border border-white/10 rounded-2xl overflow-hidden">
              <button
                type="button"
                onClick={() => {
                  setImpactaCaja(!impactaCaja)
                  if (!impactaCaja && montoSugerido > 0) setMonto(String(montoSugerido))
                }}
                className={`w-full flex items-center gap-3 p-4 transition-all ${impactaCaja ? 'bg-amber-500/10 border-b border-amber-500/20' : 'bg-white/5 hover:bg-white/10'}`}
              >
                <div className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center shrink-0 transition-all ${impactaCaja ? 'bg-amber-500 border-amber-500' : 'border-slate-600'}`}>
                  {impactaCaja && <span className="text-white text-[10px] font-black">✓</span>}
                </div>
                <Banknote size={16} className={impactaCaja ? 'text-amber-400' : 'text-slate-500'} />
                <div className="text-left flex-1">
                  <p className={`text-[10px] font-black uppercase tracking-widest ${impactaCaja ? 'text-amber-400' : 'text-slate-400'}`}>
                    Registrar egreso en caja
                  </p>
                  <p className="text-[9px] text-slate-600 mt-0.5">Descuenta el monto de caja o banco al guardar</p>
                </div>
              </button>

              {impactaCaja && (
                <div className="p-4 space-y-3 bg-amber-500/5">
                  {/* Tipo de cuenta */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setTipoCuenta('caja')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${tipo_cuenta === 'caja' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-[#243248] border-white/10 text-slate-400 hover:text-white'}`}
                    >
                      <Banknote size={14} /> Caja
                    </button>
                    <button
                      type="button"
                      onClick={() => setTipoCuenta('banco')}
                      className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-[10px] font-black uppercase tracking-widest transition-all ${tipo_cuenta === 'banco' ? 'bg-amber-600 border-amber-500 text-white' : 'bg-[#243248] border-white/10 text-slate-400 hover:text-white'}`}
                    >
                      <Landmark size={14} /> Banco
                    </button>
                  </div>
                  {/* Monto */}
                  <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-amber-400/70 mb-1.5">Monto a descontar *</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-black text-sm">$</span>
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={monto}
                        onChange={e => setMonto(e.target.value)}
                        placeholder="0.00"
                        className="w-full bg-[#243248] border border-amber-500/30 rounded-xl py-3 pl-8 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-amber-500/60 transition-colors"
                      />
                    </div>
                    {montoSugerido > 0 && (
                      <button
                        type="button"
                        onClick={() => setMonto(String(montoSugerido))}
                        className="mt-1.5 text-[10px] text-amber-400/60 hover:text-amber-400 transition-colors"
                      >
                        Sugerido: ${montoSugerido.toLocaleString('es-AR')} (precio unitario × cantidad)
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {cantidadResultante < 0 && (
            <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-3 text-rose-400 text-xs font-bold">
              ⚠️ El stock resultante sería negativo. Verificar la cantidad ingresada.
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-5 sm:p-6 border-t border-white/5 flex gap-3">
          <button
            type="button"
            onClick={handleClose}
            className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 text-sm font-black uppercase tracking-widest transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || cantidad <= 0 || !motivo || (impactaCaja && (!monto || Number(monto) <= 0))}
            className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando...' : 'Confirmar'}
          </button>
        </div>
      </div>
    </div>
  )
}
