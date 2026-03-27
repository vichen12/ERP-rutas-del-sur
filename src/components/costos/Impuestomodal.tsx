'use client'
import { useState, useEffect, useMemo, useRef } from 'react'
import { X, Loader2, CheckCircle2, Calendar } from 'lucide-react'
import type { VariableContext, Frecuencia } from '@/app/costos-multas/page'
import { evaluarFormula } from '@/app/costos-multas/page'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  isSaving: boolean
  editingData: any
  variableContext: VariableContext
}

const frecuencias: { value: Frecuencia; label: string }[] = [
  { value: 'semanal',    label: 'Semanal' },
  { value: 'quincenal',  label: 'Quincenal' },
  { value: 'mensual',    label: 'Mensual' },
  { value: 'bimestral',  label: 'Bimestral' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral',  label: 'Semestral' },
  { value: 'anual',      label: 'Anual' },
]

export function ImpuestoModal({ isOpen, onClose, onSubmit, isSaving, editingData, variableContext }: Props) {
  const inputRef = useRef<HTMLInputElement>(null)

  const [form, setForm] = useState({
    nombre: '',
    monto: '',
    frecuencia: 'mensual' as Frecuencia,
    proximo_pago: '',
    activo: true,
    notas: '',
  })

  useEffect(() => {
    if (isOpen) {
      if (editingData) {
        setForm({
          nombre:       editingData.nombre       || '',
          monto:        editingData.monto        || '',
          frecuencia:   editingData.frecuencia   || 'mensual',
          proximo_pago: editingData.proximo_pago || new Date().toISOString().split('T')[0],
          activo:       editingData.activo       ?? true,
          notas:        editingData.notas        || '',
        })
      } else {
        setForm({
          nombre: '', monto: '', frecuencia: 'mensual',
          proximo_pago: new Date().toISOString().split('T')[0],
          activo: true, notas: '',
        })
      }
    }
  }, [isOpen, editingData])

  const liveResult = useMemo(() => {
    if (!form.monto.trim()) return null
    return evaluarFormula(form.monto, variableContext)
  }, [form.monto, variableContext])

  const isFormula = useMemo(() => {
    return isNaN(Number(form.monto)) && form.monto.trim() !== ''
  }, [form.monto])

  function inject(text: string) {
    const el = inputRef.current
    if (!el) { setForm(p => ({ ...p, monto: p.monto + text })); return }
    const start = el.selectionStart || form.monto.length
    const end = el.selectionEnd || form.monto.length
    const newMonto = form.monto.substring(0, start) + text + form.monto.substring(end)
    setForm(p => ({ ...p, monto: newMonto }))
    setTimeout(() => { el.focus(); el.selectionStart = el.selectionEnd = start + text.length }, 0)
  }

  if (!isOpen) return null

  const variables = [
    { label: 'VENTAS',     val: variableContext.VENTAS,     color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 hover:bg-emerald-500/20' },
    { label: 'GASOIL',     val: variableContext.GASOIL,     color: 'text-amber-400 bg-amber-500/10 border-amber-500/20 hover:bg-amber-500/20' },
    { label: 'CHOFERES',   val: variableContext.CHOFERES,   color: 'text-sky-400 bg-sky-500/10 border-sky-500/20 hover:bg-sky-500/20' },
    { label: 'NETO',       val: variableContext.NETO,       color: 'text-violet-400 bg-violet-500/10 border-violet-500/20 hover:bg-violet-500/20' },
    { label: 'VIAJES',     val: variableContext.VIAJES,     color: 'text-rose-400 bg-rose-500/10 border-rose-500/20 hover:bg-rose-500/20' },
  ]

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#141c28]/90 backdrop-blur-md p-4 font-sans italic">
      <div className="bg-[#141c28] w-full max-w-lg rounded-[2.5rem] border border-white/10 p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-300">

        {/* Barra superior violeta */}
        <div className="absolute top-0 left-0 w-full h-1 rounded-t-[2.5rem] bg-violet-500" />

        {/* Header */}
        <div className="flex justify-between items-start mb-7">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-violet-400 mb-1">
              {editingData ? 'Editar Impuesto' : 'Nuevo Impuesto'}
            </p>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Impuesto / Fórmula</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-slate-500 hover:text-white hover:rotate-90 transition-all">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} className="space-y-5">

          {/* NOMBRE */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">Nombre</label>
            <input required placeholder="EJ: INGRESOS BRUTOS / IIBB / IVA / GANANCIAS"
              value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value.toUpperCase() }))}
              className="w-full bg-[#1a2537] border border-white/5 rounded-xl py-3.5 px-5 text-white font-black text-sm uppercase outline-none focus:border-violet-500 transition-all placeholder:text-slate-700" />
          </div>

          {/* MONTO / FÓRMULA */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">Monto o Fórmula</label>
              {isFormula && (
                <span className="text-[8px] font-black text-violet-400 uppercase tracking-widest bg-violet-500/10 px-2 py-0.5 rounded">ƒ(x)</span>
              )}
            </div>
            <input ref={inputRef} required placeholder="50000 ó VENTAS * 0.03"
              value={form.monto} onChange={e => setForm(p => ({ ...p, monto: e.target.value.toUpperCase() }))}
              className="w-full bg-[#1a2537] border border-white/5 rounded-xl py-3.5 px-5 text-white font-mono font-black text-lg uppercase outline-none focus:border-violet-500 transition-all placeholder:text-slate-700 tracking-wide" />

            {/* Variables disponibles — botones discretos */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {variables.map(v => (
                <button key={v.label} type="button" onClick={() => inject(v.label)}
                  className={`${v.color} border rounded-lg px-2.5 py-1 text-[8px] font-black uppercase tracking-wider transition-all active:scale-95`}>
                  {v.label}
                </button>
              ))}
              {['+', '-', '*', '/', '(', ')'].map(op => (
                <button key={op} type="button" onClick={() => inject(` ${op} `)}
                  className="bg-[#243248] hover:bg-slate-700 border border-white/10 rounded-lg px-2.5 py-1 text-white font-mono text-xs font-bold transition-all active:scale-95">
                  {op}
                </button>
              ))}
            </div>

            {/* Preview en vivo — sutil */}
            {form.monto.trim() && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mt-1 ${
                liveResult !== null ? 'bg-emerald-500/5 border border-emerald-500/10' : 'bg-rose-500/5 border border-rose-500/10'
              }`}>
                <div className={`w-1.5 h-1.5 rounded-full ${liveResult !== null ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <span className={`text-sm font-black tabular-nums ${liveResult !== null ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {liveResult !== null ? `= $ ${liveResult.toLocaleString('es-AR', { maximumFractionDigits: 0 })}` : 'Fórmula inválida'}
                </span>
              </div>
            )}
          </div>

          {/* FRECUENCIA */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest flex items-center gap-1.5">
              <Calendar size={10} /> Frecuencia de Pago
            </label>
            <div className="flex flex-wrap gap-1.5">
              {frecuencias.map(f => (
                <button key={f.value} type="button" onClick={() => setForm(p => ({ ...p, frecuencia: f.value }))}
                  className={`px-3.5 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${
                    form.frecuencia === f.value
                      ? 'bg-violet-600 border-violet-500 text-white'
                      : 'bg-white/5 border-white/5 text-slate-500 hover:text-white hover:bg-white/10'
                  }`}>
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* PRÓXIMO PAGO */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">Próximo Vencimiento</label>
            <input type="date" value={form.proximo_pago} onChange={e => setForm(p => ({ ...p, proximo_pago: e.target.value }))}
              className="w-full bg-[#1a2537] border border-white/5 rounded-xl py-3.5 px-5 text-white font-black text-sm outline-none focus:border-violet-500 transition-all [color-scheme:dark]" />
          </div>

          {/* NOTAS */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">Notas <span className="text-slate-700">(Opcional)</span></label>
            <input placeholder="EJ: VENCE EL 15 / CUIT 30-..." value={form.notas}
              onChange={e => setForm(p => ({ ...p, notas: e.target.value.toUpperCase() }))}
              className="w-full bg-[#1a2537] border border-white/5 rounded-xl py-3.5 px-5 text-white font-bold text-sm uppercase outline-none focus:border-violet-500 transition-all placeholder:text-slate-700" />
          </div>

          {/* SUBMIT */}
          <button type="submit" disabled={isSaving || (form.monto.trim() !== '' && liveResult === null)}
            className="w-full py-4 rounded-xl bg-violet-600 hover:bg-violet-500 disabled:bg-[#243248] text-white disabled:text-slate-600 font-black uppercase text-[10px] tracking-[0.3em] transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-xl">
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <><CheckCircle2 size={18} />{editingData ? 'Guardar Cambios' : 'Registrar Impuesto'}</>}
          </button>
        </form>
      </div>
    </div>
  )
}