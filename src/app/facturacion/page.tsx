'use client'
import { useState, useEffect, useMemo, Suspense, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import * as supabaseLib from '@/lib/supabase'
import { toast } from 'sonner'
import { FacturasHeader } from '@/components/facturacion/FacturasHeader'
import { FacturasKpis } from '@/components/facturacion/FacturasKpis'
import { FacturasTabla } from '@/components/facturacion/FacturasTabla'
import { FacturaWizard } from '@/components/facturacion/Facturawizard'
import { ArcaConfigModal } from '@/components/facturacion/ArcaConfigModal'

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
  const wizardAutoOpenedRef = useRef(false)

  const [dateStart, setDateStart] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
  })
  const [dateEnd, setDateEnd] = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => { fetchAll() }, [])

  // Auto-abrir wizard cuando viene de remitos con params en la URL (solo una vez)
  useEffect(() => {
    if (!loading && clientes.length > 0 && !wizardAutoOpenedRef.current) {
      const cid = searchParams.get('cliente_id')
      const imp = searchParams.get('importe')
      const vid = searchParams.get('viaje_id')
      if (cid) {
        const cliente = clientes.find((c: any) => c.id === cid)
        if (cliente) {
          wizardAutoOpenedRef.current = true
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
      const [facturasRes, clientesRes, viajesRes, remitosRes, configRes] = await Promise.all([
        supabase.from('facturas').select('*, clientes(razon_social)').order('fecha_comprobante', { ascending: false }),
        supabase.from('clientes').select('id, razon_social, cuit, condicion_iva').order('razon_social'),
        supabase.from('viajes').select('id, fecha, cliente_id, clientes(razon_social), tarifa_flete').order('fecha', { ascending: false }),
        supabase.from('remitos').select('id, fecha, numero, cliente_id, clientes(razon_social), facturado').order('fecha', { ascending: false }),
        supabase.from('configuracion').select('arca_cuit, arca_razon_social, arca_punto_venta, arca_condicion_iva, arca_entorno, arca_certificado, arca_clave_privada').eq('id', 1).single(),
      ])
      setFacturas(facturasRes.data || [])
      setClientes(clientesRes.data || [])
      setViajes(viajesRes.data || [])
      setRemitos(remitosRes.data || [])
      setConfig(configRes.data)
    } catch (error) {
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

  function handleCloseWizard() {
    setIsWizardOpen(false)
    setPreloadData(null)
    // Limpiar URL params si habia
    if (searchParams.get('cliente_id')) {
      window.history.replaceState({}, '', '/facturacion')
    }
  }

  const arcaConfigurado = !!(config?.arca_cuit && config?.arca_razon_social)

  return (
    <main className="min-h-screen bg-[#020617] pt-20 lg:pt-24 pb-20 font-sans italic">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 space-y-8">
        <FacturasHeader arcaConfigurado={arcaConfigurado} entorno={config?.arca_entorno || 'homologacion'} dateStart={dateStart} setDateStart={setDateStart} dateEnd={dateEnd} setDateEnd={setDateEnd} onNuevaFactura={() => { setPreloadData(null); setIsWizardOpen(true) }} onOpenConfig={() => setIsConfigModalOpen(true)} />
        <FacturasKpis kpis={kpis} loading={loading} />
        <FacturasTabla facturas={facturasFiltradas} loading={loading} />
        <FacturaWizard isOpen={isWizardOpen} onClose={handleCloseWizard} onSubmit={handleEmitir} isEmitting={isEmitting} clientes={clientes} viajes={viajes} remitos={remitos} puntoVenta={config?.arca_punto_venta || 1} condicionIvaEmisor={config?.arca_condicion_iva || 'RI'} preloadData={preloadData} />
        <ArcaConfigModal isOpen={isConfigModalOpen} onClose={() => setIsConfigModalOpen(false)} onSave={handleSaveConfig} initialConfig={config} />
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