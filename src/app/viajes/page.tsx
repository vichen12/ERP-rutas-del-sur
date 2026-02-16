'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect, useMemo } from 'react'
import { getSupabase } from '@/lib/supabase'
import { Loader2 } from 'lucide-react'

import { ViajesHeader } from '@/components/ViajesHeader'
import { ViajesTable } from '@/components/ViajesTable'
import { ViajeModal } from '@/components/ViajeModal'

export default function ViajesPage() {
  const [loading, setLoading] = useState(true)
  // Definimos 3 estados: global (ver todo), ida y retorno
  const [activeTab, setActiveTab] = useState<'ida' | 'retorno' | 'global'>('global')
  
  const [selectedMonth, setSelectedMonth] = useState<number>(new Date().getMonth()) 
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear())
  const [showAllTime, setShowAllTime] = useState(false)
  
  const [viajes, setViajes] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [choferes, setChoferes] = useState<any[]>([])
  const [camiones, setCamiones] = useState<any[]>([])
  const [precioGasoil, setPrecioGasoil] = useState(0)

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [search, setSearch] = useState('')

  const supabase = getSupabase()

  const [formData, setFormData] = useState({
    cliente_id: '', chofer_id: '', camion_id: '',
    origen: '', destino: '', fecha: new Date().toISOString().split('T')[0],
    km_salida: '', km_retorno: '', es_retorno: false, engrase: false,
    facturacion: '', costos_operativos: '', pago_chofer: '', lts_combustible: '',
    precio_gasoil: '' 
  })

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [vi, cl, ch, ca, conf] = await Promise.all([
        supabase.from('viajes').select('*, clientes(razon_social), choferes(nombre), camiones(patente, km_actual)').order('fecha', { ascending: false }),
        supabase.from('clientes').select('id, razon_social').order('razon_social', { ascending: true }),
        supabase.from('choferes').select('id, nombre, km_recorridos').order('nombre', { ascending: true }),
        supabase.from('camiones').select('id, patente, km_actual').order('patente', { ascending: true }),
        supabase.from('configuracion').select('precio_gasoil').single()
      ])
      
      setViajes(vi.data || [])
      setClientes(cl.data || [])
      setChoferes(ch.data || [])
      setCamiones(ca.data || [])
      if (conf.data) setPrecioGasoil(conf.data.precio_gasoil)
    } catch (e) {
      console.error("Error en fetchData:", e)
    } finally {
      setLoading(false)
    }
  }

  // --- LÓGICA DE FILTRADO (CON FIX GLOBAL) ---
  const filteredViajes = useMemo(() => {
    return viajes.filter(v => {
      // 1. Filtro de búsqueda
      const matchesSearch = v.destino?.toLowerCase().includes(search.toLowerCase()) || 
                            v.clientes?.razon_social?.toLowerCase().includes(search.toLowerCase()) ||
                            v.origen?.toLowerCase().includes(search.toLowerCase())
      
      // 2. Lógica de Pestañas: Si es global pasan todos, sino discriminamos por es_retorno
      const matchesTab = activeTab === 'global' 
        ? true 
        : (activeTab === 'ida' ? !v.es_retorno : v.es_retorno)

      // 3. Filtro Temporal
      if (showAllTime) return matchesSearch && matchesTab;

      const tripDate = new Date(v.fecha);
      const tripMonth = tripDate.getUTCMonth();
      const tripYear = tripDate.getUTCFullYear();

      const matchesMonth = selectedMonth === -1 ? true : tripMonth === selectedMonth;
      const matchesYear = tripYear === selectedYear;

      return matchesSearch && matchesTab && matchesMonth && matchesYear
    })
  }, [viajes, search, activeTab, selectedMonth, selectedYear, showAllTime])

  // --- CÁLCULO DE MÉTRICAS (Basado en lo que el usuario ve) ---
  const stats = useMemo(() => {
    return filteredViajes.reduce((acc, v) => {
      const bruta = Number(v.facturacion) || 0
      const pagoChofer = Number(v.pago_chofer) || 0
      const costosOp = Number(v.costos_operativos) || 0
      const litros = Number(v.lts_combustible) || 0
      
      const pGasoil = v.precio_gasoil_historico || precioGasoil
      const costoGasoil = litros * pGasoil
      const neta = bruta - (pagoChofer + costosOp + costoGasoil)
      
      return {
        km: acc.km + (Number(v.km_salida) || 0) + (Number(v.km_retorno) || 0),
        bruta: acc.bruta + bruta,
        neta: acc.neta + neta,
        siva: acc.siva + (neta / 1.21),
        totalLts: acc.totalLts + litros,
        totalChofer: acc.totalChofer + pagoChofer,
        totalCostos: acc.totalCostos + costosOp
      }
    }, { km: 0, bruta: 0, neta: 0, siva: 0, totalLts: 0, totalChofer: 0, totalCostos: 0 })
  }, [filteredViajes, precioGasoil])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    const kmTotal = (Number(formData.km_salida) || 0) + (Number(formData.km_retorno) || 0)

    try {
      // Blindaje de datos para Supabase (IDs como null si están vacíos)
      const payload = {
        cliente_id: formData.cliente_id === "" ? null : formData.cliente_id,
        chofer_id: formData.chofer_id === "" ? null : formData.chofer_id,
        camion_id: formData.camion_id === "" ? null : formData.camion_id,
        origen: formData.origen.toUpperCase(),
        destino: formData.destino.toUpperCase(),
        fecha: formData.fecha,
        km_salida: Number(formData.km_salida) || 0,
        km_retorno: Number(formData.km_retorno) || 0,
        es_retorno: formData.es_retorno,
        engrase: formData.engrase,
        facturacion: Number(formData.facturacion) || 0,
        costos_operativos: Number(formData.costos_operativos) || 0,
        pago_chofer: Number(formData.pago_chofer) || 0,
        lts_combustible: Number(formData.lts_combustible) || 0,
        precio_gasoil_historico: Number(formData.precio_gasoil) || precioGasoil,
        monto_neto: Number(formData.facturacion) || 0
      }

      const { error: errorViaje } = await supabase.from('viajes').insert([payload])
      if (errorViaje) throw errorViaje

      // Actualizar odómetros
      if (payload.camion_id) {
        const actual = camiones.find(c => c.id === payload.camion_id)?.km_actual || 0
        await supabase.from('camiones').update({ km_actual: actual + kmTotal }).eq('id', payload.camion_id)
      }
      if (payload.chofer_id) {
        const actual = choferes.find(ch => ch.id === payload.chofer_id)?.km_recorridos || 0
        await supabase.from('choferes').update({ km_recorridos: actual + kmTotal }).eq('id', payload.chofer_id)
      }

      resetForm(); setIsModalOpen(false); await fetchData()
    } catch (err: any) { 
      alert("Error: " + err.message) 
    } finally { 
      setIsSubmitting(false) 
    }
  }

  const handleDeleteViaje = async (id: string, km_salida: number, km_retorno: number, camion_id: string, chofer_id: string) => {
    const confirmar = window.confirm("¿Estás seguro? Los KM se restarán de los odómetros automáticamente.");
    if (!confirmar) return;

    try {
      const { error } = await supabase.from('viajes').delete().eq('id', id);
      if (error) throw error;

      const kmARestar = (Number(km_salida) || 0) + (Number(km_retorno) || 0);

      if (camion_id) {
        const actual = camiones.find(c => c.id === camion_id)?.km_actual || 0;
        await supabase.from('camiones').update({ km_actual: actual - kmARestar }).eq('id', camion_id);
      }
      if (chofer_id) {
        const actual = choferes.find(ch => ch.id === chofer_id)?.km_recorridos || 0;
        await supabase.from('choferes').update({ km_recorridos: actual - kmARestar }).eq('id', chofer_id);
      }
      await fetchData();
    } catch (err: any) {
      alert("Error al eliminar: " + err.message);
    }
  };

  const resetForm = () => {
    setFormData({
      cliente_id: '', chofer_id: '', camion_id: '',
      origen: '', destino: '', fecha: new Date().toISOString().split('T')[0],
      km_salida: '', km_retorno: '', es_retorno: false, engrase: false,
      facturacion: '', costos_operativos: '', pago_chofer: '', lts_combustible: '',
      precio_gasoil: precioGasoil.toString()
    })
  }

  const handleOpenModal = () => {
    resetForm()
    setFormData(prev => ({ 
      ...prev, 
      es_retorno: activeTab === 'retorno', 
      precio_gasoil: precioGasoil.toString() 
    }))
    setIsModalOpen(true)
  }

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-20 pt-32 relative font-sans italic">
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 space-y-10 relative z-10">
        <ViajesHeader 
          search={search} setSearch={setSearch} 
          onOpenModal={handleOpenModal}
          totalKm={stats.km}
          totalFacturado={stats.bruta}
          totalNeto={stats.neta}
          totalSiva={stats.siva}
          totalLts={stats.totalLts}
          totalChofer={stats.totalChofer}
          totalCostos={stats.totalCostos}
          activeTab={activeTab} setActiveTab={setActiveTab}
          precioGasoil={precioGasoil} setPrecioGasoil={setPrecioGasoil}
          selectedMonth={selectedMonth} setSelectedMonth={setSelectedMonth}
          selectedYear={selectedYear} setSelectedYear={setSelectedYear}
          showAllTime={showAllTime} setShowAllTime={setShowAllTime}
        />
        
        {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="animate-spin text-indigo-500 w-12 h-12" />
            </div>
        ) : (
            <ViajesTable 
              viajes={filteredViajes} 
              precioGasoilActual={precioGasoil} 
              onRefresh={fetchData} 
              onDelete={handleDeleteViaje}
            />
        )}
      </div>

      <ViajeModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit} 
        isSubmitting={isSubmitting}
        formData={formData} 
        setFormData={setFormData}
        clientes={clientes} 
        choferes={choferes} 
        camiones={camiones}
      />
    </div>
  )
}