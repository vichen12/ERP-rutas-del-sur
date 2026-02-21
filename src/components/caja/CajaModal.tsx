'use client'
import { useState, useEffect } from 'react'
import { X, Loader2, DollarSign, Calendar, Tag, Wallet, Landmark, ArrowUpCircle, ArrowDownCircle, FileText, ChevronRight, CheckCircle2 } from 'lucide-react'

const CATEGORIAS_INGRESO = [
  { value: 'cobro_flete', label: 'Cobro de Flete' },
  { value: 'ingreso_otro', label: 'Ingreso Varios' },
]

const CATEGORIAS_EGRESO = [
  { value: 'pago_chofer', label: 'Pago a Chofer' },
  { value: 'gasto_camion', label: 'Gasto de Unidad' },
  { value: 'costo_fijo', label: 'Costo Fijo' },
  { value: 'multa', label: 'Multa' },
  { value: 'egreso_otro', label: 'Egreso Varios' },
]

interface CajaModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: any) => void
  isSaving: boolean
  editingData: any
  clientes: any[]
  choferes: any[]
  camiones: any[]
}

export function CajaModal({ isOpen, onClose, onSubmit, isSaving, editingData, clientes, choferes, camiones }: CajaModalProps) {
  const [form, setForm] = useState({
    tipo: 'ingreso' as 'ingreso' | 'egreso',
    tipo_cuenta: 'banco' as 'caja' | 'banco',
    categoria: '',
    descripcion: '',
    monto: '',
    fecha: new Date().toISOString().split('T')[0],
    referencia: '',
    cliente_id: '',
    chofer_id: '',
    camion_id: '',
  })

  useEffect(() => {
    if (isOpen) {
      if (editingData) {
        setForm({
          tipo: editingData.tipo || 'ingreso',
          tipo_cuenta: editingData.tipo_cuenta || 'banco',
          categoria: editingData.categoria || '',
          descripcion: editingData.descripcion || '',
          monto: editingData.monto || '',
          fecha: editingData.fecha || new Date().toISOString().split('T')[0],
          referencia: editingData.referencia || '',
          cliente_id: editingData.cliente_id || '',
          chofer_id: editingData.chofer_id || '',
          camion_id: editingData.camion_id || '',
        })
      } else {
        setForm({
          tipo: 'ingreso',
          tipo_cuenta: 'banco',
          categoria: '',
          descripcion: '',
          monto: '',
          fecha: new Date().toISOString().split('T')[0],
          referencia: '',
          cliente_id: '',
          chofer_id: '',
          camion_id: '',
        })
      }
    }
  }, [isOpen, editingData])

  if (!isOpen) return null

  const categorias = form.tipo === 'ingreso' ? CATEGORIAS_INGRESO : CATEGORIAS_EGRESO

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit(form)
  }

  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto font-sans italic">
      <div className="bg-[#020617] w-full max-w-2xl rounded-[3rem] border border-white/10 p-8 md:p-10 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-300">

        {/* Línea superior */}
        <div className={`absolute top-0 left-0 w-full h-1.5 rounded-t-full transition-colors duration-500 ${form.tipo === 'ingreso' ? 'bg-emerald-500' : 'bg-rose-500'}`} />

        {/* HEADER */}
        <div className="flex justify-between items-start mb-8">
          <div>
            <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-1 ${form.tipo === 'ingreso' ? 'text-emerald-500' : 'text-rose-500'}`}>
              {editingData ? 'Editando Movimiento' : 'Nuevo Movimiento'}
            </p>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
              Caja / <span className={form.tipo === 'ingreso' ? 'text-emerald-500' : 'text-rose-500'}>
                Banco
              </span>
            </h2>
          </div>
          <button onClick={onClose} className="p-2.5 bg-white/5 rounded-full text-slate-500 hover:text-white hover:rotate-90 transition-all">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">

          {/* TIPO: INGRESO / EGRESO */}
          {!editingData && (
            <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-white/5 shadow-inner">
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, tipo: 'ingreso', categoria: '' }))}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  form.tipo === 'ingreso' ? 'bg-emerald-600 text-white shadow-xl scale-[1.02]' : 'text-slate-600 hover:text-slate-400'
                }`}
              >
                <ArrowUpCircle size={16} /> Ingreso
              </button>
              <button
                type="button"
                onClick={() => setForm(p => ({ ...p, tipo: 'egreso', categoria: '' }))}
                className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                  form.tipo === 'egreso' ? 'bg-rose-600 text-white shadow-xl scale-[1.02]' : 'text-slate-600 hover:text-slate-400'
                }`}
              >
                <ArrowDownCircle size={16} /> Egreso
              </button>
            </div>
          )}

          {/* CUENTA: CAJA / BANCO */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, tipo_cuenta: 'caja' }))}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase border transition-all ${
                form.tipo_cuenta === 'caja'
                  ? 'bg-amber-600/20 border-amber-500/50 text-amber-400'
                  : 'bg-slate-950 border-white/5 text-slate-600 hover:text-slate-400'
              }`}
            >
              <Wallet size={14} /> Efectivo
            </button>
            <button
              type="button"
              onClick={() => setForm(p => ({ ...p, tipo_cuenta: 'banco' }))}
              className={`flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl text-[10px] font-black uppercase border transition-all ${
                form.tipo_cuenta === 'banco'
                  ? 'bg-sky-600/20 border-sky-500/50 text-sky-400'
                  : 'bg-slate-950 border-white/5 text-slate-600 hover:text-slate-400'
              }`}
            >
              <Landmark size={14} /> Banco
            </button>
          </div>

          {/* CATEGORÍA */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest flex items-center gap-2">
              <Tag size={10} /> Categoría
            </label>
            <div className="relative">
              <select
                required
                value={form.categoria}
                onChange={e => setForm(p => ({ ...p, categoria: e.target.value }))}
                className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-6 text-white font-black text-sm outline-none focus:border-emerald-500 appearance-none cursor-pointer uppercase"
              >
                <option value="">-- SELECCIONAR CATEGORÍA --</option>
                {categorias.map(c => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
              <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 rotate-90 pointer-events-none" size={16} />
            </div>
          </div>

          {/* DESCRIPCIÓN */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest flex items-center gap-2">
              <FileText size={10} /> Descripción
            </label>
            <div className="relative">
              <FileText className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={16} />
              <input
                required
                placeholder="EJ: COBRO FLETE CLIENTE X"
                value={form.descripcion}
                onChange={e => setForm(p => ({ ...p, descripcion: e.target.value.toUpperCase() }))}
                className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-14 pr-6 text-white font-black text-sm uppercase outline-none focus:border-emerald-500 transition-all placeholder:text-slate-700"
              />
            </div>
          </div>

          {/* MONTO Y FECHA */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Monto ($)</label>
              <div className="relative">
                <DollarSign className={`absolute left-5 top-1/2 -translate-y-1/2 ${form.tipo === 'ingreso' ? 'text-emerald-500' : 'text-rose-500'}`} size={16} />
                <input
                  required
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={form.monto}
                  onChange={e => setForm(p => ({ ...p, monto: e.target.value }))}
                  className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-14 pr-4 text-white font-black text-xl tabular-nums outline-none focus:border-white/20 transition-all"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Fecha</label>
              <div className="relative">
                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 pointer-events-none" size={16} />
                <input
                  required
                  type="date"
                  value={form.fecha}
                  onChange={e => setForm(p => ({ ...p, fecha: e.target.value }))}
                  className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 pl-14 pr-4 text-white font-black text-sm outline-none focus:border-white/20 [color-scheme:dark] uppercase"
                />
              </div>
            </div>
          </div>

          {/* REFERENCIA */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">
              Referencia / Comprobante <span className="text-slate-700">(Opcional)</span>
            </label>
            <input
              placeholder="EJ: RECIBO-001 / TRANSFERENCIA X"
              value={form.referencia}
              onChange={e => setForm(p => ({ ...p, referencia: e.target.value.toUpperCase() }))}
              className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-6 text-white font-black text-sm uppercase outline-none focus:border-white/20 transition-all placeholder:text-slate-700"
            />
          </div>

          {/* VINCULACIONES OPCIONALES */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Cliente</label>
              <select
                value={form.cliente_id}
                onChange={e => setForm(p => ({ ...p, cliente_id: e.target.value }))}
                className="w-full bg-slate-900 border border-white/5 rounded-2xl py-3 px-4 text-white font-bold text-xs outline-none focus:border-sky-500 appearance-none uppercase"
              >
                <option value="">SIN VINCULAR</option>
                {clientes.map(c => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Chofer</label>
              <select
                value={form.chofer_id}
                onChange={e => setForm(p => ({ ...p, chofer_id: e.target.value }))}
                className="w-full bg-slate-900 border border-white/5 rounded-2xl py-3 px-4 text-white font-bold text-xs outline-none focus:border-indigo-500 appearance-none uppercase"
              >
                <option value="">SIN VINCULAR</option>
                {choferes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Unidad</label>
              <select
                value={form.camion_id}
                onChange={e => setForm(p => ({ ...p, camion_id: e.target.value }))}
                className="w-full bg-slate-900 border border-white/5 rounded-2xl py-3 px-4 text-white font-bold text-xs outline-none focus:border-amber-500 appearance-none uppercase"
              >
                <option value="">SIN VINCULAR</option>
                {camiones.map(c => <option key={c.id} value={c.id}>{c.patente}</option>)}
              </select>
            </div>
          </div>

          {/* BOTÓN GUARDAR */}
          <div className="pt-4">
            <button
              type="submit"
              disabled={isSaving}
              className={`w-full py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl disabled:opacity-50 group ${
                form.tipo === 'ingreso'
                  ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-900/20'
                  : 'bg-rose-600 hover:bg-rose-500 shadow-rose-900/20'
              } text-white`}
            >
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : (
                <>
                  <CheckCircle2 size={20} className="group-hover:scale-110 transition-transform" />
                  {editingData ? 'Guardar Cambios' : `Registrar ${form.tipo === 'ingreso' ? 'Ingreso' : 'Egreso'}`}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
