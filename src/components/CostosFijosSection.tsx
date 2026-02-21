'use client'
import { Plus, Edit3, Trash2, ToggleLeft, ToggleRight, Loader2, DollarSign, TrendingUp, Calendar } from 'lucide-react'

interface CostosFijosSectionProps {
  costos: any[]
  loading: boolean
  totalMensual: number
  onNuevo: () => void
  onEdit: (c: any) => void
  onDelete: (id: string) => void
  onToggle: (id: string, activo: boolean) => void
}

export function CostosFijosSection({ costos, loading, totalMensual, onNuevo, onEdit, onDelete, onToggle }: CostosFijosSectionProps) {
  const totalAnual = totalMensual * 12
  const activos = costos.filter(c => c.activo).length
  const inactivos = costos.filter(c => !c.activo).length

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin text-orange-500" size={40} />
    </div>
  )

  return (
    <div className="space-y-6">

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-[2.5rem] p-7 relative overflow-hidden">
          <DollarSign size={80} className="absolute -right-4 -bottom-4 text-orange-500/5 pointer-events-none" />
          <p className="text-[8px] font-black text-orange-500/70 uppercase tracking-[0.3em] mb-1">Costo Fijo Mensual</p>
          <p className="text-4xl font-black text-orange-400 italic tabular-nums tracking-tighter">
            $ {totalMensual.toLocaleString('es-AR')}
          </p>
          <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-2">{activos} ítems activos</p>
        </div>
        <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-7 relative overflow-hidden">
          <TrendingUp size={80} className="absolute -right-4 -bottom-4 text-slate-500/5 pointer-events-none" />
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Proyección Anual</p>
          <p className="text-4xl font-black text-white italic tabular-nums tracking-tighter">
            $ {totalAnual.toLocaleString('es-AR')}
          </p>
          <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-2">x12 meses</p>
        </div>
        <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-7 relative overflow-hidden">
          <Calendar size={80} className="absolute -right-4 -bottom-4 text-slate-500/5 pointer-events-none" />
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Costo Diario</p>
          <p className="text-4xl font-black text-slate-300 italic tabular-nums tracking-tighter">
            $ {(totalMensual / 30).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-2">Promedio por día</p>
        </div>
      </div>

      {/* HEADER TABLA */}
      <div className="flex justify-between items-center">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
          {costos.length} costos registrados · {inactivos > 0 ? `${inactivos} inactivos` : 'todos activos'}
        </p>
        <button
          onClick={onNuevo}
          className="flex items-center gap-2 px-7 py-3.5 bg-orange-600 hover:bg-orange-500 text-white rounded-[1.8rem] font-black uppercase text-[9px] tracking-[0.2em] transition-all active:scale-95 shadow-xl group"
        >
          <Plus size={16} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
          Nuevo Costo
        </button>
      </div>

      {/* LISTA */}
      {costos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-30">
          <DollarSign size={48} className="text-slate-600 mb-4" />
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">Sin costos fijos registrados</p>
        </div>
      ) : (
        <div className="bg-slate-900/40 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-white/[0.02] text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] border-b border-white/5">
              <tr>
                <th className="p-6 pl-8">Nombre</th>
                <th className="p-6">Categoría</th>
                <th className="p-6 text-center">Frecuencia</th>
                <th className="p-6 text-right">Monto</th>
                <th className="p-6 text-right">Equiv. Mensual</th>
                <th className="p-6 text-center">Estado</th>
                <th className="p-6 pr-8 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {costos.map(c => {
                const mensual = c.es_anual ? Number(c.monto) / 12 : Number(c.monto)
                return (
                  <tr key={c.id} className={`hover:bg-white/[0.02] transition-all group ${!c.activo ? 'opacity-40' : ''}`}>
                    <td className="p-6 pl-8">
                      <div>
                        <p className="text-sm font-black text-white uppercase">{c.nombre}</p>
                        {c.notas && <p className="text-[9px] text-slate-600 font-bold uppercase mt-0.5">{c.notas}</p>}
                      </div>
                    </td>
                    <td className="p-6">
                      <span className="px-3 py-1.5 bg-orange-500/10 border border-orange-500/20 text-orange-400 text-[8px] font-black uppercase rounded-xl">
                        {c.categoria}
                      </span>
                    </td>
                    <td className="p-6 text-center">
                      <span className={`px-3 py-1.5 text-[8px] font-black uppercase rounded-xl border ${
                        c.es_anual
                          ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400'
                          : 'bg-slate-500/10 border-slate-500/20 text-slate-400'
                      }`}>
                        {c.es_anual ? 'Anual' : 'Mensual'}
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <p className="text-lg font-black text-white tabular-nums">
                        $ {Number(c.monto).toLocaleString('es-AR')}
                      </p>
                    </td>
                    <td className="p-6 text-right">
                      <p className="text-lg font-black text-orange-400 tabular-nums">
                        $ {mensual.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                      </p>
                    </td>
                    <td className="p-6 text-center">
                      <button
                        onClick={() => onToggle(c.id, c.activo)}
                        className={`transition-all hover:scale-110 active:scale-95 ${c.activo ? 'text-emerald-500' : 'text-slate-600'}`}
                        title={c.activo ? 'Desactivar' : 'Activar'}
                      >
                        {c.activo ? <ToggleRight size={28} /> : <ToggleLeft size={28} />}
                      </button>
                    </td>
                    <td className="p-6 pr-8 text-center">
                      <div className="flex gap-2 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onEdit(c)} className="p-2.5 bg-white/5 hover:bg-sky-500/10 text-slate-500 hover:text-sky-400 rounded-xl border border-white/5 transition-all">
                          <Edit3 size={15} />
                        </button>
                        <button onClick={() => onDelete(c.id)} className="p-2.5 bg-white/5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 rounded-xl border border-white/5 transition-all">
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}