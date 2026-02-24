'use client'
import { Plus, Edit3, Trash2, CheckCircle2, AlertOctagon, Loader2, Calendar, User, Truck, Clock } from 'lucide-react'

interface MultasSectionProps {
  multas: any[]
  loading: boolean
  onNueva: () => void
  onEdit: (m: any) => void
  onDelete: (id: string) => void
  onPagar: (m: any) => void
}

const ESTADO_CONFIG: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pendiente: { label: 'Pendiente', color: 'text-rose-400',   bg: 'bg-rose-500/10',   border: 'border-rose-500/20' },
  pagada:    { label: 'Pagada',    color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' },
  apelada:   { label: 'Apelada',   color: 'text-amber-400',  bg: 'bg-amber-500/10',   border: 'border-amber-500/20' },
}

export function MultasSection({ multas, loading, onNueva, onEdit, onDelete, onPagar }: MultasSectionProps) {
  const totalPendiente = multas.filter(m => m.estado === 'pendiente').reduce((acc, m) => acc + Number(m.monto), 0)
  const totalPagado    = multas.filter(m => m.estado === 'pagada').reduce((acc, m) => acc + Number(m.monto), 0)
  const totalApelado   = multas.filter(m => m.estado === 'apelada').reduce((acc, m) => acc + Number(m.monto), 0)

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin text-rose-500" size={40} />
    </div>
  )

  return (
    <div className="space-y-6">

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-rose-500/10 border border-rose-500/20 rounded-[2.5rem] p-7 relative overflow-hidden">
          <AlertOctagon size={80} className="absolute -right-4 -bottom-4 text-rose-500/5 pointer-events-none" />
          <p className="text-[8px] font-black text-rose-500/70 uppercase tracking-[0.3em] mb-1">Total Pendiente</p>
          <p className="text-4xl font-black text-rose-400 italic tabular-nums tracking-tighter">
            $ {totalPendiente.toLocaleString('es-AR')}
          </p>
          <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-2">
            {multas.filter(m => m.estado === 'pendiente').length} multas sin pagar
          </p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2.5rem] p-7">
          <p className="text-[8px] font-black text-emerald-500/70 uppercase tracking-[0.3em] mb-1">Total Pagado</p>
          <p className="text-4xl font-black text-emerald-400 italic tabular-nums tracking-tighter">
            $ {totalPagado.toLocaleString('es-AR')}
          </p>
          <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-2">
            {multas.filter(m => m.estado === 'pagada').length} multas saldadas
          </p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-[2.5rem] p-7">
          <p className="text-[8px] font-black text-amber-500/70 uppercase tracking-[0.3em] mb-1">En Apelación</p>
          <p className="text-4xl font-black text-amber-400 italic tabular-nums tracking-tighter">
            $ {totalApelado.toLocaleString('es-AR')}
          </p>
          <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-2">
            {multas.filter(m => m.estado === 'apelada').length} multas apeladas
          </p>
        </div>
      </div>

      {/* HEADER */}
      <div className="flex justify-between items-center">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
          {multas.length} multas registradas
        </p>
        <button
          onClick={onNueva}
          className="flex items-center gap-2 px-7 py-3.5 bg-rose-600 hover:bg-rose-500 text-white rounded-[1.8rem] font-black uppercase text-[9px] tracking-[0.2em] transition-all active:scale-95 shadow-xl group"
        >
          <Plus size={16} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
          Nueva Multa
        </button>
      </div>

      {/* GRID DE TARJETAS */}
      {multas.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-30">
          <CheckCircle2 size={48} className="text-slate-600 mb-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">Sin multas registradas</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {multas.map(m => {
            const est = ESTADO_CONFIG[m.estado] || ESTADO_CONFIG.pendiente
            return (
              <div key={m.id} className={`bg-slate-900/40 rounded-[2.5rem] border p-7 group hover:bg-slate-900/60 transition-all shadow-xl ${m.estado === 'pendiente' ? 'border-rose-500/20' : m.estado === 'pagada' ? 'border-emerald-500/10' : 'border-amber-500/20'}`}>

                {/* HEADER */}
                <div className="flex justify-between items-start mb-5">
                  <div>
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Infractor</p>
                    <p className="text-base font-black text-white uppercase">{m.infractor}</p>
                  </div>
                  <span className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase border ${est.bg} ${est.border} ${est.color}`}>
                    {est.label}
                  </span>
                </div>

                {/* MONTO */}
                <p className={`text-4xl font-black italic tabular-nums tracking-tighter mb-4 ${m.estado === 'pendiente' ? 'text-rose-400' : m.estado === 'pagada' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  $ {Number(m.monto).toLocaleString('es-AR')}
                </p>

                {/* DETALLE */}
                {m.detalle && (
                  <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed mb-4 line-clamp-2">
                    {m.detalle}
                  </p>
                )}

                {/* CHIPS */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border bg-white/5 border-white/5 text-slate-400">
                    <Calendar size={10} />
                    {new Date(m.fecha).toLocaleDateString('es-AR')}
                  </div>
                  {m.choferes && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border bg-indigo-500/10 border-indigo-500/20 text-indigo-400">
                      <User size={10} /> {m.choferes.nombre}
                    </div>
                  )}
                  {m.camiones && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border bg-amber-500/10 border-amber-500/20 text-amber-400">
                      <Truck size={10} /> {m.camiones.patente}
                    </div>
                  )}
                  {m.estado === 'pagada' && m.fecha_pago && (
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                      <Clock size={10} /> Pagada {new Date(m.fecha_pago).toLocaleDateString('es-AR')}
                    </div>
                  )}
                </div>

                {/* ACCIONES */}
                <div className="flex gap-2 pt-3 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                  {m.estado === 'pendiente' && (
                    <button
                      onClick={() => onPagar(m)}
                      className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 text-[9px] font-black uppercase tracking-widest transition-all border border-emerald-500/20"
                    >
                      <CheckCircle2 size={13} /> Marcar Pagada
                    </button>
                  )}
                  <button onClick={() => onEdit(m)} className="p-2.5 rounded-xl bg-white/5 hover:bg-sky-500/10 text-slate-500 hover:text-sky-400 border border-white/5 transition-all">
                    <Edit3 size={13} />
                  </button>
                  <button onClick={() => onDelete(m.id)} className="p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 border border-white/5 transition-all">
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}