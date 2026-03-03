'use client'
import { FileText, AlertCircle, DollarSign, Building2, Loader2 } from 'lucide-react'

export function FacturasKpis({ kpis, loading }: any) {
  if (loading) return <div className="flex justify-center py-10"><Loader2 className="animate-spin text-sky-500" size={32} /></div>
  
  const bloques = [
    { label: 'Facturas Emitidas',     value: kpis.emitidas,              color: 'text-sky-400',     bg: 'bg-sky-500/10',     border: 'border-sky-500/20',    icon: FileText },
    { label: 'Errores',               value: kpis.errores,               color: 'text-rose-400',    bg: 'bg-rose-500/10',    border: 'border-rose-500/20',   icon: AlertCircle, alert: kpis.errores > 0 },
    { label: 'Facturado del Período', value: `$ ${kpis.totalMes.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`,  color: 'text-emerald-400', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', icon: DollarSign },
    { label: 'Total Histórico',       value: `$ ${kpis.totalHist.toLocaleString('es-AR', { maximumFractionDigits: 0 })}`, color: 'text-slate-300',   bg: 'bg-slate-500/10',   border: 'border-slate-500/20',  icon: Building2 },
  ]
  
  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-sans italic">
      {bloques.map((b, i) => (
        <div key={i} className={`relative rounded-[2.5rem] border p-7 overflow-hidden shadow-2xl ${b.bg} ${b.border} ${(b as any).alert ? 'ring-2 ring-rose-500/30' : ''}`}>
          <b.icon size={80} className={`absolute -right-4 -bottom-4 opacity-5 pointer-events-none ${b.color}`} />
          <div className="relative z-10">
            <div className={`w-9 h-9 rounded-xl ${b.bg} border ${b.border} flex items-center justify-center mb-3`}><b.icon size={16} className={b.color} /></div>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">{b.label}</p>
            <p className={`text-3xl font-black italic tabular-nums tracking-tighter mt-1 ${b.color}`}>{b.value}</p>
          </div>
        </div>
      ))}
    </div>
  )
}