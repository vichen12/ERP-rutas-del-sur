'use client'
import { Truck, User, Droplets, Gauge, Edit3, Trash2, DollarSign, CalendarCheck, AlertTriangle, ShieldCheck } from 'lucide-react'

interface CamionCardProps {
  camion: any;
  chofer: any;
  totalGastos: number;
  onEdit: (camion: any) => void;
  onDelete: (id: string, patente: string) => void;
  onAddGasto: (camion: any) => void;
  onShowHistory: (camion: any) => void;
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
  
  // Mantenimiento de Aceite
  const intervaloService = 20000;
  const kmDesdeUltimoService = (camion.km_actual || 0) - (camion.ultimo_cambio_aceite || 0);
  const kmRestantesService = intervaloService - kmDesdeUltimoService;
  const serviceVencido = kmRestantesService <= 0;
  const serviceUrgente = kmRestantesService < 2000;

  // LÓGICA TEMPORAL SEGURA
  const hoy = new Date();
  hoy.setHours(0, 0, 0, 0);

  // --- LÓGICA RTO ---
  let vencimientoRTO = null;
  if (camion.vencimiento_rto) {
    const [year, month, day] = camion.vencimiento_rto.split('T')[0].split('-').map(Number);
    vencimientoRTO = new Date(year, month - 1, day);
  }
  const rtoVencida = vencimientoRTO ? vencimientoRTO < hoy : false;
  const diasRestantesRTO = vencimientoRTO ? Math.ceil((vencimientoRTO.getTime() - hoy.getTime()) / (1000 * 3600 * 24)) : null;
  const rtoPorVencer = diasRestantesRTO !== null && diasRestantesRTO >= 0 && diasRestantesRTO <= 30;

  // --- NUEVA LÓGICA SENASA ---
  let vencimientoSenasa = null;
  if (camion.vencimiento_senasa) {
    const [sYear, sMonth, sDay] = camion.vencimiento_senasa.split('T')[0].split('-').map(Number);
    vencimientoSenasa = new Date(sYear, sMonth - 1, sDay);
  }
  const senasaVencido = vencimientoSenasa ? vencimientoSenasa < hoy : false;
  const diasRestantesSenasa = vencimientoSenasa ? Math.ceil((vencimientoSenasa.getTime() - hoy.getTime()) / (1000 * 3600 * 24)) : null;
  const senasaPorVencer = diasRestantesSenasa !== null && diasRestantesSenasa >= 0 && diasRestantesSenasa <= 30;

  return (
    <div className="group bg-slate-900/40 border border-white/5 rounded-[3rem] p-2 hover:bg-slate-800/40 transition-all duration-300 h-full">
      <div className="bg-[#020617] rounded-[2.5rem] p-8 h-full flex flex-col justify-between relative overflow-hidden shadow-2xl border border-white/5 group-hover:border-white/10 transition-colors italic">
        
        {/* BADGE DE ESTADO (Actualizado con SENASA) */}
        <div className={`absolute top-0 right-0 px-6 py-2 rounded-bl-3xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${
          rtoVencida || senasaVencido || serviceVencido 
            ? 'bg-rose-600 text-white animate-pulse' 
            : (rtoPorVencer || senasaPorVencer || serviceUrgente) 
              ? 'bg-amber-500 text-black' 
              : 'bg-emerald-500/10 text-emerald-500'
        }`}>
          {(rtoVencida || senasaVencido || serviceVencido) && <AlertTriangle size={12} />}
          {rtoVencida || senasaVencido ? 'DOC. VENCIDA' : serviceVencido ? 'SERVICE VENCIDO' : (rtoPorVencer || senasaPorVencer) ? 'VENCIMIENTO PRÓXIMO' : 'OPERATIVO'}
        </div>

        <div className="space-y-6 pt-4">
          <div className="flex gap-4 items-start">
            <div className={`p-4 rounded-2xl bg-slate-950 border border-white/10 shadow-lg ${rtoVencida || senasaVencido ? 'text-rose-500 shadow-rose-500/20' : 'text-cyan-500 shadow-cyan-500/20'}`}>
              <Truck size={32} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{camion.modelo || 'S/D'}</p>
              <h2 className="text-4xl font-black text-white italic uppercase leading-none tracking-tighter">{camion.patente}</h2>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950/50 border border-white/5 p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-slate-500 mb-1 font-black text-[9px] uppercase tracking-widest">
                <Gauge size={12} className="text-cyan-500"/> KM Actual
              </div>
              <p className="text-xl font-black text-white italic">{camion.km_actual?.toLocaleString() || 0}</p>
            </div>
            
            <div className={`p-4 rounded-2xl border ${serviceVencido ? 'bg-rose-500/5 border-rose-500/20' : 'bg-slate-950/50 border-white/5'}`}>
              <div className="flex items-center gap-2 text-slate-500 mb-1 font-black text-[9px] uppercase tracking-widest">
                <Droplets size={12} className={serviceVencido ? 'text-rose-500' : 'text-amber-500'}/> Service
              </div>
              <p className={`text-xl font-black italic truncate ${serviceVencido ? 'text-rose-500' : 'text-slate-200'}`}>
                {kmRestantesService.toLocaleString()} KM
              </p>
            </div>

            {/* BLOQUE RTO */}
            <div className={`col-span-2 p-4 rounded-2xl border flex items-center justify-between ${rtoVencida ? 'bg-rose-500/10 border-rose-500/30' : 'bg-slate-950/50 border-white/5'}`}>
              <div>
                <div className="flex items-center gap-2 text-slate-500 mb-1 font-black text-[9px] uppercase tracking-widest">
                  <CalendarCheck size={12} className={rtoVencida ? 'text-rose-500' : 'text-indigo-500'}/> Vencimiento RTO
                </div>
                <p className={`text-lg font-black italic ${rtoVencida ? 'text-rose-500' : 'text-white'}`}>
                  {vencimientoRTO ? vencimientoRTO.toLocaleDateString('es-AR') : 'SIN FECHA'}
                </p>
              </div>
              {vencimientoRTO && !rtoVencida && (
                <div className="px-3 py-1 bg-slate-800 text-slate-400 rounded-full text-[9px] font-black uppercase">
                  {diasRestantesRTO} DÍAS
                </div>
              )}
            </div>

            {/* NUEVO: BLOQUE SENASA */}
            <div className={`col-span-2 p-4 rounded-2xl border flex items-center justify-between ${senasaVencido ? 'bg-rose-500/10 border-rose-500/30' : 'bg-slate-950/50 border-white/5'}`}>
              <div>
                <div className="flex items-center gap-2 text-slate-500 mb-1 font-black text-[9px] uppercase tracking-widest">
                  <ShieldCheck size={12} className={senasaVencido ? 'text-rose-500' : 'text-emerald-500'}/> Certificado SENASA
                </div>
                <p className={`text-lg font-black italic ${senasaVencido ? 'text-rose-500' : 'text-white'}`}>
                  {vencimientoSenasa ? vencimientoSenasa.toLocaleDateString('es-AR') : 'SIN FECHA'}
                </p>
              </div>
              {vencimientoSenasa && !senasaVencido && (
                <div className="px-3 py-1 bg-slate-800 text-slate-400 rounded-full text-[9px] font-black uppercase">
                  {diasRestantesSenasa} DÍAS
                </div>
              )}
            </div>
          </div>

          <div 
            onClick={() => onShowHistory(camion)}
            className="bg-emerald-500/5 border border-emerald-500/10 p-4 rounded-2xl flex justify-between items-center group/gasto cursor-pointer hover:bg-emerald-500/10 transition-all"
          >
            <div className="flex items-center gap-2">
              <DollarSign size={14} className="text-emerald-500" />
              <span className="text-[10px] font-black text-emerald-600 uppercase italic">Gastos</span>
            </div>
            <p className="text-sm font-black text-white italic">$ {totalGastos?.toLocaleString() || 0}</p>
          </div>

          <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
            <span className="text-[10px] font-black text-slate-500 uppercase flex gap-2 items-center tracking-wider">
                <User size={14} className="text-cyan-400"/> Operador
            </span>
            <span className="text-xs font-black text-slate-200 uppercase italic truncate max-w-[150px]">
                {chofer ? chofer.nombre : 'DISPONIBLE'}
            </span>
          </div>
        </div>

        <div className="mt-8 pt-6 border-t border-white/5 flex justify-end gap-2">
          <button onClick={(e) => { e.stopPropagation(); onAddGasto(camion); }} className="p-3 bg-emerald-500/10 hover:bg-emerald-600 hover:text-white rounded-xl text-emerald-500 transition-all border border-emerald-500/20">
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