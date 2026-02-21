'use client'
import { Clock, AlertTriangle, Zap, CheckCircle2, Loader2 } from 'lucide-react'

export function TareasKpis({ kpis, loading }: { kpis: any; loading: boolean }) {
  const bloques = [
    {
      label: 'Pendientes',
      value: kpis.total,
      sublabel: 'Sin completar',
      icon: Clock,
      color: 'text-slate-300',
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/20',
    },
    {
      label: 'Vencidas',
      value: kpis.vencidas,
      sublabel: 'Atención urgente',
      icon: AlertTriangle,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      alert: kpis.vencidas > 0,
    },
    {
      label: 'Próximos 7 días',
      value: kpis.proximas,
      sublabel: 'Por vencer pronto',
      icon: Zap,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
    {
      label: 'Completadas Hoy',
      value: kpis.completadasHoy,
      sublabel: 'Logros del día',
      icon: CheckCircle2,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
    },
  ]

  if (loading) return (
    <div className="flex items-center justify-center py-10">
      <Loader2 className="animate-spin text-violet-500" size={32} />
    </div>
  )

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 font-sans italic">
      {bloques.map((b, i) => (
        <div
          key={i}
          className={`relative rounded-[2.5rem] border p-6 overflow-hidden group transition-all hover:scale-[1.02] shadow-2xl ${b.bg} ${b.border} ${b.alert ? 'ring-2 ring-rose-500/30 animate-pulse' : ''}`}
        >
          <b.icon size={80} className={`absolute -right-4 -bottom-4 opacity-[0.07] pointer-events-none ${b.color}`} />
          <div className="relative z-10">
            <div className={`w-9 h-9 rounded-xl ${b.bg} border ${b.border} flex items-center justify-center mb-3`}>
              <b.icon size={16} className={b.color} />
            </div>
            <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">{b.label}</p>
            <p className={`text-5xl font-black italic tabular-nums tracking-tighter leading-none mt-1 ${b.color}`}>
              {b.value}
            </p>
            <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-2">{b.sublabel}</p>
          </div>
        </div>
      ))}
    </div>
  )
}
