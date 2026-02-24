'use client'
// src/app/caja/page.tsx

import { useState, useEffect, useMemo, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2, Eye, Shield, X, Info, BarChart3 } from 'lucide-react'

// ─── Componentes existentes ───────────────────────────────────────────────────
import { CajaHeader }           from '@/components/caja/CajaHeader'
import { CajaDolarPanel }       from '@/components/caja/CajaDolarPanel'
import { CajaResumenGeneral }   from '@/components/caja/CajaResumenGeneral'
import { CajaMovimientosTable } from '@/components/caja/CajaMovimientosTable'
import { CajaModal }            from '@/components/caja/CajaModal'
// ─────────────────────────────────────────────────────────────────────────────

const CATEGORIA_LABELS: Record<string, string> = {
  cobro_flete: 'Cobro de Flete', cobro_parcial: 'Cobro Parcial', ingreso_otro: 'Ingreso Varios',
  pago_chofer: 'Pago a Chofer', combustible: 'Combustible', combustible_ypf: 'Combustible YPF',
  mantenimiento: 'Mantenimiento', neumaticos: 'Neumáticos', lavado: 'Lavado',
  compra: 'Compra', multa: 'Multa', seguro: 'Seguro', impuesto: 'Impuesto', peaje: 'Peaje',
  cuota_leasing: 'Leasing', cuota_prestamo: 'Préstamo', tarjeta_credito: 'Tarjeta crédito',
  transferencia_banco: 'Transferencia', costo_fijo: 'Costo Fijo', gasto_camion: 'Gasto Unidad',
  sueldo_administrativo: 'Sueldo admin', siniestro: 'Siniestro', egreso_otro: 'Egreso Varios',
}

export default function CajaPage() {
  // ─── DATOS ─────────────────────────────────────────────────────────────────
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [clientes,    setClientes]    = useState<any[]>([])
  const [choferes,    setChoferes]    = useState<any[]>([])
  const [camiones,    setCamiones]    = useState<any[]>([])
  const [loading,     setLoading]     = useState(true)
  const [tipoCambioDolar, setTipoCambioDolar] = useState(1200)

  // ─── FILTROS (para la tabla) ────────────────────────────────────────────────
  const [tipoCuenta,  setTipoCuenta]  = useState<'todas' | 'caja' | 'banco'>('todas')
  const [dateStart,   setDateStart]   = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
  })
  const [dateEnd,     setDateEnd]     = useState(() => new Date().toISOString().split('T')[0])
  const [showAllTime, setShowAllTime] = useState(false)

  // ─── MODALES ────────────────────────────────────────────────────────────────
  const [isModalOpen,       setIsModalOpen]       = useState(false)
  const [editingMovimiento, setEditingMovimiento] = useState<any>(null)
  const [isSaving,          setIsSaving]          = useState(false)
  const [modalAuditoria,    setModalAuditoria]    = useState<any>(null)
  const [vistaGrafico,      setVistaGrafico]      = useState<'6m' | '12m'>('6m')

  // ─── FETCH ──────────────────────────────────────────────────────────────────
  const fetchAll = useCallback(async () => {
    setLoading(true)
    try {
      const [movRes, clRes, chRes, caRes, confRes] = await Promise.all([
        supabase
          .from('movimientos_caja')
          .select('*, clientes(razon_social), choferes(nombre), camiones(patente)')
          .order('fecha', { ascending: false })
          .order('created_at', { ascending: false }),
        supabase.from('clientes').select('id, razon_social').order('razon_social'),
        supabase.from('choferes').select('id, nombre').order('nombre'),
        supabase.from('camiones').select('id, patente').order('patente'),
        supabase.from('configuracion').select('tipo_cambio_dolar').eq('id', 1).single(),
      ])
      setMovimientos(movRes.data || [])
      setClientes(clRes.data   || [])
      setChoferes(chRes.data   || [])
      setCamiones(caRes.data   || [])
      if (confRes.data?.tipo_cambio_dolar) setTipoCambioDolar(Number(confRes.data.tipo_cambio_dolar))
    } catch (e) {
      console.error('Error cargando caja:', e)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchAll() }, [fetchAll])

  // ─── SALDOS REALES (sobre TODO el historial, ignorando filtros) ─────────────
  // Esto es lo que tiene la empresa HOY, no lo del período seleccionado
  const saldosReales = useMemo(() => {
    let caja = 0, banco = 0
    for (const m of movimientos) {
      const delta = m.tipo === 'ingreso' ? Number(m.monto) : -Number(m.monto)
      if (m.tipo_cuenta === 'caja') caja  += delta
      else                          banco += delta
    }
    return { caja, banco, total: caja + banco }
  }, [movimientos])

  // ─── MOVIMIENTOS FILTRADOS (para la tabla y los KPIs del período) ───────────
  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter(m => {
      if (tipoCuenta !== 'todas' && m.tipo_cuenta !== tipoCuenta) return false
      if (!showAllTime && (m.fecha < dateStart || m.fecha > dateEnd)) return false
      return true
    })
  }, [movimientos, tipoCuenta, dateStart, dateEnd, showAllTime])

  // ─── KPIs DEL PERÍODO SELECCIONADO ─────────────────────────────────────────
  const kpisPeriodo = useMemo(() => {
    const ingresosMes = movimientosFiltrados
      .filter(m => m.tipo === 'ingreso')
      .reduce((a, m) => a + Number(m.monto), 0)
    const deudasMes = movimientosFiltrados
      .filter(m => m.tipo === 'egreso')
      .reduce((a, m) => a + Number(m.monto), 0)
    return { ingresosMes, deudasMes }
  }, [movimientosFiltrados])

  // ─── RESUMEN PARA CajaResumenGeneral ───────────────────────────────────────
  // totalCaja y totalBanco son los saldos REALES acumulados
  // facturasImpagas viene de cuenta_corriente (suma de DEBE sin HABER)
  const resumen = useMemo(() => {
    const total         = saldosReales.total
    const totalCorriente = total
    return {
      totalCaja:         saldosReales.caja,
      totalBanco:        saldosReales.banco,
      facturasImpagas:   0, // se puede calcular aparte desde cuenta_corriente
      deudasMes:         kpisPeriodo.deudasMes,
      ingresosMes:       kpisPeriodo.ingresosMes,
      total,
      totalCorriente,
      totalEnDolar:      totalCorriente / tipoCambioDolar,
      totalEnDolarTotal: total          / tipoCambioDolar,
    }
  }, [saldosReales, kpisPeriodo, tipoCambioDolar])

  // ─── DATOS DEL GRÁFICO HISTÓRICO ───────────────────────────────────────────
  const datosGrafico = useMemo(() => {
    const meses = vistaGrafico === '6m' ? 6 : 12
    const hoy   = new Date()
    const resultado: { mes: string; ingresos: number; egresos: number; saldoFin: number }[] = []

    for (let i = meses - 1; i >= 0; i--) {
      const d         = new Date(hoy.getFullYear(), hoy.getMonth() - i, 1)
      const primerDia = d.toISOString().split('T')[0]
      const ultimoDia = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]
      const label     = d.toLocaleDateString('es-AR', { month: 'short', year: '2-digit' })

      let ing = 0, egr = 0, saldoAcum = 0
      for (const m of movimientos) {
        const delta = m.tipo === 'ingreso' ? Number(m.monto) : -Number(m.monto)
        if (m.fecha <= ultimoDia) saldoAcum += delta
        if (m.fecha >= primerDia && m.fecha <= ultimoDia) {
          if (m.tipo === 'ingreso') ing += Number(m.monto)
          else                      egr += Number(m.monto)
        }
      }
      resultado.push({ mes: label.toUpperCase(), ingresos: ing, egresos: egr, saldoFin: saldoAcum })
    }
    return resultado
  }, [movimientos, vistaGrafico])

  // ─── GUARDAR TIPO DE CAMBIO ─────────────────────────────────────────────────
  async function handleSaveTipoCambio(valor: number) {
    setTipoCambioDolar(valor)
    await supabase.from('configuracion').update({ tipo_cambio_dolar: valor }).eq('id', 1)
  }

  // ─── GUARDAR MOVIMIENTO MANUAL ──────────────────────────────────────────────
  async function handleSaveMovimiento(data: any) {
    setIsSaving(true)
    try {
      const payload = {
        fecha:        data.fecha,
        tipo:         data.tipo,
        tipo_cuenta:  data.tipo_cuenta,
        categoria:    data.categoria,
        descripcion:  (data.descripcion || '').toUpperCase().trim(),
        monto:        Number(data.monto),
        referencia:   data.referencia   || null,
        cliente_id:   data.cliente_id   || null,
        chofer_id:    data.chofer_id    || null,
        camion_id:    data.camion_id    || null,
        origen:       'manual',
        modulo_origen:'manual',
      }
      if (editingMovimiento) {
        const { error } = await supabase.from('movimientos_caja').update(payload).eq('id', editingMovimiento.id)
        if (error) throw error
      } else {
        const { error } = await supabase.from('movimientos_caja').insert(payload)
        if (error) throw error
      }
      setIsModalOpen(false)
      setEditingMovimiento(null)
      fetchAll()
    } catch (e: any) {
      alert('Error guardando: ' + e.message)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteMovimiento(id: string) {
    if (!confirm('¿Eliminar este movimiento?')) return
    const { error } = await supabase.from('movimientos_caja').delete().eq('id', id)
    if (error) { alert('Error: ' + error.message); return }
    fetchAll()
  }

  // ─── RENDER ─────────────────────────────────────────────────────────────────
  if (loading) return (
    <div className="h-screen bg-[#020617] flex flex-col items-center justify-center">
      <Loader2 className="animate-spin text-emerald-500 w-12 h-12 mb-4" />
      <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-500 animate-pulse">Cargando Tesorería...</p>
    </div>
  )

  // Máximo valor para escalar las barras del gráfico
  const maxBarGrafico = Math.max(...datosGrafico.map(d => Math.max(d.ingresos, d.egresos)), 1)
  const maxSaldoGrafico = Math.max(...datosGrafico.map(d => Math.abs(d.saldoFin)), 1)

  return (
    <main className="min-h-screen bg-[#020617] pt-20 lg:pt-24 pb-20 font-sans italic">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 space-y-8">

        {/* ── HEADER CON FILTROS ── */}
        <CajaHeader
          tipoCuenta={tipoCuenta}       setTipoCuenta={setTipoCuenta}
          dateStart={dateStart}         setDateStart={setDateStart}
          dateEnd={dateEnd}             setDateEnd={setDateEnd}
          showAllTime={showAllTime}     setShowAllTime={setShowAllTime}
          onNuevoMovimiento={() => { setEditingMovimiento(null); setIsModalOpen(true) }}
          totalIngresos={kpisPeriodo.ingresosMes}
          totalEgresos={kpisPeriodo.deudasMes}
        />

        {/* ── PANEL DÓLAR (tipo de cambio editable + totales en USD) ── */}
        <CajaDolarPanel
          tipoCambio={tipoCambioDolar}
          onSaveTipoCambio={handleSaveTipoCambio}
          totalCorriente={resumen.totalCorriente}
          totalGeneral={resumen.total}
          totalEnDolar={resumen.totalEnDolar}
          totalEnDolarTotal={resumen.totalEnDolarTotal}
        />

        {/* ── RESUMEN PATRIMONIAL (saldos reales acumulados) ── */}
        <CajaResumenGeneral resumen={resumen} loading={loading} />

        {/* ── GRÁFICO HISTÓRICO ── */}
        <div className="bg-[#020617] border border-white/5 rounded-[3rem] p-8 space-y-6 shadow-2xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/10 rounded-xl">
                <BarChart3 size={18} className="text-emerald-500" />
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em]">Evolución Mensual</p>
                <p className="text-[8px] font-bold text-slate-600 uppercase">Ingresos · Egresos · Saldo acumulado</p>
              </div>
            </div>
            <div className="flex bg-white/5 rounded-2xl p-1 border border-white/5">
              {(['6m', '12m'] as const).map(v => (
                <button key={v} onClick={() => setVistaGrafico(v)}
                  className={`px-5 py-2.5 rounded-xl text-[9px] font-black uppercase transition-all ${
                    vistaGrafico === v ? 'bg-emerald-600 text-white shadow' : 'text-slate-500 hover:text-white'
                  }`}>
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Barras SVG */}
          <div className="w-full overflow-x-auto">
            <div style={{ minWidth: datosGrafico.length * 90 }}>
              <svg
                viewBox={`0 0 ${datosGrafico.length * 90} 180`}
                className="w-full"
                style={{ height: 180 }}
              >
                {datosGrafico.map((d, i) => {
                  const x     = i * 90 + 10
                  const barW  = 28
                  const maxH  = 120
                  const base  = 130 // línea base (y donde termina la barra)
                  const hIng  = Math.round((d.ingresos / maxBarGrafico) * maxH)
                  const hEgr  = Math.round((d.egresos  / maxBarGrafico) * maxH)
                  // Punto de saldo para la línea
                  const ySaldo = base - Math.round((d.saldoFin / maxSaldoGrafico) * (maxH * 0.7))

                  return (
                    <g key={i}>
                      {/* Barra ingresos */}
                      <rect x={x} y={base - hIng} width={barW} height={hIng} rx={6} fill="#10b981" opacity={0.85} />
                      {/* Barra egresos */}
                      <rect x={x + barW + 4} y={base - hEgr} width={barW} height={hEgr} rx={6} fill="#f43f5e" opacity={0.75} />
                      {/* Punto saldo */}
                      <circle cx={x + barW} cy={ySaldo} r={4} fill="#60a5fa" opacity={0.9} />
                      {/* Línea saldo al siguiente */}
                      {i < datosGrafico.length - 1 && (() => {
                        const next   = datosGrafico[i + 1]
                        const yNext  = base - Math.round((next.saldoFin / maxSaldoGrafico) * (maxH * 0.7))
                        return (
                          <line
                            x1={x + barW} y1={ySaldo}
                            x2={x + 90 + barW} y2={yNext}
                            stroke="#60a5fa" strokeWidth={1.5} strokeDasharray="4,3" opacity={0.6}
                          />
                        )
                      })()}
                      {/* Label mes */}
                      <text x={x + barW} y={150} textAnchor="middle" fontSize={9} fill="#64748b" fontWeight="bold">
                        {d.mes}
                      </text>
                      {/* Monto ingreso encima de barra (solo si hay espacio) */}
                      {hIng > 20 && (
                        <text x={x + barW / 2} y={base - hIng - 4} textAnchor="middle" fontSize={7} fill="#10b981" fontWeight="bold">
                          {(d.ingresos / 1000).toFixed(0)}k
                        </text>
                      )}
                      {/* Monto egreso encima de barra */}
                      {hEgr > 20 && (
                        <text x={x + barW + 4 + barW / 2} y={base - hEgr - 4} textAnchor="middle" fontSize={7} fill="#f43f5e" fontWeight="bold">
                          {(d.egresos / 1000).toFixed(0)}k
                        </text>
                      )}
                    </g>
                  )
                })}
              </svg>

              {/* Leyenda */}
              <div className="flex items-center gap-6 mt-3 justify-end pr-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-emerald-500 opacity-85" />
                  <span className="text-[8px] font-black text-slate-500 uppercase">Ingresos</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-3 h-3 rounded-sm bg-rose-500 opacity-75" />
                  <span className="text-[8px] font-black text-slate-500 uppercase">Egresos</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-4 h-0 border-t-2 border-dashed border-blue-400 opacity-70" />
                  <span className="text-[8px] font-black text-slate-500 uppercase">Saldo acumulado</span>
                </div>
              </div>
            </div>
          </div>

          {/* Resumen textual del mes actual */}
          <div className="grid grid-cols-3 gap-4 border-t border-white/5 pt-6">
            <div className="text-center">
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em]">Ingresos período</p>
              <p className="text-xl font-black text-emerald-400 tabular-nums mt-1">
                $ {kpisPeriodo.ingresosMes.toLocaleString('es-AR')}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em]">Egresos período</p>
              <p className="text-xl font-black text-rose-400 tabular-nums mt-1">
                $ {kpisPeriodo.deudasMes.toLocaleString('es-AR')}
              </p>
            </div>
            <div className="text-center">
              <p className="text-[8px] font-black text-slate-600 uppercase tracking-[0.3em]">Resultado</p>
              {(() => {
                const res = kpisPeriodo.ingresosMes - kpisPeriodo.deudasMes
                return (
                  <p className={`text-xl font-black tabular-nums mt-1 ${res >= 0 ? 'text-white' : 'text-rose-400'}`}>
                    {res < 0 ? '-' : ''} $ {Math.abs(res).toLocaleString('es-AR')}
                  </p>
                )
              })()}
            </div>
          </div>
        </div>

        {/* ── TABLA DE MOVIMIENTOS ── */}
        {/* Agregamos botón de auditoría a cada fila via wrapper */}
        <div className="space-y-4">
          {/* Tabla con botón de ojo custom — envolvemos la tabla original */}
          <CajaMovimientosTablaConAuditoria
            movimientos={movimientosFiltrados}
            loading={loading}
            onEdit={m => { setEditingMovimiento(m); setIsModalOpen(true) }}
            onDelete={handleDeleteMovimiento}
            onAuditoria={m => setModalAuditoria(m)}
          />
        </div>

      </div>

      {/* ── MODAL NUEVO / EDITAR ── */}
      <CajaModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingMovimiento(null) }}
        onSubmit={handleSaveMovimiento}
        isSaving={isSaving}
        editingData={editingMovimiento}
        clientes={clientes}
        choferes={choferes}
        camiones={camiones}
      />

      {/* ── MODAL AUDITORÍA ── */}
      {modalAuditoria && (
        <ModalAuditoria
          movimiento={modalAuditoria}
          onClose={() => setModalAuditoria(null)}
        />
      )}
    </main>
  )
}

// ─── WRAPPER TABLA CON AUDITORÍA ──────────────────────────────────────────────
// Extiende CajaMovimientosTable sin tocarla: agrega columna de auditoría
function CajaMovimientosTablaConAuditoria({
  movimientos, loading, onEdit, onDelete, onAuditoria
}: {
  movimientos: any[]
  loading: boolean
  onEdit: (m: any) => void
  onDelete: (id: string) => void
  onAuditoria: (m: any) => void
}) {
  // Inyectamos un handler para que el click en la fila abra auditoría
  // Usamos un div wrapper sobre la tabla original y capturamos clicks por data-id
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center px-2">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
          Registro de Movimientos
        </p>
        <p className="text-[8px] font-bold text-slate-600 uppercase bg-white/5 px-3 py-1 rounded-lg border border-white/5">
          {movimientos.length} registros · click en <Eye size={10} className="inline" /> para auditar
        </p>
      </div>

      {/* Tabla custom que extiende la visual original con columna de auditoría */}
      <div className="bg-slate-900/40 rounded-[2rem] md:rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="bg-white/[0.02] text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] border-b border-white/5">
              <tr>
                <th className="p-7 pl-10">Fecha</th>
                <th className="p-7">Descripción & Categoría</th>
                <th className="p-7">Vinculado a</th>
                <th className="p-7 text-center">Cuenta</th>
                <th className="p-7">Origen</th>
                <th className="p-7 text-right">Monto</th>
                <th className="p-7 pr-10 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {movimientos.length === 0 ? (
                <tr><td colSpan={7} className="py-20 text-center text-[10px] font-black text-slate-600 uppercase tracking-widest">Sin movimientos en el período</td></tr>
              ) : movimientos.map(m => {
                const esIngreso = m.tipo === 'ingreso'
                const esAuto    = m.origen === 'automatico'
                return (
                  <tr key={m.id} className="hover:bg-white/[0.02] transition-all group">
                    <td className="p-7 pl-10">
                      <p className="text-sm font-bold text-slate-400">
                        {new Date(m.fecha).toLocaleDateString('es-AR', { timeZone: 'UTC', day: '2-digit', month: '2-digit', year: '2-digit' })}
                      </p>
                    </td>
                    <td className="p-7 max-w-xs">
                      <div className="flex items-start gap-3">
                        <div className={`p-2 rounded-xl shrink-0 ${esIngreso ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          {esIngreso
                            ? <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M7 17L17 7M17 7H7M17 7v10"/></svg>
                            : <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 7L7 17M7 17H17M7 17V7"/></svg>
                          }
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-white uppercase tracking-tight truncate">{m.descripcion}</p>
                          <span className={`mt-1 inline-block px-2 py-0.5 rounded-md text-[8px] font-black uppercase border ${
                            m.tipo === 'ingreso' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                          }`}>
                            {CATEGORIA_LABELS[m.categoria] || m.categoria}
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="p-7">
                      <div className="space-y-1">
                        {m.clientes && <p className="text-[10px] font-bold text-slate-400 uppercase truncate">{m.clientes.razon_social}</p>}
                        {m.choferes && <p className="text-[10px] font-bold text-slate-500 uppercase">{m.choferes.nombre}</p>}
                        {m.camiones && <p className="text-[10px] font-bold text-slate-500 uppercase">{m.camiones.patente}</p>}
                        {!m.clientes && !m.choferes && !m.camiones && <span className="text-slate-700">—</span>}
                      </div>
                    </td>
                    <td className="p-7 text-center">
                      <span className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase border flex items-center gap-1.5 w-fit mx-auto ${
                        m.tipo_cuenta === 'caja'
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                      }`}>
                        {m.tipo_cuenta === 'caja' ? '● Efectivo' : '● Banco'}
                      </span>
                    </td>
                    <td className="p-7">
                      {esAuto ? (
                        <span className="text-[8px] font-black text-violet-400 bg-violet-500/10 border border-violet-500/20 px-2 py-1 rounded-lg uppercase">
                          Auto · {m.modulo_origen || 'sistema'}
                        </span>
                      ) : (
                        <span className="text-[8px] font-black text-slate-600 uppercase">Manual</span>
                      )}
                    </td>
                    <td className="p-7 text-right">
                      <p className={`text-2xl font-black italic tabular-nums tracking-tighter ${esIngreso ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {esIngreso ? '+' : '-'}$ {Number(m.monto).toLocaleString('es-AR')}
                      </p>
                    </td>
                    <td className="p-7 pr-10 text-center">
                      <div className="flex gap-2 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        {/* Auditoría — siempre visible */}
                        <button onClick={() => onAuditoria(m)}
                          className="p-2.5 bg-white/5 hover:bg-sky-500/10 text-slate-500 hover:text-sky-400 rounded-xl transition-all border border-white/5"
                          title="Ver detalle / auditoría">
                          <Eye size={15} />
                        </button>
                        {/* Editar solo si es manual */}
                        {!esAuto && (
                          <button onClick={() => onEdit(m)}
                            className="p-2.5 bg-white/5 hover:bg-amber-500/10 text-slate-500 hover:text-amber-400 rounded-xl transition-all border border-white/5">
                            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 2a1.41 1.41 0 012 2L4.5 12.5 2 13l.5-2.5L11 2z"/></svg>
                          </button>
                        )}
                        {/* Eliminar solo si es manual */}
                        {!esAuto && (
                          <button onClick={() => onDelete(m.id)}
                            className="p-2.5 bg-white/5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 rounded-xl transition-all border border-white/5">
                            <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h12M8 6V4h3v2M10 11v4M8 11v4M5 6l1 11h7l1-11"/></svg>
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
            {movimientos.length > 0 && (
              <tfoot className="bg-white/[0.02] border-t border-white/5">
                <tr>
                  <td colSpan={5} className="p-5 pl-10 text-[9px] font-black text-slate-600 uppercase">
                    {movimientos.length} movimientos en el período
                  </td>
                  <td className="p-5 text-right">
                    {(() => {
                      const ing = movimientos.filter(m => m.tipo === 'ingreso').reduce((a, m) => a + Number(m.monto), 0)
                      const egr = movimientos.filter(m => m.tipo === 'egreso').reduce((a, m) => a + Number(m.monto), 0)
                      const res = ing - egr
                      return (
                        <div>
                          <p className="text-[9px] font-black text-emerald-400">+ $ {ing.toLocaleString('es-AR')}</p>
                          <p className="text-[9px] font-black text-rose-400">- $ {egr.toLocaleString('es-AR')}</p>
                          <p className={`text-sm font-black tabular-nums border-t border-white/10 pt-1 mt-1 ${res >= 0 ? 'text-white' : 'text-rose-400'}`}>
                            = {res < 0 ? '-' : ''} $ {Math.abs(res).toLocaleString('es-AR')}
                          </p>
                        </div>
                      )
                    })()}
                  </td>
                  <td />
                </tr>
              </tfoot>
            )}
          </table>
        </div>

        {/* MOBILE */}
        <div className="md:hidden divide-y divide-white/5">
          {movimientos.length === 0 ? (
            <div className="py-20 text-center text-[10px] font-black text-slate-600 uppercase tracking-widest">Sin movimientos</div>
          ) : movimientos.map(m => {
            const esIngreso = m.tipo === 'ingreso'
            const esAuto    = m.origen === 'automatico'
            return (
              <div key={m.id} className="p-6 space-y-3">
                <div className="flex justify-between items-start">
                  <div>
                    <p className="text-xs font-black text-white uppercase">{m.descripcion}</p>
                    <p className="text-[9px] text-slate-500 mt-0.5">{new Date(m.fecha).toLocaleDateString('es-AR', { timeZone: 'UTC' })}</p>
                    {esAuto && <span className="text-[7px] font-black text-violet-400 uppercase">Auto · {m.modulo_origen}</span>}
                  </div>
                  <p className={`text-xl font-black tabular-nums ${esIngreso ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {esIngreso ? '+' : '-'}$ {Number(m.monto).toLocaleString('es-AR')}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase border ${
                    esIngreso ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border-rose-500/20'
                  }`}>{CATEGORIA_LABELS[m.categoria] || m.categoria}</span>
                  <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase border ${
                    m.tipo_cuenta === 'caja' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                  }`}>{m.tipo_cuenta}</span>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => onAuditoria(m)} className="p-2 bg-white/5 text-sky-400 rounded-xl"><Eye size={14} /></button>
                  {!esAuto && <button onClick={() => onEdit(m)} className="p-2 bg-white/5 text-slate-500 rounded-xl">✏️</button>}
                  {!esAuto && <button onClick={() => onDelete(m.id)} className="p-2 bg-white/5 text-rose-500 rounded-xl">🗑️</button>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

// ─── MODAL AUDITORÍA ──────────────────────────────────────────────────────────
function ModalAuditoria({ movimiento: m, onClose }: { movimiento: any; onClose: () => void }) {
  const esAuto    = m.origen === 'automatico'
  const esIngreso = m.tipo   === 'ingreso'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm font-sans italic">
      <div className="w-full max-w-md bg-[#020617] border border-white/10 rounded-[3rem] p-8 space-y-6 shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-sky-500/10 rounded-xl"><Shield size={16} className="text-sky-400" /></div>
            <h2 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Detalle / Auditoría</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-slate-400 hover:text-white transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Monto grande */}
        <div className={`text-center py-8 rounded-3xl border ${esIngreso ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-rose-500/5 border-rose-500/20'}`}>
          <p className="text-[8px] font-black text-slate-500 uppercase tracking-[0.4em] mb-3">
            {esIngreso ? '↑ Ingreso' : '↓ Egreso'} · {m.tipo_cuenta?.toUpperCase()}
          </p>
          <p className={`text-5xl font-black tabular-nums tracking-tighter ${esIngreso ? 'text-emerald-400' : 'text-rose-400'}`}>
            $ {Number(m.monto).toLocaleString('es-AR')}
          </p>
        </div>

        {/* Detalle línea a línea */}
        <div className="space-y-2.5">
          {[
            { label: 'Descripción', value: m.descripcion },
            { label: 'Fecha', value: new Date(m.fecha).toLocaleDateString('es-AR', { timeZone: 'UTC', weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) },
            { label: 'Categoría', value: CATEGORIA_LABELS[m.categoria] || m.categoria },
            { label: 'Cuenta', value: m.tipo_cuenta === 'caja' ? 'Caja física (efectivo)' : 'Banco' },
            ...(m.clientes?.razon_social ? [{ label: 'Cliente', value: m.clientes.razon_social }] : []),
            ...(m.choferes?.nombre       ? [{ label: 'Chofer',  value: m.choferes.nombre }]       : []),
            ...(m.camiones?.patente      ? [{ label: 'Unidad',  value: m.camiones.patente }]       : []),
            ...(m.referencia             ? [{ label: 'Comprobante', value: m.referencia }]         : []),
          ].map(({ label, value }) => (
            <div key={label} className="flex justify-between items-start gap-4 py-2.5 border-b border-white/5">
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-[0.2em] shrink-0 pt-0.5">{label}</span>
              <span className="text-[10px] font-bold text-slate-300 text-right leading-tight">{value}</span>
            </div>
          ))}
        </div>

        {/* Origen del registro */}
        <div className={`flex items-start gap-3 px-4 py-4 rounded-2xl border ${
          esAuto ? 'bg-violet-500/5 border-violet-500/20' : 'bg-white/5 border-white/10'
        }`}>
          <Info size={14} className={`shrink-0 mt-0.5 ${esAuto ? 'text-violet-400' : 'text-slate-600'}`} />
          <div>
            <p className={`text-[9px] font-black uppercase ${esAuto ? 'text-violet-400' : 'text-slate-500'}`}>
              {esAuto
                ? `Registrado automáticamente por el módulo de ${m.modulo_origen || 'sistema'}`
                : 'Cargado manualmente en caja'}
            </p>
            {esAuto && m.referencia_origen_id && (
              <p className="text-[8px] text-slate-700 font-mono mt-1">
                ID origen: {m.referencia_origen_id.slice(0, 8)}...
              </p>
            )}
            {esAuto && (
              <p className="text-[8px] text-violet-500/60 mt-1 uppercase font-bold">
                Este movimiento no puede editarse ni eliminarse desde caja
              </p>
            )}
          </div>
        </div>

        <button onClick={onClose}
          className="w-full py-4 bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all">
          Cerrar
        </button>
      </div>
    </div>
  )
}