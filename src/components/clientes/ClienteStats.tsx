'use client'
import { FileText, Calendar, Truck, TrendingUp, Wallet, Receipt } from 'lucide-react'

export function ClienteStats({ selected }: { selected: any }) {
  // 🚀 LÓGICA V2.0: Calculamos métricas reales de la Cuenta Corriente
  const saldoActual = Number(selected.saldo || 0);
  
  // Fletes pendientes: Son movimientos de tipo 'Cargo por Flete' que no tienen un 'Haber' asociado (o el haber es 0)
  const fletesPendientes = selected.historial?.filter((m: any) => 
    Number(m.debe) > 0 && Number(m.haber) === 0
  ).length || 0;

  // Cobros realizados: Registros donde hubo entrada de dinero (Haber)
  const cobrosRealizados = selected.historial?.filter((m: any) => 
    Number(m.haber) > 0
  ).length || 0;

  const stats = [
    { 
      label: 'Saldo en Calle', 
      val: `$${saldoActual.toLocaleString('es-AR')}`, 
      // Si el saldo es positivo, el cliente debe (color alerta/informativo)
      color: saldoActual > 0 ? 'text-emerald-500' : 'text-slate-500', 
      icon: Wallet,
      desc: 'Capital pendiente de cobro'
    },
    { 
      label: 'Viajes sin Cobrar', 
      val: fletesPendientes, 
      color: 'text-sky-400', 
      icon: Receipt,
      desc: `${cobrosRealizados} cobranzas finalizadas`
    },
    { 
      label: 'Última Actividad', 
      val: selected.historial?.[0]?.fecha 
            ? new Date(selected.historial[0].fecha).toLocaleDateString('es-AR') 
            : 'SIN REGISTROS', 
      color: 'text-white', 
      icon: Calendar,
      desc: 'Fecha del último movimiento'
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10 font-sans italic">
      {stats.map((stat, i) => (
        <div key={i} className="bg-slate-900/40 p-10 rounded-[3.5rem] border border-white/5 relative overflow-hidden group shadow-2xl backdrop-blur-sm">
          
          {/* Icono de fondo gigante con efecto hover */}
          <stat.icon className="absolute -top-6 -right-6 w-40 h-40 opacity-[0.03] group-hover:opacity-[0.07] group-hover:scale-110 group-hover:rotate-12 transition-all duration-700 pointer-events-none text-white" />
          
          <div className="relative z-10">
            <div className="flex flex-col gap-1 mb-4">
               <span className="w-8 h-1 bg-sky-500/30 rounded-full group-hover:w-12 transition-all duration-500" />
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">{stat.label}</p>
            </div>
            
            <p className={`text-4xl lg:text-5xl font-black ${stat.color} tracking-tighter leading-none mb-3`}>
              {stat.val}
            </p>
            
            <p className="text-[9px] font-bold text-slate-600 uppercase tracking-[0.3em]">
              {stat.desc}
            </p>
          </div>

          {/* Brillo sutil de fondo */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent pointer-events-none" />
        </div>
      ))}
    </div>
  )
}