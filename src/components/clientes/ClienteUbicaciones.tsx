'use client'
// src/components/clientes/ClienteUbicaciones.tsx
import { useState } from 'react'
import { supabase } from '@/lib/supabase'   // ← tu cliente existente
import {
  MapPin, Plus, Pencil, Trash2, Navigation, DollarSign,
  Ruler, Fuel, AlertCircle, Loader2, Map
} from 'lucide-react'
import { ClienteUbicacionModal } from './ClienteUbicacionModal'

interface Props {
  clienteId:     string
  clienteNombre: string
  tarifaDefault: number   // tarifa_flete del cliente — se muestra como fallback
  ubicaciones:   any[]
  onRefresh:     () => void
}

export function ClienteUbicaciones({
  clienteId, clienteNombre, tarifaDefault, ubicaciones, onRefresh
}: Props) {
  const [modalOpen,  setModalOpen]  = useState(false)
  const [editData,   setEditData]   = useState<any>(null)
  const [isSaving,   setIsSaving]   = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  async function handleSubmit(form: any) {
    setIsSaving(true)
    try {
      const payload = {
        cliente_id:    clienteId,
        nombre:        form.nombre,
        direccion:     form.direccion  || null,
        lat:           form.lat        != null ? Number(form.lat)  : null,
        lng:           form.lng        != null ? Number(form.lng)  : null,
        tarifa_flete:  form.tarifa_flete   ? Number(form.tarifa_flete)  : null,
        km_desde_base: form.km_desde_base  ? Number(form.km_desde_base) : 0,
        lts_estimados: form.lts_estimados  ? Number(form.lts_estimados) : 0,
        es_origen:     form.es_origen,
        notas:         form.notas || null,
      }

      if (editData?.id) {
        const { error } = await supabase
          .from('destinos_cliente')
          .update(payload)
          .eq('id', editData.id)
        if (error) throw error
      } else {
        const { error } = await supabase
          .from('destinos_cliente')
          .insert(payload)
        if (error) throw error
      }

      setModalOpen(false)
      setEditData(null)
      onRefresh()
    } catch (e: any) {
      console.error('Error guardando ubicación:', e)
      alert('Error al guardar: ' + (e.message || 'Revisá la consola'))
    } finally {
      setIsSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta ubicación?')) return
    setDeletingId(id)
    const { error } = await supabase.from('destinos_cliente').delete().eq('id', id)
    if (error) {
      console.error('Error eliminando:', error)
      alert('Error al eliminar: ' + error.message)
    } else {
      onRefresh()
    }
    setDeletingId(null)
  }

  function openNew() {
    setEditData(null)
    setModalOpen(true)
  }

  function openEdit(u: any) {
    setEditData(u)
    setModalOpen(true)
  }

  return (
    <>
      <div className="space-y-6 font-sans italic animate-in fade-in duration-500">

        {/* Header del panel */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h3 className="text-xl font-black text-white uppercase tracking-tighter flex items-center gap-3">
              <Map size={22} className="text-emerald-500" />
              Ubicaciones del Cliente
            </h3>
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] mt-1">
              Tarifa default del cliente: <span className="text-slate-400">$ {Number(tarifaDefault || 0).toLocaleString('es-AR')}</span>
            </p>
          </div>
          <button
            onClick={openNew}
            className="flex items-center gap-3 px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black uppercase text-[9px] tracking-[0.2em] transition-all active:scale-95 shadow-xl group"
          >
            <Plus size={16} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
            Nueva Ubicación
          </button>
        </div>

        {/* Estado vacío */}
        {ubicaciones.length === 0 && (
          <div className="flex flex-col items-center justify-center py-20 border-2 border-dashed border-white/5 rounded-[3rem] bg-white/[0.01]">
            <div className="p-6 bg-white/5 rounded-full mb-4">
              <MapPin size={32} className="text-slate-600" />
            </div>
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-[0.4em]">
              Sin ubicaciones registradas
            </p>
            <p className="text-[9px] font-bold text-slate-700 uppercase mt-2">
              Agregá destinos para usarlos en viajes
            </p>
          </div>
        )}

        {/* Grid de ubicaciones */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {ubicaciones.map(u => {
            const tarifaEfectiva = Number(u.tarifa_flete) > 0 ? Number(u.tarifa_flete) : tarifaDefault
            const usaDefault     = !Number(u.tarifa_flete) || Number(u.tarifa_flete) === 0
            const tieneCoords    = u.lat && u.lng
            const isDeleting     = deletingId === u.id

            return (
              <div
                key={u.id}
                className={`relative bg-[#020617] border rounded-[2.5rem] p-6 shadow-2xl group transition-all hover:border-white/10 overflow-hidden ${
                  u.es_origen ? 'border-sky-500/20' : 'border-white/5'
                }`}
              >
                {/* Badge es_origen */}
                {u.es_origen && (
                  <span className="absolute top-4 right-4 text-[7px] font-black text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-1 rounded-lg uppercase tracking-widest">
                    Origen / Destino
                  </span>
                )}

                {/* Nombre */}
                <div className="flex items-start gap-3 mb-4">
                  <div className={`p-2.5 rounded-xl mt-0.5 ${tieneCoords ? 'bg-emerald-500/10 text-emerald-500' : 'bg-slate-800 text-slate-600'}`}>
                    <MapPin size={16} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-black text-white uppercase tracking-tight leading-tight truncate">
                      {u.nombre}
                    </p>
                    {u.direccion && (
                      <p className="text-[9px] text-slate-500 font-bold uppercase mt-0.5 truncate">
                        {u.direccion}
                      </p>
                    )}
                  </div>
                </div>

                {/* Coords pill */}
                {tieneCoords ? (
                  <div className="flex items-center gap-1.5 mb-4 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-xl w-fit">
                    <Navigation size={10} className="text-emerald-500" />
                    <span className="text-[8px] font-black text-emerald-400 tabular-nums">
                      {parseFloat(u.lat).toFixed(4)}, {parseFloat(u.lng).toFixed(4)}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1.5 mb-4 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl w-fit">
                    <AlertCircle size={10} className="text-amber-500" />
                    <span className="text-[8px] font-black text-amber-400">Sin coordenadas</span>
                  </div>
                )}

                {/* Datos económicos */}
                <div className="space-y-2 border-t border-white/5 pt-4">
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 text-[8px] font-black text-slate-600 uppercase">
                      <DollarSign size={10} /> Tarifa
                    </span>
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-black text-emerald-400 tabular-nums">
                        $ {tarifaEfectiva.toLocaleString('es-AR')}
                      </span>
                      {usaDefault && (
                        <span className="text-[7px] font-black text-slate-700 uppercase bg-white/5 px-1.5 py-0.5 rounded">
                          default
                        </span>
                      )}
                    </div>
                  </div>

                  {Number(u.km_desde_base) > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[8px] font-black text-slate-600 uppercase">
                        <Ruler size={10} /> KM desde base
                      </span>
                      <span className="text-sm font-black text-violet-400 tabular-nums">
                        {Number(u.km_desde_base).toLocaleString('es-AR')} km
                      </span>
                    </div>
                  )}

                  {Number(u.lts_estimados) > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="flex items-center gap-1.5 text-[8px] font-black text-slate-600 uppercase">
                        <Fuel size={10} /> Litros est.
                      </span>
                      <span className="text-sm font-black text-amber-400 tabular-nums">
                        {Number(u.lts_estimados).toLocaleString('es-AR')} L
                      </span>
                    </div>
                  )}
                </div>

                {/* Notas */}
                {u.notas && (
                  <p className="text-[8px] font-bold text-slate-600 uppercase mt-3 border-t border-white/5 pt-3 truncate">
                    {u.notas}
                  </p>
                )}

                {/* Acciones */}
                <div className="flex gap-2 mt-4 opacity-0 group-hover:opacity-100 transition-all">
                  <button
                    onClick={() => openEdit(u)}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-sky-500/10 hover:text-sky-400 border border-white/5 hover:border-sky-500/20 rounded-xl text-slate-500 transition-all text-[9px] font-black uppercase"
                  >
                    <Pencil size={12} /> Editar
                  </button>
                  <button
                    onClick={() => handleDelete(u.id)}
                    disabled={isDeleting}
                    className="flex-1 flex items-center justify-center gap-2 py-3 bg-rose-500/5 hover:bg-rose-500/10 text-rose-500/40 hover:text-rose-400 border border-rose-500/10 hover:border-rose-500/20 rounded-xl transition-all text-[9px] font-black uppercase disabled:opacity-40"
                  >
                    {isDeleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
                    {isDeleting ? '...' : 'Eliminar'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <ClienteUbicacionModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditData(null) }}
        onSubmit={handleSubmit}
        initialData={editData}
        isSaving={isSaving}
        clienteNombre={clienteNombre}
      />
    </>
  )
}