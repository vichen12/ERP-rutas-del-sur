'use client'
import { Plus, Bell, CheckSquare, AlertTriangle, Clock, Archive, Filter, Mail, Phone } from 'lucide-react'

type FiltroEstado = 'todas' | 'pendientes' | 'hoy' | 'vencidas' | 'completadas'

interface TareasHeaderProps {
  filtro: FiltroEstado
  setFiltro: (v: FiltroEstado) => void
  categoriaFiltro: string
  setCategoriaFiltro: (v: string) => void
  onNuevaTarea: () => void
  onOpenNotifConfig: () => void
  notifConfig: { email: string; whatsapp: string }
}

const FILTROS: { value: FiltroEstado; label: string; icon: any }[] = [
  { value: 'pendientes', label: 'Pendientes', icon: Clock },
  { value: 'hoy',        label: 'Hoy',        icon: AlertTriangle },
  { value: 'vencidas',   label: 'Vencidas',   icon: AlertTriangle },
  { value: 'completadas',label: 'Completadas',icon: CheckSquare },
  { value: 'todas',      label: 'Todas',      icon: Archive },
]

const CATEGORIAS = [
  { value: 'todas',        label: 'Todas',       color: 'text-slate-400' },
  { value: 'mantenimiento',label: 'Mantenimiento',color: 'text-amber-400' },
  { value: 'pago_fijo',    label: 'Pagos',        color: 'text-sky-400' },
  { value: 'operativa',    label: 'Operativas',   color: 'text-violet-400' },
]

export function TareasHeader({ filtro, setFiltro, categoriaFiltro, setCategoriaFiltro, onNuevaTarea, onOpenNotifConfig, notifConfig }: TareasHeaderProps) {
  const notifOk = notifConfig.email || notifConfig.whatsapp

  return (
    <div className="space-y-6 font-sans italic">

      {/* TÍTULO */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse" />
            <p className="text-[10px] font-black text-violet-500 uppercase tracking-[0.4em]">Centro de Control</p>
          </div>
          <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.85]">
            TAREAS <br />
            <span className="text-violet-500 font-thin">/ RECORDATORIOS</span>
          </h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-3">
            Gestión de vencimientos y obligaciones · Rutas del Sur ERP
          </p>
        </div>

        {/* BOTONES DE ACCIÓN */}
        <div className="flex gap-3 flex-wrap">
          {/* Config notificaciones */}
          <button
            onClick={onOpenNotifConfig}
            className={`flex items-center gap-3 px-6 py-4 rounded-[1.8rem] font-black uppercase text-[9px] tracking-[0.2em] transition-all border ${
              notifOk
                ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20 animate-pulse'
            }`}
          >
            <Bell size={16} />
            {notifOk ? 'Notif. Configuradas' : 'Configurar Notif.'}
            {notifOk && (
              <span className="flex gap-1 ml-1">
                {notifConfig.email && <Mail size={12} className="text-emerald-500" />}
                {notifConfig.whatsapp && <Phone size={12} className="text-emerald-500" />}
              </span>
            )}
          </button>

          <button
            onClick={onNuevaTarea}
            className="flex items-center gap-3 px-10 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-[1.8rem] font-black uppercase text-[9px] tracking-[0.2em] transition-all active:scale-95 shadow-xl group"
          >
            <Plus size={18} strokeWidth={4} className="group-hover:rotate-90 transition-transform" />
            Nueva Tarea
          </button>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-3">

        {/* FILTRO POR ESTADO */}
        <div className="flex bg-slate-900 p-1.5 rounded-3xl border border-white/5 shadow-inner flex-1 lg:flex-none overflow-x-auto">
          {FILTROS.map(f => {
            const isActive = filtro === f.value
            const activeColors: Record<string, string> = {
              pendientes:  'bg-slate-600 text-white',
              hoy:         'bg-amber-600 text-white',
              vencidas:    'bg-rose-600 text-white',
              completadas: 'bg-emerald-600 text-white',
              todas:       'bg-indigo-600 text-white',
            }
            return (
              <button
                key={f.value}
                onClick={() => setFiltro(f.value)}
                className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                  isActive ? `${activeColors[f.value]} shadow-lg` : 'text-slate-500 hover:text-white'
                }`}
              >
                <f.icon size={12} />
                {f.label}
              </button>
            )
          })}
        </div>

        {/* FILTRO POR CATEGORÍA */}
        <div className="flex bg-slate-900 p-1.5 rounded-3xl border border-white/5 shadow-inner">
          <div className="flex items-center gap-1.5 px-3 text-slate-600">
            <Filter size={12} />
          </div>
          {CATEGORIAS.map(c => (
            <button
              key={c.value}
              onClick={() => setCategoriaFiltro(c.value)}
              className={`px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all whitespace-nowrap ${
                categoriaFiltro === c.value
                  ? `bg-white/10 ${c.color} shadow-lg`
                  : 'text-slate-600 hover:text-white'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
