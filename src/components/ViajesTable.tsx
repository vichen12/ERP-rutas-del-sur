'use client'
import { MapPin, ArrowRight } from 'lucide-react'

export function ViajesTable({ viajes }: { viajes: any[] }) {
  return (
    <div className="bg-slate-900/60 rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead className="bg-white/[0.02] text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-white/5">
            <tr>
              <th className="p-8">Fecha</th>
              <th className="p-8">Cliente / Ruta</th>
              <th className="p-8 text-center">Recursos</th>
              <th className="p-8 text-right">Métricas</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 italic">
            {viajes.map(v => (
              <tr key={v.id} className="hover:bg-emerald-500/5 transition-colors">
                <td className="p-8 font-bold text-slate-500 whitespace-nowrap">
                  {new Date(v.fecha).toLocaleDateString('es-AR')}
                </td>
                <td className="p-8">
                  <p className="text-lg font-black text-white uppercase">{v.clientes?.razon_social || 'PARTICULAR'}</p>
                  <div className="flex items-center gap-2 text-[10px] text-emerald-500 font-bold uppercase tracking-widest">
                    <MapPin size={10} /> {v.origen} <ArrowRight size={10} /> {v.destino}
                  </div>
                </td>
                <td className="p-8 text-center">
                  <div className="inline-flex flex-col gap-1">
                    <span className="bg-slate-950 border border-white/5 px-3 py-1 rounded-full text-[10px] font-black text-slate-300 uppercase">
                      {v.camiones?.patente}
                    </span>
                    <span className="text-[9px] text-slate-600 font-bold uppercase">{v.choferes?.nombre}</span>
                  </div>
                </td>
                <td className="p-8 text-right">
                  <p className="text-lg font-black text-white">+{v.km_recorridos} KM</p>
                  <p className="text-sm font-bold text-emerald-500">$ {Number(v.monto_neto).toLocaleString()}</p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}