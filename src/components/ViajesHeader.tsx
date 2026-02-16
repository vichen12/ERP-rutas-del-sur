'use client'
import { useState, useEffect, useMemo } from 'react'
import { 
  Plus, Search, TrendingUp, DollarSign, ArrowRight, ArrowLeft, 
  Fuel, CalendarClock, Trash2, Save, Calendar, Globe, 
  Droplets, UserCheck, Wrench, Receipt, Percent 
} from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

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
  activeTab: 'ida' | 'retorno' | 'global'; // ACTUALIZADO
  setActiveTab: (tab: 'ida' | 'retorno' | 'global') => void; // ACTUALIZADO
  precioGasoil: number;
  setPrecioGasoil: (val: number) => void;
  selectedMonth: number;
  setSelectedMonth: (val: number) => void;
  selectedYear: number;
  setSelectedYear: (val: number) => void;
  showAllTime: boolean;
  setShowAllTime: (val: boolean) => void;
}

export function ViajesHeader({ 
  search, setSearch, onOpenModal, 
  totalKm, totalFacturado, totalNeto, totalSiva,
  totalLts, totalChofer, totalCostos,
  activeTab, setActiveTab,
  precioGasoil, setPrecioGasoil,
  selectedMonth, setSelectedMonth,
  selectedYear, setSelectedYear,
  showAllTime, setShowAllTime
}: ViajesHeaderProps) {

  const supabase = getSupabase()
  const [recordatorios, setRecordatorios] = useState<any[]>([])
  const [nuevoRecordatorio, setNuevoRecordatorio] = useState('')
  const [guardandoPrecio, setGuardandoPrecio] = useState(false)

  const listaAnios = useMemo(() => {
    const anioInicio = 2024;
    const anioActual = new Date().getFullYear();
    const range = [];
    for (let i = anioInicio; i <= anioActual + 2; i++) { range.push(i); }
    return range.reverse();
  }, []);

  const opcionesMeses = [
    { id: -1, label: 'Todo el Año (Balance Anual)' },
    { id: 0, label: 'Enero' }, { id: 1, label: 'Febrero' }, { id: 2, label: 'Marzo' },
    { id: 3, label: 'Abril' }, { id: 4, label: 'Mayo' }, { id: 5, label: 'Junio' },
    { id: 6, label: 'Julio' }, { id: 7, label: 'Agosto' }, { id: 8, label: 'Septiembre' },
    { id: 9, label: 'Octubre' }, { id: 10, label: 'Noviembre' }, { id: 11, label: 'Diciembre' }
  ];

  useEffect(() => { fetchRecordatorios() }, [])

  async function fetchRecordatorios() {
    const { data } = await supabase.from('recordatorios').select('*').order('created_at', { ascending: false })
    if (data) setRecordatorios(data)
  }

  const handleAddRecordatorio = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nuevoRecordatorio.trim()) return
    await supabase.from('recordatorios').insert([{ descripcion: nuevoRecordatorio.toUpperCase() }])
    setNuevoRecordatorio('')
    fetchRecordatorios()
  }

  const handleDeleteRecordatorio = async (id: string) => {
    await supabase.from('recordatorios').delete().eq('id', id)
    fetchRecordatorios()
  }

  const handleSavePrice = async () => {
    setGuardandoPrecio(true)
    await supabase.from('configuracion').update({ precio_gasoil: Number(precioGasoil) }).eq('id', 1)
    setTimeout(() => setGuardandoPrecio(false), 800)
  }

  // --- COLORES DINÁMICOS POR ESTADO ---
  const themeColor = activeTab === 'global' ? 'text-cyan-500' : activeTab === 'retorno' ? 'text-indigo-500' : 'text-emerald-500'
  const buttonColor = activeTab === 'global' ? 'bg-cyan-600 hover:bg-cyan-500' : activeTab === 'retorno' ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-emerald-600 hover:bg-emerald-500'
  const tabLabel = activeTab === 'global' ? 'Balance General' : activeTab === 'retorno' ? 'Retornos' : 'Viajes Ida'

  return (
    <div className="space-y-10">
      <header className="flex flex-col xl:flex-row justify-between items-start gap-8">
        
        <div className="space-y-8 w-full xl:w-auto">
          <h1 className="text-6xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.8]">
            LOGÍSTICA <br/> <span className={`${themeColor} font-thin transition-colors uppercase`}>/ {activeTab}</span>
          </h1>

          <div className="inline-flex items-center gap-6 bg-slate-900/80 border border-white/10 p-6 rounded-[2.5rem] backdrop-blur-md shadow-2xl">
            <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500">
               <Fuel size={32} />
            </div>
            <div>
               <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Costo Gasoil Hoy (Lts)</p>
               <div className="flex items-center gap-2">
                 <span className="text-3xl font-black text-amber-500">$</span>
                 <input 
                   type="number" 
                   value={precioGasoil || ''} 
                   onChange={(e) => setPrecioGasoil(Number(e.target.value))}
                   onBlur={handleSavePrice}
                   placeholder="0.00"
                   className="bg-transparent text-white font-black text-4xl w-32 outline-none border-b-2 border-white/5 focus:border-amber-500 transition-all placeholder:text-slate-800"
                 />
                 {guardandoPrecio && <Save size={18} className="text-emerald-500 animate-bounce ml-2" />}
               </div>
            </div>
          </div>
        </div>

        <div className="w-full xl:w-[32rem] bg-slate-900/40 border border-white/5 rounded-[3rem] p-8 backdrop-blur-sm flex flex-col h-64 shadow-2xl relative overflow-hidden group">
          <div className="flex items-center gap-3 mb-4 border-b border-white/5 pb-3">
            <CalendarClock className="text-cyan-500" size={20} />
            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em]">Agenda de Próximos Viajes</h3>
          </div>
          
          <div className="flex-1 overflow-y-auto custom-scrollbar space-y-3 pr-2 mb-4">
             {recordatorios.length === 0 && (
                <p className="text-[10px] text-slate-700 italic mt-6 text-center font-black uppercase tracking-widest">No hay pendientes</p>
             )}
             {recordatorios.map(r => (
               <div key={r.id} className="flex justify-between items-center group bg-white/[0.03] p-3 rounded-xl border border-white/5 hover:bg-white/[0.07] transition-all">
                 <div className="flex items-center gap-3">
                    <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-[0_0_10px_rgba(6,182,212,0.5)]" />
                    <span className="text-[10px] font-bold text-slate-300 uppercase tracking-tight">{r.descripcion}</span>
                 </div>
                 <button onClick={() => handleDeleteRecordatorio(r.id)} className="text-slate-600 hover:text-rose-500 opacity-0 group-hover:opacity-100 transition-all">
                   <Trash2 size={14} />
                 </button>
               </div>
             ))}
          </div>

          <form onSubmit={handleAddRecordatorio} className="relative">
            <input 
              value={nuevoRecordatorio}
              onChange={e => setNuevoRecordatorio(e.target.value)}
              placeholder="ANOTAR PRÓXIMO VIAJE..."
              className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-5 pr-12 text-[10px] text-white font-black uppercase outline-none focus:border-cyan-500 transition-all placeholder:text-slate-800"
            />
            <button type="submit" className="absolute right-2 top-2 p-2 bg-cyan-600 rounded-xl text-white hover:bg-cyan-500 shadow-lg transition-transform active:scale-90">
               <Plus size={16} strokeWidth={3} />
            </button>
          </form>
        </div>
      </header>

      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3 bg-white/5 p-2 rounded-[2.5rem] border border-white/5 w-fit shadow-inner backdrop-blur-md">
          <div className="p-3 bg-white/5 rounded-[1.8rem] text-cyan-500"><Calendar size={18} /></div>
          <div className="flex items-center gap-6 px-6 h-10">
            <select disabled={showAllTime} value={selectedMonth} onChange={(e) => setSelectedMonth(Number(e.target.value))} className="bg-transparent text-white font-black text-xs uppercase outline-none cursor-pointer hover:text-cyan-400 transition-colors disabled:opacity-20 appearance-none">
              {opcionesMeses.map((m) => <option key={m.id} value={m.id} className="bg-slate-950">{m.label}</option>)}
            </select>
            <div className="w-px h-5 bg-white/10" />
            <select disabled={showAllTime} value={selectedYear} onChange={(e) => setSelectedYear(Number(e.target.value))} className="bg-transparent text-white font-black text-xs uppercase outline-none cursor-pointer hover:text-cyan-400 transition-colors disabled:opacity-20 appearance-none">
              {listaAnios.map(y => <option key={y} value={y} className="bg-slate-950">{y}</option>)}
            </select>
          </div>
        </div>
        <button onClick={() => setShowAllTime(!showAllTime)} className={`flex items-center gap-3 px-8 py-4 rounded-[2.5rem] text-[10px] font-black uppercase tracking-[0.25em] transition-all border ${showAllTime ? 'bg-indigo-600 border-indigo-500 text-white shadow-xl shadow-indigo-600/30' : 'bg-white/5 border-white/5 text-slate-500 hover:text-white'}`}><Globe size={16} />{showAllTime ? 'Historial Absoluto' : 'Filtrar Período'}</button>
      </div>

      <div className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          <div className="bg-slate-900/40 p-8 rounded-[3rem] border border-white/5 relative overflow-hidden group">
            <Receipt className="absolute -right-4 -top-4 w-24 h-24 text-white opacity-5 group-hover:scale-110 transition-transform" />
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Facturación Bruta</p>
            <p className="text-4xl font-black text-white italic tracking-tighter">$ {(totalFacturado ?? 0).toLocaleString()}</p>
          </div>

          <div className="bg-slate-900/40 p-8 rounded-[3rem] border border-emerald-500/20 relative overflow-hidden group ring-1 ring-emerald-500/10 shadow-[0_0_40px_rgba(16,185,129,0.05)]">
            <DollarSign className="absolute -right-4 -top-4 w-24 h-24 text-emerald-400 opacity-10" />
            <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2">Utilidad Neta Real</p>
            <p className="text-4xl font-black text-emerald-400 italic tracking-tighter">$ {(totalNeto ?? 0).toLocaleString()}</p>
          </div>

          <div className="bg-slate-900/40 p-8 rounded-[3rem] border border-cyan-500/20 relative overflow-hidden group">
            <Percent className="absolute -right-4 -top-4 w-24 h-24 text-cyan-500 opacity-5" />
            <p className="text-[9px] font-black text-cyan-600 uppercase tracking-widest mb-2">Limpio Final s/IVA</p>
            <p className="text-4xl font-black text-cyan-500 italic tracking-tighter">$ {(totalSiva ?? 0).toLocaleString()}</p>
          </div>

          <div className="bg-slate-900/40 p-8 rounded-[3rem] border border-white/5 relative overflow-hidden group">
            <TrendingUp className={`absolute -right-4 -top-4 w-24 h-24 ${themeColor} opacity-5 group-hover:scale-110 transition-transform`} />
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-2">Distancia Total ({activeTab})</p>
            <p className="text-4xl font-black text-white italic tracking-tighter">{(totalKm ?? 0).toLocaleString()} <span className="text-xs not-italic text-slate-500 ml-1">KM</span></p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-slate-950/40 p-6 rounded-[2.5rem] border border-white/5 flex items-center gap-6 group hover:bg-slate-900/60 transition-all">
            <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500 shadow-inner group-hover:scale-110 transition-transform"><Droplets size={24}/></div>
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Gasoil Utilizado</p>
              <p className="text-2xl font-black text-white italic">{(totalLts ?? 0).toLocaleString()} <span className="text-xs text-slate-600 tracking-normal">LTS</span></p>
            </div>
          </div>

          <div className="bg-slate-950/40 p-6 rounded-[2.5rem] border border-white/5 flex items-center gap-6 group hover:bg-slate-900/60 transition-all">
            <div className="p-4 bg-rose-500/10 rounded-2xl text-rose-500 shadow-inner group-hover:scale-110 transition-transform"><UserCheck size={24}/></div>
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Pagos a Choferes</p>
              <p className="text-2xl font-black text-white italic">$ {(totalChofer ?? 0).toLocaleString()}</p>
            </div>
          </div>

          <div className="bg-slate-950/40 p-6 rounded-[2.5rem] border border-white/5 flex items-center gap-6 group hover:bg-slate-900/60 transition-all">
            <div className="p-4 bg-indigo-500/10 rounded-2xl text-indigo-500 shadow-inner group-hover:scale-110 transition-transform"><Wrench size={24}/></div>
            <div>
              <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Costos Operativos</p>
              <p className="text-2xl font-black text-white italic">$ {(totalCostos ?? 0).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="flex flex-col xl:flex-row gap-6 items-end pt-4">
          <div className="bg-white/5 p-2 rounded-[2rem] flex gap-2 border border-white/5 w-full xl:w-auto">
            {/* BOTÓN IDA */}
            <button onClick={() => setActiveTab('ida')} className={`flex-1 xl:flex-none px-8 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === 'ida' ? 'bg-emerald-600 text-white shadow-xl shadow-emerald-600/30' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
              <ArrowRight size={14} strokeWidth={3} /> Ida
            </button>
            {/* BOTÓN RETORNO */}
            <button onClick={() => setActiveTab('retorno')} className={`flex-1 xl:flex-none px-8 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === 'retorno' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-600/30' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
              <ArrowLeft size={14} strokeWidth={3} /> Retorno
            </button>
            {/* BOTÓN GLOBAL */}
            <button onClick={() => setActiveTab('global')} className={`flex-1 xl:flex-none px-8 py-5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${activeTab === 'global' ? 'bg-cyan-600 text-white shadow-xl shadow-cyan-600/30' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}>
              <Globe size={14} strokeWidth={3} /> General
            </button>
          </div>

          <div className="relative flex-1 w-full group">
              <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-cyan-500 transition-colors" />
              <input value={search} onChange={e => setSearch(e.target.value)} placeholder={`BUSCAR EN ${activeTab.toUpperCase()}...`} className={`w-full bg-slate-950/80 border border-white/10 rounded-[2.5rem] py-5 pl-14 pr-6 text-white font-bold outline-none ${activeTab === 'global' ? 'focus:border-cyan-500/50' : activeTab === 'retorno' ? 'focus:border-indigo-500/50' : 'focus:border-emerald-500/50'} uppercase italic transition-all placeholder:text-slate-800 shadow-inner`} />
          </div>
          
          <button onClick={onOpenModal} className={`px-12 py-5 ${buttonColor} text-white rounded-[2.5rem] font-black uppercase tracking-[0.3em] text-[11px] transition-all active:scale-95 flex items-center gap-4 shadow-2xl`}>
              <Plus size={20} strokeWidth={4} /> {activeTab === 'retorno' ? 'Cargar Retorno' : 'Nuevo Viaje'}
          </button>
      </div>
    </div>
  )
}