'use client'
import { 
  ArrowUpRight, ArrowDownLeft, Wallet, Landmark, 
  Edit3, Trash2, Calendar, Tag, User, Truck, 
  Building2, Loader2, FilterX, BarChart4, ListOrdered,
  SearchX, Globe, CalendarSearch
} from 'lucide-react'
import { useMemo, useState } from 'react'

const CATEGORIA_LABELS: Record<string, string> = {
  cobro_flete: 'Cobro de Flete',
  pago_chofer: 'Pago a Chofer',
  gasto_camion: 'Gasto Unidad',
  costo_fijo: 'Costo Fijo',
  multa: 'Multa',
  ingreso_otro: 'Ingreso Varios',
  egreso_otro: 'Egreso Varios',
  combustible_ypf: 'Combustible YPF',
  combustible: 'Combustible',
  mantenimiento: 'Mantenimiento',
}

const CATEGORIA_COLORS: Record<string, string> = {
  cobro_flete: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  pago_chofer: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  gasto_camion: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  costo_fijo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  multa: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  ingreso_otro: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  egreso_otro: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
  combustible_ypf: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  combustible: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  mantenimiento: 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20',
}

const PROGRESS_COLORS: Record<string, string> = {
  cobro_flete: 'bg-emerald-500',
  pago_chofer: 'bg-rose-500',
  gasto_camion: 'bg-amber-500',
  costo_fijo: 'bg-indigo-500',
  multa: 'bg-orange-500',
  ingreso_otro: 'bg-cyan-500',
  egreso_otro: 'bg-slate-500',
  combustible_ypf: 'bg-sky-500',
  combustible: 'bg-sky-500',
  mantenimiento: 'bg-fuchsia-500',
}

interface CajaMovimientosTableProps {
  movimientos: any[]
  loading: boolean
  onEdit: (m: any) => void
  onDelete: (id: string) => void
}

export function CajaMovimientosTable({ movimientos, loading, onEdit, onDelete }: CajaMovimientosTableProps) {
  
  // ESTADOS DEL FILTRO Y VISTA
  const [modoVista, setModoVista] = useState<'todo' | 'filtro'>('todo')
  const [fechaDesde, setFechaDesde] = useState('')
  const [fechaHasta, setFechaHasta] = useState('')

  // 1. FILTRAMOS Y FORZAMOS EL ORDEN (Más nuevo primero)
  const movimientosProcesados = useMemo(() => {
    let filtrados = [...movimientos]

    // Solo filtramos si estamos en modo "filtro"
    if (modoVista === 'filtro') {
      if (fechaDesde) filtrados = filtrados.filter(m => m.fecha >= fechaDesde)
      if (fechaHasta) filtrados = filtrados.filter(m => m.fecha <= fechaHasta)
    }

    // Ordenar descendente (Más nuevo arriba)
    return filtrados.sort((a, b) => {
      const fA = new Date(a.fecha).getTime()
      const fB = new Date(b.fecha).getTime()
      if (fA === fB) {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      }
      return fB - fA
    })
  }, [movimientos, modoVista, fechaDesde, fechaHasta])

  // 2. AGRUPAMOS PARA EL ANÁLISIS
  const analisis = useMemo(() => {
    const ingresos = new Map<string, number>()
    const egresos = new Map<string, number>()
    let totalIngresos = 0
    let totalEgresos = 0

    movimientosProcesados.forEach(m => {
      const monto = Number(m.monto)
      const cat = m.categoria
      
      if (m.tipo === 'ingreso') {
        ingresos.set(cat, (ingresos.get(cat) || 0) + monto)
        totalIngresos += monto
      } else {
        egresos.set(cat, (egresos.get(cat) || 0) + monto)
        totalEgresos += monto
      }
    })

    const formatMap = (map: Map<string, number>) => 
      Array.from(map, ([cat, total]) => ({ cat, total })).sort((a, b) => b.total - a.total)

    return {
      ingresos: formatMap(ingresos),
      egresos: formatMap(egresos),
      totalIngresos,
      totalEgresos
    }
  }, [movimientosProcesados])

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    )
  }

  return (
    <div className="space-y-10 font-sans italic animate-in fade-in duration-500 mt-12">
      
      {/* ══════════════════════════════════════════════════════════════ */}
      {/* CONTROLADOR DE VISTAS (TODO VS FILTRO)                         */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-[#1a2537]/30 p-2 rounded-3xl border border-white/5 backdrop-blur-md">
        <div className="flex w-full sm:w-auto bg-[#141c28]/40 p-1 rounded-2xl border border-white/5">
          <button 
            onClick={() => {
              setModoVista('todo')
              setFechaDesde('')
              setFechaHasta('')
            }}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              modoVista === 'todo' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'
            }`}
          >
            <Globe size={14} /> Historial Completo
          </button>
          
          <button 
            onClick={() => setModoVista('filtro')}
            className={`flex-1 sm:flex-none px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
              modoVista === 'filtro' ? 'bg-emerald-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'
            }`}
          >
            <CalendarSearch size={14} /> Filtrar Fechas
          </button>
        </div>

        {/* Muestra los calendarios SOLO si apretó el botón de Filtrar */}
        {modoVista === 'filtro' && (
          <div className="flex items-center gap-3 w-full sm:w-auto animate-in slide-in-from-left-4 fade-in duration-300">
            <div className="flex items-center gap-2 bg-[#141c28]/40 px-4 py-2 rounded-2xl border border-emerald-500/20 w-full sm:w-auto">
              <div className="flex flex-col">
                <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">Desde</span>
                <input 
                  type="date" 
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="bg-transparent text-white font-black text-xs outline-none [color-scheme:dark]" 
                />
              </div>
              <div className="w-px h-6 bg-white/10 mx-2"></div>
              <div className="flex flex-col">
                <span className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">Hasta</span>
                <input 
                  type="date" 
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="bg-transparent text-white font-black text-xs outline-none [color-scheme:dark]" 
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SECCIÓN 1: DISTRIBUCIÓN DEL PERÍODO (ANÁLISIS)                 */}
      {/* ══════════════════════════════════════════════════════════════ */}
      {movimientosProcesados.length > 0 && (
        <section className="space-y-6">
          <div className="flex items-center gap-3 border-b border-white/10 pb-4">
            <BarChart4 size={20} className="text-slate-400" />
            <h2 className="text-lg font-black text-white uppercase tracking-widest">
              {modoVista === 'todo' ? 'Distribución Histórica Total' : 'Distribución del Rango Seleccionado'}
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* --- LISTA DE INGRESOS --- */}
            <div className="bg-[#1a2537]/30 border border-white/5 rounded-[2rem] p-8 shadow-xl">
              <h3 className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] flex items-center gap-2 mb-6">
                <ArrowUpRight size={16} /> Origen de los Ingresos
              </h3>
              
              <div className="space-y-5">
                {analisis.ingresos.length === 0 ? (
                  <p className="text-xs font-bold text-slate-500 uppercase">Sin ingresos para mostrar.</p>
                ) : (
                  analisis.ingresos.map(({ cat, total }) => {
                    const porcentaje = Math.round((total / analisis.totalIngresos) * 100)
                    const barColor = PROGRESS_COLORS[cat] || 'bg-slate-500'
                    return (
                      <div key={cat} className="space-y-2">
                        <div className="flex justify-between items-end">
                          <span className="text-xs font-black text-slate-300 uppercase">
                            {CATEGORIA_LABELS[cat] || cat}
                          </span>
                          <div className="text-right">
                            <span className="text-sm font-black text-emerald-400 tabular-nums">${total.toLocaleString('es-AR')}</span>
                            <span className="text-[10px] font-bold text-slate-500 ml-2">{porcentaje}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-[#141c28]/40 h-2 rounded-full overflow-hidden">
                          <div className={`h-full ${barColor} rounded-full`} style={{ width: `${porcentaje}%` }} />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

            {/* --- LISTA DE EGRESOS --- */}
            <div className="bg-[#1a2537]/30 border border-white/5 rounded-[2rem] p-8 shadow-xl">
              <h3 className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em] flex items-center gap-2 mb-6">
                <ArrowDownLeft size={16} /> Destino de los Egresos
              </h3>
              
              <div className="space-y-5">
                {analisis.egresos.length === 0 ? (
                  <p className="text-xs font-bold text-slate-500 uppercase">Sin egresos para mostrar.</p>
                ) : (
                  analisis.egresos.map(({ cat, total }) => {
                    const porcentaje = Math.round((total / analisis.totalEgresos) * 100)
                    const barColor = PROGRESS_COLORS[cat] || 'bg-slate-500'
                    return (
                      <div key={cat} className="space-y-2">
                        <div className="flex justify-between items-end">
                          <span className="text-xs font-black text-slate-300 uppercase">
                            {CATEGORIA_LABELS[cat] || cat}
                          </span>
                          <div className="text-right">
                            <span className="text-sm font-black text-rose-400 tabular-nums">${total.toLocaleString('es-AR')}</span>
                            <span className="text-[10px] font-bold text-slate-500 ml-2">{porcentaje}%</span>
                          </div>
                        </div>
                        <div className="w-full bg-[#141c28]/40 h-2 rounded-full overflow-hidden">
                          <div className={`h-full ${barColor} rounded-full`} style={{ width: `${porcentaje}%` }} />
                        </div>
                      </div>
                    )
                  })
                )}
              </div>
            </div>

          </div>
        </section>
      )}

      {/* ══════════════════════════════════════════════════════════════ */}
      {/* SECCIÓN 2: HISTORIAL DETALLADO DE MOVIMIENTOS                  */}
      {/* ══════════════════════════════════════════════════════════════ */}
      <section className="space-y-6">
        <div className="flex justify-between items-end border-b border-white/10 pb-4">
          <div className="flex items-center gap-3">
            <ListOrdered size={20} className="text-slate-400" />
            <h2 className="text-lg font-black text-white uppercase tracking-widest">
              {modoVista === 'todo' ? 'Todos los Movimientos' : 'Movimientos Filtrados'}
            </h2>
          </div>
          <span className="text-[10px] font-black text-slate-500 uppercase bg-white/5 px-3 py-1.5 rounded-lg border border-white/5">
            {movimientosProcesados.length} registros
          </span>
        </div>

        <div className="bg-[#1a2537]/40 rounded-[2rem] md:rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">

          {/* --- VISTA MOBILE --- */}
          <div className="md:hidden divide-y divide-white/5">
            {movimientosProcesados.length === 0 ? (
              <EmptyState modoVista={modoVista} />
            ) : movimientosProcesados.map(m => {
              const esIngreso = m.tipo === 'ingreso'
              return (
                <div key={m.id} className="p-6 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${esIngreso ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                        {esIngreso ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                      </div>
                      <div>
                        <p className="text-xs font-black text-white uppercase">{m.descripcion}</p>
                        <p className="text-[9px] text-slate-500 font-bold mt-0.5">
                          {new Date(m.fecha).toLocaleDateString('es-AR', { timeZone: 'UTC' })}
                        </p>
                      </div>
                    </div>
                    <p className={`text-xl font-black italic tabular-nums ${esIngreso ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {esIngreso ? '+' : '-'}$ {Number(m.monto).toLocaleString()}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-wrap">
                    <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase border ${CATEGORIA_COLORS[m.categoria] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                      {CATEGORIA_LABELS[m.categoria] || m.categoria}
                    </span>
                    <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase border ${m.tipo_cuenta === 'caja' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-sky-500/10 text-sky-400 border-sky-500/20'}`}>
                      {m.tipo_cuenta === 'caja' ? <Wallet size={10} className="inline mr-1" /> : <Landmark size={10} className="inline mr-1" />}
                      {m.tipo_cuenta}
                    </span>
                  </div>
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => onEdit(m)} className="p-2 text-slate-600 hover:text-sky-400"><Edit3 size={16} /></button>
                    <button onClick={() => onDelete(m.id)} className="p-2 text-slate-600 hover:text-rose-500"><Trash2 size={16} /></button>
                  </div>
                </div>
              )
            })}
          </div>

          {/* --- VISTA DESKTOP --- */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[900px]">
              <thead className="bg-white/[0.02] text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] border-b border-white/5">
                <tr>
                  <th className="p-7 pl-10">Fecha</th>
                  <th className="p-7">Descripción & Categoría</th>
                  <th className="p-7">Vinculado a</th>
                  <th className="p-7 text-center">Cuenta</th>
                  <th className="p-7 text-right">Monto</th>
                  <th className="p-7 pr-10 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.03]">
                {movimientosProcesados.length === 0 ? (
                  <tr>
                    <td colSpan={6}>
                      <EmptyState modoVista={modoVista} />
                    </td>
                  </tr>
                ) : movimientosProcesados.map(m => {
                  const esIngreso = m.tipo === 'ingreso'
                  return (
                    <tr key={m.id} className="hover:bg-white/[0.02] transition-all group">

                      <td className="p-7 pl-10">
                        <div className="flex items-center gap-2 text-slate-400">
                          <Calendar size={14} className="text-sky-500/40" />
                          <span className="text-sm font-bold">
                            {new Date(m.fecha).toLocaleDateString('es-AR', { timeZone: 'UTC' })}
                          </span>
                        </div>
                      </td>

                      <td className="p-7">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-xl ${esIngreso ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {esIngreso ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                          </div>
                          <div>
                            <p className="text-sm font-black text-white uppercase tracking-tight">{m.descripcion}</p>
                            <span className={`mt-1 inline-block px-2 py-0.5 rounded-md text-[8px] font-black uppercase border ${CATEGORIA_COLORS[m.categoria] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                              <Tag size={8} className="inline mr-1" />
                              {CATEGORIA_LABELS[m.categoria] || m.categoria}
                            </span>
                            {m.referencia && (
                              <p className="text-[9px] text-slate-600 font-bold uppercase mt-0.5">Ref: {m.referencia}</p>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="p-7">
                        <div className="space-y-1.5">
                          {m.clientes && (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                              <Building2 size={12} className="text-sky-500" />
                              {m.clientes.razon_social}
                            </div>
                          )}
                          {m.choferes ? (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                              <User size={12} className="text-indigo-400" />
                              {m.choferes.nombre}
                            </div>
                          ) : m.categoria === 'pago_chofer' && m.descripcion ? (
                            // Fallback: extraer nombre del chofer de la descripción
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                              <User size={12} className="text-indigo-400/60" />
                              {m.descripcion.replace(/^(LIQUIDACIÓN TOTAL|ADELANTO \/ PAGO PARCIAL) - /, '')}
                            </div>
                          ) : null}
                          {m.camiones && (
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                              <Truck size={12} className="text-amber-400" />
                              {m.camiones.patente}
                            </div>
                          )}
                          {!m.clientes && !m.choferes && !(m.categoria === 'pago_chofer' && m.descripcion) && !m.camiones && (
                            <span className="text-[9px] text-slate-700 font-black uppercase">—</span>
                          )}
                        </div>
                      </td>

                      <td className="p-7 text-center">
                        <span className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase border flex items-center gap-1.5 w-fit mx-auto ${
                          m.tipo_cuenta === 'caja' 
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                            : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                        }`}>
                          {m.tipo_cuenta === 'caja' ? <Wallet size={10} /> : <Landmark size={10} />}
                          {m.tipo_cuenta === 'caja' ? 'Efectivo' : 'Banco'}
                        </span>
                      </td>

                      <td className="p-7 text-right">
                        <p className={`text-2xl font-black italic tabular-nums tracking-tighter ${esIngreso ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {esIngreso ? '+' : '-'}$ {Number(m.monto).toLocaleString('es-AR')}
                        </p>
                      </td>

                      <td className="p-7 pr-10 text-center">
                        <div className="flex gap-2 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => onEdit(m)} className="p-3 bg-white/5 hover:bg-sky-500/10 text-slate-500 hover:text-sky-400 rounded-xl transition-all border border-white/5">
                            <Edit3 size={16} />
                          </button>
                          <button onClick={() => onDelete(m.id)} className="p-3 bg-white/5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 rounded-xl transition-all border border-white/5">
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  )
}

function EmptyState({ modoVista }: { modoVista: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 opacity-40">
      <SearchX size={48} className="mb-4 text-slate-500" />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-400">
        {modoVista === 'todo' 
          ? 'No hay ningún movimiento registrado' 
          : 'No hay movimientos en estas fechas'}
      </p>
    </div>
  )
}