'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from 'react'
import { getSupabase } from '@/lib/supabase'
import { backupService } from '@/lib/backupService' 
import { 
  Truck, Loader2, Plus, CheckCircle2, 
  Inbox, TrendingUp, GripVertical, Trash2, Mail, DownloadCloud, AlertTriangle, X, Edit3, Menu, ArrowRight, ArrowLeft, Hash, RotateCcw, Users
} from 'lucide-react'

// Componentes modulares
import { ClienteSidebar } from '@/components/ClienteSidebar'
import { NuevaOperacionModal } from '@/components/NuevaOperacionModal'

export default function ClientesPage() {
  const [clientes, setClientes] = useState<any[]>([])
  const [selected, setSelected] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [isClientModalOpen, setIsClientModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isOpModalOpen, setIsOpModalOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [backupLoading, setBackupLoading] = useState(false)

  const [isOverBox, setIsOverBox] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const supabase = getSupabase()

  const gestion = useMemo(() => {
    const historial = selected?.historial || []
    const maestro = historial.filter((m: any) => m.estado_gestion === 'maestro' || !m.estado_gestion)
    const porCobrar = historial.filter((m: any) => m.estado_gestion === 'por_cobrar')
    const cobrados = historial.filter((m: any) => m.estado_gestion === 'cobrado')
    const saldoPendiente = porCobrar.reduce((acc: number, m: any) => acc + Number(m.debe || m.monto || 0), 0)
    return { maestro, porCobrar, cobrados, saldoPendiente }
  }, [selected])

  useEffect(() => { fetchClientes() }, [])

  async function fetchClientes() {
    setLoading(true)
    const { data } = await supabase.from('clientes').select('*, cuenta_corriente(*)')
    if (data) {
      const procesados = data.map((c: any) => {
        const historial = (c.cuenta_corriente || []).sort((a: any, b: any) => 
          new Date(b.fecha).getTime() - new Date(a.fecha).getTime())
        const saldoPendiente = historial
          .filter((m: any) => m.estado_gestion === 'por_cobrar')
          .reduce((acc: number, m: any) => acc + Number(m.debe || m.monto || 0), 0)
        return { ...c, historial, saldo: saldoPendiente }
      })
      setClientes(procesados)
      if (selected) {
        const actualizado = procesados.find(p => p.id === selected.id)
        if (actualizado) setSelected(actualizado)
      } else if (procesados.length > 0) {
        setSelected(procesados[0])
      }
    }
    setLoading(false)
  }

  const handleUpdateCliente = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!selected) return
    setIsSaving(true)
    const fd = new FormData(e.currentTarget)
    const { error } = await supabase.from('clientes').update({
        razon_social: fd.get('rs')?.toString().toUpperCase(),
        cuit: fd.get('cuit'),
        direccion: fd.get('dir')?.toString().toUpperCase()
      }).eq('id', selected.id)
    if (!error) { setIsEditModalOpen(false); await fetchClientes() }
    setIsSaving(false)
  }

  const handleDeleteCliente = async () => {
    if (!selected) return
    if (!confirm(`¿Eliminar a ${selected.razon_social}?`)) return
    setIsSaving(true)
    const { error } = await supabase.from('clientes').delete().eq('id', selected.id)
    if (!error) { setSelected(null); await fetchClientes() }
    setIsSaving(false)
  }

  const handleBackup = async () => {
    setBackupLoading(true)
    try {
      const deudoresActuales = clientes.filter(c => (c.saldo || 0) > 0).map(c => ({ ...c, saldo: c.saldo }))
      await backupService.enviarBackupMensual(deudoresActuales)
      alert("✅ Backup enviado")
    } catch (err) { alert("❌ Error") } finally { setBackupLoading(false) }
  }

  const moverOperacion = async (id: string, nuevoEstado: string) => {
    const { error } = await supabase.from('cuenta_corriente').update({ estado_gestion: nuevoEstado }).eq('id', id)
    if (!error) await fetchClientes()
    setIsOverBox(null)
  }

  const eliminarOperacion = async (id: string) => {
    if (!confirm("¿Borrar factura?")) return
    const { error } = await supabase.from('cuenta_corriente').delete().eq('id', id)
    if (!error) await fetchClientes()
    setIsDragging(false)
  }

  const handleSubmitOperacion = async (formData: any) => {
    if (!selected) return
    setIsSaving(true)
    const payload = {
      cliente_id: selected.id,
      fecha: formData.fecha,
      descripcion: `FACTURA ${formData.nro_factura}`.toUpperCase(),
      debe: Number(formData.monto),
      monto: Number(formData.monto),
      nro_factura: formData.nro_factura, 
      haber: 0,
      estado_gestion: 'maestro' 
    }
    const { error } = await supabase.from('cuenta_corriente').insert([payload])
    if (!error) { setIsOpModalOpen(false); await fetchClientes() }
    setIsSaving(false)
  }

  const onDragStart = (e: React.DragEvent, id: string) => { e.dataTransfer.setData("opId", id); setIsDragging(true); }
  const onDragEnd = () => { setIsDragging(false); setIsOverBox(null); }
  const onDrop = (e: React.DragEvent, nuevoEstado: string) => {
    e.preventDefault()
    const id = e.dataTransfer.getData("opId")
    if (nuevoEstado === 'delete') eliminarOperacion(id)
    else moverOperacion(id, nuevoEstado)
  }

  if (loading && !selected) return <div className="h-screen bg-[#020617] flex items-center justify-center text-sky-500 font-black italic animate-pulse">SINCRONIZANDO...</div>

  return (
    <div className="flex h-screen bg-[#020617] text-slate-100 overflow-hidden font-sans italic selection:bg-sky-500/30">
      
      <div className={`${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 fixed lg:static z-[60] transition-transform duration-300 h-full w-full lg:w-auto`}>
        <ClienteSidebar 
          clientes={clientes.filter((c: any) => c.razon_social.toLowerCase().includes(searchTerm.toLowerCase()))}
          selectedId={selected?.id} onSelect={(c: any) => { setSelected(c); setIsSidebarOpen(false); }} loading={loading}
          searchTerm={searchTerm} setSearchTerm={setSearchTerm}
          onAdd={() => setIsClientModalOpen(true)} isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen}
        />
      </div>

      <main className="flex-1 overflow-y-auto relative z-10 lg:mt-0">
        <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,#ffffff01_1px,transparent_1px),linear-gradient(to_bottom,#ffffff01_1px,transparent_1px)] bg-[size:60px_60px]" />
        
        {/* HEADER MÓVIL */}
        <div className="lg:hidden flex items-center justify-between p-6 border-b border-white/5 bg-[#020617]/80 backdrop-blur-md sticky top-0 z-40">
           <Truck className="text-sky-500" size={30} />
           <button onClick={() => setIsSidebarOpen(true)} className="p-3 bg-white/5 rounded-2xl"><Menu size={24} /></button>
        </div>

        {selected ? (
          <div className="max-w-7xl mx-auto p-6 lg:p-10 space-y-8 lg:space-y-12 relative animate-in fade-in duration-500 pb-32">
            
            <header className="flex flex-col md:flex-row md:items-end justify-between gap-8 border-b border-white/5 pb-8">
              <div className="space-y-4">
                <p className="text-[10px] font-black text-sky-500 uppercase tracking-[0.4em] font-sans not-italic italic text-sky-500">Gestión / {selected.cuit}</p>
                <div className="flex flex-wrap items-center gap-4 lg:gap-6">
                  <h1 className="text-4xl lg:text-6xl font-black italic tracking-tighter uppercase leading-none">{selected.razon_social}</h1>
                  <div className="flex gap-2">
                    <button onClick={() => setIsEditModalOpen(true)} className="p-2 bg-white/5 rounded-xl border border-white/5 transition-all"><Edit3 size={18} /></button>
                    <button onClick={handleDeleteCliente} className="p-2 bg-white/5 rounded-xl border border-white/5 transition-all"><Trash2 size={18} /></button>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mt-6">
                  <div className="px-6 py-3 bg-emerald-500/10 rounded-full border border-emerald-500/20 shadow-lg">
                    <span className="text-[10px] font-black text-emerald-500/50 uppercase mr-3 tracking-widest italic text-emerald-500">Saldo Pendiente Hoy:</span>
                    <span className="text-xl lg:text-2xl font-black text-emerald-500 tabular-nums">$ {gestion.saldoPendiente.toLocaleString('es-AR')}</span>
                  </div>
                  <button onClick={handleBackup} disabled={backupLoading} className="flex items-center gap-3 px-6 py-3 lg:py-4 bg-slate-900 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-sky-500 transition-all shadow-xl group">
                    {backupLoading ? <Loader2 size={18} className="animate-spin" /> : <DownloadCloud size={18} className="text-sky-500" />}
                    Backup
                  </button>
                </div>
              </div>
              <button onClick={() => setIsOpModalOpen(true)} className="w-full md:w-auto px-8 lg:px-10 py-5 bg-sky-600 text-white rounded-[1.5rem] lg:rounded-[2rem] font-black uppercase text-[11px] tracking-widest hover:bg-sky-500 transition-all shadow-xl flex items-center justify-center gap-3 active:scale-95 shadow-sky-900/20 border border-sky-400/20">
                <Plus size={20} strokeWidth={3} /> Nueva Operación
              </button>
            </header>

            {/* LIBRO MAYOR */}
            <section 
              className={`space-y-6 p-4 lg:p-6 rounded-[2rem] lg:rounded-[3rem] border transition-all duration-300 ${isOverBox === 'maestro' ? 'bg-sky-500/10 border-sky-500 scale-[1.01]' : 'border-transparent'}`}
              onDragOver={(e) => {e.preventDefault(); setIsOverBox('maestro')}} onDragLeave={() => setIsOverBox(null)} onDrop={(e) => onDrop(e, 'maestro')}
            >
              <h2 className="text-[11px] font-black uppercase tracking-[0.4em] opacity-40 flex items-center gap-3 italic"><Inbox size={18} /> Libro Mayor / Clasificar</h2>
              <div className="grid grid-cols-1 gap-3">
                {gestion.maestro.map((m: any) => (
                  <div key={m.id} draggable onDragStart={(e) => onDragStart(e, m.id)} onDragEnd={onDragEnd} className="bg-slate-900/40 p-5 lg:p-6 rounded-[1.5rem] lg:rounded-[2.5rem] border border-white/5 flex justify-between items-center group cursor-grab active:cursor-grabbing hover:border-sky-500/30 transition-all">
                    <div className="flex items-center gap-4 lg:gap-8 text-white">
                      <GripVertical size={20} className="text-slate-700 group-hover:text-sky-500 hidden sm:block" />
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                           <Hash size={12} className="text-sky-500" />
                           <p className="text-[10px] font-black text-slate-500 uppercase italic leading-none">REMITO: {m.nro_factura || m.nro_comprobante || 'S/N'}</p>
                           <span className="text-[9px] text-slate-600 ml-2">{new Date(m.fecha).toLocaleDateString('es-AR')}</span>
                        </div>
                        <p className="text-xl lg:text-2xl font-black italic tracking-tighter text-white font-sans leading-none">$ {Number(m.debe || m.monto).toLocaleString('es-AR')}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button onClick={() => eliminarOperacion(m.id)} className="p-4 text-slate-500 hover:text-rose-500 transition-colors"><Trash2 size={20}/></button>
                        <button onClick={() => moverOperacion(m.id, 'por_cobrar')} className="p-4 bg-sky-600/20 text-sky-500 rounded-2xl hover:bg-sky-600 hover:text-white transition-all flex items-center gap-3 group">
                           <span className="text-[10px] font-black uppercase tracking-widest italic">Cobrar</span>
                           <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                        </button>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* CAJAS DE BALANCE */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-10">
              <div onDragOver={(e) => {e.preventDefault(); setIsOverBox('por_cobrar')}} onDrop={(e) => onDrop(e, 'por_cobrar')} className={`border p-6 lg:p-10 rounded-[2.5rem] lg:rounded-[4rem] min-h-[350px] lg:min-h-[500px] flex flex-col transition-all duration-300 ${isOverBox === 'por_cobrar' ? 'bg-emerald-500/10 border-emerald-500 scale-[1.02]' : 'bg-emerald-500/[0.02] border-emerald-500/10'}`}>
                <h3 className="text-emerald-500 font-black uppercase text-xl italic mb-6 lg:mb-10 flex items-center gap-3"><TrendingUp size={24} /> Por Cobrar</h3>
                <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                  {gestion.porCobrar.map((m: any) => (
                    <div key={m.id} draggable onDragStart={(e) => onDragStart(e, m.id)} className="bg-slate-950 p-5 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] border border-emerald-500/10 flex justify-between items-center group cursor-grab">
                      <div className="flex items-center gap-3">
                        <button onClick={() => moverOperacion(m.id, 'maestro')} className="p-2 bg-white/5 rounded-lg text-slate-500 hover:text-sky-500 transition-colors" title="Volver al Libro Mayor"><RotateCcw size={16} /></button>
                        <div>
                           <p className="text-[9px] font-black text-emerald-500 uppercase italic mb-1 leading-none">R: {m.nro_factura || m.nro_comprobante || 'S/N'}</p>
                           <p className="text-xl font-black italic tracking-tighter font-sans leading-none text-white">${Number(m.debe || m.monto).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => eliminarOperacion(m.id)} className="p-2 text-slate-600 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                        <button onClick={() => moverOperacion(m.id, 'cobrado')} className="p-3 bg-emerald-500/10 text-emerald-500 rounded-xl hover:bg-emerald-500 hover:text-white transition-all"><ArrowRight size={20} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div onDragOver={(e) => {e.preventDefault(); setIsOverBox('cobrado')}} onDrop={(e) => onDrop(e, 'cobrado')} className={`border p-6 lg:p-10 rounded-[2.5rem] lg:rounded-[4rem] min-h-[350px] lg:min-h-[500px] flex flex-col transition-all duration-300 ${isOverBox === 'cobrado' ? 'bg-rose-500/10 border-rose-500 scale-[1.02]' : 'bg-rose-500/[0.02] border-rose-500/10'}`}>
                <h3 className="text-rose-500 font-black uppercase text-xl italic mb-6 lg:mb-10 flex items-center gap-3"><CheckCircle2 size={24} /> Cobrados</h3>
                <div className="space-y-3 flex-1 overflow-y-auto custom-scrollbar">
                  {gestion.cobrados.map((m: any) => (
                    <div key={m.id} draggable onDragStart={(e) => onDragStart(e, m.id)} className="bg-slate-950 p-5 lg:p-6 rounded-[1.5rem] lg:rounded-[2rem] border border-rose-500/10 flex justify-between items-center opacity-40 hover:opacity-100 transition-all cursor-grab group">
                      <div className="flex items-center gap-3">
                        <button onClick={() => moverOperacion(m.id, 'maestro')} className="p-2 bg-white/5 rounded-lg text-slate-500 hover:text-sky-500 transition-colors" title="Volver al Libro Mayor"><RotateCcw size={16} /></button>
                        <div>
                           <p className="text-[9px] font-black text-rose-500 uppercase italic mb-1 leading-none">R: {m.nro_factura || m.nro_comprobante || 'S/N'}</p>
                           <p className="text-xl font-black italic tracking-tighter font-sans leading-none text-white">${Number(m.debe || m.monto).toLocaleString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => eliminarOperacion(m.id)} className="p-2 text-slate-600 hover:text-rose-500 transition-colors"><Trash2 size={16}/></button>
                        <button onClick={() => moverOperacion(m.id, 'por_cobrar')} className="p-2 bg-white/5 rounded-lg text-slate-500 hover:text-emerald-500 transition-all"><ArrowLeft size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* TACHO DE BASURA ARRASTRE */}
            <div onDragOver={(e) => { e.preventDefault(); setIsOverBox('delete') }} onDrop={(e) => onDrop(e, 'delete')} className={`fixed bottom-6 lg:bottom-10 left-1/2 -translate-x-1/2 z-[100] transition-all duration-500 flex flex-col items-center gap-3 ${isDragging ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-20 pointer-events-none'}`}>
              <div className={`p-6 lg:p-8 rounded-full border-2 border-dashed transition-all ${isOverBox === 'delete' ? 'bg-rose-600 border-white scale-110 text-white shadow-[0_0_50px_rgba(225,29,72,0.5)]' : 'bg-rose-900/20 border-rose-500/50 text-rose-500'}`}><Trash2 size={32} /></div>
              <p className="text-[10px] font-black uppercase tracking-[0.4em] text-rose-500 bg-black/80 px-4 py-1 rounded-full italic leading-none">Borrar</p>
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center opacity-10 grayscale italic"><Truck size={120} strokeWidth={1} /><h2 className="text-4xl lg:text-6xl font-black uppercase tracking-[0.5em] mt-8 text-center leading-none italic">Rutas del Sur</h2></div>
        )}

        {/* BOTÓN FLOTANTE PARA CLIENTES (SÓLO MÓVIL) */}
        <button 
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 z-[100] p-5 bg-sky-600 text-white rounded-full shadow-2xl active:scale-90 transition-all border border-sky-400/30"
        >
          <Users size={28} />
        </button>
      </main>

      {/* MODALES */}
      {isClientModalOpen && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 lg:p-6 bg-black/90 backdrop-blur-md">
          <div className="bg-[#020617] border border-white/10 p-8 lg:p-12 rounded-[2.5rem] lg:rounded-[3.5rem] w-full max-w-lg relative italic shadow-2xl">
            <button onClick={() => setIsClientModalOpen(false)} className="absolute top-8 lg:top-10 right-8 lg:right-10 text-slate-500 hover:text-white transition-all"><X size={28}/></button>
            <h3 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter text-white mb-8 leading-none italic">Nuevo <br/><span className="text-sky-500 font-thin not-italic">/</span> Cliente</h3>
            <form onSubmit={async (e) => {
              e.preventDefault(); setIsSaving(true)
              const fd = new FormData(e.currentTarget)
              const { error } = await supabase.from('clientes').insert([{ 
                razon_social: fd.get('rs')?.toString().toUpperCase(), 
                cuit: fd.get('cuit'), 
                direccion: fd.get('dir')?.toString().toUpperCase() 
              }])
              if (!error) { setIsClientModalOpen(false); fetchClientes() }
              setIsSaving(false)
            }} className="space-y-4">
              <input name="rs" placeholder="RAZÓN SOCIAL" required className="w-full p-4 lg:p-5 bg-slate-950 border border-white/5 rounded-2xl outline-none text-white font-bold uppercase" />
              <input name="cuit" placeholder="CUIT" required className="w-full p-4 lg:p-5 bg-slate-950 border border-white/5 rounded-2xl outline-none text-white font-bold" />
              <input name="dir" placeholder="DIRECCIÓN" className="w-full p-4 lg:p-5 bg-slate-950 border border-white/5 rounded-2xl outline-none text-white font-bold uppercase" />
              <button disabled={isSaving} className="w-full py-5 lg:py-6 bg-sky-600 text-white font-black rounded-[1.5rem] lg:rounded-[2rem] uppercase text-[11px] tracking-[0.2em] mt-6 shadow-xl active:scale-95 transition-all">
                {isSaving ? 'Registrando...' : 'Registrar Cliente'}
              </button>
            </form>
          </div>
        </div>
      )}

      {isEditModalOpen && selected && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 lg:p-6 bg-black/90 backdrop-blur-md">
          <div className="bg-[#0f172a] border border-sky-500/30 p-8 lg:p-12 rounded-[2.5rem] lg:rounded-[3.5rem] w-full max-w-lg relative italic shadow-2xl">
            <button onClick={() => setIsEditModalOpen(false)} className="absolute top-8 lg:top-10 right-8 lg:right-10 text-slate-500 hover:text-white transition-all"><X size={28}/></button>
            <h3 className="text-3xl lg:text-4xl font-black uppercase tracking-tighter text-white mb-8 leading-none italic text-sky-500">Editar <br/><span className="text-white font-thin not-italic">/</span> Cliente</h3>
            <form onSubmit={handleUpdateCliente} className="space-y-4">
              <input name="rs" defaultValue={selected.razon_social} placeholder="RAZÓN SOCIAL" required className="w-full p-4 lg:p-5 bg-slate-950 border border-white/5 rounded-2xl outline-none text-white font-bold uppercase" />
              <input name="cuit" defaultValue={selected.cuit} placeholder="CUIT" required className="w-full p-4 lg:p-5 bg-slate-950 border border-white/5 rounded-2xl outline-none text-white font-bold" />
              <input name="dir" defaultValue={selected.direccion} placeholder="DIRECCIÓN" className="w-full p-5 lg:p-5 bg-slate-950 border border-white/5 rounded-2xl outline-none text-white font-bold uppercase" />
              <button disabled={isSaving} className="w-full py-5 lg:py-6 bg-emerald-600 text-white font-black rounded-[1.5rem] lg:rounded-[2rem] uppercase text-[11px] tracking-[0.2em] mt-6 shadow-xl active:scale-95 transition-all shadow-emerald-900/20">
                {isSaving ? 'Guardando...' : 'Guardar Cambios'}
              </button>
            </form>
          </div>
        </div>
      )}

      <NuevaOperacionModal isOpen={isOpModalOpen} onClose={() => setIsOpModalOpen(false)} onSubmit={handleSubmitOperacion} isSaving={isSaving} clienteNombre={selected?.razon_social} />
    </div>
  )
}