'use client'
import { ArrowUpRight, ArrowDownLeft, ReceiptText, Calendar, Hash, FileSpreadsheet } from 'lucide-react'

export function ClienteLedger({ historial }: { historial: any[] }) {
  // Calculamos los saldos de forma eficiente (Cumulative Balance)
  const historialConSaldo = [...historial].reverse().reduce((acc: any[], curr: any, idx: number) => {
    const prevSaldo = idx === 0 ? 0 : acc[idx - 1].saldo;
    const nuevoSaldo = prevSaldo + (Number(curr.debe || 0) - Number(curr.haber || 0));
    acc.push({ ...curr, saldo: nuevoSaldo });
    return acc;
  }, []).reverse();

  return (
    <div className="bg-slate-900/40 rounded-[2.5rem] lg:rounded-[3.5rem] border border-white/5 overflow-hidden shadow-2xl backdrop-blur-md font-sans italic">
      
      {/* HEADER DE LA TABLA */}
      <div className="p-8 lg:p-10 border-b border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white/[0.01]">
        <div>
          <h3 className="font-black text-white uppercase tracking-tighter flex items-center gap-3 italic text-xl lg:text-2xl leading-none">
            <ReceiptText size={28} className="text-sky-500"/> Registro Maestro Contable
          </h3>
          <p className="text-[9px] text-slate-500 font-black uppercase tracking-[0.3em] mt-2">Historial de devengados y cobranzas realizadas</p>
        </div>
        <div className="px-4 py-2 bg-sky-500/10 rounded-xl border border-sky-500/20 text-[10px] font-black text-sky-500 uppercase italic flex items-center gap-2">
          <FileSpreadsheet size={14}/> {historial.length} Movimientos Registrados
        </div>
      </div>

      <div className="overflow-x-auto custom-scrollbar">
        {/* DESKTOP TABLE */}
        <table className="hidden md:table w-full text-left border-collapse">
          <thead className="bg-white/[0.02] text-[10px] font-black text-slate-600 uppercase tracking-[0.3em] border-b border-white/5">
            <tr>
              <th className="px-10 py-6">Fecha</th>
              <th className="px-10 py-6">Tipo / Detalle</th>
              <th className="px-10 py-6 text-right">Debe (+)</th>
              <th className="px-10 py-6 text-right">Haber (-)</th>
              <th className="px-10 py-6 text-right bg-white/[0.01]">Saldo Acum.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 italic">
            {historialConSaldo.length > 0 ? (
              historialConSaldo.map((m) => {
                const esDebe = Number(m.debe) > 0;
                return (
                  <tr key={m.id} className="hover:bg-white/[0.02] transition-all group">
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-2 text-[11px] font-bold text-slate-500">
                        <Calendar size={12} className="text-slate-700" />
                        {new Date(m.fecha).toLocaleDateString('es-AR')}
                      </div>
                    </td>
                    <td className="px-10 py-6">
                      <div className="flex items-center gap-4">
                         <div className={`p-2 rounded-lg ${esDebe ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                            {esDebe ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                         </div>
                         <div>
                           <span className="font-black text-white text-sm uppercase italic block leading-tight">
                             {/* Mostramos el detalle o el nro de remito si existe */}
                             {m.remitos?.numero_remito ? `REMITO: ${m.remitos.numero_remito}` : m.detalle}
                           </span>
                           <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">
                             {m.tipo_movimiento || 'MOVIMIENTO MANUAL'}
                           </span>
                         </div>
                      </div>
                    </td>
                    <td className="px-10 py-6 text-right font-black text-emerald-500 text-sm tabular-nums">
                      {Number(m.debe) > 0 ? `+ $${Number(m.debe).toLocaleString('es-AR')}` : '---'}
                    </td>
                    <td className="px-10 py-6 text-right font-black text-rose-500 text-sm tabular-nums">
                      {Number(m.haber) > 0 ? `- $${Number(m.haber).toLocaleString('es-AR')}` : '---'}
                    </td>
                    <td className="px-10 py-6 text-right font-black text-slate-300 text-sm bg-white/[0.01] tabular-nums">
                      $ {m.saldo.toLocaleString('es-AR')}
                    </td>
                  </tr>
                )
              })
            ) : (
              <tr>
                <td colSpan={5} className="px-10 py-20 text-center text-slate-600 text-[10px] font-black uppercase tracking-[0.5em]">
                  No se registran movimientos contables para este cliente
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* MOBILE VIEW */}
        <div className="md:hidden divide-y divide-white/5">
          {historialConSaldo.map((m) => {
             const esDebe = Number(m.debe) > 0;
             return (
               <div key={m.id} className="p-6 space-y-4 hover:bg-white/[0.02]">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-600 uppercase italic flex items-center gap-2">
                      <Calendar size={10} /> {new Date(m.fecha).toLocaleDateString('es-AR')}
                    </span>
                    <span className={`text-[8px] font-black uppercase px-2 py-1 rounded-md ${esDebe ? 'text-emerald-500 bg-emerald-500/5' : 'text-rose-500 bg-rose-500/5'}`}>
                      {m.tipo_movimiento || 'GENERAL'}
                    </span>
                 </div>
                 <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs font-black text-white uppercase italic truncate max-w-[180px]">
                         {m.remitos?.numero_remito ? `R: ${m.remitos.numero_remito}` : m.detalle}
                      </p>
                      <p className="text-[10px] font-black text-slate-500 mt-1">Saldo: ${m.saldo.toLocaleString()}</p>
                    </div>
                    <p className={`text-lg font-black italic tabular-nums ${esDebe ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {esDebe ? `+$${Number(m.debe).toLocaleString()}` : `-$${Number(m.haber).toLocaleString()}`}
                    </p>
                 </div>
               </div>
             )
          })}
        </div>
      </div>
    </div>
  )
}