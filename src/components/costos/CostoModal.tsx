'use client'
import { useState, useEffect } from 'react'
import { X, Loader2, CheckCircle2, DollarSign, Tag, FileText, Calendar } from 'lucide-react'

interface CostoModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  isSaving: boolean
  editingData: any
}

export function CostoModal({ isOpen, onClose, onSubmit, isSaving, editingData }: CostoModalProps) {
  const [form, setForm] = useState({
    nombre: '',
    categoria: '',
    monto: '',
    es_anual: false,
    activo: true,
    notas: '',
  })

  useEffect(() => {
    if (isOpen) {
      if (editingData) {
        setForm({
          nombre:    editingData.nombre    || '',
          categoria: editingData.categoria || '',
          monto:     editingData.monto     || '',
          es_anual:  editingData.es_anual  || false,
          activo:    editingData.activo    ?? true,
          notas:     editingData.notas     || '',
        })
      } else {
        setForm({ nombre: '', categoria: '', monto: '', es_anual: false, activo: true, notas: '' })
      }
    }
  }, [isOpen, editingData])

  if (!isOpen) return null

  // Categorías sugeridas (el usuario puede escribir lo que quiera)
  const sugerencias = ['Seguro', 'Impuesto', 'Alquiler', 'Sueldo', 'GPS', 'Servicio', 'Otro']

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 font-sans italic">
      <div className="bg-[#020617] w-full max-w-md rounded-[3rem] border border-white/10 p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-300">
        <div className="absolute top-0 left-0 w-full h-1.5 rounded-t-full bg-orange-500" />

        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-1 text-orange-500">
              {editingData ? 'Editando Costo' : 'Nuevo Costo Fijo'}
            </p>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Costo Fijo</h2>
          </div>
          <button onClick={onClose} className="p-2.5 bg-white/5 rounded-full text-slate-500 hover:text-white hover:rotate-90 transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} className="space-y-5">

          {/* NOMBRE */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Nombre</label>
            <input
              required
              placeholder="EJ: SEGURO FLOTA / ALQUILER COCHERA"
              value={form.nombre}
              onChange={e => setForm(p => ({ ...p, nombre: e.target.value.toUpperCase() }))}
              className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-6 text-white font-black text-sm uppercase outline-none focus:border-orange-500 transition-all placeholder:text-slate-700"
            />
          </div>

          {/* CATEGORÍA */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest flex items-center gap-2">
              <Tag size={10} /> Categoría <span className="text-slate-700">(libre)</span>
            </label>
            <input
              required
              placeholder="ESCRIBÍ LA CATEGORÍA O ELEGÍ UNA"
              value={form.categoria}
              onChange={e => setForm(p => ({ ...p, categoria: e.target.value.toUpperCase() }))}
              className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-6 text-white font-black text-sm uppercase outline-none focus:border-orange-500 transition-all placeholder:text-slate-700"
            />
            {/* Sugerencias rápidas */}
            <div className="flex flex-wrap gap-2 px-1">
              {sugerencias.map(s => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setForm(p => ({ ...p, categoria: s.toUpperCase() }))}
                  className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase border transition-all ${
                    form.categoria === s.toUpperCase()
                      ? 'bg-orange-500/20 border-orange-500/40 text-orange-400'
                      : 'bg-white/5 border-white/5 text-slate-600 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* MONTO Y FRECUENCIA */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Monto ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-orange-500" size={16} />
                <input
                  required
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="0.00"
                  value={form.monto}
                  onChange={e => setForm(p => ({ ...p, monto: e.target.value }))}
                  className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-14 pr-4 text-white font-black text-xl tabular-nums outline-none focus:border-orange-500 transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest flex items-center gap-1.5">
                <Calendar size={10} /> Frecuencia
              </label>
              <div className="flex bg-slate-900 border border-white/5 p-1 rounded-2xl h-[58px]">
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, es_anual: false }))}
                  className={`flex-1 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${!form.es_anual ? 'bg-orange-600 text-white' : 'text-slate-600 hover:text-white'}`}
                >
                  Mensual
                </button>
                <button
                  type="button"
                  onClick={() => setForm(p => ({ ...p, es_anual: true }))}
                  className={`flex-1 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${form.es_anual ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:text-white'}`}
                >
                  Anual
                </button>
              </div>
            </div>
          </div>

          {form.es_anual && form.monto && (
            <p className="text-[9px] font-black text-indigo-400 uppercase tracking-widest px-2">
              ≈ $ {(Number(form.monto) / 12).toLocaleString('es-AR', { maximumFractionDigits: 0 })} / mes (prorrateado)
            </p>
          )}

          {/* NOTAS */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest flex items-center gap-2">
              <FileText size={10} /> Notas <span className="text-slate-700">(Opcional)</span>
            </label>
            <input
              placeholder="EJ: VENCE EL 15 DE CADA MES"
              value={form.notas}
              onChange={e => setForm(p => ({ ...p, notas: e.target.value.toUpperCase() }))}
              className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-6 text-white font-bold text-sm uppercase outline-none focus:border-orange-500 transition-all placeholder:text-slate-700"
            />
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-5 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-black uppercase text-[10px] tracking-[0.3em] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle2 size={20} />{editingData ? 'Guardar Cambios' : 'Agregar Costo'}</>}
          </button>
        </form>
      </div>
    </div>
  )
}