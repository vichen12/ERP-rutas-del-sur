'use client'
import { useState } from 'react'
import { X, Receipt, DollarSign, Calendar as CalendarIcon, Loader2, Truck, ArrowDownCircle, ArrowUpCircle, FileText, CheckCircle2 } from 'lucide-react'

export function RegistrarMovimientoModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isSaving, 
  clienteNombre,
  remitosPendientes = [] 
}: any) {
  const [tipo, setTipo] = useState<'cargo' | 'cobro'>('cargo')
  const [remitoSeleccionado, setRemitoSeleccionado] = useState<any>(null)

  if (!isOpen) return null

  const handleLocalSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    
    // Enviamos los datos normalizados para la lógica de page.tsx
    onSubmit({
      tipo_movimiento: tipo,
      // Si es un cobro, vinculamos el ID del movimiento de deuda original
      remito_id: tipo === 'cobro' ? remitoSeleccionado?.id : null,
      remito: fd.get('remito')?.toString().toUpperCase().trim(),
      monto: Number(fd.get('monto')),
      fecha: fd.get('fecha'),
      detalle: fd.get('detalle')?.toString().toUpperCase().trim()
    })
  }

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300 font-sans italic">
      <div className="bg-[#020617] border border-white/10 p-8 lg:p-10 rounded-[3rem] w-full max-w-2xl relative shadow-2xl overflow-hidden">
        
        {/* DECORACIÓN DINÁMICA SEGÚN TIPO */}
        <div className={`absolute -right-10 -top-10 w-40 h-40 blur-[100px] opacity-20 transition-colors duration-700 ${tipo === 'cargo' ? 'bg-sky-500' : 'bg-emerald-500'}`} />
        <div className={`absolute top-0 left-0 w-full h-1.5 transition-colors duration-700 ${tipo === 'cargo' ? 'bg-sky-500 shadow-[0_0_15px_rgba(14,165,233,0.5)]' : 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)]'}`} />

        <button 
          onClick={onClose} 
          className="absolute top-8 right-8 text-slate-500 hover:text-white hover:rotate-90 transition-all z-20 p-2 bg-white/5 rounded-full"
        >
          <X size={20}/>
        </button>

        <header className="mb-8 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-2xl border transition-colors duration-500 ${tipo === 'cargo' ? 'bg-sky-500/10 border-sky-500/20 text-sky-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
              {tipo === 'cargo' ? <ArrowUpCircle size={22} /> : <ArrowDownCircle size={22} />}
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${tipo === 'cargo' ? 'text-sky-500' : 'text-emerald-500'}`}>
                {tipo === 'cargo' ? 'Contabilidad: Cargo' : 'Contabilidad: Cobranza'}
              </p>
              <h3 className="text-3xl font-black uppercase tracking-tighter text-white leading-none">
                {clienteNombre}
              </h3>
            </div>
          </div>
        </header>

        {/* SELECTOR TÁCTICO DE OPERACIÓN */}
        <div className="flex bg-slate-950 p-1.5 rounded-2xl mb-8 border border-white/5 relative z-10 shadow-inner">
          <button 
            type="button"
            onClick={() => { setTipo('cargo'); setRemitoSeleccionado(null); }}
            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tipo === 'cargo' ? 'bg-sky-600 text-white shadow-xl scale-[1.02]' : 'text-slate-600 hover:text-slate-400'}`}
          >
            <Receipt size={16} /> Emitir Deuda
          </button>
          <button 
            type="button"
            onClick={() => setTipo('cobro')}
            className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tipo === 'cobro' ? 'bg-emerald-600 text-white shadow-xl scale-[1.02]' : 'text-slate-600 hover:text-slate-400'}`}
          >
            <DollarSign size={16} /> Registrar Cobro
          </button>
        </div>

        <form onSubmit={handleLocalSubmit} className="space-y-6 relative z-10">
          
          {/* LÓGICA DE COBRO: VINCULAR A DEUDA EXISTENTE */}
          {tipo === 'cobro' && (
            <div className="space-y-3 animate-in slide-in-from-top-4 duration-500">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-4 tracking-[0.2em] flex items-center gap-2">
                <Truck size={12} className="text-emerald-500"/> Vincular con Viaje Pendiente
              </label>
              <select 
                onChange={(e) => {
                  const r = remitosPendientes.find((rp:any) => rp.id === e.target.value)
                  setRemitoSeleccionado(r)
                }}
                required={tipo === 'cobro'}
                className="w-full p-5 bg-slate-950 border border-white/10 rounded-2xl outline-none text-white font-black text-xs focus:border-emerald-500/50 appearance-none cursor-pointer shadow-xl"
              >
                <option value="">-- SELECCIONE EL COMPROBANTE --</option>
                {remitosPendientes.map((r: any) => (
                  <option key={r.id} value={r.id}>
                    {new Date(r.fecha).toLocaleDateString()} | {r.remitos?.numero_remito || r.detalle} | SALDO: ${Number(r.debe || 0).toLocaleString()}
                  </option>
                ))}
              </select>

              {remitoSeleccionado && (
                <div className="p-5 bg-emerald-500/5 border border-emerald-500/10 rounded-[2rem] flex items-center justify-between animate-in zoom-in-95">
                  <div className="flex flex-col gap-1">
                    <span className="text-[9px] text-slate-600 uppercase font-black tracking-widest">Documento a Liquidar</span>
                    <span className="text-white font-black text-xs uppercase tracking-tight">
                      {remitoSeleccionado.remitos?.numero_remito || 'CARGO MANUAL'}
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="block text-slate-600 uppercase font-black text-[9px] tracking-widest">Importe Pendiente</span>
                    <span className="text-emerald-500 font-black text-2xl tabular-nums tracking-tighter">
                      ${Number(remitoSeleccionado.debe || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* COMPROBANTE */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-4 tracking-widest">
                {tipo === 'cargo' ? 'Referencia / Remito' : 'N° Recibo / Transferencia'}
              </label>
              <div className="relative">
                <FileText className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700" size={18} />
                <input 
                  name="remito" 
                  placeholder={tipo === 'cargo' ? "OPCIONAL" : "RE-0001-XXXX"} 
                  required={tipo === 'cobro'}
                  className="w-full p-5 pl-14 bg-slate-950 border border-white/5 rounded-2xl outline-none text-white font-black uppercase focus:border-white/20 transition-all text-xs tracking-widest placeholder:text-slate-800" 
                />
              </div>
            </div>

            {/* MONTO */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-4 tracking-widest">
                {tipo === 'cargo' ? 'Monto del Cargo ($)' : 'Monto a Ingresar ($)'}
              </label>
              <div className="relative">
                <DollarSign className={`absolute left-5 top-1/2 -translate-y-1/2 ${tipo === 'cargo' ? 'text-sky-500' : 'text-emerald-500'}`} size={18} />
                <input 
                  name="monto" 
                  type="number" 
                  step="0.01" 
                  defaultValue={tipo === 'cobro' ? remitoSeleccionado?.debe : ''} 
                  placeholder="0.00" 
                  required 
                  className="w-full p-5 pl-14 bg-slate-950 border border-white/5 rounded-2xl outline-none text-white font-black focus:border-white/20 transition-all text-sm tabular-nums" 
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* FECHA */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-4 tracking-widest">Fecha de Operación</label>
              <div className="relative">
                <CalendarIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700" size={18} />
                <input 
                  name="fecha" 
                  type="date" 
                  defaultValue={new Date().toISOString().split('T')[0]} 
                  required 
                  className="w-full p-5 pl-14 bg-slate-950 border border-white/5 rounded-2xl outline-none text-white font-black focus:border-white/20 transition-all uppercase text-xs [color-scheme:dark]" 
                />
              </div>
            </div>

            {/* DETALLE */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-4 tracking-widest">Concepto / Notas</label>
              <input 
                name="detalle" 
                placeholder={tipo === 'cargo' ? "EJ: CARGO POR DEMORA" : "EJ: PAGO CHEQUE 30 DÍAS"} 
                className="w-full p-5 bg-slate-950 border border-white/5 rounded-2xl outline-none text-white font-black focus:border-white/20 transition-all text-xs uppercase placeholder:text-slate-800" 
              />
            </div>
          </div>

          {/* BOTÓN DE CIERRE DE OPERACIÓN */}
          <div className="pt-4">
            <button 
              disabled={isSaving} 
              className={`w-full py-6 font-black rounded-[2rem] uppercase text-[11px] tracking-[0.3em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50 group ${
                tipo === 'cargo' ? 'bg-sky-600 shadow-sky-900/20 hover:bg-sky-500' : 'bg-emerald-600 shadow-emerald-900/20 hover:bg-emerald-500'
              }`}
            >
              {isSaving ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {tipo === 'cargo' ? 'Confirmar Asiento Contable' : 'Finalizar Cobranza'}
                  <CheckCircle2 size={20} className="group-hover:scale-125 transition-transform duration-300" />
                </>
              )}
            </button>
            <p className="text-[8px] text-center text-slate-700 font-black uppercase tracking-[0.5em] mt-6 opacity-50">
              Registrando movimiento en servidor maestro Rutas del Sur V2.0
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}