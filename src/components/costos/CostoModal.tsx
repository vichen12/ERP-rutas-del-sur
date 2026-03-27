'use client'
import { useState, useEffect } from 'react'
import { X, Loader2, CheckCircle2, DollarSign, Calendar, RefreshCw } from 'lucide-react'
import type { Frecuencia } from '@/app/costos-multas/page'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  isSaving: boolean
  editingData: any
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

export function CostoModal({ isOpen, onClose, onSubmit, isSaving, editingData }: Props) {
  const [form, setForm] = useState({
    nombre: '',
    monto: '',
    recurrente: false,
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
          recurrente:   editingData.recurrente   || false,
          frecuencia:   editingData.frecuencia   || 'mensual',
          proximo_pago: editingData.proximo_pago || new Date().toISOString().split('T')[0],
          activo:       editingData.activo       ?? true,
          notas:        editingData.notas        || '',
        })
      } else {
        setForm({
          nombre: '', monto: '', recurrente: false, frecuencia: 'mensual',
          proximo_pago: new Date().toISOString().split('T')[0], activo: true, notas: '',
        })
      }
    }
  }, [isOpen, editingData])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[999] flex items-start sm:items-center justify-center overflow-y-auto bg-[#141c28]/90 backdrop-blur-md p-4 font-sans italic">
      <div className="bg-[#141c28] w-full max-w-md rounded-[2.5rem] border border-white/10 p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-300 my-auto">

        <div className="absolute top-0 left-0 w-full h-1 rounded-t-[2.5rem] bg-orange-500" />

        <div className="flex justify-between items-start mb-7">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-orange-500 mb-1">
              {editingData ? 'Editar Costo' : 'Nuevo Costo'}
            </p>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Costo Operativo</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-slate-500 hover:text-white hover:rotate-90 transition-all">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} className="space-y-5">

          {/* NOMBRE */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">Nombre del Costo</label>
            <input required placeholder="EJ: FRENOS CAMIÓN / ALQUILER / SERVICIO GPS"
              value={form.nombre} onChange={e => setForm(p => ({ ...p, nombre: e.target.value.toUpperCase() }))}
              className="w-full bg-[#1a2537] border border-white/5 rounded-xl py-3.5 px-5 text-white font-black text-sm uppercase outline-none focus:border-orange-500 transition-all placeholder:text-slate-700" />
          </div>

          {/* MONTO */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">Monto ($)</label>
            <div className="relative">
              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-500" size={16} />
              <input required type="number" step="0.01" min="0" placeholder="0.00"
                value={form.monto} onChange={e => setForm(p => ({ ...p, monto: e.target.value }))}
                className="w-full bg-[#1a2537] border border-white/5 rounded-xl py-3.5 pl-12 pr-5 text-white font-black text-xl tabular-nums outline-none focus:border-orange-500 transition-all" />
            </div>
          </div>

          {/* RECURRENTE TOGGLE */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest flex items-center gap-1.5">
              <RefreshCw size={10} /> ¿Es recurrente?
            </label>
            <div className="flex bg-[#1a2537] border border-white/5 p-1 rounded-xl">
              <button type="button" onClick={() => setForm(p => ({ ...p, recurrente: false }))}
                className={`flex-1 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  !form.recurrente ? 'bg-slate-700 text-white' : 'text-slate-600 hover:text-white'
                }`}>
                Pago Único
              </button>
              <button type="button" onClick={() => setForm(p => ({ ...p, recurrente: true }))}
                className={`flex-1 py-3 rounded-lg text-[9px] font-black uppercase tracking-widest transition-all ${
                  form.recurrente ? 'bg-orange-600 text-white' : 'text-slate-600 hover:text-white'
                }`}>
                Recurrente
              </button>
            </div>
          </div>

          {/* FRECUENCIA (solo si recurrente) */}
          {form.recurrente && (
            <>
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest flex items-center gap-1.5">
                  <Calendar size={10} /> Frecuencia
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {frecuencias.map(f => (
                    <button key={f.value} type="button" onClick={() => setForm(p => ({ ...p, frecuencia: f.value }))}
                      className={`px-3.5 py-2 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${
                        form.frecuencia === f.value
                          ? 'bg-orange-600 border-orange-500 text-white'
                          : 'bg-white/5 border-white/5 text-slate-500 hover:text-white hover:bg-white/10'
                      }`}>
                      {f.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">Próximo Vencimiento</label>
                <input type="date" value={form.proximo_pago} onChange={e => setForm(p => ({ ...p, proximo_pago: e.target.value }))}
                  className="w-full bg-[#1a2537] border border-white/5 rounded-xl py-3.5 px-5 text-white font-black text-sm outline-none focus:border-orange-500 transition-all [color-scheme:dark]" />
              </div>
            </>
          )}

          {/* NOTAS */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">Notas <span className="text-slate-700">(Opcional)</span></label>
            <input placeholder="EJ: FACTURA A-0001-00234 / PROVEEDOR TAL"
              value={form.notas} onChange={e => setForm(p => ({ ...p, notas: e.target.value.toUpperCase() }))}
              className="w-full bg-[#1a2537] border border-white/5 rounded-xl py-3.5 px-5 text-white font-bold text-sm uppercase outline-none focus:border-orange-500 transition-all placeholder:text-slate-700" />
          </div>

          {/* SUBMIT */}
          <button type="submit" disabled={isSaving}
            className="w-full py-4 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black uppercase text-[10px] tracking-[0.3em] transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-xl disabled:opacity-50">
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <><CheckCircle2 size={18} />{editingData ? 'Guardar Cambios' : 'Registrar Costo'}</>}
          </button>
        </form>
      </div>
    </div>
  )
}