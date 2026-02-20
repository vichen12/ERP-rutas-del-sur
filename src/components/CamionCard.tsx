'use client'
import { 
  Truck, Gauge, Droplets, Calendar, ShieldCheck, 
  DollarSign, User, AlertTriangle, AlertCircle, 
  Edit3, Trash2, Plus, History 
} from 'lucide-react'

// Definimos la interfaz con props opcionales para evitar que el render se congele
interface CamionCardProps {
  camion: any;
  chofer: any;
  totalGastos?: number;
  onEdit: (camion: any) => void;
  onDelete: (id: string, patente: string) => void;
  onAddGasto?: (camion: any) => void; // Opcional
  onShowHistory?: (camion: any) => void; // Opcional
}

export function CamionCard({ 
  camion, 
  chofer, 
  totalGastos = 0, // Valor por defecto
  onEdit, 
  onDelete, 
  onAddGasto, 
  onShowHistory 
}: CamionCardProps) {
  
  // --- 🔧 MANTENIMIENTO: ACEITE (Intervalo 20.000 KM) ---
  const intervaloService = 20000;
  const kmActual = Number(camion.km_actual) || 0;
  const kmUltimoService = Number(camion.km_ultimo_service) || 0;
  const kmDesdeUltimoService = kmActual - kmUltimoService;
  const kmRestantesService = intervaloService - kmDesdeUltimoService;
  
  const serviceVencido = kmDesdeUltimoService >= intervaloService;
  const serviceAlerta = !serviceVencido && kmRestantesService <= 2000;

  // --- 📅 LÓGICA DE VENCIMIENTOS (RTO Y SENASA) ---
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  const getDiasRestantes = (fechaStr: string | null) => {
    if (!fechaStr) return null;
    const fecha = new Date(fechaStr);
    fecha.setHours(0, 0, 0, 0);
    const diffTime = fecha.getTime() - hoy.getTime();
    return Math.ceil(diffTime / (1000 * 3600 * 24));
  };

  const diasRto = getDiasRestantes(camion.vto_rto);
  const diasSenasa = getDiasRestantes(camion.vto_senasa);

  const rtoVencida = diasRto !== null && diasRto < 0;
  const rtoPorVencer = diasRto !== null && diasRto >= 0 && diasRto <= 30;

  const senasaVencido = diasSenasa !== null && diasSenasa < 0;
  const senasaPorVencer = diasSenasa !== null && diasSenasa >= 0 && diasSenasa <= 30;

  // --- 🚨 ESTADOS CRÍTICOS ---
  const isDanger = rtoVencida || senasaVencido || serviceVencido;
  const isWarning = rtoPorVencer || senasaPorVencer || serviceAlerta;

  return (
    <div className="group bg-[#020617] rounded-[2.5rem] border border-white/10 hover:border-white/20 transition-all duration-300 shadow-2xl flex flex-col h-full overflow-hidden relative">
      
      {/* Reflejo de estado superior */}
      <div className={`absolute top-0 left-0 w-full h-[2px] opacity-70 ${
        isDanger ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-white/30'
      }`} />

      <div className="p-7 flex flex-col justify-between h-full relative z-10">
        
        {/* --- 1. CABECERA --- */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4 items-center">
            <div className="relative">
              <div className={`w-14 h-14 rounded-2xl border flex items-center justify-center shadow-inner transition-colors ${
                isDanger ? 'bg-rose-500/10 border-rose-500/30 text-rose-500' : 'bg-white/5 border-white/10 text-cyan-400'
              }`}>
                <Truck size={28} strokeWidth={1.5} />
              </div>
              <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-[2.5px] border-[#020617] ${
                camion.estado === 'En Viaje' ? 'bg-cyan-500' : camion.estado === 'En Taller' ? 'bg-rose-500' : 'bg-emerald-500'
              }`} />
            </div>

            <div>
              <h2 className="text-3xl font-black italic uppercase leading-none tracking-tighter text-white">
                {camion.patente}
              </h2>
              <div className="flex gap-2 items-center mt-1.5">
                 <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest border ${
                   camion.estado === 'En Viaje' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 
                   camion.estado === 'En Taller' ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 
                   'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                 }`}>
                   {camion.estado || 'DISPONIBLE'}
                 </span>
                 <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">{camion.modelo || 'S/M'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* --- 🚨 BANNER DE ALERTA DINÁMICO --- */}
        {(isDanger || isWarning) && (
          <div className={`mb-5 px-4 py-3 rounded-2xl flex items-center gap-3 border backdrop-blur-md ${
             isDanger ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' : 'bg-amber-500/10 border-amber-500/30 text-amber-400'
          }`}>
             {isDanger ? <AlertCircle size={20} /> : <AlertTriangle size={20} />}
             <div className="flex-1">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] mb-0.5 opacity-80">
                   {isDanger ? 'BLOQUEO OPERATIVO' : 'ATENCIÓN PREVENTIVA'}
                </p>
                <p className="text-xs font-bold leading-tight text-white">
                   {serviceVencido ? 'Requiere cambio de aceite inmediato' : 
                    rtoVencida ? 'Documentación RTO Vencida' : 
                    senasaVencido ? 'Vencimiento SENASA detectado' : 
                    'Revisiones legales próximas'}
                </p>
             </div>
          </div>
        )}

        {/* --- BENTO BOX GRID --- */}
        <div className="space-y-3 flex-1">
          
          <div className="grid grid-cols-2 gap-3">
            {/* KM ACTUAL */}
            <div className="bg-slate-900/60 border border-white/5 rounded-[1.2rem] p-4 flex flex-col justify-center">
               <div className="flex items-center gap-1.5 mb-1.5 text-slate-500">
                 <Gauge size={14} />
                 <span className="text-[9px] font-black uppercase tracking-widest">Odómetro</span>
               </div>
               <p className="text-xl font-black text-white italic tabular-nums leading-none">
                 {kmActual.toLocaleString()} <span className="text-[10px] text-slate-600 not-italic">KM</span>
               </p>
            </div>
            
            {/* SERVICE ACEITE */}
            <div className={`border rounded-[1.2rem] p-4 flex flex-col justify-center ${
              serviceVencido ? 'bg-rose-500/10 border-rose-500/30' : 
              serviceAlerta ? 'bg-amber-500/10 border-amber-500/30' : 
              'bg-slate-900/60 border-white/5'
            }`}>
               <div className="flex items-center gap-1.5 mb-1.5">
                 <Droplets size={14} className={serviceVencido ? 'text-rose-500' : serviceAlerta ? 'text-amber-500' : 'text-slate-400'} />
                 <span className={`text-[9px] font-black uppercase tracking-widest ${
                   serviceVencido ? 'text-rose-500' : serviceAlerta ? 'text-amber-500' : 'text-slate-500'
                 }`}>Service</span>
               </div>
               <p className={`text-xl font-black italic tabular-nums leading-none ${
                 serviceVencido ? 'text-rose-400' : serviceAlerta ? 'text-amber-400' : 'text-slate-200'
               }`}>
                 {kmDesdeUltimoService.toLocaleString()} <span className="text-[10px] opacity-40 not-italic">/ 20k</span>
               </p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* RTO */}
            <div className={`border rounded-[1.2rem] p-4 flex flex-col justify-center ${
              rtoVencida ? 'bg-rose-500/10 border-rose-500/30' : 
              rtoPorVencer ? 'bg-amber-500/10 border-amber-500/30' : 
              'bg-slate-900/60 border-white/5'
            }`}>
                <div className="flex items-center gap-1.5 mb-1.5 text-slate-500">
                   <Calendar size={14} className={rtoVencida ? 'text-rose-500' : rtoPorVencer ? 'text-amber-500' : ''} />
                   <span className="text-[9px] font-black uppercase tracking-widest">RTO Vto</span>
                </div>
                <p className="text-sm font-black text-white italic">
                  {camion.vto_rto ? new Date(camion.vto_rto).toLocaleDateString('es-AR') : 'S/D'}
                </p>
            </div>

            {/* SENASA */}
            <div className={`border rounded-[1.2rem] p-4 flex flex-col justify-center ${
              senasaVencido ? 'bg-rose-500/10 border-rose-500/30' : 
              senasaPorVencer ? 'bg-amber-500/10 border-amber-500/30' : 
              'bg-slate-900/60 border-white/5'
            }`}>
                <div className="flex items-center gap-1.5 mb-1.5 text-slate-500">
                   <ShieldCheck size={14} className={senasaVencido ? 'text-rose-500' : senasaPorVencer ? 'text-amber-500' : ''} />
                   <span className="text-[9px] font-black uppercase tracking-widest">SENASA</span>
                </div>
                <p className="text-sm font-black text-white italic">
                  {camion.vto_senasa ? new Date(camion.vto_senasa).toLocaleDateString('es-AR') : 'S/D'}
                </p>
            </div>
          </div>

          {/* OPERADOR Y GASTOS */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/60 border border-white/5 p-4 rounded-[1.2rem]">
               <div className="flex items-center gap-1.5 mb-1.5 text-slate-500">
                  <User size={14} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Operador</span>
               </div>
               <p className="text-xs font-black text-slate-200 uppercase truncate">
                 {chofer?.nombre || 'SIN ASIGNAR'}
               </p>
            </div>

            <div className="bg-emerald-500/5 border border-emerald-500/20 p-4 rounded-[1.2rem] relative group cursor-pointer" onClick={() => onShowHistory?.(camion)}>
               <div className="flex items-center gap-1.5 mb-1.5 text-emerald-600">
                  <DollarSign size={14} />
                  <span className="text-[9px] font-black uppercase tracking-widest">Gastos</span>
               </div>
               <p className="text-lg font-black text-emerald-400 italic tabular-nums leading-none">
                 $ {totalGastos.toLocaleString()}
               </p>
            </div>
          </div>

        </div>

        {/* --- 5. BOTONES DE ACCIÓN (CON OPCIONALES) --- */}
        <div className="mt-6 pt-6 border-t border-white/5 flex gap-2">
          <button 
            onClick={() => onAddGasto?.(camion)} 
            className="flex-[2] py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-[9px] font-black uppercase tracking-widest flex justify-center items-center gap-1.5 transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
          >
            <Plus size={14} strokeWidth={3} /> Gasto
          </button>
          
          <button 
            onClick={() => onShowHistory?.(camion)} 
            className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl flex justify-center items-center transition-all border border-white/5" 
            title="Historial"
          >
            <History size={18} />
          </button>
          
          <button 
            onClick={() => onEdit(camion)} 
            className="flex-1 py-3 bg-sky-500/10 hover:bg-sky-500 text-sky-400 hover:text-white rounded-xl flex justify-center items-center transition-all border border-sky-500/20" 
            title="Editar"
          >
            <Edit3 size={18} />
          </button>
          
          <button 
            onClick={() => onDelete(camion.id, camion.patente)} 
            className="flex-1 py-3 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl flex justify-center items-center transition-all border border-rose-500/20" 
            title="Eliminar"
          >
            <Trash2 size={18} />
          </button>
        </div>

      </div>
    </div>
  )
}