'use client'
import { FileText, Calendar, Truck, TrendingUp, Wallet, Receipt } from 'lucide-react'

export function ClienteStats({ selected }: { selected: any }) {
  // 1. Calculamos las métricas basadas en el nuevo sistema de cajas
  const saldoActual = selected.saldo || 0;
  const fletesPendientes = selected.historial?.filter((m: any) => m.estado_gestion === 'por_cobrar').length || 0;
  const cobrosRealizados = selected.historial?.filter((m: any) => m.estado_gestion === 'cobrado').length || 0;

  const stats = [
    { 
      label: 'Capital en Calle (Saldo)', 
      val: `$${saldoActual.toLocaleString('es-AR')}`, 
      // Si el cliente nos debe, es capital a favor (Verde)
      color: saldoActual > 0 ? 'text-emerald-500' : 'text-slate-400', 
      icon: Wallet,
      desc: 'Monto pendiente de liquidar'
    },
    { 
      label: 'Fletes por Cobrar', 
      val: fletesPendientes, 
      color: 'text-sky-400', 
      icon: Receipt,
      desc: `${cobrosRealizados} cobranzas ya cerradas`
    },
    { 
      label: 'Último Movimiento', 
      val: selected.historial?.[0]?.fecha 
           ? new Date(selected.historial[0].fecha).toLocaleDateString('es-AR') 
           : '---', 
      color: 'text-white', 
      icon: Calendar,
      desc: 'Actividad reciente en cuenta'
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10">
      {stats.map((stat, i) => (
        <div key={i} className="bg-slate-900/40 p-10 rounded-[3.5rem] border border-white/5 relative overflow-hidden group shadow-2xl backdrop-blur-sm italic">
          {/* Icono de fondo gigante */}
          <stat.icon className="absolute -top-6 -right-6 w-40 h-40 opacity-[0.04] group-hover:scale-110 group-hover:rotate-12 transition-all duration-500" />
          
          <div className="relative z-10">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-3">{stat.label}</p>
            <p className={`text-4xl lg:text-5xl font-black ${stat.color} tracking-tighter leading-none mb-3`}>
              {stat.val}
            </p>
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
              {stat.desc}
            </p>
          </div>
        </div>
      ))}
    </div>
  )
}