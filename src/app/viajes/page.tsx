'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabase'

import { ViajesHeader } from '@/components/ViajesHeader'
import { ViajesTable } from '@/components/ViajesTable'
import { ViajeModal } from '@/components/ViajeModal'

export default function ViajesPage() {
  const [loading, setLoading] = useState(true)
  const [viajes, setViajes] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [choferes, setChoferes] = useState<any[]>([])
  const [camiones, setCamiones] = useState<any[]>([])
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [search, setSearch] = useState('')

  const [formData, setFormData] = useState({
    cliente_id: '', chofer_id: '', camion_id: '',
    origen: '', destino: '', monto_neto: '',
    km_recorridos: '', fecha: new Date().toISOString().split('T')[0]
  })

  const supabase = getSupabase()

  useEffect(() => { fetchData() }, [])

  async function fetchData() {
    setLoading(true)
    const [vi, cl, ch, ca] = await Promise.all([
      supabase.from('viajes').select('*, clientes(razon_social), choferes(nombre, km_recorridos), camiones(patente, km_actual)').order('fecha', { ascending: false }),
      supabase.from('clientes').select('id, razon_social').order('razon_social', { ascending: true }),
      supabase.from('choferes').select('id, nombre, km_recorridos').order('nombre', { ascending: true }),
      supabase.from('camiones').select('id, patente, km_actual').order('patente', { ascending: true })
    ])
    setViajes(vi.data || [])
    setClientes(cl.data || [])
    setChoferes(ch.data || [])
    setCamiones(ca.data || [])
    setLoading(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    try {
      // 1. Insertar Viaje
      const { error } = await supabase.from('viajes').insert([{
        ...formData,
        cliente_id: formData.cliente_id || null,
        monto_neto: Number(formData.monto_neto),
        km_recorridos: Number(formData.km_recorridos),
        origen: formData.origen.toUpperCase(),
        destino: formData.destino.toUpperCase()
      }])
      if (error) throw error

      // 2. Actualizar KM Camión y Chofer (Igual que antes)
      // ...
      
      setIsModalOpen(false)
      fetchData()
    } catch (err: any) { alert(err.message) }
    finally { setIsSubmitting(false) }
  }

  const totalKm = viajes.reduce((acc, curr) => acc + (Number(curr.km_recorridos) || 0), 0)
  const totalFacturado = viajes.reduce((acc, curr) => acc + (Number(curr.monto_neto) || 0), 0)

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-20 pt-32 relative font-sans italic">
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 space-y-12 relative z-10">
        <ViajesHeader 
          search={search} setSearch={setSearch} 
          onOpenModal={() => setIsModalOpen(true)}
          totalKm={totalKm} totalFacturado={totalFacturado}
        />
        
        <ViajesTable 
          viajes={viajes.filter(v => v.destino.toLowerCase().includes(search.toLowerCase()))} 
        />
      </div>

      <ViajeModal 
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        onSubmit={handleSubmit} isSubmitting={isSubmitting}
        formData={formData} setFormData={setFormData}
        clientes={clientes} choferes={choferes} camiones={camiones}
      />
    </div>
  )
}