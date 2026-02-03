'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect } from 'react'
import { getSupabase } from '@/lib/supabase'
import { backupService } from '@/lib/backupService'
import { Truck, Loader2, AlertTriangle, X } from 'lucide-react'

// Componentes modulares
import { ClienteSidebar } from '@/components/ClienteSidebar'
import { ClienteHeader } from '@/components/ClienteHeader'
import { ClienteStats } from '@/components/ClienteStats'
import { ClienteLedger } from '@/components/ClienteLedger'
import { NuevaOperacionModal } from '@/components/NuevaOperacionModal'

interface Movimiento {
  id: string; fecha: string; descripcion: string;
  debe: number; haber: number; nro_comprobante: string;
}

interface Cliente {
  id: string; razon_social: string; cuit: string;
  direccion: string; saldo: number; historial: Movimiento[];
}

export default function ClientesPage() {
  const [clientes, setClientes] = useState<Cliente[]>([])
  const [selected, setSelected] = useState<Cliente | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false)
  const [isOpModalOpen, setIsOpModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [backupLoading, setBackupLoading] = useState(false)

  const supabase = getSupabase()

  useEffect(() => { fetchClientes() }, [])

  async function fetchClientes() {
    setLoading(true)
    // Traemos los clientes y sus movimientos vinculados de la tabla cuenta_corriente
    const { data } = await supabase.from('clientes').select('*, cuenta_corriente(*)')
    
    if (data) {
      const procesados = data.map((c: any) => {
        // Ordenamos el historial: lo más nuevo primero
        const historial = (c.cuenta_corriente || []).sort((a: any, b: any) => 
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        
        // Calculamos el saldo acumulado: (Suma de DEBE) - (Suma de HABER)
        const saldo = historial.reduce((acc: number, m: any) => acc + (Number(m.debe) - Number(m.haber)), 0)
        
        return { ...c, historial, saldo }
      })

      setClientes(procesados)
      
      // Mantenemos la selección del cliente si ya había uno elegido
      if (selected) {
        const actualizado = procesados.find(p => p.id === selected.id)
        if (actualizado) setSelected(actualizado)
      } else if (procesados.length > 0) {
        setSelected(procesados[0])
      }
    }
    setLoading(false)
  }

  // --- REGISTRO DE NUEVA OPERACIÓN (DETALLE) ---
  const handleSubmitOperacion = async (data: any) => {
    if (!selected) return
    setIsSaving(true)
    
    const payload = {
      cliente_id: selected.id,
      descripcion: data.descripcion,
      fecha: data.fecha,
      debe: data.tipo === 'debe' ? data.monto : 0,
      haber: data.tipo === 'haber' ? data.monto : 0,
    }

    const { error } = await supabase.from('cuenta_corriente').insert([payload])
    
    if (!error) {
      setIsOpModalOpen(false)
      await fetchClientes() // Recargamos para ver el nuevo movimiento y saldo
    } else {
      alert("Error al registrar movimiento: " + error.message)
    }
    setIsSaving(false)
  }

  const handleBackup = async () => {
    setBackupLoading(true)
    try {
      await backupService.enviarBackupMensual(clientes)
      alert("✅ Backup enviado correctamente")
    } catch (err) {
      alert("❌ Error al enviar backup")
    } finally {
      setBackupLoading(false)
    }
  }

  const handleDeleteClient = async () => {
    if (!selected) return
    setIsSaving(true)
    const { error } = await supabase.from('clientes').delete().eq('id', selected.id)
    if (!error) { 
      setIsDeleteModalOpen(false)
      setSelected(null)
      fetchClientes() 
    } else { 
      alert("Error: El cliente tiene movimientos asociados. Borralos primero.") 
    }
    setIsSaving(false)
  }

  return (
    <div className=" flex flex-col lg:flex-row h-screen bg-[#020617] text-slate-100 overflow-hidden font-sans italic">
      
      <ClienteSidebar 
        clientes={clientes.filter(c => c.razon_social.toLowerCase().includes(searchTerm.toLowerCase()))}
        selectedId={selected?.id}
        onSelect={setSelected}
        loading={loading}
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        onAdd={() => setIsClientModalOpen(true)}
        isOpen={isSidebarOpen}
        setIsOpen={setIsSidebarOpen}
      />

      <main className=" flex-1 overflow-y-auto p-4 lg:p-12 pb-32 lg:pb-12 relative z-10">
        {/* Fondo con grilla sutil */}
        <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:60px_60px]" />
        
        {selected ? (
          <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500 relative">
            
            <ClienteHeader 
              selected={selected} 
              onBackup={handleBackup} 
              onDelete={() => setIsDeleteModalOpen(true)} 
              onNuevaOp={() => setIsOpModalOpen(true)}
              backupLoading={backupLoading} 
            />

            <ClienteStats selected={selected} />

            <ClienteLedger historial={selected.historial} />
            
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-10 grayscale">
            <Truck size={120} strokeWidth={1} />
            <p className="text-4xl font-black uppercase tracking-[0.8em] mt-4 text-center">Rutas del Sur</p>
          </div>
        )}
      </main>

      {/* MODAL ELIMINAR */}
      {isDeleteModalOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
          <div className="bg-slate-900 border border-rose-500/30 p-10 rounded-[3rem] w-full max-w-md text-center space-y-6">
            <div className="p-5 bg-rose-500/10 text-rose-500 rounded-2xl inline-block"><AlertTriangle size={40} /></div>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-white italic">¿Eliminar Cliente?</h3>
            <div className="flex gap-4 pt-4">
              <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-4 bg-white/5 text-slate-400 font-black rounded-2xl uppercase text-[10px]">Cancelar</button>
              <button onClick={handleDeleteClient} disabled={isSaving} className="flex-1 py-4 bg-rose-600 text-white font-black rounded-2xl uppercase text-[10px]">{isSaving ? '...' : 'Confirmar'}</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL ALTA CLIENTE */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md">
          <div className="bg-[#020617] border border-white/10 p-12 rounded-[3.5rem] w-full max-w-lg relative italic shadow-2xl">
            <button onClick={() => setIsClientModalOpen(false)} className="absolute top-10 right-10 text-slate-500 hover:text-white transition-all"><X size={28}/></button>
            <h3 className="text-4xl font-black uppercase tracking-tighter text-white mb-8 leading-none">Nuevo <br/><span className="text-sky-500 font-thin">/</span> Cliente</h3>
            <form onSubmit={async (e) => {
              e.preventDefault()
              setIsSaving(true)
              const fd = new FormData(e.currentTarget)
              const { error } = await supabase.from('clientes').insert([{ 
                razon_social: fd.get('rs')?.toString().toUpperCase(), 
                cuit: fd.get('cuit'), 
                direccion: fd.get('dir')?.toString().toUpperCase() 
              }])
              if (!error) { setIsClientModalOpen(false); fetchClientes() }
              else { alert("Error al crear cliente: " + error.message) }
              setIsSaving(false)
            }} className="space-y-4">
              <input name="rs" placeholder="RAZÓN SOCIAL" required className="w-full p-5 bg-slate-950 border border-white/5 rounded-2xl outline-none text-white font-bold uppercase" />
              <input name="cuit" placeholder="CUIT" required className="w-full p-5 bg-slate-950 border border-white/5 rounded-2xl outline-none text-white font-bold" />
              <input name="dir" placeholder="DIRECCIÓN" className="w-full p-5 bg-slate-950 border border-white/5 rounded-2xl outline-none text-white font-bold uppercase" />
              <button disabled={isSaving} className="w-full py-6 bg-sky-600 text-white font-black rounded-3xl uppercase text-[11px] tracking-[0.2em] mt-6 shadow-xl shadow-sky-900/20 active:scale-95 transition-all">
                {isSaving ? 'Registrando...' : 'Registrar Cliente'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL NUEVA OPERACIÓN (DETALLE) */}
      <NuevaOperacionModal 
        isOpen={isOpModalOpen}
        onClose={() => setIsOpModalOpen(false)}
        onSubmit={handleSubmitOperacion}
        isSaving={isSaving}
        clienteNombre={selected?.razon_social}
      />
    </div>
  )
}