'use client'
import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import * as supabaseLib from '@/lib/supabase'
import { toast } from 'sonner'
import { FacturasHeader } from '@/components/facturacion/FacturasHeader'
import { FacturasKpis } from '@/components/facturacion/FacturasKpis'
import { FacturasTabla } from '@/components/facturacion/FacturasTabla'
import { FacturaWizard } from '@/components/facturacion/Facturawizard'
import { ArcaConfigModal } from '@/components/facturacion/ArcaConfigModal'
import { FacturaManualModal } from '@/components/facturacion/FacturaManualModal'
import { FileText, ChevronDown, RotateCcw } from 'lucide-react'

const supabase = (supabaseLib as any).supabase || ((supabaseLib as any).getSupabase?.()) || supabaseLib

function FacturacionInner() {
  const searchParams = useSearchParams()
  const [facturas, setFacturas] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [viajes, setViajes] = useState<any[]>([])
  const [remitos, setRemitos] = useState<any[]>([])
  const [config, setConfig] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [isConfigModalOpen, setIsConfigModalOpen] = useState(false)
  const [isEmitting, setIsEmitting] = useState(false)
  const [preloadData, setPreloadData] = useState<any>(null)
  const [isManualModalOpen, setIsManualModalOpen] = useState(false)
  const [showFacturadosArca, setShowFacturadosArca] = useState(false)
  const [arcaSearch, setArcaSearch] = useState('')
  const [arcaClienteFilter, setArcaClienteFilter] = useState('todos')
  const [arcaFechaStart, setArcaFechaStart] = useState('')
  const [arcaFechaEnd, setArcaFechaEnd] = useState('')

  const [dateStart, setDateStart] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
  })
  const [dateEnd, setDateEnd] = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => { fetchAll() }, [])

  // Auto-abrir wizard cuando viene de remitos con params en la URL
  useEffect(() => {
    if (!loading && clientes.length > 0) {
      const cid = searchParams.get('cliente_id')
      const imp = searchParams.get('importe')
      const vid = searchParams.get('viaje_id')
      if (cid) {
        const cliente = clientes.find((c: any) => c.id === cid)
        if (cliente) {
          setPreloadData({
            cliente,
            importe: imp ? (Number(imp) / 1.21).toFixed(2) : '',
            viaje_id: vid || '',
          })
          setIsWizardOpen(true)
        }
      }
    }
  }, [loading, clientes, searchParams])

  async function fetchAll() {
    setLoading(true)
    try {
      const [facturasRes, clientesRes, viajesRes, remitosRes, ccRemitosRes, configRes] = await Promise.all([
        supabase.from('facturas').select('*, clientes(razon_social)').order('fecha_comprobante', { ascending: false }),
        supabase.from('clientes').select('id, razon_social, cuit, condicion_iva').order('razon_social'),
        supabase.from('viajes').select('id, fecha, origen, destino, cliente_id, clientes(razon_social), tarifa_flete').order('fecha', { ascending: false }),
        supabase.from('remitos').select('id, viaje_id, numero_remito, cliente_id, facturado'),
        supabase.from('cuenta_corriente').select('viaje_id, cliente_id, remito, fecha').not('remito', 'is', null).neq('remito', 'PENDIENTE').neq('remito', ''),
        supabase.from('configuracion').select('arca_cuit, arca_razon_social, arca_punto_venta, arca_condicion_iva, arca_entorno, arca_certificado, arca_clave_privada').eq('id', 1).single(),
      ])

      const remitosDB: any[] = remitosRes.data || []
      // viaje_ids que ya están en la tabla remitos
      const viajesEnRemitosDB = new Set(remitosDB.map((r: any) => r.viaje_id).filter(Boolean))

      // Deduplicar cc por viaje_id (puede haber múltiples filas por viaje)
      const ccPorViaje: Record<string, any> = {}
      for (const cc of (ccRemitosRes.data || [])) {
        if (cc.viaje_id && !ccPorViaje[cc.viaje_id]) ccPorViaje[cc.viaje_id] = cc
      }

      // Remitos de cuenta_corriente que NO tienen fila en tabla remitos
      const remitosDeCC = Object.values(ccPorViaje)
        .filter((cc: any) => !viajesEnRemitosDB.has(cc.viaje_id))
        .map((cc: any) => ({
          id: null,
          viaje_id: cc.viaje_id,
          numero_remito: cc.remito,
          cliente_id: cc.cliente_id,
          facturado: false,
          _fromCC: true,
        }))

      const allRemitos = [...remitosDB, ...remitosDeCC]
      setFacturas(facturasRes.data || [])
      setClientes(clientesRes.data || [])
      setViajes(viajesRes.data || [])
      setRemitos(allRemitos)
      setConfig(configRes.data)
    } catch (error) {
      console.error('[Facturacion] fetchAll error:', error)
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  const facturasFiltradas = useMemo(() =>
    facturas.filter(f => f.fecha_comprobante >= dateStart && f.fecha_comprobante <= dateEnd),
    [facturas, dateStart, dateEnd]
  )

  const kpis = useMemo(() => {
    const emitidas = facturas.filter(f => f.estado === 'emitida')
    const errores = facturas.filter(f => f.estado === 'error')
    const totalMes = facturasFiltradas.filter(f => f.estado === 'emitida').reduce((a, f) => a + Number(f.importe_total), 0)
    const totalHist = emitidas.reduce((a, f) => a + Number(f.importe_total), 0)
    return { emitidas: emitidas.length, errores: errores.length, totalMes, totalHist }
  }, [facturas, facturasFiltradas])

  async function handleEmitir(data: any) {
    setIsEmitting(true)
    toast.promise(
      async () => {
        const res = await fetch('/api/arca/facturar', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) })
        const result = await res.json()
        if (!res.ok || result.error) throw new Error(result.error || 'Error al comunicar con ARCA')
        return result
      },
      {
        loading: 'Enviando factura a AFIP...',
        success: (result) => {
          setIsWizardOpen(false)
          setPreloadData(null)
          fetchAll()
          return 'Factura emitida con CAE: ' + result.cae
        },
        error: (err) => 'Error AFIP: ' + err.message,
        finally: () => setIsEmitting(false)
      }
    )
  }

  async function handleSaveManual(data: any) {
    setIsEmitting(true)
    try {
      const { error } = await supabase.from('facturas').insert([data])
      if (error) throw error
      toast.success('Factura manual registrada')
      setIsManualModalOpen(false)
      fetchAll()
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    } finally {
      setIsEmitting(false)
    }
  }

  async function handleDeleteFactura(f: any) {
    const label = f.estado === 'manual' ? 'factura manual' : 'factura'
    if (!window.confirm(`¿Eliminar ${label} por $${Number(f.importe_total).toLocaleString('es-AR')}? Esta acción no se puede deshacer.`)) return
    try {
      const { error } = await supabase.from('facturas').delete().eq('id', f.id)
      if (error) throw error
      toast.success('Factura eliminada')
      fetchAll()
    } catch (e: any) {
      toast.error('Error al eliminar: ' + e.message)
    }
  }

  async function handleSaveConfig(configData: any) {
    try {
      const { error } = await supabase.from('configuracion').update(configData).eq('id', 1)
      if (error) throw error
      toast.success('Configuracion guardada')
      setIsConfigModalOpen(false)
      fetchAll()
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    }
  }

  async function handleMarcarFacturado(remito: any) {
    try {
      if (remito.id) {
        // Ya tiene fila en tabla remitos → solo actualizar
        const { error } = await supabase.from('remitos').update({ facturado: true }).eq('id', remito.id)
        if (error) throw error
      } else if (remito.viaje_id) {
        // Viene de cuenta_corriente, crear fila en remitos
        const { error } = await supabase.from('remitos').insert([{
          viaje_id: remito.viaje_id,
          cliente_id: remito.cliente_id,
          numero_remito: remito.numero_remito,
          facturado: true,
          estado: 'generado',
          estado_cobro: 'Pendiente',
        }])
        if (error) throw error
      }
      toast.success(`Remito ${remito.numero_remito} marcado como facturado`)
      fetchAll()
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    }
  }

  async function handleDesmarcarFacturado(remito: any) {
    if (!window.confirm(`¿Desmarcar remito ${remito.numero_remito} como facturado? Vuelve a "Pendientes".`)) return
    try {
      const { error } = await supabase.from('remitos').update({ facturado: false }).eq('id', remito.id)
      if (error) throw error
      toast.success(`Remito ${remito.numero_remito} vuelto a pendiente`)
      fetchAll()
    } catch (e: any) {
      toast.error('Error: ' + e.message)
    }
  }

  function handleCloseWizard() {
    setIsWizardOpen(false)
    setPreloadData(null)
    // Limpiar URL params si habia
    if (searchParams.get('cliente_id')) {
      window.history.replaceState({}, '', '/facturacion')
    }
  }

  const arcaConfigurado = !!(config?.arca_cuit && config?.arca_certificado)

  return (
    <main className="min-h-screen bg-[#141c28] pt-20 lg:pt-24 pb-20 font-sans italic">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 space-y-8">
        <FacturasHeader arcaConfigurado={arcaConfigurado} entorno={config?.arca_entorno || 'homologacion'} dateStart={dateStart} setDateStart={setDateStart} dateEnd={dateEnd} setDateEnd={setDateEnd} onNuevaFactura={() => { setPreloadData(null); setIsWizardOpen(true) }} onOpenConfig={() => setIsConfigModalOpen(true)} />
        <div className="flex justify-end">
          <button
            onClick={() => setIsManualModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#1a2537] border border-slate-700/50 text-slate-300 hover:text-emerald-400 hover:border-emerald-500/30 text-[11px] font-black uppercase tracking-widest transition-all"
          >
            <FileText size={14} /> Registrar Factura Manual
          </button>
        </div>
        <FacturasKpis kpis={kpis} loading={loading} />

        {/* REMITOS PENDIENTES DE FACTURAR */}
        <div className="space-y-4 font-sans italic">
          <div className="flex justify-between items-center px-2">
            <div className="flex items-center gap-3">
              {!loading && remitos.filter((r: any) => !r.facturado && r.numero_remito).length > 0 && (
                <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              )}
              <p className="text-[10px] font-black text-amber-400 uppercase tracking-[0.4em]">
                Pendientes de Facturar
              </p>
            </div>
            <span className="text-[9px] font-black text-amber-600 uppercase bg-amber-500/10 px-3 py-1 rounded-lg border border-amber-500/20">
              {loading ? '...' : `${remitos.filter((r: any) => !r.facturado && r.numero_remito).length} remitos`}
            </span>
          </div>
          <div className="bg-[#1a2537]/40 rounded-[2.5rem] border border-amber-500/15 overflow-hidden shadow-2xl">
            {loading ? (
              <div className="py-16 flex justify-center"><span className="w-6 h-6 rounded-full border-2 border-amber-500 border-t-transparent animate-spin" /></div>
            ) : remitos.filter((r: any) => !r.facturado && r.numero_remito).length === 0 ? (
              <div className="py-16 flex flex-col items-center gap-3 opacity-40">
                <svg xmlns="http://www.w3.org/2000/svg" width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg>
                <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Todos los remitos están facturados</p>
              </div>
            ) : (
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left min-w-[700px]">
                  <thead className="bg-amber-500/5 text-[9px] font-black text-amber-600/70 uppercase tracking-[0.3em] border-b border-amber-500/10">
                    <tr>
                      <th className="p-5 pl-8">Remito</th>
                      <th className="p-5">Cliente</th>
                      <th className="p-5">Estado</th>
                      <th className="p-5 text-right pr-8">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/3">
                    {remitos.filter((r: any) => !r.facturado && r.numero_remito).map((r: any) => (
                      <tr key={r.id || r.viaje_id} className="hover:bg-white/2 transition-all">
                        <td className="p-5 pl-8">
                          <p className="text-sm font-black text-white font-mono">{r.numero_remito}</p>
                        </td>
                        <td className="p-5">
                          <p className="text-sm font-bold text-slate-300 uppercase">{clientes.find((c: any) => c.id === r.cliente_id)?.razon_social || '—'}</p>
                        </td>
                        <td className="p-5">
                          <span className="px-2.5 py-1 rounded-lg text-[8px] font-black uppercase border bg-amber-500/10 text-amber-400 border-amber-500/20">Sin facturar</span>
                        </td>
                        <td className="p-5 pr-8">
                          <div className="flex gap-2 justify-end">
                            <button
                              onClick={() => {
                                const cliente = clientes.find((c: any) => c.id === r.cliente_id)
                                if (cliente) {
                                  setPreloadData({ cliente, importe: '', viaje_id: r.viaje_id || '' })
                                  setIsWizardOpen(true)
                                } else {
                                  toast.error('No se encontró el cliente para este remito')
                                }
                              }}
                              className="px-3 py-2 rounded-xl bg-sky-500/10 hover:bg-sky-500 border border-sky-500/30 text-sky-400 hover:text-white font-black uppercase text-[8px] tracking-widest transition-all active:scale-95"
                            >
                              Emitir Factura
                            </button>
                            <button
                              onClick={() => handleMarcarFacturado(r)}
                              className="px-3 py-2 rounded-xl bg-emerald-500/10 hover:bg-emerald-500 border border-emerald-500/30 text-emerald-400 hover:text-white font-black uppercase text-[8px] tracking-widest transition-all active:scale-95"
                            >
                              ✓ Ya Facturado
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Mobile */}
            {!loading && remitos.filter((r: any) => !r.facturado && r.numero_remito).length > 0 && (
              <div className="md:hidden divide-y divide-white/5">
                {remitos.filter((r: any) => !r.facturado && r.numero_remito).map((r: any) => (
                  <div key={r.id || r.viaje_id} className="p-5 space-y-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="text-sm font-black text-white font-mono">{r.numero_remito}</p>
                        <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">{clientes.find((c: any) => c.id === r.cliente_id)?.razon_social || '—'}</p>
                      </div>
                      <span className="px-2.5 py-1 rounded-lg text-[8px] font-black uppercase border bg-amber-500/10 text-amber-400 border-amber-500/20">Sin facturar</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          const cliente = clientes.find((c: any) => c.id === r.cliente_id)
                          if (cliente) { setPreloadData({ cliente, importe: '', viaje_id: r.viaje_id || '' }); setIsWizardOpen(true) }
                        }}
                        className="flex-1 py-2.5 rounded-xl bg-sky-500/10 border border-sky-500/30 text-sky-400 font-black uppercase text-[8px] tracking-widest transition-all"
                      >Emitir Factura</button>
                      <button
                        onClick={() => handleMarcarFacturado(r)}
                        className="flex-1 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 font-black uppercase text-[8px] tracking-widest transition-all"
                      >✓ Ya Facturado</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        {/* FACTURADOS EN ARCA (externos) */}
        {(() => {
          const viajesConFactura = new Set(facturas.map((f: any) => f.viaje_id).filter(Boolean))
          const viajesMap: Record<string, any> = {}
          for (const v of viajes) viajesMap[v.id] = v

          const todosFacturadosArca = remitos.filter((r: any) =>
            r.facturado && r.id && r.numero_remito && !viajesConFactura.has(r.viaje_id)
          )

          const facturadosArca = todosFacturadosArca.filter((r: any) => {
            const viaje = viajesMap[r.viaje_id]
            const cliente = clientes.find((c: any) => c.id === r.cliente_id)
            const matchSearch = arcaSearch === '' ||
              r.numero_remito.toLowerCase().includes(arcaSearch.toLowerCase()) ||
              (cliente?.razon_social || '').toLowerCase().includes(arcaSearch.toLowerCase())
            const matchCliente = arcaClienteFilter === 'todos' || r.cliente_id === arcaClienteFilter
            const fecha = viaje?.fecha || ''
            const matchFechaStart = arcaFechaStart === '' || fecha >= arcaFechaStart
            const matchFechaEnd = arcaFechaEnd === '' || fecha <= arcaFechaEnd
            return matchSearch && matchCliente && matchFechaStart && matchFechaEnd
          })

          return (
            <div className="space-y-4 font-sans italic">
              <button
                onClick={() => setShowFacturadosArca(v => !v)}
                className="w-full flex justify-between items-center px-2"
              >
                <div className="flex items-center gap-3">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <p className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.4em]">
                    Facturados en ARCA
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-[9px] font-black text-emerald-600 uppercase bg-emerald-500/10 px-3 py-1 rounded-lg border border-emerald-500/20">
                    {todosFacturadosArca.length} remitos
                  </span>
                  <ChevronDown size={16} className={'text-slate-500 transition-transform ' + (showFacturadosArca ? 'rotate-180' : '')} />
                </div>
              </button>

              {showFacturadosArca && (
                <div className="space-y-3">
                  {/* Filtros */}
                  <div className="flex flex-col sm:flex-row gap-2">
                    <div className="relative flex-1">
                      <svg className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                      <input
                        type="text"
                        placeholder="Buscar por remito o cliente..."
                        value={arcaSearch}
                        onChange={e => setArcaSearch(e.target.value)}
                        className="w-full bg-[#1a2537]/60 border border-white/10 rounded-2xl py-3 pl-10 pr-4 text-white text-xs font-bold uppercase tracking-widest outline-none focus:border-emerald-500/40 placeholder:text-slate-700 transition-all"
                      />
                    </div>
                    <select
                      value={arcaClienteFilter}
                      onChange={e => setArcaClienteFilter(e.target.value)}
                      className="bg-[#1a2537]/60 border border-white/10 rounded-2xl py-3 px-4 text-white text-[10px] font-black uppercase tracking-widest outline-none focus:border-emerald-500/40 appearance-none cursor-pointer border-r-8 border-transparent sm:w-56"
                    >
                      <option value="todos">Todos los clientes</option>
                      {clientes.map((c: any) => <option key={c.id} value={c.id} className="bg-[#1a2537]">{c.razon_social}</option>)}
                    </select>
                    <input
                      type="date"
                      value={arcaFechaStart}
                      onChange={e => setArcaFechaStart(e.target.value)}
                      className="bg-[#1a2537]/60 border border-white/10 rounded-2xl py-3 px-4 text-slate-400 text-xs font-bold outline-none focus:border-emerald-500/40 transition-all sm:w-40"
                      title="Desde"
                    />
                    <input
                      type="date"
                      value={arcaFechaEnd}
                      onChange={e => setArcaFechaEnd(e.target.value)}
                      className="bg-[#1a2537]/60 border border-white/10 rounded-2xl py-3 px-4 text-slate-400 text-xs font-bold outline-none focus:border-emerald-500/40 transition-all sm:w-40"
                      title="Hasta"
                    />
                    {(arcaSearch || arcaClienteFilter !== 'todos' || arcaFechaStart || arcaFechaEnd) && (
                      <button
                        onClick={() => { setArcaSearch(''); setArcaClienteFilter('todos'); setArcaFechaStart(''); setArcaFechaEnd('') }}
                        className="px-4 py-3 rounded-2xl bg-white/5 border border-white/10 text-slate-500 hover:text-white text-[9px] font-black uppercase tracking-widest transition-all"
                      >
                        Limpiar
                      </button>
                    )}
                  </div>

                  <div className="bg-[#1a2537]/40 rounded-[2.5rem] border border-emerald-500/15 overflow-hidden shadow-2xl">
                    {facturadosArca.length === 0 ? (
                      <div className="py-12 flex flex-col items-center gap-2 opacity-40">
                        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-slate-500"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Sin resultados</p>
                      </div>
                    ) : (
                      <>
                        <div className="hidden md:block overflow-x-auto">
                          <table className="w-full text-left min-w-[700px]">
                            <thead className="bg-emerald-500/5 text-[9px] font-black text-emerald-600/70 uppercase tracking-[0.3em] border-b border-emerald-500/10">
                              <tr>
                                <th className="p-5 pl-8">Remito</th>
                                <th className="p-5">Cliente</th>
                                <th className="p-5">Ruta</th>
                                <th className="p-5">Fecha</th>
                                <th className="p-5">Importe</th>
                                <th className="p-5 text-right pr-8">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-white/3">
                              {facturadosArca.map((r: any) => {
                                const viaje = viajesMap[r.viaje_id]
                                const cliente = clientes.find((c: any) => c.id === r.cliente_id)
                                return (
                                  <tr key={r.id} className="hover:bg-white/2 transition-all">
                                    <td className="p-5 pl-8">
                                      <p className="text-sm font-black text-white font-mono">{r.numero_remito}</p>
                                    </td>
                                    <td className="p-5">
                                      <p className="text-sm font-bold text-slate-300 uppercase">{cliente?.razon_social || '—'}</p>
                                    </td>
                                    <td className="p-5">
                                      {viaje ? (
                                        <p className="text-[10px] font-bold text-slate-400 uppercase">{viaje.origen} → {viaje.destino}</p>
                                      ) : <span className="text-slate-600 text-xs">—</span>}
                                    </td>
                                    <td className="p-5">
                                      <p className="text-[11px] font-bold text-slate-400">
                                        {viaje?.fecha ? new Date(viaje.fecha).toLocaleDateString('es-AR', { timeZone: 'UTC' }) : '—'}
                                      </p>
                                    </td>
                                    <td className="p-5">
                                      <p className="text-sm font-black text-white tabular-nums">
                                        {viaje?.tarifa_flete ? '$' + Number(viaje.tarifa_flete).toLocaleString('es-AR') : '—'}
                                      </p>
                                    </td>
                                    <td className="p-5 pr-8">
                                      <div className="flex gap-2 justify-end items-center">
                                        <span className="px-2.5 py-1 rounded-lg text-[8px] font-black uppercase border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">
                                          Facturado ARCA
                                        </span>
                                        <button
                                          onClick={() => handleDesmarcarFacturado(r)}
                                          title="Desmarcar (volver a pendiente)"
                                          className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/10 border border-white/10 hover:border-rose-500/30 text-slate-500 hover:text-rose-400 transition-all"
                                        >
                                          <RotateCcw size={12} />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                        {/* Mobile */}
                        <div className="md:hidden divide-y divide-white/5">
                          {facturadosArca.map((r: any) => {
                            const viaje = viajesMap[r.viaje_id]
                            const cliente = clientes.find((c: any) => c.id === r.cliente_id)
                            return (
                              <div key={r.id} className="p-5 space-y-2">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <p className="text-sm font-black text-white font-mono">{r.numero_remito}</p>
                                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-0.5">{cliente?.razon_social || '—'}</p>
                                  </div>
                                  <span className="px-2.5 py-1 rounded-lg text-[8px] font-black uppercase border bg-emerald-500/10 text-emerald-400 border-emerald-500/20">ARCA</span>
                                </div>
                                {viaje && (
                                  <p className="text-[9px] text-slate-500 font-bold uppercase">
                                    {viaje.origen} → {viaje.destino}
                                    {viaje.fecha ? ' · ' + new Date(viaje.fecha).toLocaleDateString('es-AR', { timeZone: 'UTC' }) : ''}
                                    {viaje.tarifa_flete ? ' · $' + Number(viaje.tarifa_flete).toLocaleString('es-AR') : ''}
                                  </p>
                                )}
                                <button
                                  onClick={() => handleDesmarcarFacturado(r)}
                                  className="w-full py-2 rounded-xl bg-white/5 border border-white/10 text-slate-500 font-black uppercase text-[8px] tracking-widest flex items-center justify-center gap-2"
                                >
                                  <RotateCcw size={11} /> Desmarcar
                                </button>
                              </div>
                            )
                          })}
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          )
        })()}

        <FacturasTabla facturas={facturasFiltradas} loading={loading} onDelete={handleDeleteFactura} />

        <FacturaWizard isOpen={isWizardOpen} onClose={handleCloseWizard} onSubmit={handleEmitir} isEmitting={isEmitting} clientes={clientes} viajes={viajes} remitos={remitos} puntoVenta={config?.arca_punto_venta || 1} condicionIvaEmisor={config?.arca_condicion_iva || 'RI'} preloadData={preloadData} />
        <ArcaConfigModal isOpen={isConfigModalOpen} onClose={() => setIsConfigModalOpen(false)} onSave={handleSaveConfig} initialConfig={config} />
        <FacturaManualModal isOpen={isManualModalOpen} onClose={() => setIsManualModalOpen(false)} onSave={handleSaveManual} isSaving={isEmitting} clientes={clientes} />
      </div>
    </main>
  )
}

export default function FacturacionPage() {
  return (
    <Suspense>
      <FacturacionInner />
    </Suspense>
  )
}