'use client'
import { useState } from 'react'
import { Plus, Calendar, Globe, TrendingUp, TrendingDown, Landmark, Wallet } from 'lucide-react'

interface CajaHeaderProps {
  tipoCuenta: 'todas' | 'caja' | 'banco'
  setTipoCuenta: (v: 'todas' | 'caja' | 'banco') => void
  dateStart: string
  setDateStart: (v: string) => void
  dateEnd: string
  setDateEnd: (v: string) => void
  showAllTime: boolean
  setShowAllTime: (v: boolean) => void
  onNuevoMovimiento: () => void
  totalIngresos: number
  totalEgresos: number
}

export function CajaHeader({
  tipoCuenta, setTipoCuenta,
  dateStart, setDateStart,
  dateEnd, setDateEnd,
  showAllTime, setShowAllTime,
  onNuevoMovimiento,
  totalIngresos, totalEgresos,
}: CajaHeaderProps) {

  const setEsteMes = () => {
    const hoy = new Date()
    setDateStart(new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0])
    setDateEnd(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0])
    setShowAllTime(false)
  }

  const setEsteAno = () => {
    const hoy = new Date()
    setDateStart(new Date(hoy.getFullYear(), 0, 1).toISOString().split('T')[0])
    setDateEnd(new Date(hoy.getFullYear(), 11, 31).toISOString().split('T')[0])
    setShowAllTime(false)
  }

  return (
    <div className="space-y-6 font-sans italic">

      {/* TÍTULO */}
      <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Tesorería Central</p>
          </div>
          <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.85]">
            CAJA <br />
            <span className="text-emerald-500 font-thin">/ BANCO</span>
          </h1>
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-3">
            Control financiero integral · Rutas del Sur ERP
          </p>
        </div>

        {/* KPIs rápidos del período */}
        <div className="flex gap-4 flex-wrap">
          <div className="bg-emerald-500/10 border border-emerald-500/20 px-8 py-5 rounded-[2rem] flex items-center gap-4">
            <TrendingUp size={22} className="text-emerald-500" />
            <div>
              <p className="text-[8px] font-black text-emerald-500/70 uppercase tracking-widest">Ingresos del Período</p>
              <p className="text-2xl font-black text-emerald-400 italic tabular-nums">
                $ {totalIngresos.toLocaleString('es-AR')}
              </p>
            </div>
          </div>
          <div className="bg-rose-500/10 border border-rose-500/20 px-8 py-5 rounded-[2rem] flex items-center gap-4">
            <TrendingDown size={22} className="text-rose-500" />
            <div>
              <p className="text-[8px] font-black text-rose-500/70 uppercase tracking-widest">Egresos del Período</p>
              <p className="text-2xl font-black text-rose-400 italic tabular-nums">
                $ {totalEgresos.toLocaleString('es-AR')}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* BARRA DE FILTROS */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-4 bg-slate-950/40 p-2 rounded-[2.2rem] border border-white/5">

        {/* SELECTOR CAJA / BANCO */}
        <div className="flex bg-slate-900 p-1.5 rounded-3xl border border-white/5 shadow-inner shrink-0">
          {(['todas', 'caja', 'banco'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTipoCuenta(t)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${
                tipoCuenta === t
                  ? t === 'caja'
                    ? 'bg-amber-600 text-white shadow-lg'
                    : t === 'banco'
                    ? 'bg-sky-600 text-white shadow-lg'
                    : 'bg-emerald-600 text-white shadow-lg'
                  : 'text-slate-500 hover:text-white'
              }`}
            >
              {t === 'caja' ? <Wallet size={12} /> : t === 'banco' ? <Landmark size={12} /> : null}
              {t === 'todas' ? 'Todas' : t === 'caja' ? 'Efectivo' : 'Banco'}
            </button>
          ))}
        </div>

        {/* FILTROS RÁPIDOS */}
        <div className="flex bg-slate-900 p-1.5 rounded-3xl border border-white/5 shadow-inner shrink-0">
          <button onClick={setEsteMes} className="px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all text-slate-500 hover:text-white hover:bg-white/5">
            Este Mes
          </button>
          <button onClick={setEsteAno} className="px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all text-slate-500 hover:text-white hover:bg-white/5">
            Este Año
          </button>
        </div>

        {/* RANGO DE FECHAS */}
        <div className={`flex-1 flex flex-col sm:flex-row items-center gap-4 px-4 transition-all duration-700 ${showAllTime ? 'opacity-20 grayscale pointer-events-none' : 'opacity-100'}`}>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <Calendar className="text-emerald-500 shrink-0" size={16} />
            <div className="flex flex-col">
              <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Desde</span>
              <input
                type="date"
                value={dateStart}
                onChange={e => setDateStart(e.target.value)}
                className="bg-transparent text-white font-black text-xs uppercase outline-none [color-scheme:dark]"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="flex flex-col">
              <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Hasta</span>
              <input
                type="date"
                value={dateEnd}
                onChange={e => setDateEnd(e.target.value)}
                className="bg-transparent text-white font-black text-xs uppercase outline-none [color-scheme:dark]"
              />
            </div>
          </div>
        </div>

        {/* BOTÓN HISTÓRICO */}
        <button
          onClick={() => setShowAllTime(!showAllTime)}
          className={`flex items-center justify-center gap-3 px-8 py-4 rounded-[1.8rem] text-[9px] font-black uppercase tracking-[0.2em] transition-all border shrink-0 ${
            showAllTime
              ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg'
              : 'bg-slate-900 border-white/10 text-slate-500 hover:text-white'
          }`}
        >
          <Globe size={16} />
          {showAllTime ? 'Historial Completo' : 'Ver Todo'}
        </button>

        {/* BOTÓN NUEVO MOVIMIENTO */}
        <button
          onClick={onNuevoMovimiento}
          className="flex items-center justify-center gap-3 px-10 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-[1.8rem] font-black uppercase text-[9px] tracking-[0.2em] transition-all active:scale-95 shadow-xl group shrink-0"
        >
          <Plus size={18} strokeWidth={4} className="group-hover:rotate-90 transition-transform" />
          Nuevo Movimiento
        </button>
      </div>
    </div>
  )
}
