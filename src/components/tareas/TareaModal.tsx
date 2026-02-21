'use client'
import { useState, useEffect } from 'react'
import { X, Loader2, CheckCircle2, ChevronRight, Repeat, Calendar, Bell, Truck, FileText } from 'lucide-react'

const PERIODOS = [
  { value: 'semanal',    label: 'Semanal' },
  { value: 'mensual',    label: 'Mensual' },
  { value: 'bimestral',  label: 'Bimestral' },
  { value: 'trimestral', label: 'Trimestral' },
  { value: 'semestral',  label: 'Semestral' },
  { value: 'anual',      label: 'Anual' },
]

interface TareaModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  isSaving: boolean
  editingData: any
  camiones: any[]
}

export function TareaModal({ isOpen, onClose, onSubmit, isSaving, editingData, camiones }: TareaModalProps) {
  const [form, setForm] = useState({
    titulo: '',
    descripcion: '',
    categoria: 'operativa',
    fecha_vencimiento: '',
    dias_anticipacion: 3,
    es_recurrente: false,
    periodo_recurrencia: 'mensual',
    camion_id: '',
  })

  useEffect(() => {
    if (isOpen) {
      if (editingData) {
        setForm({
          titulo: editingData.titulo || '',
          descripcion: editingData.descripcion || '',
          categoria: editingData.categoria || 'operativa',
          fecha_vencimiento: editingData.fecha_vencimiento || '',
          dias_anticipacion: editingData.dias_anticipacion || 3,
          es_recurrente: editingData.es_recurrente || false,
          periodo_recurrencia: editingData.periodo_recurrencia || 'mensual',
          camion_id: editingData.camion_id || '',
        })
      } else {
        const manana = new Date()
        manana.setDate(manana.getDate() + 1)
        setForm({
          titulo: '',
          descripcion: '',
          categoria: 'operativa',
          fecha_vencimiento: manana.toISOString().split('T')[0],
          dias_anticipacion: 3,
          es_recurrente: false,
          periodo_recurrencia: 'mensual',
          camion_id: '',
        })
      }
    }
  }, [isOpen, editingData])

  if (!isOpen) return null

  const CATEGORIAS = [
    { value: 'mantenimiento', label: 'Mantenimiento', color: 'bg-amber-600' },
    { value: 'pago_fijo',     label: 'Pago Fijo',     color: 'bg-sky-600' },
    { value: 'operativa',     label: 'Operativa',     color: 'bg-violet-600' },
  ]

  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto font-sans italic">
      <div className="bg-[#020617] w-full max-w-xl rounded-[3rem] border border-white/10 p-8 md:p-10 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-300">

        {/* Línea superior violeta */}
        <div className="absolute top-0 left-0 w-full h-1.5 rounded-t-full bg-violet-500" />

        {/* HEADER */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-1 text-violet-500">
              {editingData ? 'Editando Tarea' : 'Nueva Tarea'}
            </p>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
              Recordatorio
            </h2>
          </div>
          <button onClick={onClose} className="p-2.5 bg-white/5 rounded-full text-slate-500 hover:text-white hover:rotate-90 transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} className="space-y-5">

          {/* CATEGORÍA */}
          <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-white/5">
            {CATEGORIAS.map(c => (
              <button
                key={c.value}
                type="button"
                onClick={() => setForm(p => ({ ...p, categoria: c.value }))}
                className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                  form.categoria === c.value ? `${c.color} text-white shadow-xl` : 'text-slate-600 hover:text-slate-400'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>

          {/* TÍTULO */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Título</label>
            <input
              required
              placeholder="EJ: PAGO SEGURO FLOTA / SERVICE UNIDAD"
              value={form.titulo}
              onChange={e => setForm(p => ({ ...p, titulo: e.target.value.toUpperCase() }))}
              className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-6 text-white font-black text-sm uppercase outline-none focus:border-violet-500 transition-all placeholder:text-slate-700"
            />
          </div>

          {/* DESCRIPCIÓN */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest flex items-center gap-2">
              <FileText size={10} /> Descripción <span className="text-slate-700">(Opcional)</span>
            </label>
            <textarea
              placeholder="DETALLES ADICIONALES..."
              value={form.descripcion}
              onChange={e => setForm(p => ({ ...p, descripcion: e.target.value.toUpperCase() }))}
              rows={2}
              className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-6 text-white font-black text-sm uppercase outline-none focus:border-violet-500 transition-all resize-none placeholder:text-slate-700"
            />
          </div>

          {/* FECHA Y DÍAS DE ANTICIPACIÓN */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest flex items-center gap-1.5">
                <Calendar size={10} /> Fecha Límite
              </label>
              <input
                required
                type="date"
                value={form.fecha_vencimiento}
                onChange={e => setForm(p => ({ ...p, fecha_vencimiento: e.target.value }))}
                className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-6 text-white font-black text-sm outline-none focus:border-violet-500 [color-scheme:dark] uppercase"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest flex items-center gap-1.5">
                <Bell size={10} /> Avisar X Días Antes
              </label>
              <input
                required
                type="number"
                min={1}
                max={30}
                value={form.dias_anticipacion}
                onChange={e => setForm(p => ({ ...p, dias_anticipacion: Number(e.target.value) }))}
                className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-6 text-white font-black text-xl tabular-nums outline-none focus:border-violet-500 transition-all"
              />
            </div>
          </div>

          {/* RECURRENCIA */}
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, es_recurrente: !p.es_recurrente }))}
              className={`w-full flex items-center gap-3 px-6 py-4 rounded-2xl border transition-all font-black text-[10px] uppercase tracking-widest ${
                form.es_recurrente
                  ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400'
                  : 'bg-slate-900 border-white/5 text-slate-600 hover:text-slate-400'
              }`}
            >
              <Repeat size={16} />
              {form.es_recurrente ? 'Tarea Recurrente ✓' : 'Hacer Recurrente'}
            </button>

            {form.es_recurrente && (
              <div className="relative animate-in fade-in slide-in-from-top-2 duration-200">
                <select
                  value={form.periodo_recurrencia}
                  onChange={e => setForm(p => ({ ...p, periodo_recurrencia: e.target.value }))}
                  className="w-full bg-slate-900 border border-indigo-500/30 rounded-2xl py-4 px-6 text-white font-black text-sm outline-none appearance-none uppercase"
                >
                  {PERIODOS.map(p => (
                    <option key={p.value} value={p.value}>{p.label}</option>
                  ))}
                </select>
                <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 rotate-90 pointer-events-none" size={16} />
              </div>
            )}
          </div>

          {/* CAMIÓN (solo para mantenimiento) */}
          {form.categoria === 'mantenimiento' && (
            <div className="space-y-2 animate-in fade-in duration-200">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest flex items-center gap-1.5">
                <Truck size={10} /> Unidad <span className="text-slate-700">(Opcional)</span>
              </label>
              <div className="relative">
                <select
                  value={form.camion_id}
                  onChange={e => setForm(p => ({ ...p, camion_id: e.target.value }))}
                  className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-6 text-white font-black text-sm outline-none appearance-none uppercase"
                >
                  <option value="">SIN ASIGNAR</option>
                  {camiones.map(c => <option key={c.id} value={c.id}>{c.patente}</option>)}
                </select>
                <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 rotate-90 pointer-events-none" size={16} />
              </div>
            </div>
          )}

          {/* GUARDAR */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSaving}
              className="w-full py-5 rounded-2xl bg-violet-600 hover:bg-violet-500 text-white font-black uppercase text-[10px] tracking-[0.3em] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl disabled:opacity-50 group"
            >
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  <CheckCircle2 size={20} className="group-hover:scale-110 transition-transform" />
                  {editingData ? 'Guardar Cambios' : 'Crear Tarea'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
