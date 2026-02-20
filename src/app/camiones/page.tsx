'use client'
export const dynamic = 'force-dynamic'

import { useState, useEffect, useMemo } from 'react'
import { supabase } from '@/lib/supabase' 
import { 
  Plus, UserCircle, Truck, Loader2, Gauge, 
  ShieldAlert, Activity, Search, AlertTriangle, ChevronRight,
  UserCheck, Hash, Phone, Calendar, Info
} from 'lucide-react'

import { CamionCard } from '@/components/CamionCard'
import { CamionModal } from '@/components/CamionModal'
import { GastoModal } from '@/components/GastoModal'
import { GastoHistoryModal } from '@/components/GastoHistoryModal'

export default function FlotaPage() {
  const [mounted, setMounted] = useState(false)
  const [activeTab, setActiveTab] = useState<'camiones' | 'choferes'>('camiones')
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [search, setSearch] = useState('')
  
  const [choferes, setChoferes] = useState<any[]>([])
  const [camiones, setCamiones] = useState<any[]>([])
  const [gastos, setGastos] = useState<any[]>([])

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isGastoModalOpen, setIsGastoModalOpen] = useState(false)
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false)
  
  const [editingId, setEditingId] = useState<string | null>(null)
  const [selectedCamion, setSelectedCamion] = useState<any>(null)

  const initialFormState = {
    patente: '', modelo: '', km_actual: '', 
    km_ultimo_service: '', vto_rto: '', vto_senasa: '',
    estado: 'Disponible', chofer_id: '' 
  }

  const [formData, setFormData] = useState<any>(initialFormState)

  const [gastoData, setGastoData] = useState({
    descripcion: '', monto: '', fecha: new Date().toISOString().split('T')[0]
  })

  useEffect(() => {
    setMounted(true)
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    try {
      const [ca, ch, ga] = await Promise.all([
        supabase.from('camiones').select('*').order('patente', { ascending: true }),
        supabase.from('choferes').select('id, nombre, dni, vto_licencia'),
        supabase.from('gastos_camion').select('*').order('fecha', { ascending: false })
      ]);

      if (ca.error) throw ca.error;

      // Unimos datos y calculamos gastos al vuelo
      const camionesMapeados = (ca.data || []).map(camion => {
        const choferAsignado = (ch.data || []).find(c => c.id === camion.chofer_id || c.id === camion.operador_id) || null;
        const totalGastosCamion = (ga.data || [])
          .filter(g => g.camion_id === camion.id)
          .reduce((acc, curr) => acc + Number(curr.monto), 0);

        return {
          ...camion,
          operador: choferAsignado,
          totalGastos: totalGastosCamion
        }
      });

      setCamiones(camionesMapeados);
      setChoferes(ch.data || []);
      setGastos(ga.data || []);

    } catch (err: any) {
      console.error("❌ ERROR CARGA:", err.message)
    } finally {
      setLoading(false)
    }
  }

  // --- 🛰️ MOTOR DE GUARDADO PRINCIPAL ---
  const handleSaveCamion = async (e: React.FormEvent) => {
    e.preventDefault(); 
    console.log("📬 EJECUTANDO GUARDADO...", formData);
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

      const result = editingId 
        ? await supabase.from('camiones').update(payload).eq('id', editingId).select()
        : await supabase.from('camiones').insert([payload]).select()

      if (result.error) throw result.error;

      console.log("✅ GUARDADO EXITOSO");
      setIsModalOpen(false); 
      fetchData();
      
    } catch (error: any) {
      console.error("🔥 FALLO CRÍTICO:", error)
      alert("ERROR: " + error.message);
    } finally { 
      setIsSubmitting(false) 
    }
  }

  // --- 💸 MOTOR DE GASTOS ---
  const handleSubmitGasto = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("gastos_camion").insert([{
        camion_id: selectedCamion.id,
        descripcion: gastoData.descripcion.toUpperCase(),
        monto: Number(gastoData.monto),
        fecha: gastoData.fecha,
      }]);
      
      if (error) throw error;
      
      setIsGastoModalOpen(false);
      fetchData();
    } catch (err: any) {
      alert("Error al cargar gasto: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string, patente: string) => {
    if (!confirm(`¿Eliminar la unidad ${patente}? Se perderán sus gastos asociados.`)) return;
    setIsSubmitting(true);
    const { error } = await supabase.from('camiones').delete().eq('id', id);
    if (error) alert("Error: " + error.message);
    else await fetchData();
    setIsSubmitting(false);
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
      <div className="fixed inset-0 pointer-events-none bg-[linear-gradient(to_right,#ffffff03_1px,transparent_1px),linear-gradient(to_bottom,#ffffff03_1px,transparent_1px)] bg-[size:40px_40px]" />

      <div className="max-w-[1600px] mx-auto px-6 lg:px-10 pt-24 md:pt-32 space-y-12 relative z-10">
        <header className="flex flex-col xl:flex-row justify-between items-end gap-8">
          <div className="space-y-4">
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.8]">
              GESTIÓN <br/> <span className="text-cyan-500 font-thin">/</span> FLOTA
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 w-full xl:w-auto">
            <div className="relative group flex-1 xl:w-96">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="BUSCAR PATENTE..." className="w-full bg-slate-950 border border-white/10 rounded-3xl py-5 pl-14 text-white font-bold outline-none focus:border-cyan-500/50 uppercase italic" />
            </div>
            <div className="flex bg-slate-900/80 p-1.5 rounded-[2.5rem] border border-white/5 backdrop-blur-md shadow-2xl">
              <TabBtn active={activeTab === 'camiones'} onClick={() => setActiveTab('camiones')} label="Camiones" />
              <TabBtn active={activeTab === 'choferes'} onClick={() => setActiveTab('choferes')} label="Choferes" />
            </div>
            <button onClick={() => { setEditingId(null); setFormData(initialFormState); setIsModalOpen(true); }} className="px-8 py-5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-3xl font-black uppercase tracking-widest transition-all shadow-lg active:scale-95 flex items-center gap-2"><Plus size={20} strokeWidth={3} /> Alta</button>
          </div>
        </header>

        <main className="animate-in fade-in slide-in-from-bottom-4 duration-1000">
          {activeTab === 'camiones' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {filteredData.map((c) => (
                <CamionCard 
                  key={c.id} camion={c} chofer={c.operador} totalGastos={c.totalGastos} 
                  onEdit={() => {
                    setEditingId(c.id);
                    setFormData({ ...initialFormState, ...c, chofer_id: c.chofer_id || c.operador_id || '' });
                    setIsModalOpen(true);
                  }} 
                  onDelete={() => handleDelete(c.id, c.patente)}
                  onAddGasto={() => {
                    setSelectedCamion(c);
                    setGastoData({ descripcion: '', monto: '', fecha: new Date().toISOString().split('T')[0] });
                    setIsGastoModalOpen(true);
                  }} 
                  onShowHistory={() => { setSelectedCamion(c); setIsHistoryModalOpen(true); }}
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

      {/* MODALES */}
      <CamionModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onSubmit={handleSaveCamion} 
        isSubmitting={isSubmitting} 
        editingId={editingId} 
        formData={formData} 
        setFormData={setFormData} 
        choferes={choferes} 
      />

      <GastoModal
        isOpen={isGastoModalOpen}
        onClose={() => setIsGastoModalOpen(false)}
        onSubmit={handleSubmitGasto}
        formData={gastoData}
        setFormData={setGastoData}
        camionPatente={selectedCamion?.patente}
      />

      <GastoHistoryModal
        isOpen={isHistoryModalOpen}
        onClose={() => setIsHistoryModalOpen(false)}
        gastos={gastos.filter(g => g.camion_id === selectedCamion?.id)}
        camionPatente={selectedCamion?.patente}
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