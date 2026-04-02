'use client'
import { useState, useEffect, useMemo } from 'react'
import { X, ChevronRight, DollarSign, Loader2, CheckCircle2 } from 'lucide-react'

const TIPOS_COMPROBANTE = [
  { value: 1,  label: 'Factura A', letra: 'A', desc: 'Resp. Inscripto → Resp. Inscripto' },
  { value: 6,  label: 'Factura B', letra: 'B', desc: 'Resp. Inscripto → Cons. Final' },
  { value: 11, label: 'Factura C', letra: 'C', desc: 'Monotributista' },
]

const ALICUOTAS = [
  { value: 0, label: 'Exento (0%)' }, { value: 10.5, label: '10.5%' },
  { value: 21, label: '21%' }, { value: 27, label: '27%' },
]

const TIPO_COLORS: Record<string, string> = {
  A: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
  B: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
  C: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
}

export function FacturaModal({ isOpen, onClose, onSubmit, isEmitting, clientes, viajes, remitos, puntoVenta }: any) {
  const [form, setForm] = useState({ tipo_comprobante: 6, fecha_comprobante: new Date().toISOString().split('T')[0], cliente_id: '', cuit_receptor: '', condicion_iva_receptor: 'CF', importe_neto: '', alicuota_iva: 21, concepto: 2, descripcion: 'SERVICIO DE TRANSPORTE', viaje_id: '', remito_id: '' })
  
  const importeIva   = useMemo(() => (Number(form.importe_neto) * form.alicuota_iva) / 100, [form.importe_neto, form.alicuota_iva])
  const importeTotal = useMemo(() => Number(form.importe_neto) + importeIva, [form.importe_neto, importeIva])
  
  useEffect(() => { if (isOpen) setForm({ tipo_comprobante: 6, fecha_comprobante: new Date().toISOString().split('T')[0], cliente_id: '', cuit_receptor: '', condicion_iva_receptor: 'CF', importe_neto: '', alicuota_iva: 21, concepto: 2, descripcion: 'SERVICIO DE TRANSPORTE', viaje_id: '', remito_id: '' }) }, [isOpen])
  
  function handleClienteChange(id: string) { const c = clientes.find((x: any) => x.id === id); setForm(p => ({ ...p, cliente_id: id, cuit_receptor: c?.cuit || '' })) }
  function handleViajeChange(id: string) { const v = viajes.find((x: any) => x.id === id); setForm(p => ({ ...p, viaje_id: id, ...(v?.tarifa_flete ? { importe_neto: (Number(v.tarifa_flete) / 1.21).toFixed(2) } : {}) })) }
  
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-center bg-[#141c28]/90 backdrop-blur-md p-4 overflow-y-auto font-sans italic" onClick={onClose}>
      <div className="bg-[#141c28] w-full max-w-2xl rounded-[3rem] border border-white/10 p-8 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-300 max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <div className="absolute top-0 left-0 w-full h-1.5 rounded-t-full bg-sky-500" />
        <div className="flex justify-between items-start mb-8">
          <div><p className="text-[10px] font-black uppercase tracking-[0.4em] mb-1 text-sky-500">Nueva Factura Electrónica</p><h2 className="text-3xl font-black text-white uppercase tracking-tighter">Emitir Comprobante</h2></div>
          <button onClick={onClose} className="p-2.5 bg-white/5 rounded-full text-slate-500 hover:text-white hover:rotate-90 transition-all"><X size={20} /></button>
        </div>
        <form onSubmit={e => { e.preventDefault(); onSubmit({ ...form, importe_iva: importeIva, importe_total: importeTotal, importe_neto: Number(form.importe_neto), punto_venta: puntoVenta }) }} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Tipo de Comprobante</label>
            <div className="flex gap-3">
              {TIPOS_COMPROBANTE.map(t => (
                <button key={t.value} type="button" onClick={() => setForm(p => ({ ...p, tipo_comprobante: t.value }))}
                  className={`flex-1 py-4 px-3 rounded-2xl border text-center transition-all ${form.tipo_comprobante === t.value ? `${TIPO_COLORS[t.letra]} shadow-lg` : 'bg-[#1a2537] border-white/5 text-slate-600 hover:text-white'}`}>
                  <p className="text-2xl font-black">{t.letra}</p><p className="text-[8px] font-black uppercase tracking-widest mt-1">{t.label}</p><p className="text-[7px] text-slate-600 mt-0.5">{t.desc}</p>
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Cliente</label>
              <div className="relative">
                <select value={form.cliente_id} onChange={e => handleClienteChange(e.target.value)} className="w-full bg-[#1a2537] border border-white/5 rounded-2xl py-4 px-5 text-white font-bold text-xs outline-none appearance-none uppercase">
                  <option value="">CONSUMIDOR FINAL</option>{clientes.map((c: any) => <option key={c.id} value={c.id}>{c.razon_social}</option>)}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 rotate-90 pointer-events-none" size={14} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">CUIT Receptor</label>
              <input placeholder="00000000000" value={form.cuit_receptor} onChange={e => setForm(p => ({ ...p, cuit_receptor: e.target.value.replace(/\D/g, '') }))} className="w-full bg-[#1a2537] border border-white/5 rounded-2xl py-4 px-5 text-white font-black text-sm tabular-nums outline-none focus:border-sky-500 placeholder:text-slate-700" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Vincular a Viaje</label>
              <div className="relative">
                <select value={form.viaje_id} onChange={e => handleViajeChange(e.target.value)} className="w-full bg-[#1a2537] border border-white/5 rounded-2xl py-4 px-5 text-white font-bold text-xs outline-none appearance-none uppercase">
                  <option value="">SIN VINCULAR</option>{viajes.map((v: any) => <option key={v.id} value={v.id}>{new Date(v.fecha).toLocaleDateString('es-AR')} — {v.clientes?.razon_social}</option>)}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 rotate-90 pointer-events-none" size={14} />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Vincular a Remito</label>
              <div className="relative">
                <select value={form.remito_id} onChange={e => setForm(p => ({ ...p, remito_id: e.target.value }))} className="w-full bg-[#1a2537] border border-white/5 rounded-2xl py-4 px-5 text-white font-bold text-xs outline-none appearance-none uppercase">
                  <option value="">SIN VINCULAR</option>{remitos.filter((r: any) => !r.facturado).map((r: any) => <option key={r.id} value={r.id}>Rem. {r.numero || r.id.substring(0,8)} — {r.clientes?.razon_social}</option>)}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 rotate-90 pointer-events-none" size={14} />
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Importe Neto (sin IVA)</label>
              <div className="relative">
                <DollarSign className="absolute left-5 top-1/2 -translate-y-1/2 text-sky-500" size={16} />
                <input required type="number" step="0.01" min="0" placeholder="0.00" value={form.importe_neto} onChange={e => setForm(p => ({ ...p, importe_neto: e.target.value }))} className="w-full bg-[#1a2537] border border-white/5 rounded-2xl py-4 pl-14 pr-4 text-white font-black text-xl tabular-nums outline-none focus:border-sky-500" />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Alícuota IVA</label>
              <div className="relative">
                <select value={form.alicuota_iva} onChange={e => setForm(p => ({ ...p, alicuota_iva: Number(e.target.value) }))} className="w-full bg-[#1a2537] border border-white/5 rounded-2xl py-4 px-5 text-white font-black text-sm outline-none appearance-none uppercase">
                  {ALICUOTAS.map(a => <option key={a.value} value={a.value}>{a.label}</option>)}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-600 rotate-90 pointer-events-none" size={14} />
              </div>
            </div>
          </div>
          {form.importe_neto && (
            <div className="grid grid-cols-3 gap-3 p-4 bg-[#141c28]/60 rounded-2xl border border-white/5">
              {[{ label: 'Neto', value: Number(form.importe_neto), color: 'text-slate-300' }, { label: `IVA ${form.alicuota_iva}%`, value: importeIva, color: 'text-amber-400' }, { label: 'TOTAL', value: importeTotal, color: 'text-sky-400' }].map((r, i) => (
                <div key={i} className="text-center">
                  <p className="text-[8px] font-black text-slate-600 uppercase tracking-widest">{r.label}</p>
                  <p className={`text-lg font-black tabular-nums ${r.color}`}>$ {r.value.toLocaleString('es-AR', { maximumFractionDigits: 2 })}</p>
                </div>
              ))}
            </div>
          )}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Descripción</label>
              <input value={form.descripcion} onChange={e => setForm(p => ({ ...p, descripcion: e.target.value.toUpperCase() }))} className="w-full bg-[#1a2537] border border-white/5 rounded-2xl py-4 px-5 text-white font-black text-sm uppercase outline-none focus:border-sky-500" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Fecha</label>
              <input type="date" value={form.fecha_comprobante} onChange={e => setForm(p => ({ ...p, fecha_comprobante: e.target.value }))} className="w-full bg-[#1a2537] border border-white/5 rounded-2xl py-4 px-5 text-white font-black text-sm outline-none [color-scheme:dark]" />
            </div>
          </div>
          <button type="submit" disabled={isEmitting} className="w-full py-5 rounded-2xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-black uppercase text-[10px] tracking-[0.3em] transition-all active:scale-95 flex items-center justify-center gap-3 shadow-xl">
            {isEmitting ? <><Loader2 className="animate-spin" size={20} /> Enviando a ARCA...</> : <><CheckCircle2 size={20} /> Emitir Factura</>}
          </button>
        </form>
      </div>
    </div>
  )
}