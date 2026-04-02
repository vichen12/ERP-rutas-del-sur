'use client'
import { useState, useEffect, useMemo } from 'react'
import { X, ChevronRight, ChevronLeft, DollarSign, Loader2, CheckCircle2, User, FileText, Search, Zap } from 'lucide-react'

// Auto-detectar tipo de factura
function detectarTipoFactura(ivaEmisor: string, ivaReceptor: string): { tipo: number; letra: string } {
  if (ivaEmisor === 'MONO') return { tipo: 11, letra: 'C' }
  if (ivaReceptor === 'RI') return { tipo: 1, letra: 'A' }
  return { tipo: 6, letra: 'B' }
}

const LETRA_COLORS: Record<string, string> = {
  A: 'bg-sky-500 text-white',
  B: 'bg-violet-500 text-white',
  C: 'bg-amber-500 text-white',
}

const IVA_LABELS: Record<string, string> = {
  RI: 'Resp. Inscripto',
  CF: 'Consumidor Final',
  MONO: 'Monotributista',
  EX: 'Exento',
}

export function FacturaWizard({ isOpen, onClose, onSubmit, isEmitting, clientes, viajes, remitos, puntoVenta, condicionIvaEmisor, preloadData }: any) {
  const [step, setStep] = useState(1)
  const [search, setSearch] = useState('')
  const [selectedCliente, setSelectedCliente] = useState<any>(null)
  const [selectedViaje, setSelectedViaje] = useState<any>(null)
  const [selectedRemito, setSelectedRemito] = useState<any>(null)
  const [importeNeto, setImporteNeto] = useState('')
  const [alicuotaIva, setAlicuotaIva] = useState(21)
  const [descripcion, setDescripcion] = useState('SERVICIO DE TRANSPORTE')
  const [fechaComprobante, setFechaComprobante] = useState(new Date().toISOString().split('T')[0])

  useEffect(() => {
    if (isOpen) {
      setSearch('')
      setSelectedViaje(null)
      setSelectedRemito(null)
      setAlicuotaIva(21)
      setDescripcion('SERVICIO DE TRANSPORTE')
      setFechaComprobante(new Date().toISOString().split('T')[0])
      if (preloadData && preloadData.cliente) {
        setSelectedCliente(preloadData.cliente)
        setImporteNeto(preloadData.importe || '')
        setStep(2)
      } else {
        setSelectedCliente(null)
        setImporteNeto('')
        setStep(1)
      }
    }
  }, [isOpen, preloadData])

  // Filtrar clientes por búsqueda
  const clientesFiltrados = useMemo(() => {
    if (!search) return clientes || []
    return (clientes || []).filter((c: any) =>
      c.razon_social.toLowerCase().includes(search.toLowerCase()) ||
      (c.cuit || '').includes(search)
    )
  }, [clientes, search])

  // Viajes y remitos del cliente seleccionado (sin facturar)
  const viajesCliente = useMemo(() => {
    if (!selectedCliente) return []
    return (viajes || []).filter((v: any) => v.cliente_id === selectedCliente.id)
  }, [viajes, selectedCliente])

  const remitosCliente = useMemo(() => {
    if (!selectedCliente) return []
    return (remitos || []).filter((r: any) => r.cliente_id === selectedCliente.id && !r.facturado)
  }, [remitos, selectedCliente])

  // Auto-detect tipo factura
  const tipoFactura = useMemo(() => {
    if (!selectedCliente) return { tipo: 6, letra: 'B' }
    return detectarTipoFactura(condicionIvaEmisor || 'RI', selectedCliente.condicion_iva || 'CF')
  }, [selectedCliente, condicionIvaEmisor])

  // Calculos
  const importeIva = useMemo(() => (Number(importeNeto) * alicuotaIva) / 100, [importeNeto, alicuotaIva])
  const importeTotal = useMemo(() => Number(importeNeto) + importeIva, [importeNeto, importeIva])

  function handleSelectCliente(cliente: any) {
    setSelectedCliente(cliente)
    setSelectedViaje(null)
    setSelectedRemito(null)
    setImporteNeto('')
  }

  function handleSelectViaje(viaje: any) {
    setSelectedViaje(viaje)
    if (viaje?.tarifa_flete) {
      setImporteNeto((Number(viaje.tarifa_flete) / 1.21).toFixed(2))
    }
  }

  function handleConsumidorFinal() {
    setSelectedCliente({ id: null, razon_social: 'CONSUMIDOR FINAL', cuit: '00000000000', condicion_iva: 'CF' })
  }

  function handleEmitir() {
    onSubmit({
      tipo_comprobante: tipoFactura.tipo,
      fecha_comprobante: fechaComprobante,
      cliente_id: selectedCliente?.id || null,
      cuit_receptor: selectedCliente?.cuit || '00000000000',
      condicion_iva_receptor: selectedCliente?.condicion_iva || 'CF',
      importe_neto: Number(importeNeto),
      alicuota_iva: alicuotaIva,
      importe_iva: importeIva,
      importe_total: importeTotal,
      concepto: 2,
      descripcion,
      viaje_id: selectedViaje?.id || (preloadData?.viaje_id) || '',
      remito_id: selectedRemito?.id || '',
      punto_venta: puntoVenta,
    })
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center bg-[#141c28]/90 backdrop-blur-md p-4 font-sans italic" onClick={onClose}>
      <div className="bg-[#141c28] w-full max-w-lg rounded-[2.5rem] border border-white/10 shadow-2xl relative animate-in fade-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>

        <div className="absolute top-0 left-0 w-full h-1 rounded-t-[2.5rem] bg-sky-500" />

        {/* HEADER */}
        <div className="p-7 pb-0">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[9px] font-black uppercase tracking-[0.4em] text-sky-400 mb-1">
                Paso {step} de 2
              </p>
              <h2 className="text-xl font-black text-white uppercase tracking-tight">
                {step === 1 ? 'Elegir Cliente' : 'Confirmar y Emitir'}
              </h2>
            </div>
            <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-slate-500 hover:text-white hover:rotate-90 transition-all">
              <X size={18} />
            </button>
          </div>

          {/* Progress */}
          <div className="flex gap-2 mt-4">
            <div className={`flex-1 h-1 rounded-full transition-all ${step >= 1 ? 'bg-sky-500' : 'bg-white/5'}`} />
            <div className={`flex-1 h-1 rounded-full transition-all ${step >= 2 ? 'bg-sky-500' : 'bg-white/5'}`} />
          </div>
        </div>

        <div className="p-7">

          {/* ═══════════════════════════════
              PASO 1: ELEGIR CLIENTE
          ═══════════════════════════════ */}
          {step === 1 && (
            <div className="space-y-4">

              {/* Búsqueda */}
              <div className="relative">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" />
                <input
                  autoFocus
                  placeholder="Buscar por nombre o CUIT..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full bg-[#1a2537] border border-white/5 rounded-xl py-3.5 pl-11 pr-4 text-white font-bold text-sm uppercase outline-none focus:border-sky-500 placeholder:text-slate-700"
                />
              </div>

              {/* Consumidor Final */}
              <button onClick={() => { handleConsumidorFinal(); setStep(2) }}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                  selectedCliente?.id === null
                    ? 'bg-sky-500/10 border-sky-500/30'
                    : 'bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10'
                }`}>
                <div className="w-10 h-10 rounded-xl bg-[#243248] flex items-center justify-center text-slate-500">
                  <User size={18} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-black text-white uppercase">Consumidor Final</p>
                  <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">Sin datos fiscales</p>
                </div>
                <span className="px-2.5 py-1 rounded-lg text-[9px] font-black bg-violet-500/15 text-violet-400">B</span>
              </button>

              {/* Lista de clientes */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                {clientesFiltrados.map((c: any) => {
                  const tf = detectarTipoFactura(condicionIvaEmisor || 'RI', c.condicion_iva || 'CF')
                  return (
                    <button key={c.id} onClick={() => { handleSelectCliente(c); setStep(2) }}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border bg-white/[0.02] border-white/5 hover:bg-white/[0.04] hover:border-white/10 transition-all text-left group">
                      <div className="w-10 h-10 rounded-xl bg-[#243248] flex items-center justify-center text-slate-400 group-hover:text-white transition-colors">
                        <User size={18} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-black text-white uppercase truncate">{c.razon_social}</p>
                        <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">
                          CUIT: {c.cuit || 'Sin CUIT'} · {IVA_LABELS[c.condicion_iva] || 'Cons. Final'}
                        </p>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black ${LETRA_COLORS[tf.letra]}`}>
                        {tf.letra}
                      </span>
                    </button>
                  )
                })}
                {clientesFiltrados.length === 0 && (
                  <p className="text-center py-8 text-[9px] font-bold text-slate-600 uppercase">No se encontraron clientes</p>
                )}
              </div>

              <p className="text-[8px] font-bold text-slate-700 uppercase tracking-widest text-center">
                La letra de la factura se detecta sola segun la condicion de IVA del cliente
              </p>
            </div>
          )}

          {/* ═══════════════════════════════
              PASO 2: MONTO Y CONFIRMAR
          ═══════════════════════════════ */}
          {step === 2 && selectedCliente && (
            <div className="space-y-5">

              {/* Resumen cliente + tipo factura */}
              <div className="flex items-center gap-4 p-4 bg-[#1a2537]/60 rounded-xl border border-white/5">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl font-black ${LETRA_COLORS[tipoFactura.letra]}`}>
                  {tipoFactura.letra}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-black text-white uppercase truncate">{selectedCliente.razon_social}</p>
                  <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">
                    Factura {tipoFactura.letra} · CUIT: {selectedCliente.cuit || '—'} · {IVA_LABELS[selectedCliente.condicion_iva] || 'CF'}
                  </p>
                </div>
                <button onClick={() => setStep(1)} className="p-2 bg-white/5 rounded-lg text-slate-500 hover:text-white transition-all" title="Cambiar cliente">
                  <ChevronLeft size={16} />
                </button>
              </div>

              {/* Vincular viaje (si hay) */}
              {viajesCliente.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest flex items-center gap-1.5">
                    <Zap size={10} className="text-sky-400" /> Vincular a viaje <span className="text-slate-700">(autocompleta el monto)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => { setSelectedViaje(null); setImporteNeto('') }}
                      className={`px-3 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${
                        !selectedViaje ? 'bg-sky-600 border-sky-500 text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'
                      }`}>
                      Manual
                    </button>
                    {viajesCliente.slice(0, 5).map((v: any) => (
                      <button key={v.id} onClick={() => handleSelectViaje(v)}
                        className={`px-3 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${
                          selectedViaje?.id === v.id ? 'bg-sky-600 border-sky-500 text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'
                        }`}>
                        {new Date(v.fecha).toLocaleDateString('es-AR')} · ${Number(v.tarifa_flete || 0).toLocaleString('es-AR')}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Vincular remito */}
              {remitosCliente.length > 0 && (
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest flex items-center gap-1.5">
                    <FileText size={10} className="text-amber-400" /> Vincular remito <span className="text-slate-700">(opcional)</span>
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => setSelectedRemito(null)}
                      className={`px-3 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${
                        !selectedRemito ? 'bg-amber-600 border-amber-500 text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'
                      }`}>
                      Ninguno
                    </button>
                    {remitosCliente.slice(0, 5).map((r: any) => (
                      <button key={r.id} onClick={() => setSelectedRemito(r)}
                        className={`px-3 py-2 rounded-lg text-[8px] font-black uppercase tracking-widest border transition-all ${
                          selectedRemito?.id === r.id ? 'bg-amber-600 border-amber-500 text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'
                        }`}>
                        {r.numero_remito || r.id.substring(0, 8)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Monto */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">Importe Neto (sin IVA)</label>
                <div className="relative">
                  <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-500" size={18} />
                  <input
                    required
                    autoFocus={!viajesCliente.length}
                    type="number"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    value={importeNeto}
                    onChange={e => setImporteNeto(e.target.value)}
                    className="w-full bg-[#1a2537] border border-white/5 rounded-xl py-4 pl-13 pr-4 text-white font-black text-2xl tabular-nums outline-none focus:border-sky-500 placeholder:text-slate-700"
                    style={{ paddingLeft: '3.25rem' }}
                  />
                </div>
              </div>

              {/* IVA selector simplificado */}
              <div className="space-y-1.5">
                <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">IVA</label>
                <div className="flex gap-2">
                  {[{ v: 0, l: '0%' }, { v: 10.5, l: '10.5%' }, { v: 21, l: '21%' }, { v: 27, l: '27%' }].map(a => (
                    <button key={a.v} type="button" onClick={() => setAlicuotaIva(a.v)}
                      className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase border transition-all ${
                        alicuotaIva === a.v ? 'bg-sky-600 border-sky-500 text-white' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'
                      }`}>
                      {a.l}
                    </button>
                  ))}
                </div>
              </div>

              {/* Preview totales */}
              {Number(importeNeto) > 0 && (
                <div className="grid grid-cols-3 gap-3 p-4 bg-[#141c28]/60 rounded-xl border border-white/5">
                  <div className="text-center">
                    <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Neto</p>
                    <p className="text-base font-black text-slate-300 tabular-nums">${Number(importeNeto).toLocaleString('es-AR', { maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[7px] font-black text-slate-600 uppercase tracking-widest">IVA {alicuotaIva}%</p>
                    <p className="text-base font-black text-amber-400 tabular-nums">${importeIva.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-[7px] font-black text-emerald-500 uppercase tracking-widest">Total</p>
                    <p className="text-xl font-black text-white tabular-nums">${importeTotal.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</p>
                  </div>
                </div>
              )}

              {/* Descripción y fecha (colapsados, con defaults) */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">Descripcion</label>
                  <input value={descripcion} onChange={e => setDescripcion(e.target.value.toUpperCase())}
                    className="w-full bg-[#1a2537] border border-white/5 rounded-xl py-3 px-4 text-white font-bold text-xs uppercase outline-none focus:border-sky-500" />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[9px] font-black text-slate-500 uppercase ml-1 tracking-widest">Fecha</label>
                  <input type="date" value={fechaComprobante} onChange={e => setFechaComprobante(e.target.value)}
                    className="w-full bg-[#1a2537] border border-white/5 rounded-xl py-3 px-4 text-white font-bold text-xs outline-none [color-scheme:dark]" />
                </div>
              </div>

              {/* Botones */}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setStep(1)}
                  className="px-6 py-4 rounded-xl bg-white/5 border border-white/5 text-slate-400 hover:text-white font-black uppercase text-[9px] tracking-widest transition-all flex items-center gap-2">
                  <ChevronLeft size={14} /> Volver
                </button>
                <button onClick={handleEmitir} disabled={isEmitting || !importeNeto || Number(importeNeto) <= 0}
                  className="flex-1 py-4 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-black uppercase text-[10px] tracking-[0.2em] transition-all active:scale-[0.98] flex items-center justify-center gap-3 shadow-xl">
                  {isEmitting
                    ? <><Loader2 className="animate-spin" size={18} /> Enviando a AFIP...</>
                    : <><CheckCircle2 size={18} /> Emitir Factura {tipoFactura.letra}</>
                  }
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}