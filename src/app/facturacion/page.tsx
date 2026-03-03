'use client'
import { useState, useEffect, useMemo } from 'react'
import { getSupabase } from '@/lib/supabase'
import { toast } from 'sonner' // <-- IMPORTANTE: Agregamos Sonner
import { FacturasHeader } from '@/components/facturacion/FacturasHeader'
import { FacturasKpis } from '@/components/facturacion/FacturasKpis'
import { FacturasTabla } from '@/components/facturacion/FacturasTabla'
import { FacturaModal } from '@/components/facturacion/FacturaModal'
import { ArcaConfigModal } from '@/components/facturacion/ArcaConfigModal'

export default function FacturacionPage() {
  const supabase = getSupabase()

  const [facturas, setFacturas] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [viajes,   setViajes]   = useState<any[]>([])
  const [remitos,  setRemitos]  = useState<any[]>([])
  const [config,   setConfig]   = useState<any>(null)
  const [loading,  setLoading]  = useState(true)

  const [isFacturaModalOpen, setIsFacturaModalOpen] = useState(false)
  const [isConfigModalOpen,  setIsConfigModalOpen]  = useState(false)
  const [isEmitting,         setIsEmitting]         = useState(false)

  const [dateStart, setDateStart] = useState(() => {
    const d = new Date()
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0]
  })
  const [dateEnd, setDateEnd] = useState(() => new Date().toISOString().split('T')[0])

  useEffect(() => { fetchAll() }, [])

  async function fetchAll() {
    setLoading(true)
    try {
      const [facturasRes, clientesRes, viajesRes, remitosRes, configRes] = await Promise.all([
        supabase.from('facturas').select('*, clientes(razon_social)').order('fecha_comprobante', { ascending: false }),
        supabase.from('clientes').select('id, razon_social, cuit').order('razon_social'),
        supabase.from('viajes').select('id, fecha, clientes(razon_social), precio').eq('estado', 'completado').order('fecha', { ascending: false }),
        supabase.from('remitos').select('id, fecha, numero, clientes(razon_social), facturado').order('fecha', { ascending: false }),
        supabase.from('configuracion').select('arca_cuit, arca_razon_social, arca_punto_venta, arca_condicion_iva, arca_entorno').eq('id', 1).single(),
      ])
      setFacturas(facturasRes.data || [])
      setClientes(clientesRes.data || [])
      setViajes(viajesRes.data || [])
      setRemitos(remitosRes.data || [])
      setConfig(configRes.data)
    } catch (error) {
      toast.error('Error al cargar los datos de facturación')
    } finally {
      setLoading(false)
    }
  }

  const facturasFiltradas = useMemo(() => {
    return facturas.filter(f => f.fecha_comprobante >= dateStart && f.fecha_comprobante <= dateEnd)
  }, [facturas, dateStart, dateEnd])

  const kpis = useMemo(() => {
    const emitidas  = facturas.filter(f => f.estado === 'emitida')
    const errores   = facturas.filter(f => f.estado === 'error')
    const totalMes  = facturasFiltradas.filter(f => f.estado === 'emitida').reduce((a, f) => a + Number(f.importe_total), 0)
    const totalHist = emitidas.reduce((a, f) => a + Number(f.importe_total), 0)
    return { emitidas: emitidas.length, errores: errores.length, totalMes, totalHist }
  }, [facturas, facturasFiltradas])

  // 🚀 MEJORADO: Manejo de errores y notificaciones profesionales
  async function handleEmitir(data: any) {
    setIsEmitting(true)
    
    // Usamos toast.promise para mostrar el estado de carga visualmente
    toast.promise(
      async () => {
        const res = await fetch('/api/arca/facturar', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
        })
        
        const result = await res.json()
        
        if (!res.ok || result.error) {
          throw new Error(result.error || 'Error desconocido al comunicar con ARCA')
        }
        
        return result;
      },
      {
        loading: 'Conectando con ARCA/AFIP...',
        success: (result) => {
          setIsFacturaModalOpen(false);
          fetchAll(); // Recargamos la tabla
          return `Comprobante ${result.nroComprobante} emitido con éxito. CAE: ${result.cae}`;
        },
        error: (err) => `AFIP Rechazado: ${err.message}`,
        finally: () => setIsEmitting(false)
      }
    )
  }

  async function handleSaveConfig(configData: any) {
    try {
      const { error } = await supabase.from('configuracion').update(configData).eq('id', 1)
      if (error) throw error
      
      toast.success('Configuración de ARCA guardada exitosamente')
      setIsConfigModalOpen(false)
      fetchAll()
    } catch (e: any) {
      toast.error('Error al guardar configuración: ' + e.message)
    }
  }

  const arcaConfigurado = !!(config?.arca_cuit && config?.arca_razon_social)

  return (
    <main className="min-h-screen bg-[#020617] pt-20 lg:pt-24 pb-20 font-sans italic">
      <div className="max-w-[1600px] mx-auto px-4 md:px-8 space-y-8">

        <FacturasHeader
          arcaConfigurado={arcaConfigurado}
          entorno={config?.arca_entorno || 'homologacion'}
          dateStart={dateStart}
          setDateStart={setDateStart}
          dateEnd={dateEnd}
          setDateEnd={setDateEnd}
          onNuevaFactura={() => setIsFacturaModalOpen(true)}
          onOpenConfig={() => setIsConfigModalOpen(true)}
        />

        <FacturasKpis kpis={kpis} loading={loading} />

        <FacturasTabla facturas={facturasFiltradas} loading={loading} />

        <FacturaModal
          isOpen={isFacturaModalOpen}
          onClose={() => setIsFacturaModalOpen(false)}
          onSubmit={handleEmitir}
          isEmitting={isEmitting}
          clientes={clientes}
          viajes={viajes}
          remitos={remitos}
          puntoVenta={config?.arca_punto_venta || 1}
        />

        <ArcaConfigModal
          isOpen={isConfigModalOpen}
          onClose={() => setIsConfigModalOpen(false)}
          onSave={handleSaveConfig}
          initialConfig={config}
        />
      </div>
    </main>
  )
}