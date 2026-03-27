'use client'
import { Circle, CheckCircle2, Edit3, Trash2, Repeat, DollarSign, Calendar } from 'lucide-react'

const PERIODO_LABELS: Record<string, string> = {
  semanal: 'Semanal', quincenal: 'Quincenal', mensual: 'Mensual',
  bimestral: 'Bimestral', trimestral: 'Trimestral', semestral: 'Semestral', anual: 'Anual',
}

interface Props {
  tareas: any[]
  tipo: 'por_cumplir' | 'atrasadas' | 'cumplidas'
  onCompletar: (t: any) => void
  onEdit: (t: any) => void
  onDelete: (id: string) => void
}

export function TareasList({ tareas, tipo, onCompletar, onEdit, onDelete }: Props) {
  const hoy = new Date().toISOString().split('T')[0]

  if (tareas.length === 0) {
    const mensajes = {
      por_cumplir: 'Sin tareas pendientes',
      atrasadas:   'Sin tareas atrasadas',
      cumplidas:   'Sin tareas cumplidas',
    }
    return (
      <div className="flex flex-col items-center justify-center py-20 opacity-30">
        <CheckCircle2 size={40} className="text-slate-600 mb-3" />
        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">{mensajes[tipo]}</p>
      </div>
    )
  }

  return (
    <div className="bg-[#1a2537]/30 rounded-[2rem] border border-white/5 overflow-hidden">
      <div className="divide-y divide-white/[0.04]">
        {tareas.map(tarea => {
          const diff = Math.ceil(
            (new Date(tarea.fecha_vencimiento + 'T12:00:00').getTime() - new Date(hoy + 'T12:00:00').getTime()) / 86400000
          )
          const vencida = tipo === 'atrasadas'
          const esHoy = !tarea.completada && diff === 0

          return (
            <div
              key={tarea.id}
              className={`flex items-center gap-4 px-5 py-4 transition-all group hover:bg-white/[0.02] ${
                tipo === 'cumplidas' ? 'opacity-50' : ''
              } ${vencida ? 'bg-rose-500/[0.03]' : ''}`}
            >
              {/* ═══ CHECK ═══ */}
              {tipo !== 'cumplidas' ? (
                <button
                  onClick={() => onCompletar(tarea)}
                  className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all active:scale-90 ${
                    vencida
                      ? 'bg-rose-500/10 text-rose-400 hover:bg-rose-500/20'
                      : esHoy
                        ? 'bg-amber-500/10 text-amber-400 hover:bg-amber-500/20'
                        : 'bg-white/5 text-slate-600 hover:text-emerald-400 hover:bg-emerald-500/10'
                  }`}
                  title="Marcar como cumplida"
                >
                  <Circle size={20} strokeWidth={1.5} />
                </button>
              ) : (
                <div className="shrink-0 w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-500/10 text-emerald-500">
                  <CheckCircle2 size={20} />
                </div>
              )}

              {/* ═══ CONTENIDO ═══ */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className={`text-sm font-black uppercase truncate ${
                    tipo === 'cumplidas' ? 'line-through text-slate-600' : 'text-white'
                  }`}>
                    {tarea.titulo}
                  </p>
                  {tarea.es_recurrente && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[7px] font-black uppercase tracking-widest bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded-lg shrink-0">
                      <Repeat size={8} />{PERIODO_LABELS[tarea.periodo_recurrencia] || ''}
                    </span>
                  )}
                  {tarea.afecta_caja && tarea.monto && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[7px] font-black uppercase tracking-widest bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
                      <DollarSign size={8} />$ {Number(tarea.monto).toLocaleString('es-AR')}
                    </span>
                  )}
                </div>
                {tarea.descripcion && (
                  <p className="text-[9px] font-bold text-slate-600 uppercase truncate mt-0.5 max-w-[400px]">
                    {tarea.descripcion}
                  </p>
                )}
              </div>

              {/* ═══ FECHA ═══ */}
              <div className="shrink-0 text-right hidden sm:block">
                {tipo === 'cumplidas' ? (
                  <p className="text-[8px] font-bold text-slate-600">
                    {tarea.fecha_completada
                      ? new Date(tarea.fecha_completada).toLocaleDateString('es-AR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
                      : ''
                    }
                  </p>
                ) : tipo === 'atrasadas' ? (
                  <div>
                    <p className="text-[9px] font-black text-rose-400 uppercase tracking-widest">
                      Hace {Math.abs(diff)}d
                    </p>
                    <p className="text-[8px] font-bold text-slate-600 mt-0.5">
                      {new Date(tarea.fecha_vencimiento + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                ) : (
                  <div>
                    <p className={`text-[9px] font-black uppercase tracking-widest ${esHoy ? 'text-amber-400' : 'text-slate-500'}`}>
                      {esHoy ? 'Hoy' : `En ${diff}d`}
                    </p>
                    <p className="text-[8px] font-bold text-slate-600 mt-0.5">
                      {new Date(tarea.fecha_vencimiento + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: 'short' })}
                    </p>
                  </div>
                )}
              </div>

              {/* ═══ ACCIONES ═══ */}
              <div className="shrink-0 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {tipo !== 'cumplidas' && (
                  <button onClick={() => onEdit(tarea)}
                    className="p-2 bg-white/5 hover:bg-sky-500/10 text-slate-600 hover:text-sky-400 rounded-lg transition-all">
                    <Edit3 size={13} />
                  </button>
                )}
                <button onClick={() => onDelete(tarea.id)}
                  className="p-2 bg-white/5 hover:bg-rose-500/10 text-slate-600 hover:text-rose-500 rounded-lg transition-all">
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