'use client'
import { FileText, Loader2 } from 'lucide-react'

const TC: Record<string, string> = {
  A: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  B: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  C: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
}

function ec(e: string) {
  if (e === 'emitida') return 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
  if (e === 'error') return 'bg-rose-500/10 border-rose-500/20 text-rose-400'
  return 'bg-slate-500/10 border-slate-500/20 text-slate-400'
}

export function FacturasTabla({ facturas, loading }: any) {
  if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin text-sky-500" size={40} /></div>
  return (
    <div className="space-y-4 font-sans italic">
      <div className="flex justify-between items-center px-2">
        <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">Historial</p>
        <span className="text-[9px] font-black text-slate-600 uppercase bg-white/5 px-3 py-1 rounded-lg border border-white/5">{facturas.length} registros</span>
      </div>
      <div className="bg-slate-900/40 rounded-[2.5rem] border border-white/5 overflow-hidden shadow-2xl">
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left min-w-[900px]">
            <thead className="bg-white/[0.02] text-[9px] font-black text-slate-600 uppercase tracking-[0.3em] border-b border-white/5">
              <tr><th className="p-6 pl-8">Fecha</th><th className="p-6">Tipo</th><th className="p-6">Comprobante</th><th className="p-6">Cliente</th><th className="p-6">CAE</th><th className="p-6">Vto</th><th className="p-6 text-right">Total</th><th className="p-6 pr-8 text-center">Estado</th></tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {facturas.length === 0 && <tr><td colSpan={8} className="py-20 text-center"><div className="flex flex-col items-center gap-3 opacity-30"><FileText size={40} className="text-slate-600" /><p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Sin facturas</p></div></td></tr>}
              {facturas.map((f: any) => {
                const l = f.tipo_comprobante || 'B'
                return (
                  <tr key={f.id} className="hover:bg-white/[0.02] transition-all">
                    <td className="p-6 pl-8 text-sm font-bold text-slate-400">{new Date(f.fecha_comprobante+'T00:00:00').toLocaleDateString('es-AR')}</td>
                    <td className="p-6"><span className={'px-3 py-1.5 rounded-xl text-[10px] font-black uppercase border '+(TC[l]||TC.B)}>FACT {l}</span></td>
                    <td className="p-6"><p className="text-sm font-black text-white tabular-nums">{String(f.punto_venta).padStart(4,'0')}-{String(f.numero_comprobante).padStart(8,'0')}</p></td>
                    <td className="p-6"><p className="text-sm font-bold text-slate-300 uppercase">{f.clientes?.razon_social||f.razon_social_receptor||'CONS. FINAL'}</p>{f.cuit_receptor&&<p className="text-[9px] text-slate-600 font-bold">{f.cuit_receptor}</p>}</td>
                    <td className="p-6">{f.cae?<p className="text-[10px] font-black text-emerald-400 tabular-nums font-mono">{f.cae}</p>:<span className="text-slate-700">-</span>}</td>
                    <td className="p-6 text-sm font-bold text-slate-400">{f.cae_vto?new Date(f.cae_vto+'T00:00:00').toLocaleDateString('es-AR'):'-'}</td>
                    <td className="p-6 text-right"><p className="text-xl font-black text-white tabular-nums">$ {Number(f.importe_total).toLocaleString('es-AR')}</p></td>
                    <td className="p-6 pr-8 text-center"><span className={'px-3 py-1.5 rounded-xl text-[8px] font-black uppercase border '+ec(f.estado)}>{f.estado}</span></td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
        <div className="md:hidden divide-y divide-white/5">
          {facturas.map((f: any) => {
            const l = f.tipo_comprobante||'B'
            return (<div key={f.id} className="p-6 space-y-3"><div className="flex justify-between"><span className={'px-3 py-1 rounded-xl text-[9px] font-black uppercase border '+(TC[l]||TC.B)}>FACT {l}</span><span className={'px-3 py-1 rounded-xl text-[9px] font-black uppercase border '+ec(f.estado)}>{f.estado}</span></div><p className="text-base font-black text-white uppercase">{f.clientes?.razon_social||'CONS. FINAL'}</p><p className="text-2xl font-black text-sky-400 tabular-nums">$ {Number(f.importe_total).toLocaleString('es-AR')}</p>{f.cae&&<p className="text-[9px] font-mono text-emerald-400">CAE: {f.cae}</p>}</div>)
          })}
        </div>
      </div>
    </div>
  )
}