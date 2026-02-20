'use client'
import { 
  UserCircle, Truck, Trash2, Edit3, 
  Milestone, DollarSign, AlertCircle,
  Wallet, ShieldCheck, AlertTriangle, 
  IdCard, Activity, Clock, Ban
} from 'lucide-react'
import Image from 'next/image'

interface ChoferCardProps {
  chofer: any;
  camion: any;
  totalKm: number;
  totalViajes: number;
  saldoPendiente: number; 
  onEdit: (chofer: any) => void;
  onDelete: (id: string, nombre: string) => void;
  onViewStats: (chofer: any) => void;
}

export function ChoferCard({ 
  chofer, camion, totalKm, totalViajes, saldoPendiente, onEdit, onDelete, onViewStats 
}: ChoferCardProps) {
  
  // --- LÓGICA DE VENCIMIENTO MILIMÉTRICA ---
  const tieneVencimiento = Boolean(chofer.vto_licencia);
  const vencimiento = tieneVencimiento ? new Date(chofer.vto_licencia) : null;
  const hoy = new Date();
  
  hoy.setHours(0,0,0,0);
  if (vencimiento) vencimiento.setHours(0,0,0,0);

  const diasRestantes = vencimiento 
    ? Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 3600 * 24)) 
    : null;

  const estaVencido = diasRestantes !== null && diasRestantes < 0;
  const vencePronto = diasRestantes !== null && diasRestantes >= 0 && diasRestantes <= 30;
  
  const saldoSeguro = saldoPendiente ?? 0;
  const tieneDeuda = saldoSeguro > 0;

  // --- ESTILOS DINÁMICOS DEL CONTENEDOR (Estilo BENTO) ---
  const isDanger = estaVencido;
  const isWarning = vencePronto;

  const topBorderColor = isDanger ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : 'bg-white/10';

  return (
    <div className="group rounded-[2.5rem] p-[1px] bg-gradient-to-b from-white/10 to-transparent hover:from-white/20 transition-all duration-500 h-full shadow-2xl relative overflow-hidden">
      
      {/* Contenedor Principal (Cristal Oscuro) */}
      <div className="bg-[#020617]/95 backdrop-blur-2xl rounded-[2.4rem] p-6 flex flex-col justify-between relative h-full">
        
        {/* Acento superior elegante */}
        <div className={`absolute top-0 left-0 w-full h-1 ${topBorderColor} opacity-80`} />
        
        {/* Glow de Deuda Fijo (si hay deuda, pero sin animaciones locas) */}
        {tieneDeuda && (
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-rose-500/10 blur-[80px] rounded-full pointer-events-none" />
        )}

        {/* --- 1. CABECERA: AVATAR Y DATOS PERSONALES --- */}
        <div className="flex justify-between items-start mb-6 pt-1 relative z-10">
          <div className="flex gap-4 items-center">
            
            {/* AVATAR CON FOTO O ÍCONO (Tamaño ajustado a la CamionCard) */}
            <div className="relative">
              <div className={`w-14 h-14 rounded-[1.2rem] bg-gradient-to-br from-slate-800 to-slate-950 border border-white/10 shadow-inner flex items-center justify-center overflow-hidden transition-colors ${isDanger ? 'border-rose-500/50 text-rose-500' : isWarning ? 'border-amber-500/50 text-amber-500' : 'text-slate-300 group-hover:text-white'}`}>
                {chofer.foto_url ? (
                  <Image 
                    src={chofer.foto_url} 
                    alt={`Foto de ${chofer.nombre}`} 
                    fill 
                    className="object-cover"
                  />
                ) : (
                  <UserCircle size={26} strokeWidth={1.5} />
                )}
              </div>
              
              {/* Punto de Disponibilidad */}
              <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-[2.5px] border-[#020617] ${chofer.estado === 'En Viaje' ? 'bg-cyan-500' : chofer.estado === 'Franco' ? 'bg-indigo-500' : 'bg-emerald-500'}`} title={chofer.estado || 'Disponible'} />
            </div>

            <div className="flex flex-col justify-center">
              <h2 className="text-2xl font-black italic uppercase leading-none tracking-tighter text-white truncate max-w-[180px]">
                {chofer.nombre}
              </h2>
              <div className="flex gap-2 items-center mt-1.5">
                 <span className={`px-1.5 py-0.5 rounded-[5px] text-[7px] font-black uppercase tracking-widest border ${chofer.estado === 'En Viaje' ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : chofer.estado === 'Franco' ? 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'}`}>
                   {chofer.estado || 'DISPONIBLE'}
                 </span>
                 <span className="w-1 h-1 rounded-full bg-slate-700" />
                 <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1">
                   <IdCard size={10} /> {chofer.licencia || 'S/D'}
                 </span>
              </div>
            </div>
          </div>
        </div>

        {/* --- 🚨 BANNER DE VENCIMIENTO (SOBRIO Y ELEGANTE) --- */}
        {(estaVencido || vencePronto) && (
          <div className={`mb-5 p-3 rounded-[1rem] flex items-start gap-3 border shadow-sm ${
             estaVencido 
             ? 'bg-rose-950/20 border-rose-500/20' 
             : 'bg-amber-950/10 border-amber-500/20'
          }`}>
             <div className={`mt-0.5 ${estaVencido ? 'text-rose-500' : 'text-amber-500'}`}>
                {estaVencido ? <AlertCircle size={16} strokeWidth={2.5} /> : <AlertTriangle size={16} strokeWidth={2.5} />}
             </div>
             <div>
                <p className={`text-[9px] font-black uppercase tracking-widest ${estaVencido ? 'text-rose-500' : 'text-amber-500'}`}>
                   {estaVencido ? 'Bloqueo Operativo' : 'Atención Preventiva'}
                </p>
                <p className="text-[10px] font-bold uppercase tracking-tight text-slate-300 mt-0.5">
                   {estaVencido ? `Licencia vencida hace ${Math.abs(diasRestantes as number)} días` : `Licencia vence en ${diasRestantes} días`}
                </p>
             </div>
          </div>
        )}

        {/* --- BENTO BOX GRID --- */}
        <div className="space-y-3 flex-1">
          
          {/* FILA 1: LICENCIA Y KM */}
          <div className="grid grid-cols-2 gap-3">
            <div className={`p-3.5 rounded-[1.2rem] border flex flex-col justify-center transition-colors ${estaVencido ? 'bg-rose-950/30 border-rose-500/30' : vencePronto ? 'bg-amber-950/20 border-amber-500/30' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck size={12} className={estaVencido ? 'text-rose-500' : vencePronto ? 'text-amber-500' : 'text-emerald-500'} />
                    <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">LNH</span>
                  </div>
                </div>
                <div className="flex flex-col">
                  <p className={`text-sm font-black italic tabular-nums ${estaVencido ? 'text-rose-400' : vencePronto ? 'text-amber-400' : 'text-white'}`}>
                    {vencimiento ? vencimiento.toLocaleDateString('es-AR') : 'S/D'}
                  </p>
                  {(!estaVencido && !vencePronto && tieneVencimiento) && (
                    <span className="text-[8px] font-black uppercase tracking-wider mt-0.5 text-emerald-500/80">
                      VIGENTE
                    </span>
                  )}
                </div>
            </div>

            <div className="bg-slate-900/60 border border-white/5 rounded-[1.2rem] p-3.5 flex flex-col justify-center hover:bg-slate-800/60 transition-colors">
               <div className="flex items-center gap-1.5 mb-1.5">
                 <Milestone size={12} className="text-sky-400" />
                 <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Odómetro</span>
               </div>
               <p className="text-lg font-black text-white italic tracking-tighter tabular-nums leading-none">
                 {((chofer.km_recorridos || 0) + (totalKm || 0)).toLocaleString()} <span className="text-[10px] text-slate-600 not-italic">KM</span>
               </p>
            </div>
          </div>

          {/* FILA 2: UNIDAD Y DEUDA/SALDO */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900/60 border border-white/5 p-4 rounded-[1.2rem] flex flex-col justify-center">
               <div className="flex items-center gap-1.5 mb-1.5">
                  <Truck size={14} className="text-cyan-400" />
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Unidad</span>
               </div>
               <span className="text-xs font-black text-slate-200 uppercase truncate">
                 {camion ? camion.patente : 'SIN ASIGNAR'}
               </span>
            </div>

            <div onClick={() => onViewStats(chofer)} className={`border p-4 rounded-[1.2rem] flex flex-col justify-center cursor-pointer transition-colors group/balance ${tieneDeuda ? 'bg-rose-500/5 border-rose-500/20 hover:bg-rose-500/10' : 'bg-indigo-500/5 border-indigo-500/20 hover:bg-indigo-500/10'}`}>
               <div className="flex items-center gap-1.5 mb-1">
                  <DollarSign size={14} className={tieneDeuda ? 'text-rose-500' : 'text-indigo-400'} />
                  <span className={`text-[9px] font-black uppercase tracking-widest ${tieneDeuda ? 'text-rose-500' : 'text-indigo-400'}`}>
                    {tieneDeuda ? 'Pendiente' : 'Al Día'}
                  </span>
               </div>
               <p className={`text-lg font-black italic tracking-tighter tabular-nums ${tieneDeuda ? 'text-rose-400' : 'text-white'}`}>
                 $ {saldoSeguro.toLocaleString()}
               </p>
            </div>
          </div>

        </div>

        {/* --- 5. BOTONES DE ACCIÓN (Mismo layout que CamionCard) --- */}
        <div className="mt-5 pt-5 border-t border-white/5 flex gap-2 relative z-10">
           {/* Botón Principal */}
           <button 
             onClick={() => onViewStats(chofer)}
             className={`flex-[2] py-3.5 rounded-xl text-[10px] font-black uppercase tracking-widest flex justify-center items-center gap-1.5 shadow-sm active:scale-95 transition-all border ${tieneDeuda ? 'bg-rose-500/10 hover:bg-rose-500 text-rose-400 hover:text-white border-rose-500/20 hover:border-rose-500' : 'bg-indigo-500/10 hover:bg-indigo-500 text-indigo-400 hover:text-white border-indigo-500/20 hover:border-indigo-500'}`}
           >
             <Wallet size={14} strokeWidth={3} /> {tieneDeuda ? 'Liquidar' : 'Ver Ficha'}
           </button>
           
           {/* Botones Secundarios */}
           <button 
             onClick={() => onEdit(chofer)} 
             className="flex-1 py-3.5 bg-sky-500/5 hover:bg-sky-500/10 rounded-xl text-sky-400 flex justify-center items-center transition-all border border-sky-500/10 hover:border-sky-500/30" 
             title="Editar"
           >
             <Edit3 size={16} />
           </button>
           
           <button 
             onClick={() => onDelete(chofer.id, chofer.nombre)} 
             className="flex-1 py-3.5 bg-rose-500/5 hover:bg-rose-500/10 rounded-xl text-rose-400 flex justify-center items-center transition-all border border-rose-500/10 hover:border-rose-500/30" 
             title="Eliminar"
           >
             <Trash2 size={16} />
           </button>
        </div>

      </div>
    </div>
  )
}