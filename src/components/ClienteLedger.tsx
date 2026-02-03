'use client'
import { ClipboardList, ArrowUpRight, ArrowDownLeft } from 'lucide-react'

export function ClienteLedger({ historial }: { historial: any[] }) {
  return (
    <div className="bg-slate-900/60 rounded-[2.5rem] lg:rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
      <div className="p-6 lg:p-8 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
        <h3 className="font-black text-white uppercase tracking-tighter flex items-center gap-3 italic text-lg lg:text-xl leading-none">
          <ClipboardList size={24} className="text-sky-600"/> Libro Mayor Detallado
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="hidden md:table w-full text-left border-collapse">
          <thead className="bg-white/[0.02] text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] border-b border-white/5">
            <tr>
              <th className="px-10 py-6">Fecha</th>
              <th className="px-10 py-6">Concepto</th>
              <th className="px-10 py-6 text-right">Debe (+)</th>
              <th className="px-10 py-6 text-right">Haber (-)</th>
              <th className="px-10 py-6 text-right bg-white/[0.01]">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 italic">
            {historial.map((m, idx) => {
              const balance = historial.slice(idx).reduce((a, b) => a + (Number(b.debe) - Number(b.haber)), 0);
              return (
                <tr key={m.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-10 py-6 text-xs font-bold text-slate-500 uppercase">{m.fecha}</td>
                  <td className="px-10 py-6">
                    <div className="flex items-center gap-3">
                       {m.debe > 0 ? <ArrowUpRight size={16} className="text-rose-500" /> : <ArrowDownLeft size={16} className="text-emerald-500" />}
                       <span className="font-bold text-slate-200 text-sm uppercase italic tracking-tight">{m.descripcion}</span>
                    </div>
                  </td>
                  <td className="px-10 py-6 text-right font-black text-rose-500 text-sm">
                    {m.debe > 0 ? `+ $${Number(m.debe).toLocaleString('es-AR')}` : '---'}
                  </td>
                  <td className="px-10 py-6 text-right font-black text-emerald-400 text-sm">
                    {m.haber > 0 ? `- $${Number(m.haber).toLocaleString('es-AR')}` : '---'}
                  </td>
                  <td className="px-10 py-6 text-right font-black text-white text-sm bg-white/[0.01]">
                    ${balance.toLocaleString('es-AR')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* VISTA MÓVIL */}
        <div className="md:hidden divide-y divide-white/5 italic">
          {historial.map((m, idx) => {
             const balance = historial.slice(idx).reduce((a, b) => a + (Number(b.debe) - Number(b.haber)), 0);
             return (
               <div key={m.id} className="p-6 space-y-4">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-500 uppercase">{m.fecha}</span>
                    <span className="text-xs font-black text-white bg-white/5 px-3 py-1 rounded-full">
                      Bal: ${balance.toLocaleString('es-AR')}
                    </span>
                 </div>
                 <div className="flex items-center gap-3">
                    {m.debe > 0 ? <ArrowUpRight size={18} className="text-rose-500" /> : <ArrowDownLeft size={18} className="text-emerald-500" />}
                    <p className="text-sm font-bold text-white uppercase italic">{m.descripcion}</p>
                 </div>
                 <div className="flex justify-between pt-2 border-t border-white/5">
                    <div className="text-left">
                      <p className="text-[8px] font-black text-slate-600 uppercase">Debe</p>
                      <p className="text-sm font-black text-rose-500">{m.debe > 0 ? `+$${m.debe.toLocaleString()}` : '---'}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[8px] font-black text-slate-600 uppercase">Haber</p>
                      <p className="text-sm font-black text-emerald-400">{m.haber > 0 ? `-$${m.haber.toLocaleString()}` : '---'}</p>
                    </div>
                 </div>
               </div>
             )
          })}
        </div>
      </div>
    </div>
  )
}