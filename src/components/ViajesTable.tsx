'use client'
import { 
  MapPin, ArrowRight, ArrowLeft, Fuel, Wrench, 
  Truck, User, Trash2, Calendar, DollarSign, Calculator
} from 'lucide-react'

interface ViajesTableProps {
  viajes: any[];
  precioGasoilActual: number; 
  onDelete: (id: string) => void;
}

export function ViajesTable({ viajes, precioGasoilActual, onDelete }: ViajesTableProps) {
  
  if (viajes.length === 0) {
    return (
      <div className="bg-slate-900/40 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl backdrop-blur-md relative z-20">
         <div className="p-20 md:p-32 text-center flex flex-col items-center justify-center">
            <div className="p-8 bg-white/5 rounded-[3rem] mb-6 text-slate-700">
               <Truck size={48} strokeWidth={1} />
            </div>
            <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em] italic text-center">Sin registros en el periodo seleccionado</p>
         </div>
      </div>
    )
  }

  return (
    <div className="bg-slate-900/40 rounded-[2rem] md:rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl backdrop-blur-md relative z-20 font-sans italic">
      
      {/* ===== VISTA MÓVIL (Tarjetas de Control) ===== */}
      <div className="md:hidden divide-y divide-white/[0.05]">
         {viajes.map(v => {
             const isRetorno = v.es_retorno;
             const themeColor = isRetorno ? 'text-indigo-400' : 'text-emerald-400';
             
             // 🚀 LÓGICA FINANCIERA V2.0
             const bruta = Number(v.tarifa_flete) || 0;
             const costoGasoil = (Number(v.lts_gasoil) || 0) * (Number(v.precio_gasoil) || precioGasoilActual);
             const costoDesgaste = (Number(v.km_recorridos) || 0) * (Number(v.desgaste_por_km) || 0);
             const totalCostos = (Number(v.pago_chofer) || 0) + (Number(v.costo_descarga) || 0) + costoGasoil + costoDesgaste;
             const neta = bruta - totalCostos;

             return (
               <div key={v.id} className="p-6 flex flex-col gap-5 relative">
                  <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2 text-slate-500 font-bold">
                        <Calendar size={14} className="opacity-40" />
                        <span className="text-xs uppercase">{new Date(v.fecha).toLocaleDateString('es-AR')}</span>
                      </div>
                      <span className={`px-3 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest ${isRetorno ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                        {isRetorno ? 'Retorno' : 'Carga Ida'}
                      </span>
                  </div>

                  <div className="bg-white/5 p-4 rounded-2xl border border-white/5 space-y-2">
                      <p className="text-xs font-black text-white uppercase tracking-tight truncate">
                        {v.clientes?.razon_social || 'Dador Particular'}
                      </p>
                      <div className={`flex items-center gap-2 text-[10px] font-black uppercase ${themeColor}`}>
                        <MapPin size={12} className="shrink-0" />
                        <span className="truncate">{v.origen}</span> 
                        {isRetorno ? <ArrowLeft size={10}/> : <ArrowRight size={10}/>} 
                        <span className="truncate">{v.destino}</span>
                      </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                     <div className="space-y-3">
                        <div className="flex items-center gap-2">
                           <Truck size={12} className="text-sky-500" />
                           <span className="text-[11px] font-black text-sky-400 uppercase">{v.camiones?.patente || 'S/N'}</span>
                        </div>
                        <div className="flex items-end gap-1">
                           <span className="text-white font-black text-lg leading-none">{Number(v.km_recorridos).toLocaleString()}</span>
                           <span className="text-[8px] text-slate-600 font-black mb-0.5 uppercase">Km Totales</span>
                        </div>
                     </div>

                     <div className="text-right flex flex-col justify-center">
                        <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest mb-1">Margen Neto</p>
                        <p className={`text-xl font-black italic tracking-tighter tabular-nums ${neta >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                          $ {Math.round(neta).toLocaleString()}
                        </p>
                     </div>
                  </div>

                  <button onClick={() => onDelete(v.id)} className="absolute top-5 right-5 p-2 text-slate-700 hover:text-rose-500 transition-colors">
                    <Trash2 size={16} />
                  </button>
               </div>
             )
         })}
      </div>

      {/* ===== VISTA DESKTOP (Grilla Maestra) ===== */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[1100px]">
          <thead className="bg-white/[0.02] text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] border-b border-white/5">
            <tr>
              <th className="p-8 pl-10">Cronología</th>
              <th className="p-8">Ruta & Cliente</th>
              <th className="p-8 text-center">Operativo</th>
              <th className="p-8">Activo Asignado</th>
              <th className="p-8 text-right">Resultado Operativo</th>
              <th className="p-8 pr-10 text-center">Acciones</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/[0.03]">
            {viajes.map(v => {
              const isRetorno = v.es_retorno;
              
              // 🚀 LÓGICA FINANCIERA V2.0 (Sync con Modal)
              const bruta = Number(v.tarifa_flete) || 0;
              const costoGasoil = (Number(v.lts_gasoil) || 0) * (Number(v.precio_gasoil) || precioGasoilActual);
              const costoDesgaste = (Number(v.km_recorridos) || 0) * (Number(v.desgaste_por_km) || 0);
              const totalCostos = (Number(v.pago_chofer) || 0) + (Number(v.costo_descarga) || 0) + costoGasoil + costoDesgaste;
              const neta = bruta - totalCostos;

              return (
                <tr key={v.id} className="hover:bg-white/[0.02] transition-all duration-500 group">
                  
                  {/* CRONOLOGÍA */}
                  <td className="p-8 pl-10">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-slate-400 font-bold">
                        <Calendar size={14} className="text-sky-500 opacity-50" />
                        <span className="text-sm">{new Date(v.fecha).toLocaleDateString('es-AR')}</span>
                      </div>
                      <span className={`w-fit px-3 py-1 rounded-lg border text-[8px] font-black uppercase tracking-[0.2em] ${isRetorno ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'}`}>
                        {isRetorno ? 'Operación Retorno' : 'Flete de Ida'}
                      </span>
                    </div>
                  </td>

                  {/* RUTA / CLIENTE */}
                  <td className="p-8">
                    <div className="space-y-2">
                      <p className="text-base font-black text-white uppercase tracking-tight truncate max-w-[250px]">
                        {v.clientes?.razon_social || 'PARTICULAR'}
                      </p>
                      <div className={`flex items-center gap-2 text-[10px] font-black uppercase tracking-widest ${isRetorno ? 'text-indigo-500/70' : 'text-emerald-500/70'}`}>
                        <MapPin size={12} className="shrink-0" />
                        <span>{v.origen}</span> 
                        {isRetorno ? <ArrowLeft size={12}/> : <ArrowRight size={12}/>} 
                        <span>{v.destino}</span>
                      </div>
                    </div>
                  </td>

                  {/* OPERATIVO */}
                  <td className="p-8">
                    <div className="flex flex-col items-center gap-2">
                      <div className="px-5 py-2 bg-slate-950 border border-white/5 rounded-2xl shadow-inner">
                         <span className="text-white font-black text-xl tabular-nums">{Number(v.km_recorridos).toLocaleString()}</span>
                         <span className="text-[10px] text-slate-600 font-black ml-1 uppercase">KM</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-500 font-bold">
                        <span className="flex items-center gap-1"><Fuel size={14} className="text-amber-500/50"/> {v.lts_gasoil}L</span>
                        {v.engrase && <span className="p-1 bg-amber-500/10 rounded-md text-amber-500"><Wrench size={12} /></span>}
                      </div>
                    </div>
                  </td>

                  {/* RECURSOS */}
                  <td className="p-8">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3 bg-white/5 border border-white/5 px-4 py-2 rounded-2xl w-fit group-hover:border-sky-500/30 transition-all">
                        <Truck size={16} className="text-sky-500" />
                        <span className="text-sm font-black text-sky-400 uppercase tabular-nums">
                          {v.camiones?.patente || 'S/N'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 pl-2">
                        <User size={12} className="text-slate-600" />
                        <span className="text-[10px] font-black text-slate-500 uppercase truncate max-w-[150px]">
                          {v.choferes?.nombre || 'Operador S/A'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* RESULTADO FINANCIERO */}
                  <td className="p-8 text-right">
                    <div className="space-y-1">
                      <div className="flex items-center justify-end gap-2">
                        <Calculator size={12} className="text-slate-700" />
                        <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Utilidad Neta</p>
                      </div>
                      <p className={`text-3xl font-black italic tracking-tighter tabular-nums ${neta >= 0 ? 'text-emerald-400' : 'text-rose-500'}`}>
                        $ {Math.round(neta).toLocaleString()}
                      </p>
                      <p className="text-[10px] font-bold text-slate-700 uppercase tracking-widest">Bruto: ${Math.round(bruta).toLocaleString()}</p>
                    </div>
                  </td>

                  {/* ACCIONES */}
                  <td className="p-8 pr-10 text-center">
                    <button 
                      onClick={() => onDelete(v.id)}
                      className="p-4 rounded-2xl bg-white/5 text-slate-700 hover:text-rose-500 hover:bg-rose-500/10 border border-transparent hover:border-rose-500/20 transition-all active:scale-90"
                      title="Eliminar registro de bitácora"
                    >
                      <Trash2 size={20} />
                    </button>
                  </td>

                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

    </div>
  )
}