'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { 
  FileText, Search, CheckCircle2, Loader2,
  Building2, MapPin, Edit3, X, Save, Camera, Upload, 
  Plus, Trash2, Eye, Milestone, DollarSign, Image as ImageIcon,
  AlertCircle, Receipt
} from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

export default function RemitosPage() {
  const [loading, setLoading] = useState(true)
  const [viajes, setViajes] = useState<any[]>([])
  const [clientes, setClientes] = useState<any[]>([])
  const [filter, setFilter] = useState<'todos' | 'pendiente' | 'facturado'>('todos')
  const [search, setSearch] = useState('')
  const [updatingId, setUpdatingId] = useState<string | null>(null)

  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isViewOpen, setIsViewOpen] = useState(false)
  
  const [selectedViaje, setSelectedViaje] = useState<any>(null)
  const [viewImageUrl, setViewImageUrl] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [uploadingFile, setUploadingFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)

  // 🚀 ESTADO INICIAL V2.0
  const [newRemito, setNewRemito] = useState({
    nro_remito: '', 
    cliente_id: '', 
    monto_neto: '', 
    iva: '21', 
    monto_total: '',
    origen: '', 
    destino: '', 
    km_recorridos: '',
    fecha: new Date().toISOString().split('T')[0], 
    descripcion_remito: ''
  })

  const supabase = getSupabase()

  useEffect(() => { 
    fetchData(); 
    fetchClientes(); 
  }, [])

  // Cálculo de IVA Automático
  useEffect(() => {
    const neto = parseFloat(newRemito.monto_neto) || 0
    const ivaPerc = parseFloat(newRemito.iva) || 0
    const total = neto * (1 + (ivaPerc / 100))
    setNewRemito(prev => ({ ...prev, monto_total: total > 0 ? total.toFixed(2) : '' }))
  }, [newRemito.monto_neto, newRemito.iva])

  async function fetchData() {
    setLoading(true)
    // Filtramos solo los viajes que ya tienen asignado un número de remito
    const { data } = await supabase
      .from('viajes')
      .select('*, clientes(razon_social)')
      .neq('nro_remito', '')
      .order('fecha', { ascending: false })
    
    if (data) setViajes(data)
    setLoading(false)
  }

  async function fetchClientes() {
    const { data } = await supabase.from('clientes').select('id, razon_social').order('razon_social')
    if (data) setClientes(data)
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0]
      setUploadingFile(file); 
      setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const uploadPhoto = async (id: string) => {
    if (!uploadingFile) return null
    const extension = uploadingFile.name.split('.').pop()
    const fileName = `${id}-${Date.now()}.${extension}`
    
    const { error } = await supabase.storage.from('remitos').upload(fileName, uploadingFile)
    if (error) throw error
    
    const { data } = supabase.storage.from('remitos').getPublicUrl(fileName)
    return data.publicUrl
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setIsSaving(true)
    try {
      const payload = { 
        ...newRemito, 
        tarifa_flete: Number(newRemito.monto_neto), // Mapeo a columna V2.0
        monto_total: Number(newRemito.monto_total), 
        iva: Number(newRemito.iva), 
        km_recorridos: Number(newRemito.km_recorridos) 
      }
      
      const { data, error } = await supabase.from('viajes').insert([payload]).select()
      if (error) throw error
      
      if (uploadingFile && data?.[0]) {
        const url = await uploadPhoto(data[0].id)
        await supabase.from('viajes').update({ foto_url: url }).eq('id', data[0].id)
      }
      
      setIsAddModalOpen(false); 
      setUploadingFile(null); 
      setPreviewUrl(null); 
      fetchData()
    } catch (err: any) { 
      alert("Error al digitalizar: " + err.message) 
    } finally {
      setIsSaving(false)
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault(); 
    setIsSaving(true)
    try {
      let url = selectedViaje.foto_url
      if (uploadingFile) url = await uploadPhoto(selectedViaje.id)
      
      const { error } = await supabase.from('viajes').update({
        ...selectedViaje,
        tarifa_flete: Number(selectedViaje.monto_neto),
        monto_total: Number(selectedViaje.monto_total),
        iva: Number(selectedViaje.iva),
        km_recorridos: Number(selectedViaje.km_recorridos),
        foto_url: url
      }).eq('id', selectedViaje.id)
      
      if (error) throw error
      setIsEditModalOpen(false); 
      setUploadingFile(null); 
      setPreviewUrl(null); 
      fetchData()
    } catch (err: any) { 
      alert("Error al actualizar: " + err.message) 
    } finally {
      setIsSaving(false)
    }
  }

  const toggleFacturado = async (id: string, state: boolean) => {
    setUpdatingId(id)
    const { error } = await supabase.from('viajes').update({ facturado: !state }).eq('id', id)
    if (!error) {
      setViajes(viajes.map(v => v.id === id ? { ...v, facturado: !state } : v))
    }
    setUpdatingId(null)
  }

  const filtered = viajes.filter(v => 
    (v.nro_remito?.toLowerCase().includes(search.toLowerCase()) || v.clientes?.razon_social?.toLowerCase().includes(search.toLowerCase())) &&
    (filter === 'todos' ? true : filter === 'facturado' ? v.facturado : !v.facturado)
  )

  if (loading) return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center font-sans italic">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="text-amber-500 animate-spin" size={48} />
        <p className="text-amber-500 font-black uppercase tracking-[0.3em]">Cargando Archivo Digital...</p>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-20 pt-32 md:pt-40 relative overflow-x-hidden font-sans italic selection:bg-amber-500/30">
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:30px_30px]" />

      <div className="max-w-[1600px] mx-auto px-4 md:px-10 space-y-12 relative z-10">
        
        {/* HEADER */}
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-8 border-b border-white/5 pb-12">
          <div className="space-y-6 w-full xl:w-auto">
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.8]">
              CONTROL <br /> <span className="text-amber-500 font-thin">/</span> REMITOS
            </h1>
            <button onClick={() => { setIsAddModalOpen(true); setPreviewUrl(null); setUploadingFile(null); }} className="w-full sm:w-auto flex items-center justify-center gap-4 px-10 py-5 bg-amber-600 hover:bg-amber-500 text-white rounded-2xl font-black uppercase text-[11px] tracking-widest active:scale-95 shadow-2xl shadow-amber-900/40 transition-all border border-amber-400/20">
              <Plus size={20} strokeWidth={3} /> Digitalizar Nuevo
            </button>
          </div>

          <div className="w-full xl:w-auto bg-slate-950/80 border border-white/10 p-8 rounded-[3rem] flex flex-col md:flex-row items-center gap-10 backdrop-blur-xl shadow-2xl relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-5"><Receipt size={80} className="text-amber-500" /></div>
             <div className="text-center md:text-left relative z-10">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em] mb-2 flex items-center gap-2 justify-center md:justify-start">
                  <AlertCircle size={12} className="text-amber-500" /> Monto por Facturar
                </p>
                <h3 className="text-4xl md:text-5xl font-black text-amber-500 italic tracking-tighter">
                  ${viajes.filter(v => !v.facturado).reduce((a,b) => a + Number(b.monto_total || 0), 0).toLocaleString('es-AR')}
                </h3>
             </div>
             <div className="flex bg-slate-900 p-1.5 rounded-2xl border border-white/5 w-full md:w-auto shadow-inner">
                {['todos', 'pendiente', 'facturado'].map(f => (
                  <button key={f} onClick={() => setFilter(f as any)} className={`flex-1 px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500 hover:text-slate-300'}`}>{f}</button>
                ))}
             </div>
          </div>
        </header>

        {/* BUSCADOR */}
        <div className="relative w-full max-w-3xl group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-amber-500 transition-colors" size={20} />
          <input type="text" placeholder="BUSCAR POR NRO DE REMITO O RAZÓN SOCIAL..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-slate-950/50 border border-white/10 rounded-3xl py-6 pl-16 pr-8 text-white outline-none focus:border-amber-500/40 font-black tracking-widest text-xs uppercase placeholder:text-slate-800 transition-all shadow-inner" />
        </div>

        {/* GRILLA DE TARJETAS */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
          {filtered.length > 0 ? filtered.map(v => (
            <div key={v.id} className={`group p-1 rounded-[3.5rem] transition-all duration-700 hover:scale-[1.02] ${v.facturado ? 'bg-emerald-500/10 border border-emerald-500/20' : 'bg-slate-800/20 border border-white/5'}`}>
              <div className="bg-[#020617] rounded-[3.4rem] p-8 md:p-10 space-y-8 h-full flex flex-col justify-between relative overflow-hidden shadow-2xl">
                
                {/* Badge de Estado */}
                <div className={`absolute top-0 right-0 px-8 py-3 rounded-bl-[2rem] text-[10px] font-black uppercase tracking-[0.2em] shadow-lg ${v.facturado ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white animate-pulse'}`}>
                  {v.facturado ? 'Digitalizado' : 'En Espera'}
                </div>

                <div className="space-y-6">
                  <div className="flex justify-between items-start pt-4">
                    <div className="flex items-start gap-5">
                      <div className="p-4 rounded-2xl bg-slate-950 border border-white/5 text-amber-500 shadow-inner group-hover:bg-amber-500 group-hover:text-white transition-all">
                        <FileText size={28} />
                      </div>
                      <div>
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Identificador</p>
                        <h2 className="text-2xl md:text-3xl font-black text-white italic tracking-tighter uppercase leading-none mt-1">{v.nro_remito}</h2>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3 bg-white/[0.02] p-5 rounded-3xl border border-white/5 shadow-inner">
                    <div className="flex items-center gap-3"><Building2 size={16} className="text-sky-400" /><span className="text-xs font-black text-slate-200 uppercase truncate">{v.clientes?.razon_social || 'SIN CLIENTE'}</span></div>
                    <div className="flex items-center gap-3"><MapPin size={16} className="text-slate-600" /><span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">{v.origen} → {v.destino}</span></div>
                    <div className="flex items-center gap-3 border-t border-white/5 pt-3 mt-3"><Milestone size={16} className="text-emerald-500" /><span className="text-[10px] font-black text-emerald-500/80 uppercase tracking-widest">{v.km_recorridos || 0} KM TOTALES</span></div>
                  </div>
                </div>

                <div className="flex flex-col gap-6 pt-6 border-t border-white/5">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Importe Bruto</p>
                      <p className="text-3xl md:text-4xl font-black text-white italic tracking-tighter leading-none tabular-nums">${Number(v.monto_total || 0).toLocaleString('es-AR')}</p>
                    </div>
                    
                    <div className="flex gap-2">
                       {v.foto_url && (
                         <button onClick={() => { setViewImageUrl(v.foto_url); setIsViewOpen(true); }} className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500 hover:text-white transition-all" title="Ver Documento">
                           <ImageIcon size={20} />
                         </button>
                       )}
                       <button onClick={() => { setSelectedViaje(v); setIsEditModalOpen(true); }} className="p-4 bg-white/5 rounded-2xl text-slate-500 border border-white/10 hover:bg-white/10 hover:text-white transition-all">
                         <Edit3 size={20} />
                       </button>
                    </div>
                  </div>

                  <button 
                    onClick={() => toggleFacturado(v.id, v.facturado)} 
                    disabled={updatingId === v.id} 
                    className={`w-full py-5 rounded-2xl font-black uppercase text-[10px] tracking-[0.3em] transition-all flex items-center justify-center gap-3 shadow-xl active:scale-95 ${v.facturado ? 'bg-emerald-600/10 text-emerald-500 border border-emerald-500/20' : 'bg-white text-black hover:bg-amber-500 hover:text-white'}`}
                  >
                    {updatingId === v.id ? <Loader2 className="animate-spin" size={18} /> : v.facturado ? <><CheckCircle2 size={18}/> Conciliado</> : 'Marcar Facturado'}
                  </button>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full py-20 text-center opacity-30">
               <ImageIcon size={60} className="mx-auto mb-4" />
               <p className="text-xs font-black uppercase tracking-[0.5em]">No hay remitos que coincidan con la búsqueda</p>
            </div>
          )}
        </div>

        {/* MODAL: DIGITALIZACIÓN / EDICIÓN */}
        {(isAddModalOpen || isEditModalOpen) && (
          <div className="fixed inset-0 z-[400] flex items-center justify-center p-4 backdrop-blur-2xl bg-black/95 animate-in fade-in zoom-in-95 duration-300 font-sans italic">
            <div className="bg-[#020617] border border-white/10 w-full max-w-2xl rounded-[3.5rem] p-8 md:p-12 shadow-2xl overflow-y-auto max-h-[90vh] custom-scrollbar relative">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-amber-500 to-sky-500" />
              
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter leading-none">
                    {isAddModalOpen ? 'Digitalizar' : 'Editar'} <span className="text-amber-500">Documento</span>
                  </h2>
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mt-2">Terminal de Captura de Datos V2.0</p>
                </div>
                <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); setPreviewUrl(null); }} className="p-3 bg-white/5 rounded-full text-slate-500 hover:text-white transition-all"><X size={24} /></button>
              </div>

              <form onSubmit={isAddModalOpen ? handleCreate : handleUpdate} className="space-y-8">
                
                {/* DROPZONE DE IMAGEN */}
                <div className="border-2 border-dashed border-white/10 rounded-[2.5rem] p-8 bg-slate-950/50 flex flex-col items-center justify-center min-h-[220px] transition-all hover:border-amber-500/50 group relative overflow-hidden">
                  {previewUrl ? (
                    <div className="relative w-full aspect-video rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                      <img src={previewUrl} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button type="button" onClick={() => { setPreviewUrl(null); setUploadingFile(null); }} className="p-4 bg-rose-600 text-white rounded-full shadow-2xl scale-0 group-hover:scale-100 transition-transform"><Trash2 size={24}/></button>
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center cursor-pointer w-full h-full py-10 group">
                      <div className="p-6 bg-slate-900 rounded-3xl mb-4 group-hover:bg-amber-500/10 transition-colors border border-white/5">
                        <Camera size={48} className="text-slate-600 group-hover:text-amber-500 transition-colors" />
                      </div>
                      <span className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] group-hover:text-white transition-colors">Capturar Fotografía / Subir Archivo</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                  )}
                </div>

                {/* IMPORTES */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-4 tracking-widest flex items-center gap-2"><DollarSign size={10}/> Neto Sugerido</label>
                    <input required type="number" step="0.01" className="w-full bg-slate-950 border border-white/10 rounded-2xl py-5 px-6 text-white font-black outline-none focus:border-amber-500/50 transition-all text-sm tabular-nums" 
                      value={isAddModalOpen ? newRemito.monto_neto : selectedViaje.monto_neto} 
                      onChange={e => isAddModalOpen ? setNewRemito({...newRemito, monto_neto: e.target.value}) : setSelectedViaje({...selectedViaje, monto_neto: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-4 tracking-widest flex items-center gap-2"><ImageIcon size={10}/> Alicuota IVA %</label>
                    <input required type="number" className="w-full bg-slate-950 border border-white/10 rounded-2xl py-5 px-6 text-white font-black outline-none focus:border-amber-500/50 transition-all text-sm tabular-nums" 
                      value={isAddModalOpen ? newRemito.iva : selectedViaje.iva} 
                      onChange={e => isAddModalOpen ? setNewRemito({...newRemito, iva: e.target.value}) : setSelectedViaje({...selectedViaje, iva: e.target.value})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-amber-500 uppercase ml-4 tracking-widest flex items-center gap-2"><Save size={10}/> Total Facturable</label>
                    <input required type="number" step="0.01" className="w-full bg-slate-950 border border-amber-500/20 rounded-2xl py-5 px-6 text-amber-500 font-black outline-none shadow-lg shadow-amber-900/10 text-sm tabular-nums" 
                      value={isAddModalOpen ? newRemito.monto_total : selectedViaje.monto_total} 
                      onChange={e => isAddModalOpen ? setNewRemito({...newRemito, monto_total: e.target.value}) : setSelectedViaje({...selectedViaje, monto_total: e.target.value})} />
                  </div>
                </div>

                {/* RUTA */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                   <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-500 uppercase ml-4 tracking-widest flex items-center gap-2"><MapPin size={12} /> Punto de Carga</label>
                     <input required placeholder="ORIGEN" className="w-full bg-slate-950 border border-white/10 rounded-2xl py-5 px-8 text-white font-black italic uppercase outline-none focus:border-emerald-500/40 text-xs" 
                        value={isAddModalOpen ? newRemito.origen : selectedViaje.origen} 
                        onChange={e => isAddModalOpen ? setNewRemito({...newRemito, origen: e.target.value.toUpperCase()}) : setSelectedViaje({...selectedViaje, origen: e.target.value.toUpperCase()})} />
                   </div>
                   <div className="space-y-2">
                     <label className="text-[9px] font-black text-slate-500 uppercase ml-4 tracking-widest flex items-center gap-2"><MapPin size={12} /> Punto de Descarga</label>
                     <input required placeholder="DESTINO" className="w-full bg-slate-950 border border-white/10 rounded-2xl py-5 px-8 text-white font-black italic uppercase outline-none focus:border-emerald-500/40 text-xs" 
                        value={isAddModalOpen ? newRemito.destino : selectedViaje.destino} 
                        onChange={e => isAddModalOpen ? setNewRemito({...newRemito, destino: e.target.value.toUpperCase()}) : setSelectedViaje({...selectedViaje, destino: e.target.value.toUpperCase()})} />
                   </div>
                </div>

                {/* DATOS FISICOS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-4 tracking-widest flex items-center gap-2"><Hash size={12} /> Número de Remito Físico</label>
                    <input required placeholder="0001-XXXXXXXX" className="w-full bg-slate-950 border border-white/10 rounded-2xl py-5 px-8 text-white font-black italic uppercase tracking-[0.2em] outline-none focus:border-amber-500/50 text-sm placeholder:text-slate-800" 
                      value={isAddModalOpen ? newRemito.nro_remito : selectedViaje.nro_remito} 
                      onChange={e => isAddModalOpen ? setNewRemito({...newRemito, nro_remito: e.target.value.toUpperCase()}) : setSelectedViaje({...selectedViaje, nro_remito: e.target.value.toUpperCase()})} />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-4 tracking-widest flex items-center gap-2"><Milestone size={12} /> Odómetro Recorrido</label>
                    <input required type="number" placeholder="KM TOTALES" className="w-full bg-slate-950 border border-white/10 rounded-2xl py-5 px-8 text-white font-black outline-none focus:border-emerald-500/40 text-sm tabular-nums" 
                      value={isAddModalOpen ? newRemito.km_recorridos : selectedViaje.km_recorridos} 
                      onChange={e => isAddModalOpen ? setNewRemito({...newRemito, km_recorridos: e.target.value}) : setSelectedViaje({...selectedViaje, km_recorridos: e.target.value})} />
                  </div>
                </div>

                {isAddModalOpen && (
                  <div className="space-y-2">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-4 tracking-widest">Asignar Dador de Carga (Cliente)</label>
                    <select required className="w-full bg-slate-950 border border-white/10 rounded-2xl py-5 px-8 text-white font-black focus:border-amber-500/40 outline-none appearance-none cursor-pointer text-xs" 
                      value={newRemito.cliente_id} onChange={e => setNewRemito({...newRemito, cliente_id: e.target.value})}>
                      <option value="">-- SELECCIONAR CLIENTE DEL DIRECTORIO --</option>
                      {clientes.map(cl => <option key={cl.id} value={cl.id} className="bg-slate-900">{cl.razon_social}</option>)}
                    </select>
                  </div>
                )}

                <button type="submit" disabled={isSaving} className="w-full bg-amber-600 hover:bg-amber-500 py-6 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.4em] flex items-center justify-center gap-4 transition-all shadow-2xl shadow-amber-900/40 active:scale-95 border border-amber-400/20 group">
                  {isSaving ? <Loader2 className="animate-spin" size={24} /> : <><Upload size={20} className="group-hover:-translate-y-1 transition-transform" /> Sincronizar con Archivo Central</>}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* VISOR DE IMAGEN (FULLSCREEN) */}
        {isViewOpen && (
          <div className="fixed inset-0 z-[500] bg-[#020617]/98 backdrop-blur-xl flex items-center justify-center p-4 md:p-20 animate-in fade-in duration-500" onClick={() => setIsViewOpen(false)}>
            <button className="absolute top-8 right-8 p-4 bg-white/5 rounded-full text-white hover:bg-rose-500 transition-all z-[510]"><X size={32} /></button>
            <div className="relative w-full h-full flex items-center justify-center">
               <img src={viewImageUrl} className="max-w-full max-h-full rounded-2xl object-contain shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10" />
            </div>
          </div>
        )}

      </div>
    </div>
  )
}

// Sub-componente para iconos de Hash que faltaba
const Hash = ({ size, className }: { size: number, className?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" /><line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" />
  </svg>
)