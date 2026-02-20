'use client'
import { CheckCircle2 } from 'lucide-react'

// VISTA 1: Lista de viajes pendientes para pagar
export function LiquidacionList({ viajes, selectedViajes, toggleSelect, handleSelectAll }: any) {
  const pendientes = viajes.filter((v: any) => !v.pago_chofer_realizado)

  if (pendientes.length === 0) {
    return (
      <div className="text-center py-20 opacity-50">
        <CheckCircle2 size={40} className="mx-auto mb-4 text-emerald-500"/>
        <p className="text-xs font-black uppercase tracking-[0.3em]">Al día. No hay deuda pendiente.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4 pb-24">
      <div className="flex justify-between items-center bg-white/5 p-3 rounded-2xl border border-white/5 mb-4">
         <button onClick={handleSelectAll} className="text-[10px] font-bold text-slate-400 uppercase hover:text-white px-4 transition-colors">Seleccionar Todo</button>
         <span className="text-[10px] font-black text-rose-500 uppercase px-4">Items sin pagar</span>
      </div>
      
      {/* 🚀 EL BLINDAJE DE LA KEY: Usamos id + index para garantizar unicidad */}
      {pendientes.map((v: any, index: number) => {
         const isSelected = selectedViajes.includes(v.id)
         const uniqueKey = v.id ? v.id : `fallback-key-${index}`; // Evitamos fallas si la DB devuelve nulos

         return (
           <div 
             key={uniqueKey} 
             onClick={() => toggleSelect(v.id)} 
             className={`p-5 rounded-[2rem] border cursor-pointer flex justify-between items-center transition-all ${isSelected ? 'bg-indigo-600/10 border-indigo-500/50 shadow-[0_0_20px_rgba(79,70,229,0.1)]' : 'bg-white/[0.02] border-white/5 hover:bg-white/5'}`}
           >
              <div className="flex items-center gap-4">
                 <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-all ${isSelected ? 'bg-indigo-500 border-indigo-500' : 'border-slate-600'}`}>
                    {isSelected && <CheckCircle2 size={12} className="text-white"/>}
                 </div>
                 <div>
                    <p className="text-sm font-black text-white uppercase tracking-tight">{v.origen} → {v.destino}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">
                      {new Date(v.fecha).toLocaleDateString('es-AR', { timeZone: 'UTC' })} • {v.lts_gasoil || 0} Lts de Gasoil
                    </p>
                 </div>
              </div>
              <p className="text-xl font-black text-white italic">$ {Number(v.pago_chofer || 0).toLocaleString()}</p>
           </div>
         )
      })}
    </div>
  )
}

// VISTA 2: Tabla histórica completa
export function BitacoraTable({ viajes }: any) {
  return (
    <div className="bg-slate-900/40 rounded-[2rem] border border-white/5 overflow-hidden pb-24">
       <div className="overflow-x-auto">
         <table className="w-full text-left">
            <thead className="bg-white/5 text-[9px] font-black text-slate-500 uppercase tracking-widest">
               <tr>
                 <th className="p-6">Fecha</th>
                 <th className="p-6">Ruta</th>
                 <th className="p-6 text-center">KM</th>
                 <th className="p-6 text-center">Lts Gasoil</th>
                 <th className="p-6 text-right">Pago Chofer</th>
                 <th className="p-6 text-center">Estado</th>
               </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-[11px] font-bold text-slate-300 uppercase">
               {/* 🚀 MISMO BLINDAJE ACÁ PARA LA TABLA HISTÓRICA */}
               {viajes.map((v: any, index: number) => {
                 const uniqueKey = v.id ? v.id : `history-key-${index}`;

                 return (
                   <tr key={uniqueKey} className="hover:bg-white/5 transition-colors group">
                      <td className="p-6 text-slate-500 group-hover:text-slate-300">
                        {new Date(v.fecha).toLocaleDateString('es-AR', { timeZone: 'UTC' })}
                      </td>
                      <td className="p-6"><div className="text-white">{v.origen} → {v.destino}</div></td>
                      <td className="p-6 text-center text-white font-mono">{Number(v.km_recorridos || 0).toLocaleString()}</td>
                      <td className="p-6 text-center text-cyan-400 font-mono">{v.lts_gasoil || 0}</td>
                      <td className="p-6 text-right font-black italic text-lg text-white">$ {Number(v.pago_chofer || 0).toLocaleString()}</td>
                      <td className="p-6 text-center">
                        {v.pago_chofer_realizado ? (
                          <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-lg border border-emerald-500/20 text-[8px] font-black">Pagado</span>
                        ) : (
                          <span className="bg-rose-500/10 text-rose-500 px-3 py-1 rounded-lg border border-rose-500/20 text-[8px] font-black">Pendiente</span>
                        )}
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