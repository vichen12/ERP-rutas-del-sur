'use client'
import { useState, useEffect } from 'react'
import { X, Loader2, CheckCircle2, DollarSign, Calendar, FileText, ChevronRight, User, Truck } from 'lucide-react'

interface MultaModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  isSaving: boolean
  editingData: any
  choferes: any[]
  camiones: any[]
}

export function MultaModal({ isOpen, onClose, onSubmit, isSaving, editingData, choferes, camiones }: MultaModalProps) {
  const [form, setForm] = useState({
    fecha: new Date().toISOString().split('T')[0],
    monto: '',
    infractor: '',
    detalle: '',
    estado: 'pendiente',
    chofer_id: '',
    camion_id: '',
  })

  useEffect(() => {
    if (isOpen) {
      if (editingData) {
        setForm({
          fecha:     editingData.fecha     || new Date().toISOString().split('T')[0],
          monto:     editingData.monto     || '',
          infractor: editingData.infractor || '',
          detalle:   editingData.detalle   || '',
          estado:    editingData.estado    || 'pendiente',
          chofer_id: editingData.chofer_id || '',
          camion_id: editingData.camion_id || '',
        })
      } else {
        setForm({ fecha: new Date().toISOString().split('T')[0], monto: '', infractor: '', detalle: '', estado: 'pendiente', chofer_id: '', camion_id: '' })
      }
    }
  }, [isOpen, editingData])

  if (!isOpen) return null

  const infractoresSugeridos = ['Tránsito', 'SENASA', 'Municipalidad', 'AFIP', 'Aduana', 'Otro']
  const estados = [
    { value: 'pendiente', label: 'Pendiente', color: 'bg-rose-600' },
    { value: 'pagada',    label: 'Pagada',    color: 'bg-emerald-600' },
    { value: 'apelada',   label: 'Apelada',   color: 'bg-amber-600' },
  ]

  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto font-sans italic">
      <div className="bg-[#020617] w-full max-w-md rounded-[3rem] border border-white/10 p-8 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-300">
        <div className="absolute top-0 left-0 w-full h-1.5 rounded-t-full bg-rose-500" />

        <div className="flex justify-between items-start mb-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] mb-1 text-rose-500">
              {editingData ? 'Editando Multa' : 'Nueva Multa'}
            </p>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter">Registrar Multa</h2>
          </div>
          <button onClick={onClose} className="p-2.5 bg-white/5 rounded-full text-slate-500 hover:text-white hover:rotate-90 transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={e => { e.preventDefault(); onSubmit(form) }} className="space-y-5">

          {/* INFRACTOR */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Ente / Infractor</label>
            <input
              required
              placeholder="EJ: TRÁNSITO / SENASA / MUNICIPALIDAD"
              value={form.infractor}
              onChange={e => setForm(p => ({ ...p, infractor: e.target.value.toUpperCase() }))}
              className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-6 text-white font-black text-sm uppercase outline-none focus:border-rose-500 transition-all placeholder:text-slate-700"
            />
            <div className="flex flex-wrap gap-2 px-1">
              {infractoresSugeridos.map(s => (
                <button key={s} type="button"
                  onClick={() => setForm(p => ({ ...p, infractor: s.toUpperCase() }))}
                  className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase border transition-all ${
                    form.infractor === s.toUpperCase()
                      ? 'bg-rose-500/20 border-rose-500/40 text-rose-400'
                      : 'bg-white/5 border-white/5 text-slate-600 hover:text-white'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* MONTO Y FECHA */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Monto ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-rose-500" size={16} />
                <input
                  required type="number" step="0.01" min="0" placeholder="0.00"
                  value={form.monto}
                  onChange={e => setForm(p => ({ ...p, monto: e.target.value }))}
                  className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-14 pr-4 text-white font-black text-xl tabular-nums outline-none focus:border-rose-500 transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest flex items-center gap-1.5">
                <Calendar size={10} /> Fecha
              </label>
              <input
                required type="date"
                value={form.fecha}
                onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))}
                className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-5 text-white font-black text-sm outline-none focus:border-rose-500 [color-scheme:dark] uppercase"
              />
            </div>
          </div>

          {/* ESTADO */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Estado</label>
            <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-white/5">
              {estados.map(e => (
                <button key={e.value} type="button"
                  onClick={() => setForm(p => ({ ...p, estado: e.value }))}
                  className={`flex-1 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${
                    form.estado === e.value ? `${e.color} text-white shadow-xl` : 'text-slate-600 hover:text-slate-400'
                  }`}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          {/* DETALLE */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest flex items-center gap-2">
              <FileText size={10} /> Detalle <span className="text-slate-700">(Opcional)</span>
            </label>
            <textarea
              placeholder="DESCRIPCIÓN DE LA INFRACCIÓN..."
              value={form.detalle}
              onChange={e => setForm(p => ({ ...p, detalle: e.target.value.toUpperCase() }))}
              rows={2}
              className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-6 text-white font-bold text-sm uppercase outline-none focus:border-rose-500 transition-all resize-none placeholder:text-slate-700"
            />
          </div>

          {/* CHOFER Y CAMIÓN */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest flex items-center gap-1.5">
                <User size={10} /> Chofer
              </label>
              <div className="relative">
                <select
                  value={form.chofer_id}
                  onChange={e => setForm(p => ({ ...p, chofer_id: e.target.value }))}
                  className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-5 text-white font-bold text-xs outline-none appearance-none uppercase"
                >
                  <option value="">SIN ASIGNAR</option>
                  {choferes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 rotate-90 pointer-events-none" size={14} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest flex items-center gap-1.5">
                <Truck size={10} /> Unidad
              </label>
              <div className="relative">
                <select
                  value={form.camion_id}
                  onChange={e => setForm(p => ({ ...p, camion_id: e.target.value }))}
                  className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-5 text-white font-bold text-xs outline-none appearance-none uppercase"
                >
                  <option value="">SIN ASIGNAR</option>
                  {camiones.map(c => <option key={c.id} value={c.id}>{c.patente}</option>)}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 rotate-90 pointer-events-none" size={14} />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSaving}
            className="w-full py-5 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black uppercase text-[10px] tracking-[0.3em] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl disabled:opacity-50"
          >
            {isSaving ? <Loader2 className="animate-spin" size={20} /> : <><CheckCircle2 size={20} />{editingData ? 'Guardar Cambios' : 'Registrar Multa'}</>}
          </button>
        </form>
      </div>
    </div>
  )
}