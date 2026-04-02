'use client'
import { useState, useEffect } from 'react'
import { X, Package, Tag, Hash, DollarSign, Layers, FileText, ChevronDown } from 'lucide-react'

interface StockItemModalProps {
  open: boolean
  onClose: () => void
  onSave: (data: any) => Promise<void>
  item?: any
}

const CATEGORIAS = [
  'repuesto', 'aceite', 'filtro', 'neumatico', 'herramienta',
  'papeleria', 'higiene', 'combustible', 'electrico', 'otro'
]
const UNIDADES = ['unidad', 'litro', 'kg', 'metro', 'caja', 'juego', 'par', 'rollo']

export function StockItemModal({ open, onClose, onSave, item }: StockItemModalProps) {
  const [form, setForm] = useState({
    nombre: '',
    codigo: '',
    descripcion: '',
    categoria: 'repuesto',
    unidad: 'unidad',
    cantidad_actual: 0,
    cantidad_minima: 0,
    cantidad_maxima: 0,
    precio_unitario: 0,
    notas: '',
    activo: true,
  })
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (item) {
      setForm({
        nombre: item.nombre || '',
        codigo: item.codigo || '',
        descripcion: item.descripcion || '',
        categoria: item.categoria || 'repuesto',
        unidad: item.unidad || 'unidad',
        cantidad_actual: item.cantidad_actual ?? 0,
        cantidad_minima: item.cantidad_minima ?? 0,
        cantidad_maxima: item.cantidad_maxima ?? 0,
        precio_unitario: item.precio_unitario ?? 0,
        notas: item.notas || '',
        activo: item.activo ?? true,
      })
    } else {
      setForm({
        nombre: '', codigo: '', descripcion: '',
        categoria: 'repuesto', unidad: 'unidad',
        cantidad_actual: 0, cantidad_minima: 0, cantidad_maxima: 0,
        precio_unitario: 0, notas: '', activo: true,
      })
    }
  }, [item, open])

  const set = (field: string, value: any) => setForm(p => ({ ...p, [field]: value }))

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.nombre.trim()) return
    setSaving(true)
    try {
      await onSave(form)
      onClose()
    } finally {
      setSaving(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 w-full max-w-xl bg-[#1a2537] border border-white/10 rounded-[2rem] shadow-2xl max-h-[92vh] overflow-y-auto">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/5 bg-[#243248]/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-teal-500/15 border border-teal-500/30 rounded-xl">
              <Package size={18} className="text-teal-400" />
            </div>
            <div>
              <h2 className="font-black text-sm uppercase tracking-widest text-white">
                {item ? 'Editar Artículo' : 'Nuevo Artículo'}
              </h2>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider">
                {item ? item.nombre : 'Depósito / Stock'}
              </p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-all">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">

          {/* Nombre + Codigo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                Nombre del Artículo *
              </label>
              <div className="relative">
                <Tag size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={form.nombre}
                  onChange={e => set('nombre', e.target.value)}
                  placeholder="Ej: Filtro de aceite Volvo FH"
                  required
                  className="w-full bg-[#243248] border border-white/10 rounded-xl py-3 pl-9 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Código</label>
              <div className="relative">
                <Hash size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  value={form.codigo}
                  onChange={e => set('codigo', e.target.value)}
                  placeholder="VO-FILT-001"
                  className="w-full bg-[#243248] border border-white/10 rounded-xl py-3 pl-9 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50 transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Categoría</label>
              <div className="relative">
                <select
                  value={form.categoria}
                  onChange={e => set('categoria', e.target.value)}
                  className="w-full bg-[#243248] border border-white/10 rounded-xl py-3 px-4 text-sm text-white focus:outline-none focus:border-teal-500/50 transition-colors appearance-none capitalize"
                >
                  {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Descripcion */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Descripción</label>
            <input
              value={form.descripcion}
              onChange={e => set('descripcion', e.target.value)}
              placeholder="Descripción del artículo..."
              className="w-full bg-[#243248] border border-white/10 rounded-xl py-3 px-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50 transition-colors"
            />
          </div>

          {/* Cantidades */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Stock y Unidades
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <p className="text-[9px] text-slate-500 uppercase mb-1.5">Actual</p>
                <input
                  type="number" min="0" step="0.01"
                  value={form.cantidad_actual}
                  onChange={e => set('cantidad_actual', Number(e.target.value))}
                  className="w-full bg-[#243248] border border-white/10 rounded-xl py-3 px-3 text-sm text-white text-center focus:outline-none focus:border-teal-500/50 transition-colors"
                />
              </div>
              <div>
                <p className="text-[9px] text-slate-500 uppercase mb-1.5">Mínimo</p>
                <input
                  type="number" min="0" step="0.01"
                  value={form.cantidad_minima}
                  onChange={e => set('cantidad_minima', Number(e.target.value))}
                  className="w-full bg-[#243248] border border-white/10 rounded-xl py-3 px-3 text-sm text-amber-400 text-center focus:outline-none focus:border-amber-500/50 transition-colors"
                />
              </div>
              <div>
                <p className="text-[9px] text-slate-500 uppercase mb-1.5">Máximo</p>
                <input
                  type="number" min="0" step="0.01"
                  value={form.cantidad_maxima}
                  onChange={e => set('cantidad_maxima', Number(e.target.value))}
                  className="w-full bg-[#243248] border border-white/10 rounded-xl py-3 px-3 text-sm text-white text-center focus:outline-none focus:border-teal-500/50 transition-colors"
                />
              </div>
              <div>
                <p className="text-[9px] text-slate-500 uppercase mb-1.5">Unidad</p>
                <select
                  value={form.unidad}
                  onChange={e => set('unidad', e.target.value)}
                  className="w-full bg-[#243248] border border-white/10 rounded-xl py-3 px-2 text-sm text-white focus:outline-none focus:border-teal-500/50 transition-colors appearance-none"
                >
                  {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
                </select>
              </div>
            </div>
          </div>

          {/* Precio */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
              Precio Unitario
            </label>
            <div className="relative">
              <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                type="number" min="0" step="0.01"
                value={form.precio_unitario}
                onChange={e => set('precio_unitario', Number(e.target.value))}
                placeholder="0.00"
                className="w-full bg-[#243248] border border-white/10 rounded-xl py-3 pl-9 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Notas */}
          <div>
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Notas</label>
            <div className="relative">
              <FileText size={14} className="absolute left-3 top-3.5 text-slate-500" />
              <textarea
                value={form.notas}
                onChange={e => set('notas', e.target.value)}
                rows={2}
                placeholder="Observaciones, proveedores, referencias..."
                className="w-full bg-[#243248] border border-white/10 rounded-xl py-3 pl-9 pr-4 text-sm text-white placeholder-slate-600 focus:outline-none focus:border-teal-500/50 transition-colors resize-none"
              />
            </div>
          </div>

          {/* Activo toggle */}
          {item && (
            <label className="flex items-center gap-3 cursor-pointer">
              <div
                onClick={() => set('activo', !form.activo)}
                className={`relative w-11 h-6 rounded-full transition-colors ${form.activo ? 'bg-teal-500' : 'bg-white/10'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${form.activo ? 'translate-x-6' : 'translate-x-1'}`} />
              </div>
              <span className="text-sm text-slate-300">Artículo activo en depósito</span>
            </label>
          )}

        </form>

        {/* Footer */}
        <div className="p-6 border-t border-white/5 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-slate-400 hover:text-white hover:bg-white/10 text-sm font-black uppercase tracking-widest transition-all"
          >
            Cancelar
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !form.nombre.trim()}
            className="flex-1 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 text-white text-sm font-black uppercase tracking-widest transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Guardando...' : item ? 'Guardar Cambios' : 'Crear Artículo'}
          </button>
        </div>
      </div>
    </div>
  )
}
