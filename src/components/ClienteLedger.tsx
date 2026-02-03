'use client'
import { ClipboardList, ArrowUpRight, ArrowDownLeft, ReceiptText } from 'lucide-react'

export function ClienteLedger({ historial }: { historial: any[] }) {
  return (
    <div className="bg-slate-900/40 rounded-[2.5rem] lg:rounded-[4rem] border border-white/5 overflow-hidden shadow-2xl backdrop-blur-md">
      <div className="p-8 lg:p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
        <h3 className="font-black text-white uppercase tracking-tighter flex items-center gap-3 italic text-xl lg:text-2xl leading-none">
          <ReceiptText size={28} className="text-sky-500"/> Registro Maestro de Operaciones
        </h3>
        <div className="px-4 py-1.5 bg-white/5 rounded-full border border-white/10 text-[9px] font-black text-slate-500 uppercase tracking-widest">
          Sincronizado con Supabase
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="hidden md:table w-full text-left border-collapse">
          <thead className="bg-white/[0.02] text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] border-b border-white/5">
            <tr>
              <th className="px-10 py-8">Fecha de Registro</th>
              <th className="px-10 py-8">Comprobante / Detalle</th>
              <th className="px-10 py-8 text-right italic">Facturación (+)</th>
              <th className="px-10 py-8 text-right italic">Cobranzas (-)</th>
              <th className="px-10 py-8 text-right bg-white/[0.01]">Saldo Acum.</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 italic">
            {historial.map((m, idx) => {
              // El balance sigue la lógica: Facturación suma a la deuda, Cobro resta.
              const balance = historial.slice(idx).reduce((a, b) => a + (Number(b.debe || b.monto) - Number(b.haber || b.monto)), 0);
              const esDebe = m.debe > 0 || m.estado_gestion === 'por_cobrar';
              
              return (
                <tr key={m.id} className="hover:bg-white/[0.03] transition-all group">
                  <td className="px-10 py-8 text-[11px] font-bold text-slate-500 uppercase tracking-tighter">
                    {new Date(m.fecha).toLocaleDateString('es-AR')}
                  </td>
                  <td className="px-10 py-8">
                    <div className="flex items-center gap-4">
                       <div className={`p-2 rounded-xl ${esDebe ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          {esDebe ? <ArrowUpRight size={18} /> : <ArrowDownLeft size={18} />}
                       </div>
                       <div>
                         <span className="font-black text-white text-base uppercase italic tracking-tighter block leading-none">
                           {m.nro_factura ? `F: ${m.nro_factura}` : m.descripcion}
                         </span>
                         <span className="text-[9px] font-bold text-slate-600 uppercase tracking-widest">
                           {m.estado_gestion?.replace('_', ' ') || 'Libro Mayor'}
                         </span>
                       </div>
                    </div>
                  </td>
                  <td className="px-10 py-8 text-right font-black text-emerald-500 text-base tabular-nums">
                    {m.debe > 0 ? `+ $${Number(m.debe).toLocaleString('es-AR')}` : '---'}
                  </td>
                  <td className="px-10 py-8 text-right font-black text-rose-500 text-base tabular-nums">
                    {m.haber > 0 ? `- $${Number(m.haber).toLocaleString('es-AR')}` : '---'}
                  </td>
                  <td className="px-10 py-8 text-right font-black text-slate-300 text-base bg-white/[0.01] tabular-nums tracking-tighter">
                    ${balance.toLocaleString('es-AR')}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>

        {/* VISTA MÓVIL OPTIMIZADA */}
        <div className="md:hidden divide-y divide-white/5 italic">
          {historial.map((m, idx) => {
             const esDebe = m.debe > 0 || m.estado_gestion === 'por_cobrar';
             return (
               <div key={m.id} className="p-8 space-y-4 hover:bg-white/[0.02]">
                 <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{m.fecha}</span>
                    <span className={`text-[10px] font-black uppercase px-3 py-1 rounded-full ${esDebe ? 'text-emerald-500 bg-emerald-500/5' : 'text-rose-500 bg-rose-500/5'}`}>
                      {m.estado_gestion || 'Pendiente'}
                    </span>
                 </div>
                 <div className="flex items-center gap-4">
                    <p className="text-lg font-black text-white uppercase italic tracking-tighter">
                       {m.nro_factura ? `Factura ${m.nro_factura}` : m.descripcion}
                    </p>
                 </div>
                 <div className="flex justify-between items-end pt-4 border-t border-white/5">
                    <div>
                      <p className="text-[8px] font-black text-slate-600 uppercase mb-1">Impacto en Cuenta</p>
                      <p className={`text-xl font-black ${esDebe ? 'text-emerald-500' : 'text-rose-500'}`}>
                        {esDebe ? `+$${Number(m.debe).toLocaleString()}` : `-$${Number(m.haber).toLocaleString()}`}
                      </p>
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