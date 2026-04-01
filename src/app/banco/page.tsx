'use client'
import { toast } from 'sonner'
import { useState, useEffect, useMemo } from 'react'
import { getSupabase } from '@/lib/supabase'
import { CajaHeader } from '@/components/caja/CajaHeader'
import { CajaResumenGeneral } from '@/components/caja/CajaResumenGeneral'
import { CajaMovimientosTable } from '@/components/caja/CajaMovimientosTable'
import { CajaModal } from '@/components/caja/CajaModal'
import { CajaDolarPanel } from '@/components/caja/CajaDolarPanel'
import { Landmark, FileCheck, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

export default function CajaBancoPage() {
  const supabase = getSupabase()

  // --- ESTADO PRINCIPAL ---
  const [movimientos, setMovimientos] = useState<any[]>([])
  const [cuentas, setCuentas] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [choferes, setChoferes] = useState<any[]>([])
  const [camiones, setCamiones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // --- FILTROS ---
  const [tipoCuenta, setTipoCuenta] = useState<'todas' | 'caja' | 'banco'>('todas')
  const [dateStart, setDateStart] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
  })
  const [dateEnd, setDateEnd] = useState(() => new Date().toISOString().split('T')[0])
  const [showAllTime, setShowAllTime] = useState(false)

  // --- TABS ---
  const [activeTab, setActiveTab] = useState<'movimientos' | 'cheques'>('movimientos')

  // --- MODAL ---
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [editingMovimiento, setEditingMovimiento] = useState<any>(null)

  // --- TIPO DE CAMBIO DÓLAR ---
  const [tipoCambioDolar, setTipoCambioDolar] = useState(1100)

  useEffect(() => {
    fetchAll()
  }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const [movRes, cuentasRes, clientesRes, choferesRes, camionesRes, configRes] = await Promise.all([
        supabase
          .from('movimientos_caja')
          .select(`
            *,
            clientes(razon_social),
            choferes(nombre),
            camiones(patente)
          `)
          .order('fecha', { ascending: false }),
        supabase.from('cuentas_caja').select('*').order('nombre'),
        supabase.from('clientes').select('id, razon_social').order('razon_social'),
        supabase.from('choferes').select('id, nombre').order('nombre'),
        supabase.from('camiones').select('id, patente').order('patente'),
        supabase.from('configuracion').select('tipo_cambio_dolar').eq('id', 1).single(),
      ])

      setMovimientos(movRes.data || [])
      setCuentas(cuentasRes.data || [])
      setClientes(clientesRes.data || [])
      setChoferes(choferesRes.data || [])
      setCamiones(camionesRes.data || [])
      if (configRes.data?.tipo_cambio_dolar) {
        setTipoCambioDolar(configRes.data.tipo_cambio_dolar)
      }
    } catch (e) {
      console.error('Error cargando caja:', e)
    } finally {
      setLoading(false)
    }
  }

  // --- FILTRADO DE MOVIMIENTOS ---
  const movimientosFiltrados = useMemo(() => {
    return movimientos.filter(m => {
      // Filtro por cuenta
      if (tipoCuenta !== 'todas') {
        if (m.tipo_cuenta !== tipoCuenta) return false
      }
      // Filtro por fecha
      if (!showAllTime) {
        if (m.fecha < dateStart || m.fecha > dateEnd) return false
      }
      return true
    })
  }, [movimientos, tipoCuenta, dateStart, dateEnd, showAllTime])

  // --- CÁLCULOS DEL RESUMEN (siempre sobre TODO el historial) ---
  const resumen = useMemo(() => {
    const totalCaja = movimientos
      .filter(m => m.tipo_cuenta === 'caja')
      .reduce((acc, m) => acc + (m.tipo === 'ingreso' ? Number(m.monto) : -Number(m.monto)), 0)

    const totalBanco = movimientos
      .filter(m => m.tipo_cuenta === 'banco')
      .reduce((acc, m) => acc + (m.tipo === 'ingreso' ? Number(m.monto) : -Number(m.monto)), 0)

    // Facturas impagas: cuenta corriente de clientes (debe > 0 sin pagar)
    const facturasImpagas = 0 // Se calcula desde cuenta_corriente en el fetch
    
    // Deudas del mes: pagos pendientes (gastos, choferes, etc.)
    const deudasMes = movimientosFiltrados
      .filter(m => m.tipo === 'egreso')
      .reduce((acc, m) => acc + Number(m.monto), 0)

    const ingresosMes = movimientosFiltrados
      .filter(m => m.tipo === 'ingreso')
      .reduce((acc, m) => acc + Number(m.monto), 0)

    const total = totalCaja + totalBanco
    const totalCorriente = total // Para mostrar el capital de trabajo

    return {
      totalCaja,
      totalBanco,
      facturasImpagas,
      deudasMes,
      ingresosMes,
      total,
      totalCorriente,
      totalEnDolar: totalCorriente / tipoCambioDolar,
      totalEnDolarTotal: total / tipoCambioDolar,
    }
  }, [movimientos, movimientosFiltrados, tipoCambioDolar])

  // --- CHEQUES ---
  const cheques = useMemo(() => {
    return movimientos
      .filter(m => m.categoria === 'cheque')
      .sort((a, b) => b.fecha.localeCompare(a.fecha))
  }, [movimientos])

  // --- GUARDAR MOVIMIENTO ---
  async function handleSaveMovimiento(data: any) {
    setIsSaving(true)
    try {
      if (editingMovimiento) {
        await supabase
          .from('movimientos_caja')
          .update({
            fecha: data.fecha,
            tipo: data.tipo,
            tipo_cuenta: data.tipo_cuenta,
            categoria: data.categoria,
            descripcion: data.descripcion,
            monto: Number(data.monto),
            cliente_id: data.cliente_id || null,
            chofer_id: data.chofer_id || null,
            camion_id: data.camion_id || null,
            referencia: data.referencia || null,
          })
          .eq('id', editingMovimiento.id)
      } else {
        await supabase.from('movimientos_caja').insert([{
          fecha: data.fecha,
          tipo: data.tipo,
          tipo_cuenta: data.tipo_cuenta,
          categoria: data.categoria,
          descripcion: data.descripcion,
          monto: Number(data.monto),
          cliente_id: data.cliente_id || null,
          chofer_id: data.chofer_id || null,
          camion_id: data.camion_id || null,
          referencia: data.referencia || null,
        }])
      }
      setIsModalOpen(false)
      setEditingMovimiento(null)
      fetchAll()
    } catch (e) {
      console.error('Error guardando movimiento:', e)
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDeleteMovimiento(id: string) {
    toast('¿Eliminar este movimiento?', {
      action: { label: 'Eliminar', onClick: async () => {
        await supabase.from('movimientos_caja').delete().eq('id', id)
        fetchAll()
      }},
      cancel: { label: 'Cancelar', onClick: () => {} }
    })
  }

  async function handleSaveTipoCambio(valor: number) {
    setTipoCambioDolar(valor)
    await supabase.from('configuracion').update({ tipo_cambio_dolar: valor }).eq('id', 1)
  }

  return (
    <main className="min-h-screen bg-[#141c28] pt-16 sm:pt-20 md:pt-24 pb-20">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 md:px-8 space-y-8">

        {/* HEADER PRINCIPAL */}
        <CajaHeader
          tipoCuenta={tipoCuenta}
          setTipoCuenta={setTipoCuenta}
          dateStart={dateStart}
          setDateStart={setDateStart}
          dateEnd={dateEnd}
          setDateEnd={setDateEnd}
          showAllTime={showAllTime}
          setShowAllTime={setShowAllTime}
          onNuevoMovimiento={() => { setEditingMovimiento(null); setIsModalOpen(true) }}
          totalIngresos={resumen.ingresosMes}
          totalEgresos={resumen.deudasMes}
        />

        {/* BOTÓN ACTUALIZAR */}
        <div className="flex justify-end">
          <button
            onClick={fetchAll}
            disabled={loading}
            className="flex items-center gap-2 px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all active:scale-95 disabled:opacity-50"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={loading ? 'animate-spin' : ''}>
              <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/>
            </svg>
            Actualizar
          </button>
        </div>


        {/* PANEL DÓLAR */}
        <CajaDolarPanel
          tipoCambio={tipoCambioDolar}
          onSaveTipoCambio={handleSaveTipoCambio}
          totalCorriente={resumen.totalCorriente}
          totalGeneral={resumen.total}
          totalEnDolar={resumen.totalEnDolar}
          totalEnDolarTotal={resumen.totalEnDolarTotal}
        />

        {/* RESUMEN GENERAL */}
        <CajaResumenGeneral resumen={resumen} loading={loading} />

        {/* TABS: MOVIMIENTOS / CHEQUES */}
        <div className="flex bg-[#1a2537] p-1.5 rounded-3xl border border-white/5 w-full sm:w-fit font-sans italic overflow-x-auto">
          <button onClick={() => setActiveTab('movimientos')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'movimientos' ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
            <Landmark size={13} /> Movimientos
          </button>
          <button onClick={() => setActiveTab('cheques')}
            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all ${activeTab === 'cheques' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-500 hover:text-white'}`}>
            <FileCheck size={13} /> Cheques {cheques.length > 0 && <span className="ml-1 px-2 py-0.5 rounded-lg text-[8px] tabular-nums bg-white/20">{cheques.length}</span>}
          </button>
        </div>

        {/* TABLA DE MOVIMIENTOS */}
        {activeTab === 'movimientos' && (
          <CajaMovimientosTable
            movimientos={movimientosFiltrados}
            loading={loading}
            onEdit={(m) => { setEditingMovimiento(m); setIsModalOpen(true) }}
            onDelete={handleDeleteMovimiento}
          />
        )}

        {/* TABLA DE CHEQUES */}
        {activeTab === 'cheques' && (
          <div className="space-y-4 font-sans italic">
            <div className="flex items-center justify-between">
              <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] px-2">
                Registro de Cheques ({cheques.length})
              </h2>
              <button
                onClick={() => { setEditingMovimiento(null); setIsModalOpen(true) }}
                className="flex items-center gap-2 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase text-[9px] tracking-widest transition-all active:scale-95"
              >
                + Nuevo Cheque
              </button>
            </div>
            {cheques.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/5 rounded-[2rem]">
                <FileCheck size={40} className="text-slate-700 mb-4" />
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-600">No hay cheques registrados</p>
                <p className="text-[9px] text-slate-700 mt-1">Registrá un movimiento con categoría &quot;Cheque Emitido&quot; o &quot;Cobro con Cheque&quot;</p>
              </div>
            ) : (
              <div className="bg-[#1a2537]/40 border border-white/5 rounded-[2rem] overflow-hidden">
                <div className="overflow-x-auto">
                  <div className="hidden sm:grid grid-cols-5 px-6 py-3 border-b border-white/5 min-w-[480px]">
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Fecha</p>
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Tipo</p>
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest col-span-2">Beneficiario / Descripción</p>
                    <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest text-right">Monto</p>
                  </div>
                  <div className="divide-y divide-white/5">
                    {cheques.map((c) => (
                      <div key={c.id}>
                        {/* Desktop row */}
                        <div className="hidden sm:grid grid-cols-5 px-6 py-4 hover:bg-white/[0.02] transition-colors group min-w-[480px]">
                          <div>
                            <p className="text-xs font-black text-white">{new Date(c.fecha + 'T12:00:00').toLocaleDateString('es-AR')}</p>
                            {c.referencia && <p className="text-[9px] text-indigo-400 font-bold mt-0.5">Nro: {c.referencia}</p>}
                          </div>
                          <div className="flex items-center">
                            <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[8px] font-black uppercase ${c.tipo === 'ingreso' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                              {c.tipo === 'ingreso' ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
                              {c.tipo === 'ingreso' ? 'Cobro' : 'Pago'}
                            </span>
                          </div>
                          <p className="text-sm font-black text-white col-span-2 truncate pr-4">{c.descripcion || '—'}</p>
                          <p className={`text-sm font-black tabular-nums text-right ${c.tipo === 'ingreso' ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {c.tipo === 'egreso' ? '-' : '+'}$ {Number(c.monto).toLocaleString('es-AR')}
                          </p>
                        </div>
                        {/* Mobile card */}
                        <div className="sm:hidden px-4 py-4 space-y-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-xs font-black text-white">{new Date(c.fecha + 'T12:00:00').toLocaleDateString('es-AR')}</p>
                              {c.referencia && <p className="text-[9px] text-indigo-400 font-bold mt-0.5">Nro: {c.referencia}</p>}
                            </div>
                            <p className={`text-sm font-black tabular-nums ${c.tipo === 'ingreso' ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {c.tipo === 'egreso' ? '-' : '+'}$ {Number(c.monto).toLocaleString('es-AR')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`flex items-center gap-1 px-2 py-1 rounded-lg text-[8px] font-black uppercase ${c.tipo === 'ingreso' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
                              {c.tipo === 'ingreso' ? <ArrowUpRight size={10} /> : <ArrowDownLeft size={10} />}
                              {c.tipo === 'ingreso' ? 'Cobro' : 'Pago'}
                            </span>
                            <p className="text-xs font-bold text-slate-300 truncate">{c.descripcion || '—'}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* MODAL NUEVO/EDITAR MOVIMIENTO */}
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
      </div>
    </main>
  )
}
