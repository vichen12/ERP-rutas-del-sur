'use client'
import { 
  CheckCircle2, Circle, Edit3, Trash2, 
  Repeat, Calendar, Truck, AlertTriangle,
  Wrench, CreditCard, ClipboardList, Loader2,
  Clock, CheckSquare
} from 'lucide-react'

const CATEGORIA_CONFIG: Record<string, { label: string; icon: any; color: string; bg: string; border: string }> = {
  mantenimiento: {
    label: 'Mantenimiento',
    icon: Wrench,
    color: 'text-amber-400',
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/20',
  },
  pago_fijo: {
    label: 'Pago Fijo',
    icon: CreditCard,
    color: 'text-sky-400',
    bg: 'bg-sky-500/10',
    border: 'border-sky-500/20',
  },
  operativa: {
    label: 'Operativa',
    icon: ClipboardList,
    color: 'text-violet-400',
    bg: 'bg-violet-500/10',
    border: 'border-violet-500/20',
  },
}

const PERIODO_LABELS: Record<string, string> = {
  semanal: 'Semanal',
  mensual: 'Mensual',
  bimestral: 'Bimestral',
  trimestral: 'Trimestral',
  semestral: 'Semestral',
  anual: 'Anual',
}

interface TareasGridProps {
  tareas: any[]
  loading: boolean
  onCompletar: (t: any) => void
  onEdit: (t: any) => void
  onDelete: (id: string) => void
}

export function TareasGrid({ tareas, loading, onCompletar, onEdit, onDelete }: TareasGridProps) {
  const hoy = new Date().toISOString().split('T')[0]

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin text-violet-500" size={40} />
    </div>
  )

  if (tareas.length === 0) return (
    <div className="flex flex-col items-center justify-center py-24 opacity-30 font-sans italic">
      <CheckSquare size={48} className="text-slate-600 mb-4" />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">Sin tareas en este filtro</p>
    </div>
  )

  return (
    <div className="space-y-3 font-sans italic">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] px-2">
        {tareas.length} {tareas.length === 1 ? 'tarea' : 'tareas'}
      </p>
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {tareas.map(tarea => {
          const cat = CATEGORIA_CONFIG[tarea.categoria] || CATEGORIA_CONFIG.operativa
          const CatIcon = cat.icon

          // Estado visual
          const diff = Math.ceil((new Date(tarea.fecha_vencimiento).getTime() - new Date(hoy).getTime()) / (1000 * 60 * 60 * 24))
          const estaVencida = !tarea.completada && diff < 0
          const esHoy = !tarea.completada && diff === 0
          const esCercana = !tarea.completada && diff > 0 && diff <= tarea.dias_anticipacion

          let estadoColor = 'border-white/5'
          let estadoLabel = ''
          let estadoLabelColor = 'text-slate-500'
          if (tarea.completada) {
            estadoColor = 'border-emerald-500/20'
            estadoLabel = 'Completada'
            estadoLabelColor = 'text-emerald-500'
          } else if (estaVencida) {
            estadoColor = 'border-rose-500/40 ring-2 ring-rose-500/20'
            estadoLabel = `Vencida hace ${Math.abs(diff)} día${Math.abs(diff) !== 1 ? 's' : ''}`
            estadoLabelColor = 'text-rose-400'
          } else if (esHoy) {
            estadoColor = 'border-amber-500/40 ring-2 ring-amber-500/20'
            estadoLabel = 'Vence HOY'
            estadoLabelColor = 'text-amber-400'
          } else if (esCercana) {
            estadoColor = 'border-amber-500/20'
            estadoLabel = `Vence en ${diff} día${diff !== 1 ? 's' : ''}`
            estadoLabelColor = 'text-amber-400'
          } else if (!tarea.completada) {
            estadoLabel = `${diff} días`
            estadoLabelColor = 'text-slate-400'
          }

          return (
            <div
              key={tarea.id}
              className={`relative bg-slate-900/40 rounded-[2.5rem] border p-7 overflow-hidden group transition-all hover:bg-slate-900/60 shadow-xl ${estadoColor} ${tarea.completada ? 'opacity-50' : ''}`}
            >
              {/* Indicador de urgencia */}
              {(estaVencida || esHoy) && !tarea.completada && (
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-rose-500 to-amber-500 rounded-t-[2.5rem]" />
              )}

              {/* HEADER DE LA TARJETA */}
              <div className="flex items-start justify-between gap-3 mb-5">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Badge categoría */}
                  <div className={`shrink-0 w-10 h-10 rounded-2xl ${cat.bg} border ${cat.border} flex items-center justify-center`}>
                    <CatIcon size={18} className={cat.color} />
                  </div>
                  <div className="min-w-0">
                    <span className={`text-[8px] font-black uppercase tracking-widest ${cat.color}`}>{cat.label}</span>
                    <h3 className={`text-sm font-black uppercase tracking-tight leading-tight mt-0.5 ${tarea.completada ? 'line-through text-slate-500' : 'text-white'}`}>
                      {tarea.titulo}
                    </h3>
                  </div>
                </div>

                {/* Botón completar */}
                {!tarea.completada && (
                  <button
                    onClick={() => onCompletar(tarea)}
                    className="shrink-0 p-2 rounded-xl hover:bg-emerald-500/10 text-slate-600 hover:text-emerald-500 transition-all active:scale-95"
                    title="Marcar como completada"
                  >
                    <Circle size={22} strokeWidth={1.5} />
                  </button>
                )}
                {tarea.completada && (
                  <div className="shrink-0 p-2 text-emerald-500">
                    <CheckCircle2 size={22} />
                  </div>
                )}
              </div>

              {/* DESCRIPCIÓN */}
              {tarea.descripcion && (
                <p className="text-[10px] font-bold text-slate-500 uppercase leading-relaxed mb-4 line-clamp-2">
                  {tarea.descripcion}
                </p>
              )}

              {/* INFO CHIPS */}
              <div className="flex flex-wrap gap-2 mb-4">
                {/* Fecha */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border ${
                  estaVencida ? 'bg-rose-500/10 border-rose-500/20 text-rose-400'
                  : esHoy ? 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                  : 'bg-white/5 border-white/5 text-slate-400'
                }`}>
                  <Calendar size={10} />
                  {new Date(tarea.fecha_vencimiento + 'T00:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short', year: 'numeric' })}
                </div>

                {/* Estado */}
                <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border bg-white/5 border-white/5 ${estadoLabelColor}`}>
                  <Clock size={10} />
                  {estadoLabel}
                </div>

                {/* Recurrente */}
                {tarea.es_recurrente && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border bg-indigo-500/10 border-indigo-500/20 text-indigo-400">
                    <Repeat size={10} />
                    {PERIODO_LABELS[tarea.periodo_recurrencia] || tarea.periodo_recurrencia}
                  </div>
                )}

                {/* Camión vinculado */}
                {tarea.camiones && (
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[9px] font-black uppercase border bg-amber-500/10 border-amber-500/20 text-amber-400">
                    <Truck size={10} />
                    {tarea.camiones.patente}
                  </div>
                )}
              </div>

              {/* Días de anticipación */}
              <div className="flex items-center gap-1.5 text-[9px] text-slate-600 font-black uppercase mb-4">
                <AlertTriangle size={10} />
                Aviso {tarea.dias_anticipacion} días antes
              </div>

              {/* ACCIONES */}
              <div className="flex gap-2 pt-3 border-t border-white/5 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => onEdit(tarea)}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-white/5 hover:bg-sky-500/10 text-slate-500 hover:text-sky-400 text-[9px] font-black uppercase tracking-widest transition-all"
                >
                  <Edit3 size={13} /> Editar
                </button>
                <button
                  onClick={() => onDelete(tarea.id)}
                  className="p-2.5 rounded-xl bg-white/5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
