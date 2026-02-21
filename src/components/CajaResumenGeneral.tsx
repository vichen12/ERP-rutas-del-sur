'use client'
import { Wallet, Landmark, FileWarning, AlertCircle, TrendingUp, Loader2 } from 'lucide-react'

interface ResumenData {
  totalCaja: number
  totalBanco: number
  facturasImpagas: number
  deudasMes: number
  ingresosMes: number
  total: number
  totalCorriente: number
  totalEnDolar: number
  totalEnDolarTotal: number
}

export function CajaResumenGeneral({ resumen, loading }: { resumen: ResumenData, loading: boolean }) {

  const bloques = [
    {
      label: 'Caja',
      sublabel: 'Efectivo disponible',
      value: resumen.totalCaja,
      icon: Wallet,
      color: 'text-amber-400',
      bg: 'bg-amber-500/10',
      border: 'border-amber-500/20',
    },
    {
      label: 'Total Banco',
      sublabel: 'Saldo bancario acumulado',
      value: resumen.totalBanco,
      icon: Landmark,
      color: 'text-sky-400',
      bg: 'bg-sky-500/10',
      border: 'border-sky-500/20',
    },
    {
      label: 'Facturas Impagas',
      sublabel: 'A cobrar de clientes',
      value: resumen.facturasImpagas,
      icon: FileWarning,
      color: 'text-orange-400',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/20',
    },
    {
      label: 'Deudas del Mes',
      sublabel: 'Egresos registrados',
      value: -resumen.deudasMes,
      icon: AlertCircle,
      color: 'text-rose-400',
      bg: 'bg-rose-500/10',
      border: 'border-rose-500/20',
      isNegative: true,
    },
    {
      label: 'Total Empresa',
      sublabel: 'Patrimonio líquido neto',
      value: resumen.total,
      icon: TrendingUp,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/10',
      border: 'border-emerald-500/20',
      isTotal: true,
    },
  ]

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    )
  }

  return (
    <div className="space-y-4 font-sans italic">
      <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] px-2">
        Estado Patrimonial
      </h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {bloques.map((b, i) => (
          <div
            key={i}
            className={`relative rounded-[2.5rem] border p-7 overflow-hidden group transition-all hover:scale-[1.02] shadow-2xl ${b.bg} ${b.border} ${b.isTotal ? 'lg:col-span-1 ring-2 ring-emerald-500/20' : ''}`}
          >
            {/* Ícono de fondo decorativo */}
            <b.icon
              size={100}
              className={`absolute -right-6 -bottom-6 opacity-[0.06] group-hover:opacity-[0.1] transition-opacity ${b.color} pointer-events-none`}
            />

            <div className="relative z-10">
              <div className={`w-10 h-10 rounded-2xl ${b.bg} border ${b.border} flex items-center justify-center mb-4`}>
                <b.icon size={18} className={b.color} />
              </div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">{b.label}</p>
              <p className={`text-2xl md:text-3xl font-black italic tabular-nums tracking-tighter leading-none ${
                b.isNegative ? 'text-rose-400' : b.color
              }`}>
                {b.isNegative ? '-' : ''}$ {Math.abs(b.value).toLocaleString('es-AR')}
              </p>
              <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-2">{b.sublabel}</p>
            </div>

            {b.isTotal && (
              <div className="absolute top-4 right-4">
                <span className="px-2 py-1 bg-emerald-500/20 text-emerald-400 text-[7px] font-black uppercase tracking-widest rounded-lg border border-emerald-500/20">
                  NET
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
