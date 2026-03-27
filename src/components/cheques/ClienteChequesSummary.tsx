'use client'
import { FileCheck, ArrowUpRight, Clock, XCircle } from 'lucide-react'
import Link from 'next/link'

interface Props {
  cheques: any[]
}

export function ClienteChequesSummary({ cheques }: Props) {
  if (cheques.length === 0) return null

  const hoy = new Date().toISOString().split('T')[0]
  const pendientes = cheques.filter(c => c.estado === 'pendiente')
  const totalPendiente = pendientes.reduce((s, c) => s + Number(c.monto), 0)
  const vencidos = pendientes.filter(c => c.fecha_vencimiento && c.fecha_vencimiento < hoy)

  function fmt(n: number) {
    return '$ ' + Number(n).toLocaleString('es-AR', { minimumFractionDigits: 0 })
  }
  function formatFecha(f: string | null) {
    if (!f) return '—'
    return new Date(f + 'T12:00:00').toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  return (
    <div className="bg-[#1a2537]/40 border border-indigo-500/10 rounded-[2rem] overflow-hidden font-sans italic">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-500/10 rounded-xl">
            <FileCheck size={16} className="text-indigo-400" />
          </div>
          <div>
            <h3 className="text-[10px] font-black text-white uppercase tracking-widest">Cheques del Cliente</h3>
            <p className="text-[8px] text-slate-500 font-bold uppercase tracking-widest mt-0.5">
              {cheques.length} registrado{cheques.length !== 1 ? 's' : ''} · {pendientes.length} pendiente{pendientes.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {vencidos.length > 0 && (
            <span className="flex items-center gap-1 px-3 py-1.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-[8px] font-black text-rose-400 uppercase">
              <XCircle size={10} /> {vencidos.length} vencido{vencidos.length !== 1 ? 's' : ''}
            </span>
          )}
          {totalPendiente > 0 && (
            <span className="text-base font-black text-emerald-400 tabular-nums">{fmt(totalPendiente)}</span>
          )}
          <Link href="/cheques"
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600/10 border border-indigo-500/20 rounded-xl text-[8px] font-black text-indigo-400 uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all">
            Ver todos <ArrowUpRight size={10} />
          </Link>
        </div>
      </div>

      {/* Lista de pendientes (máx 4) */}
      {pendientes.length > 0 && (
        <div className="divide-y divide-white/5">
          {pendientes.slice(0, 4).map(c => {
            const vencido = c.fecha_vencimiento && c.fecha_vencimiento < hoy
            return (
              <div key={c.id} className="flex items-center justify-between px-6 py-3 hover:bg-white/[0.02] transition-colors">
                <div className="flex items-center gap-3 min-w-0">
                  <Clock size={12} className={vencido ? 'text-rose-400 shrink-0' : 'text-slate-600 shrink-0'} />
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">
                      {c.numero_cheque ? `Nro. ${c.numero_cheque}` : 'Sin número'}
                      {c.banco && <span className="text-slate-500 font-normal"> · {c.banco}</span>}
                    </p>
                    <p className={`text-[8px] font-bold ${vencido ? 'text-rose-400' : 'text-slate-500'}`}>
                      Vence: {formatFecha(c.fecha_vencimiento)}
                      {vencido && ' ⚠ Vencido'}
                    </p>
                  </div>
                </div>
                <p className="text-sm font-black text-emerald-400 tabular-nums shrink-0">{fmt(c.monto)}</p>
              </div>
            )
          })}
          {pendientes.length > 4 && (
            <div className="px-6 py-2.5 text-center">
              <p className="text-[8px] text-slate-600 font-bold">+{pendientes.length - 4} más →
                <Link href="/cheques" className="text-indigo-400 ml-1 hover:underline">Ver en Cheques</Link>
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
