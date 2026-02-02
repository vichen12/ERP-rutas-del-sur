'use client'
import { useState, useEffect } from 'react'
import { 
  FileText, Search, CheckCircle2, Loader2,
  Calendar, Building2, MapPin, AlertCircle,
  Edit3, X, Save, Camera, Upload, Image as ImageIcon,
  Plus, Trash2, DollarSign, Eye
} from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

export default function RemitosPage() {
  const [loading, setLoading] = useState(true)
  const [viajes, setViajes] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [filter, setFilter] = useState<'todos' | 'pendiente' | 'facturado'>('todos')
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  // ESTADOS MODALES
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  
  // ESTADOS DATOS
  const [selectedViaje, setSelectedViaje] = useState<any>(null)
  const [viewImageUrl, setViewImageUrl] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [uploadingFile, setUploadingFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  const [newRemito, setNewRemito] = useState({
    nro_remito: '', cliente_id: '', monto_neto: 0, origen: '', destino: '', 
    fecha: new Date().toISOString().split('T')[0], descripcion_remito: ''
  })

  const supabase = getSupabase()

  useEffect(() => {
    fetchData()
    fetchClientes()
  }, [])

  async function fetchData() {
    setLoading(true)
    const { data } = await supabase.from('viajes').select('*, clientes(razon_social)').neq('nro_remito', '').order('fecha', { ascending: false })
    if (data) setViajes(data)
    setLoading(false)
  }

  async function fetchClientes() {
    const { data } = await supabase.from('clientes').select('id, razon_social').order('razon_social')
    if (data) setClientes(data)
  }

  // --- LOGICA DE SUBIDA ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0]
      setUploadingFile(file)
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const uploadPhoto = async (id: string) => {
    if (!uploadingFile) return null
    const fileExt = uploadingFile.name.split('.').pop()
    const fileName = `${id}-${Date.now()}.${fileExt}`
    const { error } = await supabase.storage.from('remitos').upload(fileName, uploadingFile)
    if (error) throw error
    const { data } = supabase.storage.from('remitos').getPublicUrl(fileName)
    return data.publicUrl
  }

  // --- ACCIONES PRINCIPALES ---

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      // 1. Insertamos primero para obtener la ID
      const { data, error } = await supabase.from('viajes').insert([newRemito]).select()
      if (error) throw error
      
      // 2. Si hay foto, la subimos usando la ID del nuevo registro
      if (uploadingFile && data?.[0]) {
        const url = await uploadPhoto(data[0].id)
        await supabase.from('viajes').update({ foto_url: url }).eq('id', data[0].id)
      }

      setIsAddModalOpen(false)
      setUploadingFile(null)
      setPreviewUrl(null)
      setNewRemito({ nro_remito: '', cliente_id: '', monto_neto: 0, origen: '', destino: '', fecha: new Date().toISOString().split('T')[0], descripcion_remito: '' })
      fetchData()
    } catch (err: any) { alert(err.message) }
    setIsSaving(false)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      let finalUrl = selectedViaje.foto_url
      if (uploadingFile) {
        finalUrl = await uploadPhoto(selectedViaje.id)
      }

      const { error } = await supabase.from('viajes').update({
        nro_remito: selectedViaje.nro_remito,
        monto_neto: Number(selectedViaje.monto_neto),
        origen: selectedViaje.origen.toUpperCase(),
        destino: selectedViaje.destino.toUpperCase(),
        descripcion_remito: selectedViaje.descripcion_remito,
        foto_url: finalUrl
      }).eq('id', selectedViaje.id)

      if (error) throw error
      setIsEditModalOpen(false)
      setUploadingFile(null)
      setPreviewUrl(null)
      fetchData()
    } catch (err: any) { alert(err.message) }
    setIsSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (confirm("¿Borrar remito permanentemente?")) {
      await supabase.from('viajes').delete().eq('id', id)
      fetchData()
    }
  }

  const toggleFacturado = async (id: string, state: boolean) => {
    setUpdatingId(id)
    await supabase.from('viajes').update({ facturado: !state }).eq('id', id)
    setViajes(viajes.map(v => v.id === id ? { ...v, facturado: !state } : v))
    setUpdatingId(null)
  }

  const filtered = viajes.filter(v => 
    (v.nro_remito?.toLowerCase().includes(search.toLowerCase()) || v.clientes?.razon_social?.toLowerCase().includes(search.toLowerCase())) &&
    (filter === 'todos' ? true : filter === 'facturado' ? v.facturado : !v.facturado)
  )

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-20 pt-48 relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="max-w-[1600px] mx-auto p-10 space-y-12 relative z-10">
        <header className="flex justify-between items-end">
          <div className="space-y-4">
            <h1 className="text-7xl font-black italic tracking-tighter text-white uppercase leading-none">
              CONTROL DE <span className="text-amber-500 not-italic font-thin text-6xl">/</span> REMITOS
            </h1>
            <button onClick={() => { setIsAddModalOpen(true); setPreviewUrl(null); }} className="flex items-center gap-3 px-8 py-4 bg-amber-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 shadow-xl shadow-amber-600/20">
              <Plus size={18} strokeWidth={3} /> Nuevo Registro
            </button>
          </div>
          <div className="bg-slate-950/80 border border-amber-500/20 p-8 rounded-[2.5rem] flex items-center gap-10 backdrop-blur-xl">
             <div className="space-y-1">
                <p className="text-[9px] font-black text-slate-500 uppercase">Pendiente Neto</p>
                <h3 className="text-4xl font-black text-amber-500 italic tracking-tighter">${viajes.filter(v => !v.facturado).reduce((a,b) => a + Number(b.monto_neto), 0).toLocaleString()}</h3>
             </div>
             <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5">
                {['todos', 'pendiente', 'facturado'].map(f => (
                  <button key={f} onClick={() => setFilter(f as any)} className={`px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500'}`}>{f}</button>
                ))}
             </div>
          </div>
        </header>

        <div className="relative max-w-2xl group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500 transition-colors" />
          <input type="text" placeholder="BUSCAR POR REMITO O CLIENTE..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-3xl py-6 pl-16 text-white outline-none focus:border-amber-500/40 font-black tracking-widest text-[11px]" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filtered.map(v => (
            <div key={v.id} className={`p-1 rounded-[3rem] transition-all ${v.facturado ? 'bg-emerald-500/10' : 'bg-slate-800/20'}`}>
              <div className="bg-[#020617] border border-white/5 rounded-[2.9rem] p-8 space-y-6 relative overflow-hidden h-full flex flex-col justify-between">
                
                <div className={`absolute top-0 right-0 px-8 py-3 rounded-bl-3xl text-[10px] font-black uppercase tracking-widest ${v.facturado ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`}>
                  {v.facturado ? 'Saldado' : 'Por Facturar'}
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-start pt-4">
                    <div className="flex items-start gap-5">
                      <div className="p-4 rounded-2xl bg-slate-950 border border-white/5 text-amber-500"><FileText size={28} /></div>
                      <div>
                        <p className="text-[10px] font-black text-slate-600 uppercase italic">Remito Nro</p>
                        <h2 className="text-3xl font-black text-white italic tracking-tighter uppercase">{v.nro_remito}</h2>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {v.foto_url && (
                        <button onClick={() => { setViewImageUrl(v.foto_url); setIsViewOpen(true); }} className="p-3 bg-indigo-500/10 rounded-xl text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all">
                          <Eye size={18} />
                        </button>
                      )}
                      <button onClick={() => { setSelectedViaje(v); setPreviewUrl(v.foto_url); setIsEditModalOpen(true); }} className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-white transition-all"><Edit3 size={18} /></button>
                      <button onClick={() => handleDelete(v.id)} className="p-3 bg-rose-500/10 rounded-xl text-rose-500 hover:bg-rose-500 transition-all"><Trash2 size={18} /></button>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex items-center gap-3"><Building2 size={16} className="text-indigo-400" /><span className="text-sm font-black text-slate-300 uppercase italic tracking-tight">{v.clientes?.razon_social}</span></div>
                    <div className="flex items-center gap-3"><MapPin size={16} className="text-slate-600" /><span className="text-[10px] font-bold text-slate-500 uppercase">{v.origen} → {v.destino}</span></div>
                    {v.descripcion_remito && <p className="text-[10px] text-slate-400 bg-white/5 p-3 rounded-xl border border-white/5 italic">"{v.descripcion_remito}"</p>}
                  </div>
                </div>

                <div className="pt-8 border-t border-white/5 flex items-center justify-between">
                  <div>
                    <p className="text-[9px] font-black text-slate-600 uppercase italic tracking-widest leading-none mb-1">Valor Neto</p>
                    <p className="text-2xl font-black text-white italic">${Number(v.monto_neto).toLocaleString()}</p>
                  </div>
                  <button onClick={() => toggleFacturado(v.id, v.facturado)} disabled={updatingId === v.id} className={`h-14 px-6 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all ${v.facturado ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-amber-600 hover:text-white'}`}>
                    {updatingId === v.id ? <Loader2 className="animate-spin" size={16} /> : v.facturado ? 'Listo' : 'Facturar'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* MODAL: NUEVO REGISTRO (CON FOTO) */}
        {isAddModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 backdrop-blur-md bg-black/95 animate-in fade-in duration-300">
            <div className="bg-[#020617] border border-white/10 w-full max-w-2xl rounded-[3rem] p-12 shadow-2xl relative overflow-y-auto max-h-[90vh]">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter leading-none">Nuevo Remito <br/><span className="text-amber-500 text-sm not-italic uppercase tracking-widest font-thin">Digitalización de Documento</span></h2>
                <button onClick={() => setIsAddModalOpen(false)} className="p-4 bg-white/5 rounded-full text-slate-500 hover:text-white transition-all"><X size={28} /></button>
              </div>

              <form onSubmit={handleCreate} className="space-y-8">
                {/* COMPONENTE DE CARGA DE IMAGEN */}
                <div className="relative group border-2 border-dashed border-white/10 rounded-[2.5rem] p-4 bg-slate-950/50 hover:border-amber-500/40 transition-all flex flex-col items-center justify-center min-h-[200px]">
                  {previewUrl ? (
                    <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl">
                      <img src={previewUrl} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => { setPreviewUrl(null); setUploadingFile(null); }} className="absolute top-4 right-4 p-3 bg-rose-500 text-white rounded-full shadow-xl"><X size={20}/></button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center cursor-pointer py-10 w-full">
                      <Camera size={50} className="text-slate-600 mb-4 group-hover:text-amber-500 transition-colors" />
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em]">Capturar Imagen / Subir Archivo</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-4">Nro de Remito</label>
                    <input required className="w-full bg-slate-950 border border-white/10 rounded-2xl py-5 px-6 text-white font-black italic tracking-widest focus:border-amber-500/40 outline-none" value={newRemito.nro_remito} onChange={e => setNewRemito({...newRemito, nro_remito: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-4">Monto Neto ($)</label>
                    <input required type="number" className="w-full bg-slate-950 border border-white/10 rounded-2xl py-5 px-6 text-white font-black focus:border-amber-500/40 outline-none" value={newRemito.monto_neto} onChange={e => setNewRemito({...newRemito, monto_neto: Number(e.target.value)})} />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-slate-600 uppercase tracking-widest ml-4">Seleccionar Cliente</label>
                  <select required className="w-full bg-slate-950 border border-white/10 rounded-2xl py-5 px-6 text-white font-black focus:border-amber-500/40 outline-none appearance-none" value={newRemito.cliente_id} onChange={e => setNewRemito({...newRemito, cliente_id: e.target.value})}>
                    <option value="">-- SELECCIONAR --</option>
                    {clientes.map(cl => <option key={cl.id} value={cl.id}>{cl.razon_social}</option>)}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-6">
                   <input required placeholder="ORIGEN" className="w-full bg-slate-950 border border-white/10 rounded-2xl py-5 px-6 text-white font-black italic uppercase tracking-widest focus:border-amber-500/40 outline-none" value={newRemito.origen} onChange={e => setNewRemito({...newRemito, origen: e.target.value.toUpperCase()})} />
                   <input required placeholder="DESTINO" className="w-full bg-slate-950 border border-white/10 rounded-2xl py-5 px-6 text-white font-black italic uppercase tracking-widest focus:border-amber-500/40 outline-none" value={newRemito.destino} onChange={e => setNewRemito({...newRemito, destino: e.target.value.toUpperCase()})} />
                </div>

                <button type="submit" disabled={isSaving} className="w-full bg-amber-600 hover:bg-amber-500 py-6 rounded-3xl font-black uppercase text-xs tracking-[0.4em] flex items-center justify-center gap-4 shadow-2xl shadow-amber-600/30 transition-all active:scale-95">
                  {isSaving ? <Loader2 className="animate-spin" /> : <><Save size={20} /> Crear Remito & Sincronizar</>}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* MODAL: EDICIÓN / FOTO (EXISTENTE) */}
        {isEditModalOpen && selectedViaje && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 backdrop-blur-md bg-black/95">
            <div className="bg-[#020617] border border-white/10 w-full max-w-2xl rounded-[3rem] p-12 shadow-2xl relative">
              <div className="flex justify-between items-center mb-10">
                <h2 className="text-4xl font-black italic text-white uppercase tracking-tighter leading-none">Editar Datos <br/><span className="text-indigo-500 text-sm not-italic uppercase tracking-widest font-thin">Actualización de Documentación</span></h2>
                <button onClick={() => { setIsEditModalOpen(false); setPreviewUrl(null); }} className="p-4 bg-white/5 rounded-full text-slate-500 hover:text-white transition-all"><X size={28} /></button>
              </div>
              <form onSubmit={handleUpdate} className="space-y-6">
                <div className="border-2 border-dashed border-white/10 rounded-3xl p-6 bg-slate-950/50 flex flex-col items-center">
                  {previewUrl ? (
                    <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-xl">
                      <img src={previewUrl} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => { setPreviewUrl(null); setUploadingFile(null); }} className="absolute top-4 right-4 p-3 bg-rose-500 text-white rounded-full"><X size={16}/></button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center cursor-pointer py-10 w-full">
                      <Camera size={50} className="text-slate-600 mb-4" />
                      <span className="text-[10px] font-black text-slate-500 uppercase">Cambiar o Subir Foto</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <input className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 px-6 text-white font-black italic uppercase tracking-widest" value={selectedViaje.nro_remito} onChange={e => setSelectedViaje({...selectedViaje, nro_remito: e.target.value.toUpperCase()})} />
                  <input type="number" className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 px-6 text-white font-black" value={selectedViaje.monto_neto} onChange={e => setSelectedViaje({...selectedViaje, monto_neto: Number(e.target.value)})} />
                </div>
                <textarea placeholder="OBSERVACIONES DEL VIAJE..." className="w-full bg-slate-950 border border-white/10 rounded-3xl py-4 px-6 text-[11px] text-white font-bold min-h-[100px] outline-none tracking-widest uppercase" value={selectedViaje.descripcion_remito || ''} onChange={e => setSelectedViaje({...selectedViaje, descripcion_remito: e.target.value})} />
                <button type="submit" disabled={isSaving} className="w-full bg-indigo-600 py-6 rounded-3xl font-black uppercase text-xs tracking-[0.4em] flex items-center justify-center gap-4 shadow-xl shadow-indigo-600/30 transition-all">
                  {isSaving ? <Loader2 className="animate-spin" /> : <><Upload size={20} /> Guardar Cambios Sincronizados</>}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* VISOR DE IMAGEN (FULLSCREEN) */}
        {isViewOpen && (
          <div className="fixed inset-0 z-[400] bg-black flex items-center justify-center p-10 animate-in fade-in duration-300" onClick={() => setIsViewOpen(false)}>
            <button className="absolute top-10 right-10 p-4 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all"><X size={32} /></button>
            <img src={viewImageUrl} className="max-w-full max-h-full rounded-3xl shadow-[0_0_100px_rgba(255,255,255,0.1)] object-contain" />
          </div>
        )}

      </div>
    </div>
  )
}