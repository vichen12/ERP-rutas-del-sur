'use client'
import { 
  MapPin, ArrowRight, ArrowLeft, Fuel, Wrench, 
  Truck, User, Trash2, Calendar
} from 'lucide-react'

interface ViajesTableProps {
  viajes: any[];
  precioGasoilActual: number; 
  onDelete: (id: string, km_salida: number, km_retorno: number, camion_id: string, chofer_id: string) => void;
}

export function ViajesTable({ viajes, precioGasoilActual, onDelete }: ViajesTableProps) {
  return (
    <div className="bg-slate-900/40 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl backdrop-blur-md relative z-20">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          {/* THEAD MÁS MINIMALISTA */}
          <thead className="bg-white/[0.02] text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
            <tr>
              <th className="p-8 pl-10">Fecha & Tipo</th>
              <th className="p-8">Ruta / Cliente</th>
              <th className="p-8 text-center">Operación</th>
              <th className="p-8">Unidad & Chofer</th>
              <th className="p-8 text-right">Resultado</th>
              <th className="p-8 pr-10 text-center"></th>
            </tr>
          </thead>

          <tbody className="divide-y divide-white/[0.03] italic font-sans">
            {viajes.map(v => {
              const isRetorno = v.es_retorno;
              const themeColor = isRetorno ? 'text-indigo-400' : 'text-emerald-400';
              const badgeStyle = isRetorno 
                ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400' 
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400';
              
              const bruta = Number(v.facturacion) || 0;
              const neta = bruta - (Number(v.costos_operativos) || 0) - (Number(v.pago_chofer) || 0) - ((Number(v.lts_combustible) || 0) * (v.precio_gasoil_historico || precioGasoilActual));
              const totalKM = (Number(v.km_salida) || 0) + (Number(v.km_retorno) || 0);

              return (
                <tr key={v.id} className="hover:bg-white/[0.02] transition-all duration-300 group">
                  
                  {/* FECHA Y TIPO CON ESTILO CALENDARIO */}
                  <td className="p-8 pl-10">
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-slate-400 font-bold">
                        <Calendar size={14} className="opacity-40" />
                        <span className="text-sm">{new Date(v.fecha).toLocaleDateString('es-AR')}</span>
                      </div>
                      <span className={`w-fit px-3 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest ${badgeStyle}`}>
                        {isRetorno ? 'RETORNO' : 'IDA / CARGA'}
                      </span>
                    </div>
                  </td>

                  {/* CLIENTE Y RUTA MÁS LIMPIO */}
                  <td className="p-8">
                    <div className="space-y-2">
                      <p className="text-base font-black text-white uppercase tracking-tight truncate max-w-[200px]">
                        {v.clientes?.razon_social || 'PARTICULAR'}
                      </p>
                      <div className={`flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest ${themeColor} opacity-70`}>
                        <MapPin size={12} />
                        {v.origen} {isRetorno ? <ArrowLeft size={12}/> : <ArrowRight size={12}/>} {v.destino}
                      </div>
                    </div>
                  </td>

                  {/* OPERATIVO (KM Y FUEL) */}
                  <td className="p-8">
                    <div className="flex flex-col items-center gap-2">
                      <div className="px-4 py-2 bg-slate-950/50 border border-white/5 rounded-2xl">
                         <span className="text-white font-black text-lg">{totalKM.toLocaleString()}</span>
                         <span className="text-[10px] text-slate-600 font-black ml-1">KM</span>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 font-bold">
                        <Fuel size={14} className="text-slate-700"/>
                        {v.lts_combustible} LTS
                        {v.engrase && <Wrench size={14} className="text-amber-500/50" />}
                      </div>
                    </div>
                  </td>

                  {/* --- RECURSOS (EL CAMBIO QUE PEDISTE) --- */}
                  <td className="p-8">
                    <div className="flex flex-col gap-3">
                      {/* Badge del Camión */}
                      <div className="flex items-center gap-3 bg-cyan-500/5 border border-cyan-500/10 px-4 py-2 rounded-2xl w-fit group-hover:bg-cyan-500/10 transition-colors">
                        <Truck size={16} className="text-cyan-500" />
                        <span className="text-sm font-black text-cyan-400 uppercase tracking-widest">
                          {v.camiones?.patente || 'S/N'}
                        </span>
                      </div>
                      
                      {/* Info del Chofer */}
                      <div className="flex items-center gap-3 pl-2">
                        <div className="w-6 h-6 rounded-full bg-slate-800 flex items-center justify-center border border-white/5">
                           <User size={12} className="text-slate-500" />
                        </div>
                        <span className="text-[11px] font-black text-slate-400 uppercase tracking-tight group-hover:text-slate-200 transition-colors">
                          {v.choferes?.nombre || 'Sin asignar'}
                        </span>
                      </div>
                    </div>
                  </td>

                  {/* FINANZAS - ENFOCADO EN EL NETO */}
                  <td className="p-8 text-right">
                    <div className="space-y-1">
                      <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Utilidad Real</p>
                      <p className={`text-2xl font-black italic tracking-tighter ${neta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        $ {Math.round(neta).toLocaleString()}
                      </p>
                      <p className="text-[10px] font-bold text-slate-500 opacity-50 uppercase">Bruto: ${Math.round(bruta).toLocaleString()}</p>
                    </div>
                  </td>

                  {/* ACCIONES */}
                  <td className="p-8 pr-10 text-center">
                    <button 
                      onClick={() => onDelete(v.id, v.km_salida, v.km_retorno, v.camion_id, v.chofer_id)}
                      className="p-4 rounded-2xl text-slate-700 hover:text-rose-500 hover:bg-rose-500/10 transition-all active:scale-90"
                    >
                      <Trash2 size={20} />
                    </button>
                  </td>

                </tr>
              )
            })}
          </tbody>
        </table>

        {viajes.length === 0 && (
          <div className="p-32 text-center">
             <div className="inline-flex p-6 bg-white/5 rounded-full mb-4 text-slate-700">
                <Truck size={40} />
             </div>
             <p className="text-slate-600 text-[10px] font-black uppercase tracking-[0.4em] italic">No se encontraron registros</p>
          </div>
        )}
      </div>
    </div>
  )
}