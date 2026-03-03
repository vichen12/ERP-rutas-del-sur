'use client'
import { useState, useEffect } from 'react'
import { X, Loader2, CheckCircle2, Repeat, Calendar, FileText, DollarSign, Tag } from 'lucide-react'

const CATEGORIAS = [
  { value: 'operativa', label: 'Operativa', color: 'violet' },
  { value: 'mantenimiento', label: 'Mantenimiento', color: 'amber' },
  { value: 'pago_fijo', label: 'Pago Fijo', color: 'emerald' },
]

const PERIODOS = [
  { value: 'semanal', label: 'Semanal' },
  { value: 'quincenal', label: 'Quincenal' },
  { value: 'mensual', label: 'Mensual' },
  { value: 'bimestral', label: 'Bimestral' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral', label: 'Semestral' },
  { value: 'anual', label: 'Anual' },
]

interface Props {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  isSaving: boolean
  editingData: any
}

export function TareaModal({ isOpen, onClose, onSubmit, isSaving, editingData }: Props) {
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    categoria: 'operativa',
    fecha_inicio: '',
    fecha_vencimiento: '',
    es_recurrente: false,
    periodo_recurrencia: 'mensual',
    afecta_caja: false,
    monto: '',
  })

  useEffect(() => {
    if (isOpen) {
      if (editingData) {
        setForm({
          titulo: editingData.titulo || '',
          descripcion: editingData.descripcion || '',
          categoria: editingData.categoria || 'operativa',
          fecha_inicio: editingData.fecha_inicio || editingData.fecha_vencimiento || '',
          fecha_vencimiento: editingData.fecha_vencimiento || '',
          es_recurrente: editingData.es_recurrente || false,
          periodo_recurrencia: editingData.periodo_recurrencia || 'mensual',
          afecta_caja: editingData.afecta_caja || false,
          monto: editingData.monto ? String(editingData.monto) : '',
        })
      } else {
        const hoy = new Date().toISOString().split('T')[0]
        const manana = new Date()
        manana.setDate(manana.getDate() + 1)
        setForm({
          titulo: '', descripcion: '', categoria: 'operativa',
          fecha_inicio: hoy,
          fecha_vencimiento: manana.toISOString().split('T')[0],
          es_recurrente: false, periodo_recurrencia: 'mensual',
          afecta_caja: false, monto: '',
        })
      }
    }
  }, [isOpen, editingData])

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 font-sans italic">
      <div className="bg-[#020617] w-full max-w-md rounded-[2.5rem] border border-white/10 p-8 shadow-2xl relative animate-in fade-in zoom-in-95 duration-300">

        <div className="absolute top-0 left-0 w-full h-1 rounded-t-[2.5rem] bg-violet-500" />

        <div className="flex justify-between items-start mb-7">
          <div>
            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-violet-400 mb-1">
              {editingData ? 'Editar Tarea' : 'Nueva Tarea'}
            </p>
            <h2 className="text-xl font-black text-white uppercase tracking-tight">Tarea</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-slate-500 hover:text-white hover:rotate-90 transition-all">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} className="space-y-5">

          {/* CATEGORÍA */}
          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest flex items-center gap-1.5">
              <Tag size={10} /> Categoría
            </label>
            <div className="flex gap-2">
              {CATEGORIAS.map(c => (
                <button key={c.value} type="button"
                  onClick={() => setForm(p => ({ ...p, categoria: c.value }))}
                  className={`flex-1 py-2.5 rounded-xl text-[8px] font-black uppercase tracking-widest border transition-all ${form.categoria === c.value
                      ? c.color === 'violet' ? 'bg-violet-600  border-violet-500  text-white'
                        : c.color === 'amber' ? 'bg-amber-600   border-amber-500   text-white'
                          : 'bg-emerald-600 border-emerald-500 text-white'
                      : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'
                    }`}>
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">Título</label>
            <input required placeholder="EJ: PASARLE PLATA A MI HIJO / PAGAR LUZ"
              value={form.titulo} onChange={e => setForm(p => ({ ...p, titulo: e.target.value.toUpperCase() }))}
              className="w-full bg-slate-900 border border-white/5 rounded-xl py-3.5 px-5 text-white font-black text-sm uppercase outline-none focus:border-violet-500 transition-all placeholder:text-slate-700" />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest flex items-center gap-1.5">
              <FileText size={10} /> Descripción <span className="text-slate-700">(Opcional)</span>
            </label>
            <input placeholder="DETALLES..."
              value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value.toUpperCase() }))}
              className="w-full bg-slate-900 border border-white/5 rounded-xl py-3.5 px-5 text-white font-bold text-sm uppercase outline-none focus:border-violet-500 transition-all placeholder:text-slate-700" />
          </div>

          {/* FECHAS */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest flex items-center gap-1.5">
                <Calendar size={10} /> Desde
              </label>
              <input required type="date" value={form.fecha_inicio}
                onChange={e => setForm(p => ({ ...p, fecha_inicio: e.target.value }))}
                className="w-full bg-slate-900 border border-white/5 rounded-xl py-3.5 px-4 text-white font-black text-sm outline-none focus:border-violet-500 [color-scheme:dark]" />
              <p className="text-[7px] font-bold text-slate-700 uppercase ml-1">Cuándo aparece</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest flex items-center gap-1.5">
                <Calendar size={10} /> Vence
              </label>
              <input required type="date" value={form.fecha_vencimiento}
                onChange={e => setForm(p => ({ ...p, fecha_vencimiento: e.target.value }))}
                className="w-full bg-slate-900 border border-white/5 rounded-xl py-3.5 px-4 text-white font-black text-sm outline-none focus:border-violet-500 [color-scheme:dark]" />
              <p className="text-[7px] font-bold text-slate-700 uppercase ml-1">Fecha límite</p>
            </div>
          </div>

          <div className="space-y-2">
            <button type="button" onClick={() => setForm(p => ({ ...p, es_recurrente: !p.es_recurrente }))}
              className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl border transition-all font-black text-[9px] uppercase tracking-widest ${form.es_recurrente
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                  : 'bg-slate-900 border-white/5 text-slate-600 hover:text-slate-400'
                }`}>
              <Repeat size={14} />
              {form.es_recurrente ? 'Recurrente ✓' : 'Hacer Recurrente'}
            </button>
            {form.es_recurrente && (
              <div className="flex flex-wrap gap-1.5">
                {PERIODOS.map(p => (
                  <button key={p.value} type="button" onClick={() => setForm(f => ({ ...f, periodo_recurrencia: p.value }))}
                    className={`px-3 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${form.periodo_recurrencia === p.value
                        ? 'bg-indigo-600 border-indigo-500 text-white'
                        : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'
                      }`}>
                    {p.label}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <button type="button" onClick={() => setForm(p => ({ ...p, afecta_caja: !p.afecta_caja }))}
              className={`w-full flex items-center gap-3 px-5 py-3.5 rounded-xl border transition-all font-black text-[9px] uppercase tracking-widest ${form.afecta_caja
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-slate-900 border-white/5 text-slate-600 hover:text-slate-400'
                }`}>
              <DollarSign size={14} />
              {form.afecta_caja ? 'Afecta Caja ✓' : 'Afecta Caja'}
            </button>
            {form.afecta_caja && (
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={16} />
                <input required={form.afecta_caja} type="number" step="0.01" min="0" placeholder="Monto a descontar"
                  value={form.monto} onChange={e => setForm(p => ({ ...p, monto: e.target.value }))}
                  className="w-full bg-slate-900 border border-emerald-500/20 rounded-xl py-3.5 pl-12 pr-5 text-emerald-400 font-black text-xl tabular-nums outline-none focus:border-emerald-500 transition-all" />
              </div>
            )}
          </div>

          <button type="submit" disabled={isSaving}
            className="w-full py-4 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-black uppercase text-[10px] tracking-[0.3em] transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-xl disabled:opacity-50">
            {isSaving ? <Loader2 className="animate-spin" size={18} /> : <><CheckCircle2 size={18} />{editingData ? 'Guardar Cambios' : 'Crear Tarea'}</>}
          </button>
        </form>
      </div>
    </div>
  )
}