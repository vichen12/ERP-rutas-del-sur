'use client'
import { useState, useEffect, useMemo } from 'react'
import { getSupabase } from '@/lib/supabase'
import { CajaHeader } from '@/components/caja/CajaHeader'
import { CajaResumenGeneral } from '@/components/caja/CajaResumenGeneral'
import { CajaMovimientosTable } from '@/components/caja/CajaMovimientosTable'
import { CajaModal } from '@/components/caja/CajaModal'
import { CajaDolarPanel } from '@/components/caja/CajaDolarPanel'

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
    if (!confirm('¿Eliminar este movimiento?')) return
    await supabase.from('movimientos_caja').delete().eq('id', id)
    fetchAll()
  }

  async function handleSaveTipoCambio(valor: number) {
    setTipoCambioDolar(valor)
    await supabase.from('configuracion').update({ tipo_cambio_dolar: valor }).eq('id', 1)
  }

  return (
    <main className="min-h-screen bg-[#020617] pt-20 lg:pt-24 pb-20">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 space-y-8">

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

        {/* PANEL DÓLAR */}
        <CajaDolarPanel
          tipoCambio={tipoCambioDolar}
          onSaveTipoCambio={handleSaveTipoCambio}
          totalCorriente={resumen.totalCorriente}
          totalGeneral={resumen.total}
          totalEnDolar={resumen.totalEnDolar}
          totalEnDolarTotal={resumen.totalEnDolarTotal}
        />

        {/* RESUMEN GENERAL (los 5 bloques del Excel) */}
        <CajaResumenGeneral resumen={resumen} loading={loading} />

        {/* TABLA DE MOVIMIENTOS */}
        <CajaMovimientosTable
          movimientos={movimientosFiltrados}
          loading={loading}
          onEdit={(m) => { setEditingMovimiento(m); setIsModalOpen(true) }}
          onDelete={handleDeleteMovimiento}
        />

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
