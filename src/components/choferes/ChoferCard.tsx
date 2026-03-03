'use client'
import { 
  UserCircle, Truck, Trash2, Edit3, 
  Flame, DollarSign, AlertCircle,
  Wallet, AlertTriangle, 
  IdCard, ArrowRight, Activity
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
  
  // --- LÓGICA DE VENCIMIENTO ---
  const tieneVencimiento = Boolean(chofer.vto_licencia);
  const vencimiento = tieneVencimiento ? new Date(chofer.vto_licencia) : null;
  const hoy = new Date();
  hoy.setHours(0,0,0,0);
  if (vencimiento) vencimiento.setHours(0,0,0,0);
  const diasRestantes = vencimiento ? Math.ceil((vencimiento.getTime() - hoy.getTime()) / (1000 * 3600 * 24)) : null;
  
  const estaVencido = diasRestantes !== null && diasRestantes < 0;
  const vencePronto = diasRestantes !== null && diasRestantes >= 0 && diasRestantes <= 30;
  
  // --- 💰 LÓGICA DE SALDO TRI-ESTADO ---
  const saldoSeguro = saldoPendiente ?? 0;
  const esDeuda = saldoSeguro > 0;
  const esAFavor = saldoSeguro < 0;
  const estaAlDia = saldoSeguro === 0;

  let balanceLabel = "Cuentas al Día";
  let balanceColor = "text-slate-300";
  let balanceBg = "bg-white/[0.03] border-white/5";
  let balanceIconColor = "text-slate-500";
  let balanceGlow = "opacity-0";
  
  if (esDeuda) {
    balanceLabel = "Sueldo Pendiente";
    balanceColor = "text-rose-400";
    balanceBg = "bg-rose-950/30 border-rose-500/20";
    balanceIconColor = "text-rose-500";
    balanceGlow = "bg-rose-500/20 blur-[80px]";
  } else if (esAFavor) {
    balanceLabel = "Adelantos a Favor";
    balanceColor = "text-emerald-400";
    balanceBg = "bg-emerald-950/30 border-emerald-500/20";
    balanceIconColor = "text-emerald-500";
    balanceGlow = "bg-emerald-500/20 blur-[80px]";
  }

  // --- 🔥 CÁLCULO DE RENDIMIENTO (TELEMETRÍA) ---
  const kmTotales = Number(chofer.km_recorridos) || 0;
  const ltsTotales = Number(chofer.lts_consumidos) || 0;
  const rendimientoHistorico = kmTotales > 0 ? ((ltsTotales / kmTotales) * 100).toFixed(1) : '0.0';
  const numConsumo = Number(rendimientoHistorico);
  
  const consumoClass = numConsumo === 0 ? 'bg-slate-500/10 text-slate-400 border-slate-500/20' : 
                       numConsumo > 40 ? 'bg-rose-500/10 text-rose-400 border-rose-500/30' : 
                       numConsumo > 35 ? 'bg-amber-500/10 text-amber-400 border-amber-500/30' : 
                       'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';

  // --- 🎨 ESTADOS OPERATIVOS ---
  const estado = chofer.estado || 'Disponible';
  const isInactivo = estado.includes('Inactivo');
  let estadoColor = 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30';
  let dotColor = 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]';
  
  if (estado === 'En Viaje') { estadoColor = 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30'; dotColor = 'bg-cyan-500 shadow-[0_0_8px_rgba(6,182,212,0.8)]'; }
  else if (estado.includes('Franco') || estado.includes('Licencia')) { estadoColor = 'bg-amber-500/15 text-amber-400 border-amber-500/30'; dotColor = 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.8)]'; }
  else if (isInactivo) { estadoColor = 'bg-slate-800 text-slate-400 border-white/10'; dotColor = 'bg-slate-600'; }

  const statusBorder = estaVencido ? 'border-rose-500/50 shadow-[0_0_30px_rgba(225,29,72,0.1)]' : vencePronto ? 'border-amber-500/50 shadow-[0_0_30px_rgba(245,158,11,0.1)]' : 'border-white/10 group-hover:border-indigo-500/40 hover:shadow-[0_0_40px_rgba(79,70,229,0.1)]';

  return (
    <div className={`group bg-[#050814] rounded-[2rem] border ${statusBorder} transition-all duration-500 flex relative overflow-hidden h-full min-h-[380px] w-full min-w-0 ${isInactivo ? 'opacity-60 grayscale-[0.6]' : ''}`}>
      
      {/* 🔮 Brillo de Fondo Dinámico */}
      <div className={`absolute -bottom-10 -right-10 w-full h-full pointer-events-none transition-all duration-1000 z-0 opacity-60 ${balanceGlow}`} />

      {/* Indicador superior luminoso si hay alerta */}
      {(estaVencido || vencePronto) && (
        <div className={`absolute top-0 left-0 w-full h-1.5 ${estaVencido ? 'bg-gradient-to-r from-rose-600 to-rose-400' : 'bg-gradient-to-r from-amber-500 to-amber-300'} z-30`} />
      )}

      {/* 🛠️ BARRA LATERAL ADMINISTRATIVA (DOCK) */}
      <div className="w-14 sm:w-16 shrink-0 bg-[#02040A] flex flex-col items-center py-6 z-20 border-r border-white/5 shadow-[5px_0_15px_rgba(0,0,0,0.5)]">
        
        {/* Escudo LNH Arriba */}
    
        {/* Acciones Abajo */}
        <div className="mt-auto space-y-4 flex flex-col items-center">
          <button onClick={() => onEdit(chofer)} className="w-10 h-10 rounded-2xl bg-white/[0.03] hover:bg-indigo-500/20 hover:border-indigo-500/30 border border-transparent flex items-center justify-center text-slate-500 hover:text-indigo-400 transition-all" title="Editar Legajo">
            <Edit3 size={16} strokeWidth={2} />
          </button>
          <button onClick={() => onDelete(chofer.id, chofer.nombre)} className="w-10 h-10 rounded-2xl bg-white/[0.03] hover:bg-rose-500/20 hover:border-rose-500/30 border border-transparent flex items-center justify-center text-slate-500 hover:text-rose-500 transition-all" title="Eliminar Chofer">
            <Trash2 size={16} strokeWidth={2} />
          </button>
        </div>
      </div>

      {/* 💻 CONTENIDO PRINCIPAL DE LA TARJETA (min-w-0 es la clave acá) */}
      <div className="flex-1 flex flex-col relative z-10 min-w-0">
        
        <div className="p-5 sm:p-6 flex flex-col h-full min-w-0">
          
          {/* ─── 1. CABECERA: PERFIL Y RENDIMIENTO ─── */}
          <div className="flex gap-4 items-center mb-6">
            
            <div className="relative shrink-0">
              <div className={`w-14 h-14 sm:w-16 sm:h-16 rounded-[1.2rem] bg-slate-900 border-2 border-white/10 flex items-center justify-center overflow-hidden shadow-xl relative z-10 transition-transform duration-500 group-hover:scale-105`}>
                {chofer.foto_url ? (
                  <Image src={chofer.foto_url} alt={chofer.nombre} fill className="object-cover" />
                ) : (
                  <UserCircle size={32} strokeWidth={1.5} className="text-slate-500" />
                )}
              </div>
              <div className={`absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-[3px] border-[#050814] z-20 ${dotColor}`} title={estado} />
            </div>

            <div className="flex flex-col justify-center min-w-0 flex-1">
              {/* min-w-0 y truncate previenen que un nombre largo rompa la tarjeta */}
              <h2 className="text-xl sm:text-2xl font-black uppercase tracking-tighter text-white truncate drop-shadow-md">
                {chofer.nombre}
              </h2>
              
              {/* Tags de Identificación */}
              <div className="flex flex-wrap gap-2 items-center mt-1.5 overflow-hidden">
                 <span className={`px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border truncate ${estadoColor}`}>
                   {estado}
                 </span>
                 <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1.5 bg-white/5 border border-white/10 px-2.5 py-1 rounded-lg truncate">
                   <IdCard size={10} className="shrink-0" /> {chofer.licencia || 'S/D'}
                 </span>
              </div>
            </div>
          </div>

          {/* ─── 2. ALERTA DE LICENCIA ─── */}
          {(estaVencido || vencePronto) && (
            <div className={`mb-6 p-3 rounded-xl flex items-start gap-3 border backdrop-blur-sm min-w-0 ${estaVencido ? 'bg-rose-950/40 border-rose-500/30' : 'bg-amber-950/30 border-amber-500/30'}`}>
               <div className={`mt-0.5 shrink-0 ${estaVencido ? 'text-rose-500' : 'text-amber-500'}`}>
                  {estaVencido ? <AlertCircle size={14} strokeWidth={2.5} /> : <AlertTriangle size={14} strokeWidth={2.5} />}
               </div>
               <div className="min-w-0">
                  <p className={`text-[9px] font-black uppercase tracking-widest truncate ${estaVencido ? 'text-rose-400' : 'text-amber-400'}`}>
                     {estaVencido ? 'Bloqueo LNH' : 'Renovar LNH'}
                  </p>
                  <p className="text-[9px] sm:text-[10px] font-bold text-slate-300 mt-0.5 truncate">
                     {estaVencido ? `Expirada hace ${Math.abs(diasRestantes as number)} días` : `Vence en ${diasRestantes} días`}
                  </p>
               </div>
            </div>
          )}

          {/* ─── 3. PANEL BENTO DE DATOS OPERATIVOS ─── */}
          <div className="grid grid-cols-2 gap-2 sm:gap-3 mb-6 flex-1 min-w-0">
            
            {/* Actividad Viajes */}
            <div className="bg-white/[0.02] hover:bg-white/[0.04] border border-white/5 rounded-[1.2rem] p-3 sm:p-4 flex flex-col justify-center transition-colors min-w-0">
              <div className="flex items-center gap-1.5 mb-2 overflow-hidden">
                <div className="p-1 bg-indigo-500/10 rounded-md text-indigo-400 shrink-0"><Activity size={10} strokeWidth={2.5} /></div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-[0.2em] truncate">Actividad</span>
              </div>
              <p className="text-lg sm:text-xl font-black text-white tabular-nums tracking-tighter truncate">
                {totalViajes} <span className="text-[8px] text-slate-500 ml-1 font-bold tracking-widest">VIAJES</span>
              </p>
            </div>

            {/* Rendimiento (Colorido) */}
            <div className={`border rounded-[1.2rem] p-3 sm:p-4 flex flex-col justify-center transition-colors min-w-0 ${consumoClass}`}>
              <div className="flex items-center gap-1.5 mb-2 overflow-hidden">
                <Flame size={12} strokeWidth={2.5} className="shrink-0" />
                <span className="text-[8px] font-black uppercase tracking-[0.2em] truncate">Consumo</span>
              </div>
              <p className="text-lg sm:text-xl font-black tabular-nums tracking-tighter drop-shadow-sm truncate">
                {rendimientoHistorico} <span className="text-[8px] font-bold opacity-70 ml-0.5 tracking-wider">L/100</span>
              </p>
            </div>

            {/* Asignación (Tractor) */}
            <div className="bg-white/[0.02] border border-white/5 rounded-[1.2rem] p-3 sm:p-4 flex flex-col justify-center col-span-2 shadow-inner min-w-0">
              <div className="flex items-center gap-1.5 mb-1.5">
                <Truck size={12} className="text-cyan-500 shrink-0" />
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.2em] truncate">Unidad Asignada</span>
              </div>
              <p className="text-xs sm:text-sm font-black text-slate-200 uppercase tracking-wider truncate">
                {camion ? camion.patente : 'SIN ASIGNAR'}
              </p>
            </div>

            {/* Finanzas Rápidas */}
            <div className={`col-span-2 rounded-[1.2rem] p-4 flex flex-col justify-center border transition-all backdrop-blur-sm shadow-xl min-w-0 ${balanceBg}`}>
              <div className="flex items-center gap-1.5 mb-1.5 overflow-hidden">
                <DollarSign size={12} className={`shrink-0 ${balanceIconColor}`} />
                <span className={`text-[8px] font-black uppercase tracking-[0.2em] truncate ${balanceColor}`}>
                  {balanceLabel}
                </span>
              </div>
              <p className={`text-2xl sm:text-3xl font-black tabular-nums tracking-tighter drop-shadow-md truncate ${balanceColor}`}>
                $ {Math.abs(saldoSeguro).toLocaleString('es-AR')}
                {esAFavor && <span className="text-[9px] ml-1.5 opacity-60 bg-emerald-950/50 px-1.5 py-0.5 rounded-md border border-emerald-500/20">(-)</span>}
              </p>
            </div>

          </div>

          {/* ─── 4. BOTÓN FINANCIERO PRINCIPAL ─── */}
          <button 
            onClick={() => onViewStats(chofer)}
            className={`group/btn w-full mt-auto py-4 sm:py-5 px-2 rounded-xl font-black uppercase text-[8px] sm:text-[9px] tracking-[0.15em] sm:tracking-[0.2em] flex justify-center items-center gap-2 transition-all duration-300 active:scale-[0.98] truncate ${
              esDeuda 
              ? 'bg-gradient-to-r from-rose-600 to-rose-500 text-white shadow-[0_5px_20px_rgba(225,29,72,0.2)] hover:shadow-[0_5px_30px_rgba(225,29,72,0.4)] border border-rose-400/30' 
              : esAFavor 
                ? 'bg-gradient-to-r from-emerald-600 to-emerald-500 text-white shadow-[0_5px_20px_rgba(16,185,129,0.2)] hover:shadow-[0_5px_30px_rgba(16,185,129,0.4)] border border-emerald-400/30'
                : 'bg-white text-black hover:bg-slate-200 shadow-[0_5px_20px_rgba(255,255,255,0.15)] hover:shadow-[0_5px_30px_rgba(255,255,255,0.25)]'
            }`}
          >
            <Wallet size={14} strokeWidth={2.5} className="shrink-0 group-hover/btn:-translate-y-0.5 transition-transform" /> 
            <span className="truncate">
              {esDeuda ? 'LIQUIDAR SALDO' : esAFavor ? 'VER ADELANTOS' : 'ESTADO DE CUENTA'}
            </span>
            <ArrowRight size={14} strokeWidth={2.5} className="shrink-0 group-hover/btn:translate-x-1.5 transition-transform opacity-90" />
          </button>
        </div>
      </div>

    </div>
  )
}