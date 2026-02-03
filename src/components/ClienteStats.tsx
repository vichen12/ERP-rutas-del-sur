'use client'
import { FileText, Calendar, Truck } from 'lucide-react'

export function ClienteStats({ selected }: { selected: any }) {
  const stats = [
    { 
      label: 'Saldo Adeudado', 
      val: `$${selected.saldo.toLocaleString('es-AR')}`, 
      color: selected.saldo > 0 ? 'text-rose-500' : 'text-emerald-400', 
      icon: FileText 
    },
    { 
      label: 'Última Actividad', 
      val: selected.historial[0]?.fecha || '---', 
      color: 'text-white', 
      icon: Calendar 
    },
    { 
      label: 'Fletes Registrados', 
      val: selected.historial.filter((m: any) => m.debe > 0).length, 
      color: 'text-sky-400', 
      icon: Truck 
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-8">
      {stats.map((stat, i) => (
        <div key={i} className="bg-slate-900/40 p-8 rounded-[2rem] border border-white/5 relative overflow-hidden group shadow-lg">
          <stat.icon className="absolute -top-4 -right-4 w-32 h-32 opacity-[0.03] group-hover:scale-110 transition-transform" />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">{stat.label}</p>
          <p className={`text-3xl lg:text-4xl font-black ${stat.color} tracking-tighter italic`}>
            {stat.val}
          </p>
        </div>
      ))}
    </div>
  )
}