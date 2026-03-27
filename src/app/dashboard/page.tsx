'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase'
import Link from 'next/link'
import {
  TrendingUp, TrendingDown, Users, Truck, FileText,
  Loader2, Calendar, BarChart3, DollarSign, Fuel,
  Route, CircleDollarSign, ArrowUpRight, ArrowDownRight,
  CheckSquare, AlertTriangle, Clock, Zap, Activity,
  Package, MapPin, CreditCard, Receipt, Building2,
  ChevronRight, Minus, Crown, X
} from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar, Cell, LineChart, Line
} from 'recharts'

export default function MainDashboard() {
  const [loading, setLoading] = useState(true)
  const [showDeudaModal, setShowDeudaModal] = useState(false)
  const [data, setData] = useState<any>({
    clientes: [], viajes: [], cc: [], camiones: [],
    choferes: [], tareas: [], movimientos: []
  })

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const [cl, vj, cc, cam, ch, tar, mov] = await Promise.all([
        supabase.from('clientes').select('id,razon_social').order('razon_social'),
        supabase.from('viajes').select('*').order('fecha', { ascending: false }),
        supabase.from('cuenta_corriente').select('*'),
        supabase.from('camiones').select('*'),
        supabase.from('choferes').select('id,nombre,estado').order('nombre'),
        supabase.from('tareas').select('*').eq('completada', false).order('fecha_vencimiento'),
        supabase.from('movimientos_caja').select('fecha,tipo,monto,categoria,descripcion').order('fecha', { ascending: false }).limit(200),
      ])
      setData({
        clientes: cl.data || [], viajes: vj.data || [],
        cc: cc.data || [], camiones: cam.data || [],
        choferes: ch.data || [], tareas: tar.data || [],
        movimientos: mov.data || []
      })
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }

  const stats = useMemo(() => {
    const { viajes, cc, clientes, camiones, choferes, tareas, movimientos } = data
    const hoy = new Date()
    const hoyStr = hoy.toISOString().split('T')[0]

    // ── Período actual (mes corriente) ──
    const mesActualStart = new Date(hoy.getFullYear(), hoy.getMonth(), 1).toISOString().split('T')[0]
    const mesActualEnd   = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).toISOString().split('T')[0]

    // ── Período anterior (mes pasado) ──
    const mesPasadoStart = new Date(hoy.getFullYear(), hoy.getMonth() - 1, 1).toISOString().split('T')[0]
    const mesPasadoEnd   = new Date(hoy.getFullYear(), hoy.getMonth(), 0).toISOString().split('T')[0]

    // ── Año actual vs año anterior ──
    const anoActualStart = `${hoy.getFullYear()}-01-01`
    const anoActualEnd   = `${hoy.getFullYear()}-12-31`
    const anoPasadoStart = `${hoy.getFullYear() - 1}-01-01`
    const anoPasadoEnd   = `${hoy.getFullYear() - 1}-12-31`

    const filtrar = (start: string, end: string) =>
      (viajes || []).filter((v: any) => v.fecha >= start && v.fecha <= end)

    const calcViajes = (arr: any[]) => {
      let bruta = 0, gasoil = 0, chofPago = 0, descargas = 0, km = 0, lts = 0, desgaste = 0
      arr.forEach((v: any) => {
        bruta    += Number(v.tarifa_flete || v.tarifa_flete_calculada || 0)
        gasoil   += Number(v.lts_gasoil || 0) * Number(v.precio_gasoil || 0)
        chofPago += Number(v.pago_chofer || 0)
        descargas+= Number(v.costo_descarga || 0)
        km       += Number(v.km_recorridos || 0)
        lts      += Number(v.lts_gasoil || 0)
        desgaste += Number(v.km_recorridos || 0) * Number(v.desgaste_por_km || 0)
      })
      const costos = gasoil + chofPago + descargas + desgaste
      const neta   = bruta - costos
      const margen = bruta > 0 ? (neta / bruta) * 100 : 0
      return { bruta, neta, costos, margen, gasoil, chofPago, descargas, desgaste, km, lts, count: arr.length }
    }

    const mesActual  = calcViajes(filtrar(mesActualStart, mesActualEnd))
    const mesPasado  = calcViajes(filtrar(mesPasadoStart, mesPasadoEnd))
    const anoActual  = calcViajes(filtrar(anoActualStart, anoActualEnd))
    const anoPasado  = calcViajes(filtrar(anoPasadoStart, anoPasadoEnd))

    const delta = (a: number, b: number) => b > 0 ? ((a - b) / b) * 100 : 0

    // ── Deuda clientes ──
    const saldos: Record<string, number> = {}
    ;(cc || []).forEach((m: any) => {
      if (!saldos[m.cliente_id]) saldos[m.cliente_id] = 0
      saldos[m.cliente_id] += (Number(m.debe || 0) - Number(m.haber || 0))
    })
    const listaSaldos = (clientes || [])
      .map((c: any) => ({ ...c, saldo: saldos[c.id] || 0 }))
      .filter((c: any) => c.saldo > 0)
      .sort((a: any, b: any) => b.saldo - a.saldo)
    const totalDeuda = listaSaldos.reduce((a: number, c: any) => a + c.saldo, 0)

    // ── Top clientes por facturación (mes actual) ──
    const facPorCli: Record<string, number> = {}
    filtrar(mesActualStart, mesActualEnd).forEach((v: any) => {
      const cid = v.cliente_id; if (!cid) return
      facPorCli[cid] = (facPorCli[cid] || 0) + Number(v.tarifa_flete || v.tarifa_flete_calculada || 0)
    })
    const topClientes = Object.entries(facPorCli)
      .map(([id, total]) => ({
        nombre: (clientes || []).find((c: any) => c.id === id)?.razon_social || 'N/A',
        total: total as number
      }))
      .sort((a, b) => b.total - a.total).slice(0, 5)

    // ── Gráfico mensual (12 meses hacia atrás) ──
    const meses12 = Array.from({ length: 12 }, (_, i) => {
      const d = new Date(hoy.getFullYear(), hoy.getMonth() - (11 - i), 1)
      const s = d.toISOString().split('T')[0]
      const e = new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0]
      const arr = filtrar(s, e)
      const m = calcViajes(arr)
      return {
        mes: d.toLocaleDateString('es-AR', { month: 'short' }).replace('.', ''),
        facturacion: Math.round(m.bruta / 1000),
        neta: Math.round(m.neta / 1000),
        costos: Math.round(m.costos / 1000),
        viajes: m.count,
      }
    })

    // ── Últimos viajes ──
    const ultimosViajes = (viajes || []).slice(0, 8).map((v: any) => ({
      ...v,
      cliente: (clientes || []).find((c: any) => c.id === v.cliente_id)?.razon_social || 'N/A',
      bruta: Number(v.tarifa_flete || v.tarifa_flete_calculada || 0),
      neta: Number(v.tarifa_flete || v.tarifa_flete_calculada || 0)
             - Number(v.lts_gasoil || 0) * Number(v.precio_gasoil || 0)
             - Number(v.pago_chofer || 0)
             - Number(v.costo_descarga || 0)
             - Number(v.km_recorridos || 0) * Number(v.desgaste_por_km || 0)
    }))

    // ── Tareas ──
    const tareasHoy      = (tareas || []).filter((t: any) => t.fecha_vencimiento === hoyStr)
    const tareasAtrasadas= (tareas || []).filter((t: any) => t.fecha_vencimiento < hoyStr)
    const tareasProximas = (tareas || []).filter((t: any) => t.fecha_vencimiento > hoyStr).slice(0, 5)

    // ── Camiones con alerta ──
    const cam30dias = new Date(hoy); cam30dias.setDate(cam30dias.getDate() + 30)
    const cam30 = cam30dias.toISOString().split('T')[0]
    const camionesAlerta = (camiones || []).filter((c: any) =>
      (c.vto_rto && c.vto_rto <= cam30) || (c.vto_senasa && c.vto_senasa <= cam30)
    )

    // ── Movimientos recientes ──
    const movRecientes = (movimientos || []).slice(0, 6)

    return {
      mesActual, mesPasado, anoActual, anoPasado,
      deltaFacMes:  delta(mesActual.bruta, mesPasado.bruta),
      deltaNetaMes: delta(mesActual.neta,  mesPasado.neta),
      deltaFacAno:  delta(anoActual.bruta, anoPasado.bruta),
      deltaNetaAno: delta(anoActual.neta,  anoPasado.neta),
      totalDeuda, listaSaldos, topClientes, meses12, ultimosViajes,
      tareasHoy, tareasAtrasadas, tareasProximas, tareas: tareas || [],
      camionesAlerta, camionesActivos: (camiones || []).length,
      choferesActivos: (choferes || []).filter((c: any) => c.estado?.toLowerCase() === 'disponible' || c.estado?.toLowerCase() === 'activo').length,
      choferesTotal: (choferes || []).length,
      movRecientes,
    }
  }, [data])

  const fmt  = (n: number) => `$${Math.round(n).toLocaleString('es-AR')}`
  const fmtK = (n: number) => n >= 1_000_000 ? `$${(n/1_000_000).toFixed(1)}M` : n >= 1000 ? `$${Math.round(n/1000)}K` : `$${Math.round(n)}`

  const Trend = ({ val, inverse = false }: { val: number; inverse?: boolean }) => {
    const positive = inverse ? val < 0 : val > 0
    const color = positive ? 'text-emerald-400' : 'text-rose-400'
    const Icon  = val > 0 ? TrendingUp : TrendingDown
    if (val === 0 || isNaN(val)) return <span className="text-[9px] text-slate-500 font-bold">—</span>
    return (
      <span className={`inline-flex items-center gap-0.5 text-[9px] font-black ${color}`}>
        <Icon size={9} />
        {Math.abs(val).toFixed(1)}%
      </span>
    )
  }

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload?.length) return null
    return (
      <div className="bg-[#1a2537] border border-slate-700/40 p-3 rounded-xl shadow-xl text-[10px]">
        <p className="font-black text-slate-500 uppercase mb-2">{label}</p>
        {payload.map((p: any) => (
          <p key={p.name} style={{ color: p.color }} className="font-bold">
            {p.name}: ${p.value}K
          </p>
        ))}
      </div>
    )
  }

  /* ── Modal Deuda por Cliente ─────────────────────────────────────── */
  const DeudaModal = () => {
    const sorted = [...stats.listaSaldos].sort((a: any, b: any) => b.saldo - a.saldo)
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={() => setShowDeudaModal(false)}>
        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" />
        <div
          className="relative bg-[#1a2537] border border-slate-700/50 rounded-2xl w-full max-w-lg shadow-2xl"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-slate-700/50">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-xl bg-pink-500/15 border border-pink-500/20 flex items-center justify-center">
                <CreditCard size={15} className="text-pink-400" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-slate-100">Cuentas por Cobrar</p>
                <p className="text-[10px] text-slate-500 font-bold">{sorted.length} clientes con saldo pendiente</p>
              </div>
            </div>
            <button onClick={() => setShowDeudaModal(false)} className="w-7 h-7 rounded-lg bg-[#141c28] hover:bg-[#1a2537]/10 flex items-center justify-center transition-colors">
              <X size={13} className="text-slate-500" />
            </button>
          </div>

          {/* Total */}
          <div className="px-5 py-4 bg-pink-500/5 border-b border-pink-500/10">
            <div className="flex items-baseline justify-between">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Total a cobrar</span>
              <span className="text-2xl font-black text-pink-400 tabular-nums">{fmt(stats.totalDeuda)}</span>
            </div>
          </div>

          {/* Lista */}
          <div className="p-5 space-y-2 max-h-[360px] overflow-y-auto">
            {sorted.length === 0 && (
              <p className="text-center text-slate-500 font-bold text-sm py-6">Sin deuda pendiente ✓</p>
            )}
            {sorted.map((c: any, i: number) => {
              const pct = stats.totalDeuda > 0 ? (c.saldo / stats.totalDeuda) * 100 : 0
              return (
                <div key={c.id} className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/40 hover:bg-[#141c28] border border-slate-700/50/70 transition-colors">
                  <span className="w-5 h-5 rounded-lg bg-[#141c28] flex items-center justify-center text-[9px] font-black text-slate-500 shrink-0">
                    {i + 1}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-black text-slate-100 truncate">{c.razon_social}</p>
                    <div className="mt-1 h-1 rounded-full bg-slate-200">
                      <div className="h-1 rounded-full bg-pink-500/60" style={{ width: `${pct.toFixed(1)}%` }} />
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-[12px] font-black text-rose-400 tabular-nums">{fmt(c.saldo)}</p>
                    <p className="text-[9px] text-slate-500 font-bold">{pct.toFixed(1)}%</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Footer */}
          <div className="px-5 pb-4 flex justify-end">
            <Link href="/clientes" className="text-[10px] font-black uppercase tracking-widest text-pink-400 hover:text-pink-300 transition-colors flex items-center gap-1">
              Ver cuentas corrientes <ChevronRight size={11} />
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (loading) return (
    <div className="h-screen bg-[#141c28] flex flex-col items-center justify-center gap-3">
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-2 border-slate-700/25 rounded-full" />
        <div className="absolute inset-0 border-t-2 border-emerald-500 rounded-full animate-spin" />
      </div>
      <p className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-500 animate-pulse">Cargando dashboard</p>
    </div>
  )

  const hoyLabel = new Date().toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long' })

  return (
    <div className="min-h-screen bg-[#141c28] text-slate-200 font-sans italic selection:bg-emerald-500/20 overflow-x-hidden">

      {showDeudaModal && <DeudaModal />}

      {/* ── FONDO ── */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[800px] h-[400px] bg-emerald-400/[0.07] blur-[200px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-indigo-400/[0.07] blur-[180px] rounded-full" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff04_1px,transparent_1px),linear-gradient(to_bottom,#ffffff04_1px,transparent_1px)] bg-[size:40px_40px]" />
      </div>

      <div className="relative z-10 pt-24 pb-16 px-4 lg:px-8 max-w-[1800px] mx-auto">

        {/* ══════════════════════════════════════
            HEADER
        ══════════════════════════════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-6">
          <div>
            <p className="text-[8px] font-black uppercase tracking-[0.5em] text-slate-500 mb-1">DallapeSystems ERP</p>
            <h1 className="text-3xl font-black uppercase tracking-tight text-slate-100">
              Dashboard <span className="text-slate-600 font-thin mx-1">/</span>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-sky-400">Operaciones</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-slate-500">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {stats.camionesActivos} camiones · {stats.choferesActivos}/{stats.choferesTotal} choferes activos
          </div>
        </div>

        {/* ══════════════════════════════════════
            FILA 1: KPI PILLS (YoY rápido)
        ══════════════════════════════════════ */}
        <div className="flex flex-wrap gap-2 mb-5">
          {[
            { label: 'Facturación YoY', val: stats.anoActual.bruta, delta: stats.deltaFacAno },
            { label: 'Utilidad Neta YoY', val: stats.anoActual.neta, delta: stats.deltaNetaAno },
            { label: 'Facturación Mes', val: stats.mesActual.bruta, delta: stats.deltaFacMes },
            { label: 'Utilidad Mes', val: stats.mesActual.neta, delta: stats.deltaNetaMes },
            { label: 'Deuda Clientes', val: stats.totalDeuda, delta: 0, noTrend: true, warn: stats.totalDeuda > 500000 },
            { label: 'Viajes Año', val: stats.anoActual.count, delta: 0, noTrend: true, isNum: true },
            { label: 'Km Mes', val: stats.mesActual.km, delta: 0, noTrend: true, isNum: true, unit: 'km' },
          ].map((pill, i) => (
            <div key={i} className={`flex items-center gap-2.5 px-4 py-2 rounded-full border bg-[#1a2537]/80 backdrop-blur-sm
              ${pill.warn ? 'border-rose-500/25 bg-rose-500/5' : 'border-slate-700/50'}`}>
              <span className="text-[9px] font-black uppercase tracking-widest text-slate-500">{pill.label}</span>
              <span className={`text-[11px] font-black tabular-nums ${pill.warn ? 'text-rose-400' : 'text-slate-100'}`}>
                {pill.isNum
                  ? `${Math.round(pill.val).toLocaleString('es-AR')}${pill.unit ? ' ' + pill.unit : ''}`
                  : fmtK(pill.val)}
              </span>
              {!pill.noTrend && <Trend val={pill.delta} />}
            </div>
          ))}
        </div>

        {/* ══════════════════════════════════════
            FILA 2: 6 KPIs PRINCIPALES
        ══════════════════════════════════════ */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          {[
            {
              label: 'Facturación Bruta', value: fmtK(stats.mesActual.bruta),
              sub: 'este mes', delta: stats.deltaFacMes,
              color: '#4ade80', bg: 'from-emerald-500/10', border: 'border-emerald-500/20',
              icon: <DollarSign size={15} />
            },
            {
              label: 'Utilidad Neta', value: fmtK(stats.mesActual.neta),
              sub: `${Math.round(stats.mesActual.margen)}% margen`, delta: stats.deltaNetaMes,
              color: '#a78bfa', bg: 'from-violet-500/10', border: 'border-violet-500/20',
              icon: <TrendingUp size={15} />
            },
            {
              label: 'Costo Total', value: fmtK(stats.mesActual.costos),
              sub: 'gasoil + choferes + ops', delta: -stats.deltaFacMes, noTrend: true,
              color: '#f87171', bg: 'from-rose-500/10', border: 'border-rose-500/20',
              icon: <Receipt size={15} />
            },
            {
              label: 'Kilómetros', value: `${Math.round(stats.mesActual.km).toLocaleString('es-AR')}`,
              sub: `${stats.mesActual.count} viajes`, delta: 0, noTrend: true,
              color: '#38bdf8', bg: 'from-sky-500/10', border: 'border-sky-500/20',
              icon: <Route size={15} />
            },
            {
              label: 'Consumo Gasoil', value: fmtK(stats.mesActual.gasoil),
              sub: `${stats.mesActual.km > 0 ? ((stats.mesActual.lts / stats.mesActual.km) * 100).toFixed(1) : '—'} l/100km`,
              delta: 0, noTrend: true,
              color: '#fbbf24', bg: 'from-amber-500/10', border: 'border-amber-500/20',
              icon: <Fuel size={15} />
            },
            {
              label: 'Deuda Cobrar', value: fmtK(stats.totalDeuda),
              sub: `${stats.listaSaldos.length} clientes`, delta: 0, noTrend: true,
              color: '#f472b6', bg: 'from-pink-500/10', border: 'border-pink-500/20',
              icon: <CircleDollarSign size={15} />
            },
          ].map((kpi, i) => (
            <div key={i}
              className={`relative overflow-hidden rounded-2xl border bg-gradient-to-br ${kpi.bg} to-transparent ${kpi.border} p-4 ${kpi.label === 'Deuda Cobrar' ? 'cursor-pointer hover:border-pink-500/40' : ''} transition-colors`}
              style={{ boxShadow: `0 8px 32px -8px ${kpi.color}18` }}
              onClick={kpi.label === 'Deuda Cobrar' ? () => setShowDeudaModal(true) : undefined}>
              <div className="absolute -top-6 -right-6 w-20 h-20 rounded-full blur-2xl opacity-20" style={{ background: kpi.color }} />
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="p-1.5 rounded-lg" style={{ background: `${kpi.color}20`, color: kpi.color }}>{kpi.icon}</div>
                  {!kpi.noTrend ? <Trend val={kpi.delta} /> : <div />}
                </div>
                <p className="text-[7px] font-black uppercase tracking-widest text-slate-500 mb-0.5">{kpi.label}</p>
                <p className="text-xl font-black tabular-nums leading-none" style={{ color: kpi.color }}>{kpi.value}</p>
                <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">{kpi.sub}</p>
              </div>
            </div>
          ))}
        </div>

        {/* ══════════════════════════════════════
            CUERPO PRINCIPAL: 3 COLUMNAS
        ══════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 mb-4">

          {/* ── COL IZQUIERDA: TAREAS + ALERTAS ── */}
          <div className="lg:col-span-3 flex flex-col gap-3">

            {/* Fecha de hoy */}
            <div className="bg-[#1a2537]/80 border border-slate-700/50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Calendar size={13} className="text-indigo-400" />
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Hoy</span>
              </div>
              <p className="text-sm font-black text-slate-100 capitalize">{hoyLabel}</p>
              <div className="mt-3 grid grid-cols-3 gap-2">
                <div className="bg-rose-500/10 border border-rose-500/20 rounded-xl p-2 text-center">
                  <p className="text-xl font-black text-rose-400">{stats.tareasAtrasadas.length}</p>
                  <p className="text-[7px] font-black uppercase text-rose-500/70 tracking-wider">Atrasadas</p>
                </div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-2 text-center">
                  <p className="text-xl font-black text-amber-400">{stats.tareasHoy.length}</p>
                  <p className="text-[7px] font-black uppercase text-amber-500/70 tracking-wider">Hoy</p>
                </div>
                <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl p-2 text-center">
                  <p className="text-xl font-black text-sky-400">{stats.tareasProximas.length}</p>
                  <p className="text-[7px] font-black uppercase text-sky-500/70 tracking-wider">Próximas</p>
                </div>
              </div>
            </div>

            {/* Tareas */}
            <div className="bg-[#1a2537]/80 border border-slate-700/50 rounded-2xl p-4 flex-1">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CheckSquare size={13} className="text-emerald-400" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Tareas pendientes</span>
                </div>
                <Link href="/tareas" className="text-[7px] font-black uppercase text-slate-500 hover:text-indigo-400 transition-colors">ver todo</Link>
              </div>
              <div className="space-y-2">
                {[...stats.tareasAtrasadas.slice(0, 2), ...stats.tareasHoy, ...stats.tareasProximas].slice(0, 6).map((t: any) => {
                  const atrasada = t.fecha_vencimiento < new Date().toISOString().split('T')[0]
                  const esHoy    = t.fecha_vencimiento === new Date().toISOString().split('T')[0]
                  return (
                    <div key={t.id} className={`flex items-start gap-2.5 p-2.5 rounded-xl border
                      ${atrasada ? 'bg-rose-500/5 border-rose-500/15' : esHoy ? 'bg-amber-500/5 border-amber-500/15' : 'bg-slate-800/40/50 border-slate-700/50/70'}`}>
                      <div className={`w-1.5 h-1.5 rounded-full mt-1 shrink-0 ${atrasada ? 'bg-rose-400' : esHoy ? 'bg-amber-400' : 'bg-sky-400'}`} />
                      <div className="min-w-0">
                        <p className="text-[10px] font-black text-slate-100 truncate">{t.titulo}</p>
                        <p className={`text-[8px] font-bold ${atrasada ? 'text-rose-400' : esHoy ? 'text-amber-400' : 'text-slate-500'}`}>
                          {atrasada ? '⚠ Vencida' : esHoy ? '🔴 Hoy' : t.fecha_vencimiento}
                        </p>
                      </div>
                    </div>
                  )
                })}
                {[...stats.tareasAtrasadas, ...stats.tareasHoy, ...stats.tareasProximas].length === 0 && (
                  <p className="text-[9px] text-slate-500 font-bold text-center py-4">Sin tareas pendientes ✓</p>
                )}
              </div>
            </div>

            {/* Alertas flota */}
            {stats.camionesAlerta.length > 0 && (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4">
                <div className="flex items-center gap-2 mb-3">
                  <AlertTriangle size={13} className="text-amber-400" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-amber-500">Alertas Flota</span>
                </div>
                <div className="space-y-2">
                  {stats.camionesAlerta.slice(0, 3).map((c: any) => (
                    <div key={c.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Truck size={11} className="text-amber-400/60" />
                        <span className="text-[10px] font-black text-slate-100">{c.patente}</span>
                      </div>
                      <span className="text-[8px] font-bold text-amber-400 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-full">
                        {c.vto_rto && c.vto_rto <= new Date(Date.now() + 30*86400000).toISOString().split('T')[0] ? 'RTO' : 'SENASA'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Links rápidos */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { href: '/viajes', icon: <Truck size={14} />, label: 'Viajes', c: 'hover:border-sky-500/30 hover:text-sky-400' },
                { href: '/clientes', icon: <Users size={14} />, label: 'Clientes', c: 'hover:border-emerald-500/30 hover:text-emerald-400' },
                { href: '/facturacion', icon: <Receipt size={14} />, label: 'Facturas', c: 'hover:border-violet-500/30 hover:text-violet-400' },
                { href: '/caja', icon: <DollarSign size={14} />, label: 'Caja', c: 'hover:border-amber-500/30 hover:text-amber-400' },
              ].map(s => (
                <Link key={s.href} href={s.href}
                  className={`bg-[#1a2537]/80 border border-slate-700/50 rounded-xl p-3 flex items-center gap-2 text-slate-500 transition-all ${s.c}`}>
                  {s.icon}
                  <span className="text-[9px] font-black uppercase tracking-wider">{s.label}</span>
                  <ChevronRight size={10} className="ml-auto opacity-40" />
                </Link>
              ))}
            </div>
          </div>

          {/* ── COL CENTRAL: GRÁFICO + ÚLTIMOS VIAJES ── */}
          <div className="lg:col-span-6 flex flex-col gap-4">

            {/* Gráfico de área (12 meses) */}
            <div className="bg-[#1a2537]/80 border border-slate-700/50 rounded-2xl p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-[8px] font-black uppercase tracking-widest text-slate-500 mb-0.5">Facturación vs Utilidad</p>
                  <p className="text-sm font-black text-slate-100">Últimos 12 meses</p>
                </div>
                <div className="flex items-center gap-3 text-[8px] font-bold text-slate-500">
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-400 inline-block" />Facturación</span>
                  <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-emerald-400 inline-block" />Utilidad</span>
                </div>
              </div>
              <div className="h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={stats.meses12} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="gFac" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#818cf8" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gNet" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%"  stopColor="#4ade80" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="2 8" stroke="#ffffff08" vertical={false} />
                    <XAxis dataKey="mes" stroke="#64748b" fontSize={8} axisLine={false} tickLine={false} fontWeight="900" />
                    <YAxis stroke="#64748b" fontSize={8} axisLine={false} tickLine={false} fontWeight="900" tickFormatter={v => `${v}K`} />
                    <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#ffffff08' }} />
                    <Area type="monotone" dataKey="facturacion" name="Facturación" stroke="#818cf8" strokeWidth={2} fill="url(#gFac)" dot={false} />
                    <Area type="monotone" dataKey="neta" name="Utilidad" stroke="#4ade80" strokeWidth={2} fill="url(#gNet)" dot={false} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Últimos viajes */}
            <div className="bg-[#1a2537]/80 border border-slate-700/50 rounded-2xl p-5 flex-1">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity size={13} className="text-sky-400" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Últimos Viajes</span>
                </div>
                <Link href="/viajes" className="text-[7px] font-black uppercase text-slate-500 hover:text-sky-400 transition-colors flex items-center gap-1">
                  ver todos <ArrowUpRight size={9} />
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[10px]">
                  <thead>
                    <tr className="border-b border-slate-700/50/70">
                      {['Fecha', 'Ruta', 'Cliente', 'Bruto', 'Neto', 'Estado'].map(h => (
                        <th key={h} className="text-left pb-2 font-black uppercase tracking-wider text-[8px] text-slate-500 pr-3">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {stats.ultimosViajes.map((v: any) => (
                      <tr key={v.id} className="border-b border-slate-700/25 hover:bg-slate-800/40/50 transition-colors">
                        <td className="py-2 pr-3 text-slate-500 font-bold whitespace-nowrap">
                          {new Date(v.fecha).toLocaleDateString('es-AR', { day: '2-digit', month: '2-digit' })}
                        </td>
                        <td className="py-2 pr-3 font-black text-slate-100 whitespace-nowrap">
                          {v.origen?.slice(0, 4) || 'MDZ'} → {(v.destino || '—').slice(0, 6)}
                        </td>
                        <td className="py-2 pr-3 text-slate-500 font-bold max-w-[100px] truncate">{v.cliente}</td>
                        <td className="py-2 pr-3 font-black text-slate-100 tabular-nums">{fmtK(v.bruta)}</td>
                        <td className={`py-2 pr-3 font-black tabular-nums ${v.neta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {fmtK(v.neta)}
                        </td>
                        <td className="py-2">
                          <span className={`text-[7px] font-black uppercase px-2 py-0.5 rounded-full border
                            ${v.es_retorno ? 'text-indigo-400 border-indigo-500/20 bg-indigo-500/10' : 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10'}`}>
                            {v.es_retorno ? 'Ret' : 'Ida'}
                          </span>
                        </td>
                      </tr>
                    ))}
                    {stats.ultimosViajes.length === 0 && (
                      <tr><td colSpan={6} className="text-center py-6 text-slate-500 text-[9px] font-bold">Sin viajes registrados</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* ── COL DERECHA: RENTABILIDAD + CLIENTES ── */}
          <div className="lg:col-span-3 flex flex-col gap-4">

            {/* P&L compacto */}
            <div className="bg-[#1a2537]/80 border border-slate-700/50 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <BarChart3 size={13} className="text-violet-400" />
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">P&L — Mes corriente</span>
              </div>
              {[
                { label: 'Facturación', val: stats.mesActual.bruta, color: 'text-slate-100' },
                { label: 'Gasoil', val: -stats.mesActual.gasoil, color: 'text-amber-400' },
                { label: 'Choferes', val: -stats.mesActual.chofPago, color: 'text-violet-400' },
                { label: 'Descarga + Ops', val: -stats.mesActual.descargas, color: 'text-rose-400' },
                { label: 'Desgaste', val: -stats.mesActual.desgaste, color: 'text-sky-400' },
              ].map((row, i) => (
                <div key={i} className="flex items-center justify-between py-1.5 border-b border-slate-700/25 last:border-0">
                  <span className="text-[9px] font-bold text-slate-500">{row.label}</span>
                  <span className={`text-[10px] font-black tabular-nums ${row.color}`}>
                    {row.val >= 0 ? '' : '−'}{fmtK(Math.abs(row.val))}
                  </span>
                </div>
              ))}
              <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center justify-between">
                <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">= Utilidad Neta</span>
                <span className={`text-lg font-black tabular-nums ${stats.mesActual.neta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {fmtK(stats.mesActual.neta)}
                </span>
              </div>
              <div className="mt-2">
                <div className="flex justify-between text-[8px] font-bold text-slate-500 mb-1">
                  <span>Margen</span>
                  <span>{Math.round(stats.mesActual.margen)}%</span>
                </div>
                <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-emerald-500/100 to-emerald-400 rounded-full transition-all"
                    style={{ width: `${Math.max(0, Math.min(100, stats.mesActual.margen))}%` }} />
                </div>
              </div>
            </div>

            {/* Top clientes */}
            <div className="bg-[#1a2537]/80 border border-slate-700/50 rounded-2xl p-4 flex-1">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Crown size={13} className="text-amber-400" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Top Clientes</span>
                </div>
                <span className="text-[7px] text-slate-500 font-bold">este mes</span>
              </div>
              <div className="space-y-2.5">
                {stats.topClientes.map((c: any, i: number) => {
                  const max = stats.topClientes[0]?.total || 1
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[8px] font-black text-slate-500 w-3">{i + 1}</span>
                          <span className="text-[10px] font-black text-slate-100 truncate max-w-[120px]">{c.nombre}</span>
                        </div>
                        <span className="text-[10px] font-black text-emerald-400 tabular-nums">{fmtK(c.total)}</span>
                      </div>
                      <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all"
                          style={{
                            width: `${(c.total / max) * 100}%`,
                            background: ['#4ade80','#818cf8','#38bdf8','#fbbf24','#f472b6'][i]
                          }} />
                      </div>
                    </div>
                  )
                })}
                {stats.topClientes.length === 0 && (
                  <p className="text-[9px] text-slate-500 font-bold text-center py-4">Sin viajes este mes</p>
                )}
              </div>
            </div>

            {/* Deuda clientes (top 4) */}
            <div
              className="bg-[#1a2537]/80 border border-slate-700/50 rounded-2xl p-4 cursor-pointer hover:border-pink-500/30 transition-colors"
              onClick={() => setShowDeudaModal(true)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CreditCard size={13} className="text-pink-400" />
                  <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Cuentas por cobrar</span>
                </div>
                <span className="text-[7px] font-black uppercase text-slate-500 hover:text-pink-400 transition-colors">ver detalle →</span>
              </div>
              <div className="space-y-2">
                {stats.listaSaldos.slice(0, 4).map((c: any) => (
                  <div key={c.id} className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-100 truncate max-w-[120px]">{c.razon_social}</span>
                    <span className="text-[10px] font-black text-rose-400 tabular-nums">{fmtK(c.saldo)}</span>
                  </div>
                ))}
                {stats.listaSaldos.length > 4 && (
                  <p className="text-[8px] text-pink-500/70 font-bold text-center mt-1">+ {stats.listaSaldos.length - 4} más · Total {fmtK(stats.totalDeuda)}</p>
                )}
                {stats.listaSaldos.length === 0 && (
                  <p className="text-[9px] text-slate-500 font-bold text-center py-2">Sin deuda pendiente ✓</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════
            FILA INFERIOR: PIPELINE + ANÁLISIS
        ══════════════════════════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">

          {/* Pipeline viajes (últimos 30 días por estado) */}
          {(() => {
            const hace30 = new Date(); hace30.setDate(hace30.getDate() - 30)
            const hace30Str = hace30.toISOString().split('T')[0]
            const recientes = (data.viajes || []).filter((v: any) => v.fecha >= hace30Str)
            const idas     = recientes.filter((v: any) => !v.es_retorno)
            const retornos = recientes.filter((v: any) => v.es_retorno)
            const totalFac = recientes.reduce((a: number, v: any) => a + Number(v.tarifa_flete || v.tarifa_flete_calculada || 0), 0)

            return (
              <div className="lg:col-span-8 bg-[#1a2537]/80 border border-slate-700/50 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Zap size={13} className="text-amber-400" />
                    <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Pipeline — Últimos 30 días</span>
                  </div>
                  <span className="text-[8px] font-black text-slate-500">{recientes.length} viajes · {fmtK(totalFac)} facturado</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    {
                      label: 'Viajes de Ida', count: idas.length, color: 'emerald',
                      total: idas.reduce((a: number, v: any) => a + Number(v.tarifa_flete || v.tarifa_flete_calculada || 0), 0),
                      items: idas.slice(0, 3)
                    },
                    {
                      label: 'Retornos', count: retornos.length, color: 'indigo',
                      total: retornos.reduce((a: number, v: any) => a + Number(v.tarifa_flete || v.tarifa_flete_calculada || 0), 0),
                      items: retornos.slice(0, 3)
                    },
                    {
                      label: 'Con Remito', count: recientes.filter((v: any) => v.remito_numero).length, color: 'amber',
                      total: recientes.filter((v: any) => v.remito_numero).reduce((a: number, v: any) => a + Number(v.tarifa_flete || v.tarifa_flete_calculada || 0), 0),
                      items: recientes.filter((v: any) => v.remito_numero).slice(0, 3)
                    },
                  ].map((col) => (
                    <div key={col.label} className={`bg-${col.color}-500/5 border border-${col.color}-500/15 rounded-xl p-3`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-[8px] font-black uppercase tracking-widest text-${col.color}-400`}>{col.label}</span>
                        <span className={`text-[8px] font-black text-${col.color}-400 bg-${col.color}-500/10 px-2 py-0.5 rounded-full`}>{col.count}</span>
                      </div>
                      <p className={`text-lg font-black text-${col.color}-400 tabular-nums mb-2`}>{fmtK(col.total)}</p>
                      <div className="space-y-1.5">
                        {col.items.map((v: any) => (
                          <div key={v.id} className="flex items-center justify-between">
                            <span className="text-[8px] text-slate-500 font-bold truncate max-w-[80px]">
                              {v.origen?.slice(0,3)} → {(v.destino || '?').slice(0,5)}
                            </span>
                            <span className="text-[8px] font-black text-slate-100 tabular-nums">
                              {fmtK(Number(v.tarifa_flete || v.tarifa_flete_calculada || 0))}
                            </span>
                          </div>
                        ))}
                        {col.items.length === 0 && (
                          <p className="text-[8px] text-slate-200 font-bold text-center py-2">—</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )
          })()}

          {/* Movimientos recientes */}
          <div className="lg:col-span-4 bg-[#1a2537]/80 border border-slate-700/50 rounded-2xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Activity size={13} className="text-emerald-400" />
                <span className="text-[8px] font-black uppercase tracking-widest text-slate-500">Movimientos Recientes</span>
              </div>
              <Link href="/caja" className="text-[7px] font-black uppercase text-slate-500 hover:text-emerald-400 transition-colors">ver caja</Link>
            </div>
            <div className="space-y-2">
              {stats.movRecientes.map((m: any, i: number) => (
                <div key={i} className="flex items-center gap-2.5">
                  <div className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0
                    ${m.tipo === 'ingreso' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-rose-500/15 text-rose-400'}`}>
                    {m.tipo === 'ingreso' ? <ArrowUpRight size={11} /> : <ArrowDownRight size={11} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[9px] font-black text-slate-100 truncate">{m.descripcion || m.categoria}</p>
                    <p className="text-[7px] text-slate-500 font-bold">{m.fecha}</p>
                  </div>
                  <span className={`text-[10px] font-black tabular-nums shrink-0 ${m.tipo === 'ingreso' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {m.tipo === 'ingreso' ? '+' : '−'}{fmtK(Number(m.monto))}
                  </span>
                </div>
              ))}
              {stats.movRecientes.length === 0 && (
                <p className="text-[9px] text-slate-500 font-bold text-center py-6">Sin movimientos recientes</p>
              )}
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}
