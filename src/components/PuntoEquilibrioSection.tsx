'use client'
import { useState, useMemo } from 'react'
import { TrendingUp, Target, Calendar, Truck, DollarSign, AlertTriangle, CheckCircle2, ChevronRight } from 'lucide-react'

interface PuntoEquilibrioProps {
  costosFijosMes: number
  viajes: any[]
  multas: any[]
  costos: any[]
}

export function PuntoEquilibrioSection({ costosFijosMes, viajes, multas, costos }: PuntoEquilibrioProps) {
  const hoy = new Date()
  const [dateStart, setDateStart] = useState(() => new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0])
  const [dateEnd,   setDateEnd]   = useState(() => new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0])

  // Costos variables del período (multas pendientes + pagadas en el rango)
  const multasPeriodo = useMemo(() => {
    return multas
      .filter(m => m.fecha >= dateStart && m.fecha <= dateEnd && m.estado !== 'apelada')
      .reduce((acc, m) => acc + Number(m.monto), 0)
  }, [multas, dateStart, dateEnd])

  // Días del período
  const diasPeriodo = useMemo(() => {
    const start = new Date(dateStart)
    const end   = new Date(dateEnd)
    return Math.max(1, Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1)
  }, [dateStart, dateEnd])

  const mesesPeriodo = diasPeriodo / 30

  // Costos fijos prorrateados al período
  const costosFijosperiodo = costosFijosMes * mesesPeriodo

  // Viajes del período
  const viajesPeriodo = useMemo(() => {
    return viajes.filter(v => v.fecha >= dateStart && v.fecha <= dateEnd)
  }, [viajes, dateStart, dateEnd])

  const cantidadViajes = viajesPeriodo.length
  const ingresosPeriodo = viajesPeriodo.reduce((acc, v) => acc + Number(v.precio || 0), 0)
  const ticketPromedio  = cantidadViajes > 0 ? ingresosPeriodo / cantidadViajes : 0

  // PUNTO DE EQUILIBRIO
  const totalCostosperiodo = costosFijosperiodo + multasPeriodo
  const resultado = ingresosPeriodo - totalCostosperiodo

  // Cuántos viajes se necesitan para cubrir costos (con el ticket promedio actual)
  const viajesNecesarios = ticketPromedio > 0 ? Math.ceil(totalCostosperiodo / ticketPromedio) : 0

  // Cuánto necesitaría facturar por mes para estar en equilibrio
  const facturacionNecesariaMes = costosFijosMes + (multasPeriodo / mesesPeriodo)

  // % de cobertura
  const porcentajeCobertura = totalCostosperiodo > 0
    ? Math.min(200, (ingresosPeriodo / totalCostosperiodo) * 100)
    : 100

  const enEquilibrio = resultado >= 0

  // Setear el mes actual
  const setEsteMes = () => {
    setDateStart(new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0])
    setDateEnd(new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0])
  }

  const setEsteAno = () => {
    setDateStart(new Date(hoy.getFullYear(), 0, 1).toISOString().split('T')[0])
    setDateEnd(new Date(hoy.getFullYear(), 11, 31).toISOString().split('T')[0])
  }

  return (
    <div className="space-y-6 font-sans italic">

      {/* FILTRO DE PERÍODO */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 bg-slate-950/40 p-2 rounded-[2rem] border border-white/5">
        <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-white/5 shrink-0">
          <button onClick={setEsteMes} className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/5 transition-all">
            Este Mes
          </button>
          <button onClick={setEsteAno} className="px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white hover:bg-white/5 transition-all">
            Este Año
          </button>
        </div>
        <div className="flex flex-1 items-center gap-4 px-4">
          <div className="flex flex-col">
            <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Desde</span>
            <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)}
              className="bg-transparent text-white font-black text-sm outline-none [color-scheme:dark]" />
          </div>
          <ChevronRight size={14} className="text-slate-700" />
          <div className="flex flex-col">
            <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Hasta</span>
            <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)}
              className="bg-transparent text-white font-black text-sm outline-none [color-scheme:dark]" />
          </div>
          <span className="ml-auto text-[9px] font-black text-slate-600 uppercase bg-white/5 px-3 py-1 rounded-lg border border-white/5">
            {diasPeriodo} días
          </span>
        </div>
      </div>

      {/* RESULTADO PRINCIPAL */}
      <div className={`relative rounded-[3rem] border p-10 overflow-hidden shadow-2xl ${
        enEquilibrio
          ? 'bg-emerald-500/10 border-emerald-500/30'
          : 'bg-rose-500/10 border-rose-500/30'
      }`}>
        <div className="absolute inset-0 pointer-events-none">
          {enEquilibrio
            ? <CheckCircle2 size={300} className="absolute -right-16 -bottom-16 text-emerald-500/5" />
            : <AlertTriangle size={300} className="absolute -right-16 -bottom-16 text-rose-500/5" />
          }
        </div>
        <div className="relative z-10">
          <p className={`text-[10px] font-black uppercase tracking-[0.4em] mb-2 ${enEquilibrio ? 'text-emerald-500' : 'text-rose-500'}`}>
            {enEquilibrio ? '✓ Por encima del punto de equilibrio' : '✗ Por debajo del punto de equilibrio'}
          </p>
          <div className="flex flex-col md:flex-row items-start md:items-end gap-4 md:gap-8">
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Resultado del Período</p>
              <p className={`text-6xl md:text-8xl font-black italic tabular-nums tracking-tighter leading-none ${enEquilibrio ? 'text-emerald-400' : 'text-rose-400'}`}>
                {enEquilibrio ? '+' : ''}$ {resultado.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="flex gap-6 pb-2">
              <div>
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Ingresos</p>
                <p className="text-2xl font-black text-emerald-400 tabular-nums">$ {ingresosPeriodo.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
              </div>
              <div>
                <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Costos</p>
                <p className="text-2xl font-black text-rose-400 tabular-nums">$ {totalCostosperiodo.toLocaleString('es-AR', { maximumFractionDigits: 0 })}</p>
              </div>
            </div>
          </div>

          {/* BARRA DE PROGRESO */}
          <div className="mt-6">
            <div className="flex justify-between mb-2">
              <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Cobertura de costos</span>
              <span className={`text-[9px] font-black uppercase ${enEquilibrio ? 'text-emerald-400' : 'text-rose-400'}`}>
                {porcentajeCobertura.toFixed(1)}%
              </span>
            </div>
            <div className="h-3 bg-white/5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-700 ${enEquilibrio ? 'bg-emerald-500' : 'bg-rose-500'}`}
                style={{ width: `${Math.min(100, porcentajeCobertura)}%` }}
              />
            </div>
            <div className="flex justify-between mt-1">
              <span className="text-[7px] font-black text-slate-700 uppercase">$0</span>
              <span className="text-[7px] font-black text-slate-500 uppercase">PUNTO DE EQUILIBRIO</span>
              <span className="text-[7px] font-black text-slate-700 uppercase">200%</span>
            </div>
          </div>
        </div>
      </div>

      {/* GRILLA DE MÉTRICAS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        {/* Costos fijos del período */}
        <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-7">
          <DollarSign size={16} className="text-orange-400 mb-3" />
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">Costos Fijos Período</p>
          <p className="text-3xl font-black text-orange-400 italic tabular-nums tracking-tighter mt-1">
            $ {costosFijosperiodo.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[8px] font-bold text-slate-600 uppercase mt-2">
            $ {costosFijosMes.toLocaleString('es-AR', { maximumFractionDigits: 0 })} / mes
          </p>
        </div>

        {/* Multas del período */}
        <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-7">
          <AlertTriangle size={16} className="text-rose-400 mb-3" />
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">Multas del Período</p>
          <p className="text-3xl font-black text-rose-400 italic tabular-nums tracking-tighter mt-1">
            $ {multasPeriodo.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </p>
          <p className="text-[8px] font-bold text-slate-600 uppercase mt-2">
            {multas.filter(m => m.fecha >= dateStart && m.fecha <= dateEnd && m.estado !== 'apelada').length} multas computadas
          </p>
        </div>

        {/* Viajes del período */}
        <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-7">
          <Truck size={16} className="text-sky-400 mb-3" />
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">Viajes Completados</p>
          <p className="text-3xl font-black text-sky-400 italic tabular-nums tracking-tighter mt-1">
            {cantidadViajes}
          </p>
          <p className="text-[8px] font-bold text-slate-600 uppercase mt-2">
            Ticket prom: $ {ticketPromedio.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
          </p>
        </div>

        {/* Viajes necesarios */}
        <div className={`border rounded-[2.5rem] p-7 ${enEquilibrio ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'}`}>
          <Target size={16} className={`mb-3 ${enEquilibrio ? 'text-emerald-400' : 'text-rose-400'}`} />
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">Viajes p/ Equilibrio</p>
          <p className={`text-3xl font-black italic tabular-nums tracking-tighter mt-1 ${enEquilibrio ? 'text-emerald-400' : 'text-rose-400'}`}>
            {viajesNecesarios}
          </p>
          <p className="text-[8px] font-bold text-slate-600 uppercase mt-2">
            {cantidadViajes >= viajesNecesarios
              ? `✓ Superado por ${cantidadViajes - viajesNecesarios} viaje${cantidadViajes - viajesNecesarios !== 1 ? 's' : ''}`
              : `Faltan ${viajesNecesarios - cantidadViajes} viaje${viajesNecesarios - cantidadViajes !== 1 ? 's' : ''}`
            }
          </p>
        </div>
      </div>

      {/* DESGLOSE DE COSTOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Por viaje */}
        <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 space-y-5">
          <div className="flex items-center gap-3">
            <Truck size={18} className="text-sky-400" />
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Análisis por Viaje</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Costo fijo por viaje',   value: cantidadViajes > 0 ? costosFijosperiodo / cantidadViajes : 0, color: 'text-orange-400' },
              { label: 'Multas por viaje',        value: cantidadViajes > 0 ? multasPeriodo / cantidadViajes : 0,      color: 'text-rose-400' },
              { label: 'Costo total por viaje',   value: cantidadViajes > 0 ? totalCostosperiodo / cantidadViajes : 0, color: 'text-slate-300', bold: true },
              { label: 'Ingreso promedio/viaje',  value: ticketPromedio,                                               color: 'text-emerald-400', bold: true },
            ].map((row, i) => (
              <div key={i} className={`flex justify-between items-center py-3 ${i < 3 ? 'border-b border-white/5' : 'border-t-2 border-white/10 mt-2 pt-4'}`}>
                <span className={`text-[9px] font-black uppercase tracking-widest ${row.bold ? 'text-slate-300' : 'text-slate-500'}`}>{row.label}</span>
                <span className={`text-lg font-black tabular-nums ${row.color}`}>
                  $ {row.value.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </div>
          {ticketPromedio > 0 && (
            <div className={`p-4 rounded-2xl text-center text-[9px] font-black uppercase tracking-widest ${
              ticketPromedio > (cantidadViajes > 0 ? totalCostosperiodo / cantidadViajes : 0)
                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
            }`}>
              {ticketPromedio > (cantidadViajes > 0 ? totalCostosperiodo / cantidadViajes : 0)
                ? `✓ Cada viaje deja $ ${(ticketPromedio - totalCostosperiodo / cantidadViajes).toLocaleString('es-AR', { maximumFractionDigits: 0 })} de margen`
                : `✗ Cada viaje pierde $ ${(totalCostosperiodo / cantidadViajes - ticketPromedio).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`
              }
            </div>
          )}
        </div>

        {/* Por mes */}
        <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-8 space-y-5">
          <div className="flex items-center gap-3">
            <Calendar size={18} className="text-violet-400" />
            <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Análisis Mensual</h3>
          </div>
          <div className="space-y-3">
            {[
              { label: 'Costos fijos / mes',           value: costosFijosMes,                                          color: 'text-orange-400' },
              { label: 'Multas prom. / mes',            value: multasPeriodo / mesesPeriodo,                            color: 'text-rose-400' },
              { label: 'Necesito facturar / mes',       value: facturacionNecesariaMes,                                 color: 'text-slate-300', bold: true },
              { label: 'Ingresos prom. reales / mes',   value: ingresosPeriodo / mesesPeriodo,                          color: 'text-emerald-400', bold: true },
            ].map((row, i) => (
              <div key={i} className={`flex justify-between items-center py-3 ${i < 3 ? 'border-b border-white/5' : 'border-t-2 border-white/10 mt-2 pt-4'}`}>
                <span className={`text-[9px] font-black uppercase tracking-widest ${row.bold ? 'text-slate-300' : 'text-slate-500'}`}>{row.label}</span>
                <span className={`text-lg font-black tabular-nums ${row.color}`}>
                  $ {row.value.toLocaleString('es-AR', { maximumFractionDigits: 0 })}
                </span>
              </div>
            ))}
          </div>
          <div className={`p-4 rounded-2xl text-center text-[9px] font-black uppercase tracking-widest ${
            ingresosPeriodo / mesesPeriodo >= facturacionNecesariaMes
              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
          }`}>
            {ingresosPeriodo / mesesPeriodo >= facturacionNecesariaMes
              ? `✓ Superás el punto de equilibrio por $ ${((ingresosPeriodo / mesesPeriodo) - facturacionNecesariaMes).toLocaleString('es-AR', { maximumFractionDigits: 0 })} / mes`
              : `✗ Te faltan $ ${(facturacionNecesariaMes - ingresosPeriodo / mesesPeriodo).toLocaleString('es-AR', { maximumFractionDigits: 0 })} / mes`
            }
          </div>
        </div>
      </div>
    </div>
  )
}