'use client'
import { Truck, User, Droplets, Gauge, Edit3, Trash2, DollarSign } from 'lucide-react'

interface CamionCardProps {
  camion: any;
  chofer: any;
  totalGastos: number;
  onEdit: (camion: any) => void;
  onDelete: (id: string, patente: string) => void;
  onAddGasto: (camion: any) => void;
  onShowHistory: (camion: any) => void; // Nueva función para ver el historial
}

export function CamionCard({ 
  camion, 
  chofer, 
  totalGastos, 
  onEdit, 
  onDelete, 
  onAddGasto,
  onShowHistory 
}: CamionCardProps) {
  
  // CONFIGURACIÓN: Service cada 32.000km
  const intervaloService = 32000;
  const kmDesdeUltimoService = (camion.km_actual || 0) - (camion.ultimo_cambio_aceite || 0);
  const kmRestantes = intervaloService - kmDesdeUltimoService;
  
  const estaVencido = kmRestantes <= 0;
  const serviceUrgente = kmRestantes < 2000;

  return (
    <div className="group bg-slate-900/40 border border-white/5 rounded-[3rem] p-2 hover:bg-slate-800/40 transition-all duration-300">
      <div className="bg-[#020617] rounded-[2.5rem] p-8 h-full flex flex-col justify-between relative overflow-hidden shadow-2xl">
        
        {/* BADGE DINÁMICO DE SERVICE */}
        <div className={`absolute top-0 right-0 px-8 py-3 rounded-bl-3xl text-[9px] font-black uppercase tracking-widest transition-all ${
          estaVencido 
            ? 'bg-rose-600 text-white animate-pulse' 
            : serviceUrgente 
              ? 'bg-amber-500 text-black' 
              : 'bg-emerald-500/10 text-emerald-500'
        }`}>
          {estaVencido ? 'MANTENIMIENTO VENCIDO' : serviceUrgente ? 'SERVICE PRÓXIMO' : 'MECÁNICA AL DÍA'}
        </div>

        <div className="space-y-6 pt-2">
          <div className="flex gap-4 items-start">
            <div className={`p-4 rounded-2xl bg-slate-950 border border-white/10 shadow-lg ${estaVencido ? 'text-rose-500 shadow-rose-500/20' : 'text-cyan-500 shadow-cyan-500/20'}`}>
              <Truck size={32} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{camion.modelo || 'Sin Modelo'}</p>
              <h2 className="text-4xl font-black text-white italic uppercase leading-none tracking-tighter">{camion.patente}</h2>
            </div>
          </div>

          {/* KILOMETRAJE Y ESTADO DE SERVICE */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950/50 border border-white/5 p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-slate-500 mb-1 font-black text-[9px] uppercase tracking-widest">
                <Gauge size={12} className="text-cyan-500"/> KM Actual
              </div>
              <p className="text-xl font-black text-white italic">{camion.km_actual?.toLocaleString() || 0}</p>
            </div>
            
            <div className={`p-4 rounded-2xl border ${
              estaVencido 
                ? 'bg-rose-500/5 border-rose-500/20' 
                : 'bg-slate-950/50 border-white/5'
            }`}>
              <div className="flex items-center gap-2 text-slate-500 mb-1 font-black text-[9px] uppercase tracking-widest">
                <Droplets size={12} className={estaVencido ? 'text-rose-500' : 'text-amber-500'}/> Service
              </div>
              <p className={`text-xl font-black italic leading-none ${estaVencido ? 'text-rose-500' : 'text-slate-200'}`}>
                {estaVencido 
                  ? `-${Math.abs(kmRestantes).toLocaleString()} KM` 
                  : `${kmRestantes.toLocaleString()} KM`
                }
              </p>
              <p className="text-[7px] font-black text-slate-600 mt-1 uppercase">
                {estaVencido ? 'HACE CUANTOS KM' : 'RESTANTES'}
              </p>
            </div>
          </div>

          {/* SECCIÓN DE GASTOS (Click para ver historial) */}
          <div 
            onClick={() => onShowHistory(camion)}
            className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl flex justify-between items-center group/gasto cursor-pointer hover:bg-emerald-500/10 transition-all"
          >
            <div className="flex items-center gap-2">
              <DollarSign size={14} className="text-emerald-500" />
              <span className="text-[10px] font-black text-emerald-600 uppercase italic">Gastos Acumulados</span>
            </div>
            <p className="text-sm font-black text-white italic tracking-tighter">
              $ {totalGastos?.toLocaleString() || 0}
            </p>
          </div>

          {/* OPERADOR */}
          <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
            <span className="text-[10px] font-black text-slate-500 uppercase flex gap-2 items-center"><User size={14} className="text-cyan-400"/> Operador Actual</span>
            <span className="text-xs font-black text-slate-200 uppercase italic truncate max-w-[150px]">
                {chofer ? chofer.nombre : 'DISPONIBLE'}
            </span>
          </div>
        </div>

        {/* ACCIONES */}
        <div className="mt-8 pt-6 border-t border-white/5 flex justify-end gap-2">
          {/* BOTÓN PARA CARGAR GASTO */}
          <button 
            onClick={(e) => { e.stopPropagation(); onAddGasto(camion); }} 
            className="p-3 bg-emerald-500/10 hover:bg-emerald-600 hover:text-white rounded-xl text-emerald-500 transition-all border border-emerald-500/20"
            title="Cargar Gasto"
          >
            <DollarSign size={18} />
          </button>

          <button onClick={(e) => { e.stopPropagation(); onEdit(camion); }} className="p-3 bg-white/5 hover:bg-cyan-600 hover:text-white rounded-xl text-slate-400 transition-all border border-white/5">
            <Edit3 size={18} />
          </button>
          <button onClick={(e) => { e.stopPropagation(); onDelete(camion.id, camion.patente); }} className="p-3 bg-rose-500/10 hover:bg-rose-600 hover:text-white rounded-xl text-rose-500 transition-all border border-rose-500/20">
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}