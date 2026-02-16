'use client'
import { 
  UserCircle, Truck, Trash2, Edit3, 
  Milestone, DollarSign, AlertCircle,
  Wallet, ArrowRight, ShieldCheck, AlertTriangle, 
  Calendar, IdCard // <--- Agregué IdCard
} from 'lucide-react'

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
  
  // --- LÓGICA DE VENCIMIENTO ---
  const tieneVencimiento = Boolean(chofer.vencimiento_licencia)
  const vencimiento = tieneVencimiento ? new Date(chofer.vencimiento_licencia) : new Date()
  const hoy = new Date()
  const estaVencido = tieneVencimiento && vencimiento < hoy
  const vencePronto = tieneVencimiento && !estaVencido && (vencimiento.getTime() - hoy.getTime()) / (1000 * 3600 * 24) <= 30
  
  const saldoSeguro = saldoPendiente ?? 0
  const tieneDeuda = saldoSeguro > 0

  return (
    <div className="group bg-slate-900/40 border border-white/5 rounded-[3.5rem] p-2 hover:bg-slate-800/40 transition-all duration-500 italic">
      <div className="bg-[#020617] rounded-[3rem] p-8 h-full flex flex-col justify-between relative overflow-hidden shadow-2xl font-sans">
        
        {/* --- ETIQUETA SUPERIOR: ESTADO (Semaforo general) --- */}
        <div className="absolute top-0 right-0 z-20">
           {tieneVencimiento ? (
             <div className={`px-6 py-3 rounded-bl-3xl text-[9px] font-black uppercase tracking-widest shadow-xl flex items-center gap-2 ${
                estaVencido ? 'bg-rose-600 text-white animate-pulse' : 
                vencePronto ? 'bg-amber-500 text-black' : 
                'bg-white/5 text-slate-500 border-l border-b border-white/10'
             }`}>
                {estaVencido ? <AlertCircle size={12}/> : vencePronto ? <AlertTriangle size={12}/> : <ShieldCheck size={12}/>}
                {estaVencido ? 'Atención Requerida' : vencePronto ? 'Revisar Legajo' : 'Legajo Activo'}
             </div>
           ) : (
             <div className="px-6 py-3 rounded-bl-3xl text-[9px] font-black uppercase tracking-widest bg-slate-800 text-slate-500 border-l border-b border-white/10 flex items-center gap-2">
                <AlertCircle size={12}/> Sin Datos
             </div>
           )}
        </div>

        <div className="space-y-6 pt-4">
          
          {/* --- INFO DEL CHOFER (CABECERA REDISEÑADA) --- */}
          <div className="flex gap-4 items-start">
            {/* Avatar */}
            <div className={`p-3.5 rounded-[1.5rem] bg-slate-950 border border-white/10 shadow-inner transition-colors duration-500 shrink-0 ${estaVencido ? 'text-rose-500 group-hover:bg-rose-500/10' : 'text-slate-400 group-hover:text-indigo-400 group-hover:bg-indigo-500/10'}`}>
              <UserCircle size={32} strokeWidth={1.5} />
            </div>
            
            {/* Textos */}
            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-black text-white italic uppercase leading-none tracking-tighter truncate group-hover:text-indigo-400 transition-colors mb-2">
                {chofer.nombre}
              </h2>
              
              {/* NUEVO: Badges de Licencia y Vencimiento */}
              <div className="flex flex-wrap gap-2">
                
                {/* Badge Nro Licencia */}
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 border border-white/5">
                    <IdCard size={12} className="text-slate-500"/>
                    <span className="text-[10px] font-bold text-slate-300 font-mono tracking-wider">
                        {chofer.licencia || 'S/D'}
                    </span>
                </div>

                {/* Badge Fecha Vencimiento */}
                {tieneVencimiento && (
                    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border ${
                        estaVencido ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                        vencePronto ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                        'bg-slate-800/50 border-white/5 text-emerald-400/80'
                    }`}>
                        <Calendar size={12} />
                        <span className="text-[10px] font-bold tracking-wider">
                           Vence: {vencimiento.toLocaleDateString('es-AR')}
                        </span>
                    </div>
                )}
              </div>
            </div>
          </div>

          {/* --- BLOQUE DE DEUDA / SALDO --- */}
          <div 
             onClick={() => onViewStats(chofer)} 
             className={`p-6 rounded-[2.5rem] border cursor-pointer relative overflow-hidden transition-all duration-500 group/balance ${
            tieneDeuda 
            ? 'bg-rose-500/10 border-rose-500/30 hover:bg-rose-500/20' 
            : 'bg-emerald-500/5 border-emerald-500/10 hover:bg-emerald-500/10'
          }`}>
             <Wallet className={`absolute -right-4 -bottom-4 w-24 h-24 opacity-5 transition-transform group-hover/balance:scale-110 ${tieneDeuda ? 'text-rose-500' : 'text-emerald-500'}`} />
             
             <div className="flex justify-between items-center relative z-10">
                <div className="space-y-1">
                   <div className="flex items-center gap-2">
                      <div className={`p-1.5 rounded-lg ${tieneDeuda ? 'bg-rose-500 text-white' : 'bg-emerald-500 text-white'}`}>
                        <DollarSign size={14} strokeWidth={3}/>
                      </div>
                      <span className={`text-[10px] font-black uppercase tracking-widest ${tieneDeuda ? 'text-rose-400' : 'text-emerald-500'}`}>
                        {tieneDeuda ? 'Pendiente' : 'Al Día'}
                      </span>
                   </div>
                   <p className="text-[9px] font-bold text-slate-500 uppercase pl-1">Saldo acumulado</p>
                </div>
                <div className="text-right">
                  <p className={`text-3xl font-black tracking-tighter italic ${tieneDeuda ? 'text-rose-500' : 'text-emerald-400'}`}>
                    $ {saldoSeguro.toLocaleString()}
                  </p>
                  {tieneDeuda && <p className="text-[9px] font-bold text-rose-400 uppercase flex justify-end items-center gap-1">Liquidar <ArrowRight size={10}/></p>}
                </div>
             </div>
          </div>

          {/* --- DATOS OPERATIVOS --- */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950/50 border border-white/5 p-4 rounded-3xl">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Milestone size={12} className="text-indigo-500"/> 
                <span className="text-[8px] font-black uppercase tracking-widest">Recorrido</span>
              </div>
              <p className="text-xl font-black text-white italic tracking-tighter">
                {(totalKm ?? 0).toLocaleString()} <span className="text-[9px] not-italic text-slate-600">KM</span>
              </p>
            </div>
            
            <div className="bg-slate-950/50 border border-white/5 p-4 rounded-3xl">
               <div className="flex justify-between items-center mb-1">
                  <span className="text-[8px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-1"><Truck size={12} className="text-cyan-500"/> Unidad</span>
               </div>
               <p className="text-sm font-black text-white uppercase italic tracking-wider truncate">
                 {camion ? camion.patente : 'SIN ASIGNAR'}
               </p>
            </div>
          </div>
        </div>

        {/* --- BOTONES DE ACCIÓN --- */}
        <div className="mt-8 pt-6 border-t border-white/5 flex flex-col gap-4">
          
          <button 
            onClick={() => onViewStats(chofer)}
            className={`w-full py-4 rounded-2xl border font-black uppercase tracking-[0.2em] text-xs transition-all active:scale-95 flex items-center justify-center gap-3 shadow-lg ${
              tieneDeuda 
              ? 'bg-rose-600 hover:bg-rose-500 text-white border-rose-500 shadow-rose-900/20' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white border-indigo-500 shadow-indigo-900/20'
            }`}
          >
            {tieneDeuda ? <AlertCircle size={18} /> : <Wallet size={18} />}
            {tieneDeuda ? 'Gestionar Pagos' : 'Ver Cuenta Corriente'}
          </button>

          <div className="flex gap-2 justify-center">
             <button 
               onClick={() => onEdit(chofer)} 
               className="px-6 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-bold uppercase tracking-wider text-slate-400 hover:text-white transition-all border border-white/5 flex items-center gap-2"
             >
               <Edit3 size={14} /> Editar
             </button>
             <button 
               onClick={() => onDelete(chofer.id, chofer.nombre)} 
               className="px-4 py-3 bg-white/5 hover:bg-rose-500/10 rounded-xl text-slate-500 hover:text-rose-500 transition-all border border-white/5"
             >
               <Trash2 size={14} />
             </button>
          </div>
        </div>

      </div>
    </div>
  )
}