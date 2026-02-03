'use client'
export const dynamic = 'force-dynamic'
import { useState, useEffect } from 'react'
import { 
  FileText, Search, CheckCircle2, Loader2,
  Building2, MapPin, Edit3, X, Save, Camera, Upload, 
  Plus, Trash2, Eye, Milestone, DollarSign, Image as ImageIcon
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

  const [newRemito, setNewRemito] = useState({
    nro_remito: '', cliente_id: '', monto_neto: '', iva: '21', monto_total: '',
    origen: '', destino: '', km_recorridos: '',
    fecha: new Date().toISOString().split('T')[0], descripcion_remito: ''
  })

  const supabase = getSupabase()

  useEffect(() => { fetchData(); fetchClientes(); }, [])

  // Cálculo de IVA automático sin flechitas molestas
  useEffect(() => {
    const neto = parseFloat(newRemito.monto_neto) || 0
    const ivaPerc = parseFloat(newRemito.iva) || 0
    const total = neto * (1 + (ivaPerc / 100))
    setNewRemito(prev => ({ ...prev, monto_total: total > 0 ? total.toFixed(2) : '' }))
  }, [newRemito.monto_neto, newRemito.iva])

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0]
      setUploadingFile(file); setPreviewUrl(URL.createObjectURL(file))
    }
  }

  const uploadPhoto = async (id: string) => {
    if (!uploadingFile) return null
    const fileName = `${id}-${Date.now()}.${uploadingFile.name.split('.').pop()}`
    const { error } = await supabase.storage.from('remitos').upload(fileName, uploadingFile)
    if (error) throw error
    const { data } = supabase.storage.from('remitos').getPublicUrl(fileName)
    return data.publicUrl
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true)
    try {
      const payload = { ...newRemito, monto_neto: Number(newRemito.monto_neto), monto_total: Number(newRemito.monto_total), iva: Number(newRemito.iva), km_recorridos: Number(newRemito.km_recorridos) }
      const { data, error } = await supabase.from('viajes').insert([payload]).select()
      if (error) throw error
      if (uploadingFile && data?.[0]) {
        const url = await uploadPhoto(data[0].id)
        await supabase.from('viajes').update({ foto_url: url }).eq('id', data[0].id)
      }
      setIsAddModalOpen(false); setUploadingFile(null); setPreviewUrl(null); fetchData()
    } catch (err: any) { alert(err.message) }
    setIsSaving(false)
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault(); setIsSaving(true)
    try {
      let url = selectedViaje.foto_url
      if (uploadingFile) url = await uploadPhoto(selectedViaje.id)
      const { error } = await supabase.from('viajes').update({
        ...selectedViaje,
        monto_neto: Number(selectedViaje.monto_neto),
        monto_total: Number(selectedViaje.monto_total),
        iva: Number(selectedViaje.iva),
        km_recorridos: Number(selectedViaje.km_recorridos),
        foto_url: url
      }).eq('id', selectedViaje.id)
      if (error) throw error
      setIsEditModalOpen(false); setUploadingFile(null); setPreviewUrl(null); fetchData()
    } catch (err: any) { alert(err.message) }
    setIsSaving(false)
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
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-20 pt-32 md:pt-48 relative overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:30px_30px]" />

      <div className="max-w-[1600px] mx-auto px-4 md:px-10 space-y-10 relative z-10">
        
        {/* HEADER */}
        <header className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-8">
          <div className="space-y-6 w-full lg:w-auto text-center lg:text-left">
            <h1 className="text-5xl md:text-7xl font-black italic tracking-tighter text-white uppercase leading-[0.8]">
              CONTROL <br /> <span className="text-amber-500 font-thin text-4xl md:text-6xl">/</span> REMITOS
            </h1>
            <button onClick={() => { setIsAddModalOpen(true); setPreviewUrl(null); setUploadingFile(null); }} className="w-full sm:w-auto flex items-center justify-center gap-3 px-8 py-5 bg-amber-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest active:scale-95 shadow-xl shadow-amber-600/20 transition-all">
              <Plus size={18} strokeWidth={3} /> Nuevo Registro
            </button>
          </div>

          <div className="w-full lg:w-auto bg-slate-950/80 border border-amber-500/20 p-6 md:p-8 rounded-[2.5rem] flex flex-col sm:flex-row items-center gap-6 md:gap-10 backdrop-blur-xl">
             <div className="text-center sm:text-left">
                <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Pendiente (Total)</p>
                <h3 className="text-3xl md:text-4xl font-black text-amber-500 italic">
                  ${viajes.filter(v => !v.facturado).reduce((a,b) => a + Number(b.monto_total || 0), 0).toLocaleString()}
                </h3>
             </div>
             <div className="flex bg-white/5 p-1 rounded-2xl border border-white/5 w-full sm:w-auto overflow-x-auto no-scrollbar">
                {['todos', 'pendiente', 'facturado'].map(f => (
                  <button key={f} onClick={() => setFilter(f as any)} className={`flex-1 sm:flex-none px-6 py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${filter === f ? 'bg-amber-600 text-white shadow-lg' : 'text-slate-500'}`}>{f}</button>
                ))}
             </div>
          </div>
        </header>

        {/* BUSCADOR */}
        <div className="relative w-full max-w-2xl group">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-amber-500" />
          <input type="text" placeholder="BUSCAR POR REMITO O CLIENTE..." value={search} onChange={e => setSearch(e.target.value)} className="w-full bg-slate-950 border border-white/10 rounded-2xl md:rounded-3xl py-5 md:py-6 pl-16 text-white outline-none focus:border-amber-500/40 font-black tracking-widest text-[10px]" />
        </div>

        {/* GRILLA DE TARJETAS */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
          {filtered.map(v => (
            <div key={v.id} className={`p-1 rounded-[2.5rem] md:rounded-[3rem] transition-all duration-500 ${v.facturado ? 'bg-emerald-500/10' : 'bg-slate-800/20'}`}>
              <div className="bg-[#020617] border border-white/5 rounded-[2.4rem] md:rounded-[2.9rem] p-6 md:p-8 space-y-6 h-full flex flex-col justify-between relative overflow-hidden">
                <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-3xl text-[9px] font-black uppercase tracking-widest ${v.facturado ? 'bg-emerald-600 text-white' : 'bg-amber-600 text-white'}`}>
                  {v.facturado ? 'Saldado' : 'Pendiente'}
                </div>

                <div className="space-y-5">
                  <div className="flex justify-between items-start pt-4">
                    <div className="flex items-start gap-4">
                      <div className="p-3 rounded-xl bg-slate-950 border border-white/5 text-amber-500"><FileText size={24} /></div>
                      <div>
                        <p className="text-[9px] font-black text-slate-600 uppercase italic">Remito</p>
                        <h2 className="text-xl md:text-2xl font-black text-white italic tracking-tighter uppercase">{v.nro_remito}</h2>
                      </div>
                    </div>
                    <div className="flex gap-1 md:gap-2">
                      {v.foto_url && <button onClick={() => { setViewImageUrl(v.foto_url); setIsViewOpen(true); }} className="p-2 md:p-3 bg-indigo-500/10 rounded-lg text-indigo-400"><Eye size={16} /></button>}
                      <button onClick={() => { setSelectedViaje(v); setIsEditModalOpen(true); }} className="p-2 md:p-3 bg-white/5 rounded-lg text-slate-500"><Edit3 size={16} /></button>
                      <button onClick={() => { if(confirm("¿Eliminar?")) supabase.from('viajes').delete().eq('id', v.id).then(() => fetchData()) }} className="p-2 md:p-3 bg-rose-500/10 rounded-lg text-rose-500"><Trash2 size={16} /></button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3"><Building2 size={14} className="text-indigo-400" /><span className="text-xs font-black text-slate-300 uppercase italic truncate">{v.clientes?.razon_social}</span></div>
                    <div className="flex items-center gap-3"><MapPin size={14} className="text-slate-600" /><span className="text-[9px] font-bold text-slate-500 uppercase">{v.origen} → {v.destino}</span></div>
                    <div className="flex items-center gap-3"><Milestone size={14} className="text-emerald-500" /><span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">{v.km_recorridos || 0} KM RECORRIDOS</span></div>
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5">
                  <div className="flex justify-between items-end">
                    <div className="space-y-1">
                      <p className="text-[8px] font-black text-slate-600 uppercase">Neto: <span className="text-slate-300">${Number(v.monto_neto).toLocaleString()}</span></p>
                      <p className="text-[22px] font-black text-white italic tracking-tighter leading-none">${Number(v.monto_total || 0).toLocaleString()}</p>
                    </div>
                    <button onClick={() => toggleFacturado(v.id, v.facturado)} disabled={updatingId === v.id} className={`h-12 px-5 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all ${v.facturado ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-white/5 text-slate-400 border border-white/10 hover:bg-amber-600 hover:text-white'}`}>
                      {updatingId === v.id ? <Loader2 className="animate-spin" size={14} /> : v.facturado ? 'Listo' : 'Facturar'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* MODAL: ALTA Y EDICIÓN */}
        {(isAddModalOpen || isEditModalOpen) && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 backdrop-blur-md bg-black/95">
            <div className="bg-[#020617] border border-white/10 w-full max-w-2xl rounded-[2.5rem] p-8 md:p-12 shadow-2xl overflow-y-auto max-h-[90vh] no-scrollbar">
              <div className="flex justify-between items-center mb-8">
                <h2 className="text-2xl md:text-3xl font-black italic text-white uppercase tracking-tighter">
                  {isAddModalOpen ? 'Digitalizar Nuevo' : 'Editar Facturación'}
                </h2>
                <button onClick={() => { setIsAddModalOpen(false); setIsEditModalOpen(false); setPreviewUrl(null); }} className="p-3 bg-white/5 rounded-full text-slate-500"><X size={24} /></button>
              </div>

              <form onSubmit={isAddModalOpen ? handleCreate : handleUpdate} className="space-y-6">
                
                <div className="border-2 border-dashed border-white/10 rounded-3xl p-6 bg-slate-950/50 flex flex-col items-center justify-center min-h-[160px]">
                  {previewUrl ? (
                    <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl">
                      <img src={previewUrl} className="w-full h-full object-cover" />
                      <button type="button" onClick={() => { setPreviewUrl(null); setUploadingFile(null); }} className="absolute top-2 right-2 p-2 bg-rose-500 text-white rounded-full shadow-lg"><X size={16}/></button>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center cursor-pointer py-8 w-full text-center group">
                      <Camera size={44} className="text-slate-600 mb-3 group-hover:text-amber-500 transition-colors" />
                      <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Subir Foto del Remito</span>
                      <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                    </label>
                  )}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-500 uppercase ml-2">Neto ($)</label>
                    {/* INPUT LIMPIO SIN FLECHITAS */}
                    <input required type="text" inputMode="decimal" className="w-full bg-slate-950 border border-white/10 rounded-xl py-4 px-6 text-white font-black outline-none focus:border-amber-500/40" 
                      value={isAddModalOpen ? newRemito.monto_neto : selectedViaje.monto_neto} 
                      onChange={e => isAddModalOpen ? setNewRemito({...newRemito, monto_neto: e.target.value}) : setSelectedViaje({...selectedViaje, monto_neto: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-500 uppercase ml-2">IVA (%)</label>
                    <input required type="text" inputMode="decimal" className="w-full bg-slate-950 border border-white/10 rounded-xl py-4 px-6 text-white font-black outline-none focus:border-amber-500/40" 
                      value={isAddModalOpen ? newRemito.iva : selectedViaje.iva} 
                      onChange={e => isAddModalOpen ? setNewRemito({...newRemito, iva: e.target.value}) : setSelectedViaje({...selectedViaje, iva: e.target.value})} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[8px] font-black text-slate-500 uppercase ml-2">Total ($)</label>
                    <input required type="text" inputMode="decimal" className="w-full bg-slate-950 border border-amber-500/40 rounded-xl py-4 px-6 text-amber-500 font-black outline-none" 
                      value={isAddModalOpen ? newRemito.monto_total : selectedViaje.monto_total} 
                      onChange={e => isAddModalOpen ? setNewRemito({...newRemito, monto_total: e.target.value}) : setSelectedViaje({...selectedViaje, monto_total: e.target.value})} />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input required placeholder="ORIGEN" className="w-full bg-slate-950 border border-white/10 rounded-xl py-4 px-6 text-white font-black italic uppercase outline-none focus:border-emerald-500/40" 
                    value={isAddModalOpen ? newRemito.origen : selectedViaje.origen} 
                    onChange={e => isAddModalOpen ? setNewRemito({...newRemito, origen: e.target.value.toUpperCase()}) : setSelectedViaje({...selectedViaje, origen: e.target.value.toUpperCase()})} />
                  <input required placeholder="DESTINO" className="w-full bg-slate-950 border border-white/10 rounded-xl py-4 px-6 text-white font-black italic uppercase outline-none focus:border-emerald-500/40" 
                    value={isAddModalOpen ? newRemito.destino : selectedViaje.destino} 
                    onChange={e => isAddModalOpen ? setNewRemito({...newRemito, destino: e.target.value.toUpperCase()}) : setSelectedViaje({...selectedViaje, destino: e.target.value.toUpperCase()})} />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input required placeholder="NRO REMITO" className="w-full bg-slate-950 border border-white/10 rounded-xl py-4 px-6 text-white font-black italic uppercase tracking-widest outline-none focus:border-amber-500/40" 
                    value={isAddModalOpen ? newRemito.nro_remito : selectedViaje.nro_remito} 
                    onChange={e => isAddModalOpen ? setNewRemito({...newRemito, nro_remito: e.target.value.toUpperCase()}) : setSelectedViaje({...selectedViaje, nro_remito: e.target.value.toUpperCase()})} />
                  <input required type="text" inputMode="numeric" placeholder="KM RECORRIDOS" className="w-full bg-slate-950 border border-white/10 rounded-xl py-4 px-6 text-white font-black outline-none focus:border-emerald-500/40" 
                    value={isAddModalOpen ? newRemito.km_recorridos : selectedViaje.km_recorridos} 
                    onChange={e => isAddModalOpen ? setNewRemito({...newRemito, km_recorridos: e.target.value}) : setSelectedViaje({...selectedViaje, km_recorridos: e.target.value})} />
                </div>

                {isAddModalOpen && (
                  <select required className="w-full bg-slate-950 border border-white/10 rounded-xl py-4 px-6 text-white font-black focus:border-amber-500/40 outline-none appearance-none" 
                    value={newRemito.cliente_id} onChange={e => setNewRemito({...newRemito, cliente_id: e.target.value})}>
                    <option value="">SELECCIONAR CLIENTE</option>
                    {clientes.map(cl => <option key={cl.id} value={cl.id}>{cl.razon_social}</option>)}
                  </select>
                )}

                <button type="submit" disabled={isSaving} className="w-full bg-amber-600 hover:bg-amber-500 py-6 rounded-2xl font-black uppercase text-[10px] tracking-[0.4em] flex items-center justify-center gap-4 transition-all shadow-xl shadow-amber-600/20 active:scale-[0.98]">
                  {isSaving ? <Loader2 className="animate-spin" /> : <><Upload size={20} /> Sincronizar Registro</>}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* VISOR DE IMAGEN */}
        {isViewOpen && (
          <div className="fixed inset-0 z-[400] bg-black/98 flex items-center justify-center p-4 md:p-10 animate-in fade-in duration-300" onClick={() => setIsViewOpen(false)}>
            <button className="absolute top-6 right-6 p-4 bg-white/10 rounded-full text-white hover:bg-white/20 transition-all"><X size={32} /></button>
            <img src={viewImageUrl} className="max-w-full max-h-full rounded-2xl object-contain shadow-2xl" />
          </div>
        )}

      </div>
    </div>
  )
}