'use client'
import { useMemo } from 'react'
import { Plus, Edit3, Trash2, ToggleLeft, ToggleRight, Loader2, DollarSign, TrendingUp, Calendar, RefreshCw, Banknote, Activity, Clock, AlertCircle, CheckCircle2 } from 'lucide-react'
import type { VariableContext } from '@/app/costos-multas/page'
import { evaluarFormula, labelFrecuencia } from '@/app/costos-multas/page'

interface Props {
  activeSubTab: 'impuestos' | 'costos'
  costos: any[]
  loading: boolean
  pendientes: any[]
  variableContext: VariableContext
  totalMensual: number
  onNuevoImpuesto: () => void
  onNuevoCosto: () => void
  onEdit: (c: any) => void
  onDelete: (id: string) => void
  onToggle: (id: string, activo: boolean) => void
  onPagar: (c: any) => void
}

export function CostosFijosSection({
  activeSubTab, costos, loading, pendientes, variableContext, totalMensual,
  onNuevoImpuesto, onNuevoCosto, onEdit, onDelete, onToggle, onPagar
}: Props) {

  const impuestos = costos.filter(c => c.tipo === 'impuesto')
  const costosNormales = costos.filter(c => c.tipo !== 'impuesto')

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <Loader2 className="animate-spin text-orange-500" size={40} />
    </div>
  )

  return (
    <div className="space-y-8">

      {/* ═══════════════════════════════════════════════════════════
          PENDIENTES DE PAGO — Siempre visible arriba
      ═══════════════════════════════════════════════════════════ */}
      {pendientes.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-3 ml-1">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-pulse" />
            <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.3em]">
              Pendientes de Pago ({pendientes.length})
            </p>
          </div>
          <div className="bg-amber-500/[0.04] border border-amber-500/20 rounded-[2rem] overflow-hidden">
            <div className="divide-y divide-amber-500/10">
              {pendientes.map(c => {
                const val = evaluarFormula(c.monto, variableContext)
                const esFormula = isNaN(Number(c.monto)) && c.monto?.trim() !== ''
                const diasVencido = c.proximo_pago
                  ? Math.max(0, Math.floor((Date.now() - new Date(c.proximo_pago + 'T12:00:00').getTime()) / 86400000))
                  : 0

                return (
                  <div key={c.id} className="flex items-center justify-between px-6 py-4 hover:bg-amber-500/[0.03] transition-all group">
                    <div className="flex items-center gap-4 flex-1 min-w-0">
                      {/* Indicador tipo */}
                      <div className={`shrink-0 w-9 h-9 rounded-xl flex items-center justify-center ${
                        c.tipo === 'impuesto'
                          ? 'bg-violet-500/15 text-violet-400'
                          : c.recurrente
                            ? 'bg-orange-500/15 text-orange-400'
                            : 'bg-slate-500/15 text-slate-400'
                      }`}>
                        {c.tipo === 'impuesto' ? <Activity size={15} /> : c.recurrente ? <RefreshCw size={13} /> : <DollarSign size={15} />}
                      </div>

                      <div className="min-w-0">
                        <p className="text-sm font-black text-white uppercase truncate">{c.nombre}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className={`text-[8px] font-black uppercase tracking-widest ${
                            c.tipo === 'impuesto' ? 'text-violet-400' : 'text-slate-500'
                          }`}>
                            {c.tipo === 'impuesto' ? 'Impuesto' : c.recurrente ? 'Recurrente' : 'Costo'}
                          </span>
                          {c.frecuencia && (
                            <span className="text-[8px] font-bold text-slate-600">· {labelFrecuencia(c.frecuencia)}</span>
                          )}
                          {diasVencido > 0 && (
                            <span className="text-[8px] font-black text-rose-400 uppercase">· Vencido hace {diasVencido}d</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Monto */}
                    <div className="text-right mr-4">
                      {esFormula && (
                        <p className="text-[8px] font-mono text-slate-600 mb-0.5">{c.monto}</p>
                      )}
                      <p className="text-lg font-black text-amber-400 tabular-nums">
                        {val !== null ? `$ ${val.toLocaleString('es-AR', { maximumFractionDigits: 0 })}` : 'Error'}
                      </p>
                    </div>

                    {/* Botón Pagar */}
                    <button
                      onClick={() => onPagar(c)}
                      className="shrink-0 flex items-center gap-2 px-5 py-3 bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-400 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all active:scale-95"
                    >
                      <Banknote size={14} />
                      Pagar
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════════════
          CONTENIDO SEGÚN TAB ACTIVO
      ═══════════════════════════════════════════════════════════ */}

      {activeSubTab === 'impuestos' ? (
        <ImpuestosView
          impuestos={impuestos}
          variableContext={variableContext}
          totalMensual={totalMensual}
          onNuevo={onNuevoImpuesto}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggle={onToggle}
          onPagar={onPagar}
        />
      ) : (
        <CostosView
          costos={costosNormales}
          onNuevo={onNuevoCosto}
          onEdit={onEdit}
          onDelete={onDelete}
          onToggle={onToggle}
          onPagar={onPagar}
        />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════
//  VISTA: IMPUESTOS
// ═══════════════════════════════════════════════════════════
function ImpuestosView({ impuestos, variableContext, totalMensual, onNuevo, onEdit, onDelete, onToggle, onPagar }: {
  impuestos: any[]; variableContext: VariableContext; totalMensual: number
  onNuevo: () => void; onEdit: (c: any) => void; onDelete: (id: string) => void; onToggle: (id: string, activo: boolean) => void; onPagar: (c: any) => void
}) {
  const activos = impuestos.filter(c => c.activo).length

  return (
    <div className="space-y-6">

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-violet-500/10 border border-violet-500/20 rounded-[2.5rem] p-7 relative overflow-hidden">
          <Activity size={70} className="absolute -right-3 -bottom-3 text-violet-500/5 pointer-events-none" />
          <p className="text-[8px] font-black text-violet-400/70 uppercase tracking-[0.3em] mb-1">Carga Impositiva / Mes</p>
          <p className="text-3xl font-black text-violet-400 italic tabular-nums tracking-tighter">
            $ {totalMensual.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-2">{activos} impuestos activos</p>
        </div>
        <div className="bg-[#1a2537]/40 border border-white/5 rounded-[2.5rem] p-7 relative overflow-hidden">
          <TrendingUp size={70} className="absolute -right-3 -bottom-3 text-slate-500/5 pointer-events-none" />
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Proyección Anual</p>
          <p className="text-3xl font-black text-white italic tabular-nums tracking-tighter">
            $ {(totalMensual * 12).toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </p>
        </div>
        <div className="bg-[#1a2537]/40 border border-white/5 rounded-[2.5rem] p-7 relative overflow-hidden">
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">% sobre Ventas</p>
          <p className="text-3xl font-black text-orange-400 italic tabular-nums tracking-tighter">
            {variableContext.VENTAS > 0 ? ((totalMensual / variableContext.VENTAS) * 100).toFixed(1) : '0'}%
          </p>
        </div>
      </div>

      {/* Header + Botón */}
      <div className="flex justify-between items-center">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
          {impuestos.length} impuestos registrados
        </p>
        <button onClick={onNuevo}
          className="flex items-center gap-2 px-7 py-3.5 bg-violet-600 hover:bg-violet-500 text-white rounded-[1.8rem] font-black uppercase text-[9px] tracking-[0.2em] transition-all active:scale-95 shadow-xl group">
          <Plus size={16} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
          Nuevo Impuesto
        </button>
      </div>

      {/* Tabla */}
      {impuestos.length === 0 ? (
        <EmptyState text="Sin impuestos registrados" />
      ) : (
        <div className="bg-[#1a2537]/40 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-white/[0.02] text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] border-b border-white/5">
              <tr>
                <th className="p-5 pl-8">Nombre</th>
                <th className="p-5">Fórmula / Monto</th>
                <th className="p-5 text-center">Frecuencia</th>
                <th className="p-5 text-right">Resultado</th>
                <th className="p-5 text-center">Último Pago</th>
                <th className="p-5 text-center">Próximo</th>
                <th className="p-5 text-center">Estado</th>
                <th className="p-5 pr-8 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {impuestos.map(c => {
                const val = evaluarFormula(c.monto, variableContext)
                const esFormula = isNaN(Number(c.monto)) && c.monto?.trim() !== ''
                const vencido = c.proximo_pago && c.proximo_pago <= new Date().toISOString().split('T')[0]

                return (
                  <tr key={c.id} className={`hover:bg-white/[0.02] transition-all group ${!c.activo ? 'opacity-30' : ''}`}>
                    <td className="p-5 pl-8">
                      <p className="text-sm font-black text-white uppercase">{c.nombre}</p>
                      {c.notas && <p className="text-[9px] text-slate-600 font-bold uppercase mt-0.5">{c.notas}</p>}
                    </td>
                    <td className="p-5">
                      {esFormula ? (
                        <code className="font-mono text-xs font-bold text-violet-300 bg-violet-500/10 px-2 py-1 rounded-lg">{c.monto}</code>
                      ) : (
                        <span className="text-sm text-slate-400 tabular-nums">$ {Number(c.monto).toLocaleString('es-AR')}</span>
                      )}
                    </td>
                    <td className="p-5 text-center">
                      <span className="px-3 py-1.5 text-[8px] font-black uppercase rounded-xl border bg-violet-500/10 border-violet-500/20 text-violet-400">
                        {labelFrecuencia(c.frecuencia || 'mensual')}
                      </span>
                    </td>
                    <td className="p-5 text-right">
                      {val !== null
                        ? <p className="text-lg font-black text-white tabular-nums">$ {val.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
                        : <span className="text-[9px] font-black text-rose-400">ERROR</span>
                      }
                    </td>
                    <td className="p-5 text-center">
                      {c.ultimo_pago ? (
                        <div>
                          <p className="text-[9px] font-bold text-slate-500">{c.ultimo_pago}</p>
                          {c.monto_ultimo_pago && <p className="text-[8px] text-slate-600 tabular-nums">$ {Number(c.monto_ultimo_pago).toLocaleString('es-AR')}</p>}
                        </div>
                      ) : <span className="text-[8px] text-slate-700">—</span>}
                    </td>
                    <td className="p-5 text-center">
                      {c.proximo_pago ? (
                        <span className={`text-[9px] font-black ${vencido ? 'text-rose-400' : 'text-slate-400'}`}>
                          {c.proximo_pago}
                        </span>
                      ) : <span className="text-[8px] text-slate-700">—</span>}
                    </td>
                    <td className="p-5 text-center">
                      <button onClick={() => onToggle(c.id, c.activo)}
                        className={`transition-all hover:scale-110 active:scale-95 ${c.activo ? 'text-emerald-500' : 'text-slate-600'}`}>
                        {c.activo ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                      </button>
                    </td>
                    <td className="p-5 pr-8 text-center">
                      <div className="flex gap-1.5 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {vencido && c.activo && val !== null && (
                          <button onClick={() => onPagar(c)} className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/20 transition-all" title="Pagar">
                            <Banknote size={14} />
                          </button>
                        )}
                        <button onClick={() => onEdit(c)} className="p-2 bg-white/5 hover:bg-sky-500/10 text-slate-500 hover:text-sky-400 rounded-lg border border-white/5 transition-all">
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => onDelete(c.id)} className="p-2 bg-white/5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 rounded-lg border border-white/5 transition-all">
                          <Trash2 size={14} />
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

// ═══════════════════════════════════════════════════════════
//  VISTA: COSTOS NORMALES
// ═══════════════════════════════════════════════════════════
function CostosView({ costos, onNuevo, onEdit, onDelete, onToggle, onPagar }: {
  costos: any[]; onNuevo: () => void; onEdit: (c: any) => void; onDelete: (id: string) => void; onToggle: (id: string, activo: boolean) => void; onPagar: (c: any) => void
}) {
  const pagados = costos.filter(c => c.pagado).length
  const pendientes = costos.filter(c => !c.pagado && c.activo && !c.recurrente).length
  const recurrentes = costos.filter(c => c.recurrente).length
  const totalPendiente = costos.filter(c => !c.pagado && c.activo && !c.recurrente).reduce((a, c) => a + Number(c.monto || 0), 0)

  return (
    <div className="space-y-6">

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-[#1a2537]/40 border border-white/5 rounded-[2rem] p-6">
          <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] mb-1">Total Registrados</p>
          <p className="text-3xl font-black text-white italic tabular-nums">{costos.length}</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-[2rem] p-6">
          <p className="text-[8px] font-black text-amber-400/70 uppercase tracking-[0.3em] mb-1">Pendientes</p>
          <p className="text-3xl font-black text-amber-400 italic tabular-nums">{pendientes}</p>
          {totalPendiente > 0 && <p className="text-[8px] text-amber-400/60 font-bold mt-1">$ {totalPendiente.toLocaleString('es-AR')}</p>}
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] p-6">
          <p className="text-[8px] font-black text-emerald-400/70 uppercase tracking-[0.3em] mb-1">Pagados</p>
          <p className="text-3xl font-black text-emerald-400 italic tabular-nums">{pagados}</p>
        </div>
        <div className="bg-orange-500/10 border border-orange-500/20 rounded-[2rem] p-6">
          <p className="text-[8px] font-black text-orange-400/70 uppercase tracking-[0.3em] mb-1">Recurrentes</p>
          <p className="text-3xl font-black text-orange-400 italic tabular-nums">{recurrentes}</p>
        </div>
      </div>

      {/* Header + Botón */}
      <div className="flex justify-between items-center">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
          {costos.length} costos registrados
        </p>
        <button onClick={onNuevo}
          className="flex items-center gap-2 px-7 py-3.5 bg-orange-600 hover:bg-orange-500 text-white rounded-[1.8rem] font-black uppercase text-[9px] tracking-[0.2em] transition-all active:scale-95 shadow-xl group">
          <Plus size={16} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
          Nuevo Costo
        </button>
      </div>

      {/* Tabla */}
      {costos.length === 0 ? (
        <EmptyState text="Sin costos registrados" />
      ) : (
        <div className="bg-[#1a2537]/40 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
          <table className="w-full text-left">
            <thead className="bg-white/[0.02] text-[8px] font-black text-slate-600 uppercase tracking-[0.3em] border-b border-white/5">
              <tr>
                <th className="p-5 pl-8">Nombre</th>
                <th className="p-5 text-right">Monto</th>
                <th className="p-5 text-center">Tipo</th>
                <th className="p-5 text-center">Frecuencia</th>
                <th className="p-5 text-center">Estado Pago</th>
                <th className="p-5 text-center">Activo</th>
                <th className="p-5 pr-8 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {costos.map(c => {
                const isPagado = c.pagado && !c.recurrente
                const vencido = c.recurrente && c.proximo_pago && c.proximo_pago <= new Date().toISOString().split('T')[0]

                return (
                  <tr key={c.id} className={`hover:bg-white/[0.02] transition-all group ${!c.activo ? 'opacity-30' : ''} ${isPagado ? 'opacity-50' : ''}`}>
                    <td className="p-5 pl-8">
                      <p className="text-sm font-black text-white uppercase">{c.nombre}</p>
                      {c.notas && <p className="text-[9px] text-slate-600 font-bold uppercase mt-0.5">{c.notas}</p>}
                    </td>
                    <td className="p-5 text-right">
                      <p className="text-lg font-black text-white tabular-nums">$ {Number(c.monto).toLocaleString('es-AR')}</p>
                    </td>
                    <td className="p-5 text-center">
                      {c.recurrente ? (
                        <span className="px-3 py-1.5 text-[8px] font-black uppercase rounded-xl border bg-orange-500/10 border-orange-500/20 text-orange-400">
                          <RefreshCw size={10} className="inline mr-1 -mt-0.5" />Recurrente
                        </span>
                      ) : (
                        <span className="px-3 py-1.5 text-[8px] font-black uppercase rounded-xl border bg-slate-500/10 border-slate-500/20 text-slate-400">
                          Único
                        </span>
                      )}
                    </td>
                    <td className="p-5 text-center">
                      {c.recurrente && c.frecuencia ? (
                        <span className="text-[9px] font-bold text-slate-400">{labelFrecuencia(c.frecuencia)}</span>
                      ) : <span className="text-slate-700">—</span>}
                    </td>
                    <td className="p-5 text-center">
                      {isPagado ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 text-[8px] font-black uppercase rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
                          <CheckCircle2 size={10} /> Pagado
                        </span>
                      ) : vencido ? (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 text-[8px] font-black uppercase rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400">
                          <AlertCircle size={10} /> Vencido
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-3 py-1.5 text-[8px] font-black uppercase rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                          <Clock size={10} /> Pendiente
                        </span>
                      )}
                    </td>
                    <td className="p-5 text-center">
                      <button onClick={() => onToggle(c.id, c.activo)}
                        className={`transition-all hover:scale-110 active:scale-95 ${c.activo ? 'text-emerald-500' : 'text-slate-600'}`}>
                        {c.activo ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                      </button>
                    </td>
                    <td className="p-5 pr-8 text-center">
                      <div className="flex gap-1.5 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {!isPagado && c.activo && (
                          <button onClick={() => onPagar(c)} className="p-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-lg border border-emerald-500/20 transition-all" title="Pagar">
                            <Banknote size={14} />
                          </button>
                        )}
                        <button onClick={() => onEdit(c)} className="p-2 bg-white/5 hover:bg-sky-500/10 text-slate-500 hover:text-sky-400 rounded-lg border border-white/5 transition-all">
                          <Edit3 size={14} />
                        </button>
                        <button onClick={() => onDelete(c.id)} className="p-2 bg-white/5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 rounded-lg border border-white/5 transition-all">
                          <Trash2 size={14} />
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

function EmptyState({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 opacity-30">
      <DollarSign size={48} className="text-slate-600 mb-4" />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-600">{text}</p>
    </div>
  )
}