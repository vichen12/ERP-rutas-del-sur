'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from 'react'
// 🚀 CONEXIÓN ESTÁTICA: Usamos la instancia única para evitar desconexiones
import { supabase } from '@/lib/supabase' 
import { 
  Plus, UserCircle, Truck, Loader2, Gauge, 
  ShieldAlert, Activity, Search, AlertTriangle, ChevronRight,
  UserCheck, Hash, Phone, Calendar, Info
} from 'lucide-react'

import { CamionCard } from '@/components/CamionCard'
import { CamionModal } from '@/components/CamionModal'

export default function FlotaPage() {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'camiones' | 'choferes'>('camiones')
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  
  const [choferes, setChoferes] = useState<any[]>([])
  const [camiones, setCamiones] = useState<any[]>([])

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)

  const initialFormState = {
    patente: '', modelo: '', km_actual: '', 
    km_ultimo_service: '', vto_rto: '', vto_senasa: '',
    estado: 'Disponible', chofer_id: '' 
  }

  const [formData, setFormData] = useState<any>(initialFormState)

  useEffect(() => {
    setMounted(true)
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [chResp, caResp] = await Promise.all([
        supabase.from('choferes').select('*').order('nombre'),
        supabase.from('camiones').select('*').order('patente')
      ]);

      if (chResp.error) throw chResp.error;
      
      const camionesConChofer = (caResp.data || []).map(camion => ({
        ...camion,
        operador: (chResp.data || []).find(ch => 
          ch.id === camion.chofer_id || ch.id === camion.operador_id
        ) || null
      }));

      setChoferes(chResp.data || []);
      setCamiones(camionesConChofer);
    } catch (err: any) {
      console.error("❌ ERROR CARGA:", err.message)
    } finally {
      setLoading(false)
    }
  }

  // --- 🛰️ MOTOR DE GUARDADO SINCRONIZADO ---
  const handleSaveCamion = async (e: React.FormEvent) => {
    e.preventDefault(); 
    
    // Si este log no sale, el problema es el botón del Modal
    console.log("📬 EVENTO CAPTURADO EN LA PÁGINA - PROCESANDO...");
    
    setIsSubmitting(true)

    try {
      const payload = {
        patente: (formData.patente || '').toUpperCase().trim(),
        modelo: (formData.modelo || '').toUpperCase().trim(),
        km_actual: Number(formData.km_actual) || 0,
        km_ultimo_service: Number(formData.km_ultimo_service) || 0,
        operador_id: formData.chofer_id || null, 
        chofer_id: formData.chofer_id || null,   
        estado: formData.estado || 'Disponible',
        vto_rto: formData.vto_rto || null,
        vto_senasa: formData.vto_senasa || null 
      }

      console.log("📤 PAYLOAD LISTO PARA ENVIAR:", payload)

      const result = editingId 
        ? await supabase.from('camiones').update(payload).eq('id', editingId).select()
        : await supabase.from('camiones').insert([payload]).select()

      if (result.error) throw result.error;

      console.log("✅ UNIDAD SINCRONIZADA CON ÉXITO");
      setIsModalOpen(false); 
      fetchData();
      
    } catch (error: any) {
      console.error("🔥 FALLO CRÍTICO:", error)
      alert("ERROR: " + error.message);
    } finally { 
      setIsSubmitting(false) 
    }
  }

  const handleEditClick = (camion: any) => {
    setEditingId(camion.id)
    setFormData({
      ...initialFormState,
      ...camion,
      chofer_id: camion.chofer_id || camion.operador_id || ''
    })
    setIsModalOpen(true)
  }

  const filteredData = useMemo(() => {
    const term = search.toLowerCase().trim();
    if (activeTab === 'camiones') {
      return camiones.filter(c => 
        c.patente.toLowerCase().includes(term) || 
        c.operador?.nombre?.toLowerCase().includes(term)
      )
    }
    return choferes.filter(ch => ch.nombre.toLowerCase().includes(term))
  }, [search, activeTab, camiones, choferes])

  if (!mounted || loading) return <div className="h-screen bg-[#020617] flex flex-col items-center justify-center"><Loader2 className="text-cyan-500 animate-spin mb-4" size={48} /><p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.5em] animate-pulse">Estabilizando Conexión...</p></div>

  return (
    <div className="min-h-screen bg-[#020617] text-slate-200 pb-32 font-sans italic selection:bg-cyan-500/30 overflow-x-hidden">
      <div className="fixed inset-0 pointer-events-none"><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,#1e1b4b,transparent)] opacity-40" /><div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff02_1px,transparent_1px),linear-gradient(to_bottom,#ffffff02_1px,transparent_1px)] bg-[size:40px_40px] opacity-20" /></div>

      <div className="max-w-[1600px] mx-auto px-6 lg:px-12 pt-24 md:pt-32 space-y-12 relative z-10">
        <header className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-10">
          <div className="space-y-6 flex-1">
            <h1 className="text-6xl md:text-9xl font-black text-white uppercase leading-[0.8] tracking-tighter">OPERACIONES <span className="text-cyan-500 font-thin">/</span> <br/> DE FLOTA</h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
            <div className="relative group">
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600 group-focus-within:text-cyan-500 transition-colors" size={18} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="BUSCAR..." className="bg-slate-900/50 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-[10px] font-black uppercase outline-none focus:border-cyan-500/50 transition-all w-full sm:w-64" />
            </div>
            <div className="flex bg-slate-900/80 p-1.5 rounded-[2.5rem] border border-white/5 backdrop-blur-md">
              <TabBtn active={activeTab === 'camiones'} onClick={() => setActiveTab('camiones')} label="Camiones" />
              <TabBtn active={activeTab === 'choferes'} onClick={() => setActiveTab('choferes')} label="Choferes" />
            </div>
            <button onClick={() => { setEditingId(null); setFormData(initialFormState); setIsModalOpen(true); }} className="p-6 bg-white text-black rounded-3xl hover:bg-cyan-500 transition-all active:scale-90 shadow-xl shadow-white/5 flex items-center justify-center"><Plus size={28} strokeWidth={3} /></button>
          </div>
        </header>

        <main className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
          {activeTab === 'camiones' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredData.map((c) => (
                <CamionCard 
                  key={c.id} camion={c} chofer={c.operador} totalGastos={0} 
                  onEdit={() => handleEditClick(c)} 
                  onDelete={(id, pat) => confirm(`¿Borrar ${pat}?`) && supabase.from('camiones').delete().eq('id', id).then(fetchData)}
                  onAddGasto={() => {}} onShowHistory={() => {}}
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredData.map(ch => (
                <div key={ch.id} className="p-8 bg-slate-950/40 rounded-[2.5rem] border border-white/5 backdrop-blur-xl group hover:border-indigo-500/30 transition-all shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-[0.03] group-hover:scale-125 transition-transform duration-700 pointer-events-none"><UserCircle size={120} /></div>
                  <h3 className="text-2xl font-black uppercase italic tracking-tighter text-white leading-none mb-6">{ch.nombre}</h3>
                  <div className="space-y-3 pt-6 border-t border-white/5 relative z-10">
                     <ChoferInfoRow icon={Hash} label="DNI" val={ch.dni || 'S/D'} />
                     <ChoferInfoRow icon={ShieldAlert} label="Licencia" val={ch.vto_licencia || '---'} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      <CamionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        // 🚀 WRAPPER DE SEGURIDAD: Atrapamos el evento aquí
        onSubmit={(e: React.FormEvent) => {
          console.log("🔔 FORM SUBMITTED - REENVIANDO A LA PÁGINA");
          handleSaveCamion(e);
        }} 
        isSubmitting={isSubmitting} 
        editingId={editingId} 
        formData={formData} 
        setFormData={setFormData} 
        choferes={choferes} 
      />
    </div>
  )
}

function ChoferInfoRow({ icon: Icon, label, val }: any) {
  return (
    <div className="flex justify-between items-center"><p className="text-[9px] text-slate-500 uppercase font-black tracking-widest flex items-center gap-2"><Icon size={12} className="text-slate-700" /> {label}</p><span className="text-[10px] font-bold text-slate-300 uppercase">{val}</span></div>
  )
}
function TabBtn({ active, onClick, label }: any) {
  return (
    <button onClick={onClick} className={`px-10 py-3.5 rounded-[1.8rem] text-[10px] font-black uppercase transition-all tracking-widest active:scale-95 ${active ? 'bg-cyan-600 text-white shadow-[0_0_20px_rgba(8,145,178,0.3)]' : 'text-slate-500 hover:text-slate-300'}`}>{label}</button>
  )
}