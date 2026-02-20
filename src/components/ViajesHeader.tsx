'use client'
import { useState, useEffect } from 'react'
import { 
  Plus, Search, TrendingUp, DollarSign, ArrowRight, ArrowLeft, 
  Fuel, CalendarClock, Trash2, Save, Calendar, Globe, 
  Droplets, UserCheck, Wrench, Receipt, Percent, FilterX
} from 'lucide-react'
// 🚀 1. CAMBIO CLAVE: Importación directa y estática
import { supabase } from '@/lib/supabase'

interface ViajesHeaderProps {
  search: string;
  setSearch: (val: string) => void;
  onOpenModal: () => void;
  totalKm: number;
  totalFacturado: number; 
  totalNeto: number;      
  totalSiva: number;      
  totalLts: number;       
  totalChofer: number;    
  totalCostos: number;    
  activeTab: 'ida' | 'retorno' | 'global'; 
  setActiveTab: (tab: 'ida' | 'retorno' | 'global') => void; 
  precioGasoil: number;
  setPrecioGasoil: (val: number) => void;
  dateStart: string;
  setDateStart: (val: string) => void;
  dateEnd: string;
  setDateEnd: (val: string) => void;
  showAllTime: boolean;
  setShowAllTime: (val: boolean) => void;
}

export function ViajesHeader({ 
  search, setSearch, onOpenModal, 
  totalKm = 0, totalFacturado = 0, totalNeto = 0, totalSiva = 0,
  totalLts = 0, totalChofer = 0, totalCostos = 0,
  activeTab, setActiveTab,
  precioGasoil, setPrecioGasoil,
  dateStart, setDateStart,
  dateEnd, setDateEnd,
  showAllTime, setShowAllTime
}: ViajesHeaderProps) {

  const [recordatorios, setRecordatorios] = useState<any[]>([])
  const [nuevoRecordatorio, setNuevoRecordatorio] = useState('')
  const [guardandoPrecio, setGuardandoPrecio] = useState(false)

  useEffect(() => { fetchRecordatorios() }, [])

  async function fetchRecordatorios() {
    const { data, error } = await supabase.from('recordatorios').select('*').order('created_at', { ascending: false })
    if (error) {
      console.error("❌ Error al cargar recordatorios:", error.message)
    } else if (data) {
      setRecordatorios(data)
    }
  }

  // --- 🛰️ MOTOR DE CREACIÓN BLINDADO ---
  const handleAddRecordatorio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoRecordatorio.trim()) return

    try {
      console.log("📤 Intentando guardar recordatorio:", nuevoRecordatorio)
      
      const { data, error } = await supabase
        .from('recordatorios')
        .insert([{ descripcion: nuevoRecordatorio.toUpperCase() }])
        .select() // Forzamos a que devuelva la data para confirmar

      if (error) throw error;

      console.log("✅ Recordatorio creado:", data)
      setNuevoRecordatorio('')
      fetchRecordatorios()
    } catch (error: any) {
      console.error("🔥 Error al crear:", error)
      alert("No se pudo crear: " + error.message)
    }
  }

  const handleDeleteRecordatorio = async (id: string) => {
    try {
      const { error } = await supabase.from('recordatorios').delete().eq('id', id)
      if (error) throw error;
      fetchRecordatorios()
    } catch (error: any) {
      alert("Error al eliminar: " + error.message)
    }
  }

  const handleSavePrice = async () => {
    setGuardandoPrecio(true)
    try {
      const { error } = await supabase.from('configuracion').update({ precio_gasoil: Number(precioGasoil) }).eq('id', 1)
      if (error) throw error;
    } catch (error: any) {
      console.error("Error al guardar precio:", error.message)
    } finally {
      setTimeout(() => setGuardandoPrecio(false), 800)
    }
  }

  const themeColor = activeTab === 'global' ? 'text-cyan-500' : activeTab === 'retorno' ? 'text-indigo-500' : 'text-emerald-500'
  const buttonColor = activeTab === 'global' ? 'bg-cyan-600 hover:bg-cyan-500' : activeTab === 'retorno' ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-emerald-600 hover:bg-emerald-500'

  // Funciones auxiliares para formateo seguro
  const formatCurrency = (val: number) => `$ ${(val || 0).toLocaleString('es-AR', { minimumFractionDigits: 0 })}`
  const formatNumber = (val: number) => (val || 0).toLocaleString('es-AR')

  return (
    <div className="space-y-8 font-sans italic selection:bg-cyan-500/30">
      
      <header className="flex flex-col xl:flex-row justify-between items-stretch gap-8">
        <div className="flex flex-col justify-between space-y-8 w-full xl:w-auto">
          <div className="space-y-2">
            <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.85]">
              BITÁCORA <br/> 
              <span className={`${themeColor} font-thin transition-colors`}>
                / {activeTab === 'global' ? 'GESTIÓN' : activeTab}
              </span>
            </h1>
          </div>

          <div className="bg-slate-950/40 border border-white/5 p-6 rounded-[2.5rem] backdrop-blur-xl flex items-center gap-6 group hover:border-amber-500/20 transition-all duration-500 shadow-2xl">
            <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500 border border-amber-500/20 group-hover:scale-110 transition-transform">
               <Fuel size={28} />
            </div>
            <div>
               <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Precio Referencia Gasoil</p>
               <div className="flex items-center gap-2">
                 <span className="text-2xl font-black text-amber-500">$</span>
                 <input 
                    type="number" value={precioGasoil || ''} 
                    onChange={(e) => setPrecioGasoil(Number(e.target.value))}
                    onBlur={handleSavePrice}
                    onKeyDown={(e) => e.key === 'Enter' && handleSavePrice()} // Para que guarde al apretar Enter
                    className="bg-transparent text-white font-black text-3xl w-28 outline-none border-b-2 border-white/5 focus:border-amber-500 transition-all tabular-nums"
                 />
                 {guardandoPrecio && <Save size={18} className="text-emerald-500 animate-bounce ml-2" />}
               </div>
            </div>
          </div>
        </div>

        <div className="flex-1 max-w-full xl:max-w-xl bg-slate-900/40 border border-white/10 rounded-[2.8rem] p-7 backdrop-blur-md flex flex-col h-[320px] shadow-2xl group relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform duration-700">
            <CalendarClock size={120} className="text-cyan-500" />
          </div>
          <div className="flex items-center justify-between mb-6 relative z-10">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center text-cyan-500"><CalendarClock size={16} /></div>
              <h3 className="text-[10px] font-black text-white uppercase tracking-[0.3em]">Operativa Pendiente</h3>
            </div>
            <span className="bg-slate-950 px-3 py-1.5 rounded-full text-[8px] font-black text-slate-500 uppercase border border-white/5">{recordatorios.length} CARGAS</span>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 mb-6 relative z-10">
             {recordatorios.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-10 opacity-20"><FilterX size={32} className="mb-2" /><p className="text-[9px] font-black uppercase tracking-[0.3em]">Sin tareas asignadas</p></div>
             ) : recordatorios.map(r => (
               <div key={r.id} className="flex justify-between items-center group/item bg-slate-950/50 p-4 rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-all">
                 <div className="flex items-center gap-4"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_10px_cyan]" /><span className="text-[10px] font-bold text-slate-200 uppercase tracking-tight truncate max-w-[250px]">{r.descripcion}</span></div>
                 <button onClick={() => handleDeleteRecordatorio(r.id)} className="text-slate-600 hover:text-rose-500 p-2 bg-black/40 rounded-xl opacity-0 group-hover/item:opacity-100 transition-all"><Trash2 size={14} /></button>
               </div>
             ))}
          </div>
          
          <form onSubmit={handleAddRecordatorio} className="relative z-10">
            <input value={nuevoRecordatorio} onChange={e => setNuevoRecordatorio(e.target.value)} placeholder="PROGRAMAR NUEVA RUTA / DESPACHO..." className="w-full bg-slate-950/80 border border-white/10 rounded-2xl py-4.5 pl-6 pr-14 text-[10px] text-white font-black uppercase outline-none focus:border-cyan-500 placeholder:text-slate-800" />
            <button type="submit" className="absolute right-2 top-2 p-3 bg-cyan-600 rounded-xl text-white hover:bg-cyan-500 shadow-lg active:scale-95 transition-all"><Plus size={18} strokeWidth={4} /></button>
          </form>
        </div>
      </header>

      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 bg-slate-950/40 p-2 rounded-[2.2rem] border border-white/5">
        <div className={`flex-1 flex flex-col md:flex-row items-center gap-4 md:gap-8 px-6 py-2 transition-all duration-700 ${showAllTime ? 'opacity-20 grayscale pointer-events-none' : 'opacity-100'}`}>
          <div className="flex items-center gap-3 w-full md:w-auto border-b md:border-b-0 md:border-r border-white/10 pb-2 md:pb-0 md:pr-8">
            <Calendar className="text-cyan-500" size={16} />
            <div className="flex flex-col">
              <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Desde</span>
              <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="bg-transparent text-white font-black text-xs uppercase outline-none [color-scheme:dark]" />
            </div>
          </div>
          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="flex flex-col">
              <span className="text-[7px] font-black text-slate-500 uppercase tracking-widest">Hasta</span>
              <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="bg-transparent text-white font-black text-xs uppercase outline-none [color-scheme:dark]" />
            </div>
          </div>
        </div>
        <button onClick={() => setShowAllTime(!showAllTime)} className={`flex items-center justify-center gap-3 px-8 py-4 rounded-[1.8rem] text-[9px] font-black uppercase tracking-[0.2em] transition-all border ${showAllTime ? 'bg-indigo-600 border-indigo-400 text-white shadow-lg' : 'bg-slate-900 border-white/10 text-slate-500 hover:text-white'}`}>
            <Globe size={16} className={showAllTime ? 'animate-spin-slow' : ''} />
            {showAllTime ? 'AUDITANDO HISTORIAL COMPLETO' : 'VER TODO EL HISTORIAL'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard title="Facturación Bruta" value={formatCurrency(totalFacturado)} icon={Receipt} color="text-white" />
        <StatCard title="Ganancia Neta" value={formatCurrency(totalNeto)} icon={DollarSign} color="text-emerald-400" highlight />
        <StatCard title="Sujeto a IVA" value={formatCurrency(totalSiva)} icon={Percent} color="text-cyan-500" />
        <StatCard title="Kms en Ruta" value={`${formatNumber(totalKm)} KM`} icon={TrendingUp} color="text-slate-300" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <SubStat label="Combustible" value={`${formatNumber(totalLts)} LTS`} icon={Droplets} color="text-amber-500" />
        <SubStat label="Liq. Choferes" value={formatCurrency(totalChofer)} icon={UserCheck} color="text-rose-500" />
        <SubStat label="Gastos / Manten." value={formatCurrency(totalCostos)} icon={Wrench} color="text-indigo-500" />
      </div>

      <div className="flex flex-col xl:flex-row gap-4 items-center bg-slate-950/20 p-2 rounded-[3rem] border border-white/5">
          <div className="flex bg-slate-950 p-1.5 rounded-[2.5rem] w-full xl:w-auto overflow-x-auto no-scrollbar shadow-inner">
            <TabBtn label="Idas" icon={<ArrowRight size={14}/>} active={activeTab === 'ida'} onClick={() => setActiveTab('ida')} color="bg-emerald-600" />
            <TabBtn label="Global" icon={<Globe size={14}/>} active={activeTab === 'global'} onClick={() => setActiveTab('global')} color="bg-cyan-600" />
            <TabBtn label="Retornos" icon={<ArrowLeft size={14}/>} active={activeTab === 'retorno'} onClick={() => setActiveTab('retorno')} color="bg-indigo-600" />
          </div>
          <div className="relative flex-1 w-full group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-700 group-focus-within:text-cyan-500 transition-colors" size={18} />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder="BUSCAR CLIENTE, PATENTE O DESTINO..." className="w-full bg-slate-950/80 border border-white/10 rounded-[2.2rem] py-5 pl-14 pr-8 text-white font-black outline-none focus:border-cyan-500/40 uppercase tracking-[0.1em] placeholder:text-slate-800 transition-all text-[10px]" />
          </div>
          <button onClick={onOpenModal} className={`w-full xl:w-auto px-10 py-5 ${buttonColor} text-white rounded-[2.2rem] font-black uppercase tracking-[0.2em] text-[10px] transition-all active:scale-95 flex justify-center items-center gap-3 shadow-xl group`}>
              <Plus size={18} strokeWidth={4} className="group-hover:rotate-90 transition-transform" /> 
              Nueva Operación
          </button>
      </div>
    </div>
  )
}

function StatCard({ title, value, icon: Icon, color, highlight }: any) {
  return (
    <div className={`bg-slate-900/40 p-7 md:p-8 rounded-[2.2rem] border transition-all duration-500 group relative overflow-hidden ${highlight ? 'border-emerald-500/30 bg-emerald-500/5' : 'border-white/5'}`}>
      <Icon className="absolute -right-2 -top-2 w-20 h-20 text-white opacity-[0.03] group-hover:scale-110 transition-transform duration-700" />
      <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-3">{title}</p>
      <p className={`text-3xl lg:text-4xl font-black ${color} tracking-tighter leading-none italic`}>{value}</p>
    </div>
  )
}

function SubStat({ label, value, icon: Icon, color }: any) {
  return (
    <div className="bg-slate-900/20 p-5 rounded-[1.8rem] border border-white/5 flex items-center gap-5 group hover:bg-slate-900/40 transition-all">
      <div className={`p-3 rounded-xl bg-slate-950 ${color} border border-white/5 shadow-inner`}>
        <Icon size={20} />
      </div>
      <div>
        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-0.5">{label}</p>
        <p className="text-xl font-black text-slate-200 tabular-nums">{value}</p>
      </div>
    </div>
  )
}

function TabBtn({ label, icon, active, onClick, color }: any) {
  return (
    <button onClick={onClick} className={`px-6 py-3 rounded-[2rem] text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 whitespace-nowrap ${active ? `${color} text-white shadow-lg scale-[1.05]` : 'text-slate-600 hover:text-slate-400'}`}>
      {icon} {label}
    </button>
  )
}