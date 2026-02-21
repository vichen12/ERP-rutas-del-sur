'use client'
import { useState, useEffect } from 'react'
import { X, Receipt, DollarSign, Calendar as CalendarIcon, Loader2, ArrowDownCircle, ArrowUpCircle, FileText, CheckCircle2 } from 'lucide-react'

export function RegistrarMovimientoModal({ 
  isOpen, onClose, onSubmit, isSaving, clienteNombre, initialData 
}: any) {
  // 🚀 ESTADOS CONTROLADOS PARA QUE LA EDICIÓN FUNCIONE PERFECTO
  const [tipo, setTipo] = useState<'cargo' | 'cobro'>('cobro')
  const [monto, setMonto] = useState('')
  const [remito, setRemito] = useState('')
  const [detalle, setDetalle] = useState('')
  const [fecha, setFecha] = useState('')

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        // MODO EDICIÓN: Cargamos los datos exactos
        setTipo(Number(initialData.debe) > 0 ? 'cargo' : 'cobro')
        setMonto(Number(initialData.debe) > 0 ? initialData.debe : initialData.haber)
        setRemito(initialData.remito || '')
        setDetalle(initialData.detalle || '')
        setFecha(initialData.fecha ? new Date(initialData.fecha).toISOString().split('T')[0] : new Date().toISOString().split('T')[0])
      } else {
        // MODO NUEVO: Todo en blanco
        setTipo('cobro')
        setMonto('')
        setRemito('')
        setDetalle('')
        setFecha(new Date().toISOString().split('T')[0])
      }
    }
  }, [isOpen, initialData])

  if (!isOpen) return null

  const handleLocalSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    onSubmit({
      id: initialData?.id, 
      tipo_movimiento: tipo,
      remito: remito.toUpperCase().trim(),
      monto: Number(monto),
      fecha: fecha,
      detalle: detalle.toUpperCase().trim()
    })
  }

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300 font-sans italic">
      <div className="bg-[#020617] border border-white/10 p-8 lg:p-10 rounded-[3rem] w-full max-w-2xl relative shadow-2xl overflow-hidden">
        
        <div className={`absolute -right-10 -top-10 w-40 h-40 blur-[100px] opacity-20 transition-colors duration-700 ${tipo === 'cargo' ? 'bg-sky-500' : 'bg-emerald-500'}`} />
        <div className={`absolute top-0 left-0 w-full h-1.5 transition-colors duration-700 ${tipo === 'cargo' ? 'bg-sky-500' : 'bg-emerald-500'}`} />

        <button onClick={onClose} className="absolute top-8 right-8 text-slate-500 hover:text-white transition-all z-20 p-2 bg-white/5 rounded-full"><X size={20}/></button>

        <header className="mb-8 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-3 rounded-2xl border transition-colors duration-500 ${tipo === 'cargo' ? 'bg-sky-500/10 border-sky-500/20 text-sky-500' : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'}`}>
              {tipo === 'cargo' ? <ArrowUpCircle size={22} /> : <ArrowDownCircle size={22} />}
            </div>
            <div>
              <p className={`text-[10px] font-black uppercase tracking-[0.4em] ${tipo === 'cargo' ? 'text-sky-500' : 'text-emerald-500'}`}>
                {initialData ? 'Editando Operación' : (tipo === 'cargo' ? 'Contabilidad: Cargo' : 'Contabilidad: Cobranza')}
              </p>
              <h3 className="text-3xl font-black uppercase tracking-tighter text-white leading-none">{clienteNombre}</h3>
            </div>
          </div>
        </header>

        {/* Solo mostramos el selector si es una operación nueva */}
        {!initialData && (
          <div className="flex bg-slate-950 p-1.5 rounded-2xl mb-8 border border-white/5 relative z-10 shadow-inner">
            <button type="button" onClick={() => setTipo('cobro')} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tipo === 'cobro' ? 'bg-emerald-600 text-white shadow-xl scale-[1.02]' : 'text-slate-600 hover:text-slate-400'}`}>
              <DollarSign size={16} /> Registrar Ingreso
            </button>
            <button type="button" onClick={() => setTipo('cargo')} className={`flex-1 flex items-center justify-center gap-3 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tipo === 'cargo' ? 'bg-sky-600 text-white shadow-xl scale-[1.02]' : 'text-slate-600 hover:text-slate-400'}`}>
              <Receipt size={16} /> Emitir Cargo Manual
            </button>
          </div>
        )}

        <form onSubmit={handleLocalSubmit} className="space-y-6 relative z-10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-4 tracking-widest">{tipo === 'cargo' ? 'Monto a Facturar ($)' : 'Monto Recibido ($)'}</label>
              <div className="relative">
                <DollarSign className={`absolute left-5 top-1/2 -translate-y-1/2 ${tipo === 'cargo' ? 'text-sky-500' : 'text-emerald-500'}`} size={18} />
                <input 
                  type="number" step="0.01" required autoFocus placeholder="0.00"
                  value={monto} onChange={(e) => setMonto(e.target.value)}
                  className="w-full p-5 pl-14 bg-slate-950 border border-white/5 rounded-2xl outline-none text-white font-black focus:border-white/20 transition-all text-xl tabular-nums placeholder:text-slate-800" 
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-4 tracking-widest flex items-center gap-2">
                {tipo === 'cargo' ? 'Referencia / Remito' : 'N° Recibo / Transferencia'} <span className="text-slate-700">(Opcional)</span>
              </label>
              <div className="relative">
                <FileText className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700" size={18} />
                <input 
                  placeholder={tipo === 'cargo' ? "EJ: REF-001" : "EJ: TR-1234"}
                  value={remito} onChange={(e) => setRemito(e.target.value)}
                  className="w-full p-5 pl-14 bg-slate-950 border border-white/5 rounded-2xl outline-none text-white font-black uppercase focus:border-white/20 transition-all text-xs tracking-widest placeholder:text-slate-800" 
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-4 tracking-widest">Concepto / Notas</label>
              <input 
                placeholder={tipo === 'cargo' ? "EJ: CARGO POR DEMORA" : "EJ: PAGO CHEQUE 30 DÍAS"}
                value={detalle} onChange={(e) => setDetalle(e.target.value)}
                className="w-full p-5 bg-slate-950 border border-white/5 rounded-2xl outline-none text-white font-black focus:border-white/20 transition-all text-xs uppercase placeholder:text-slate-800" 
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-4 tracking-widest">Fecha de Operación</label>
              <div className="relative">
                <CalendarIcon className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-700" size={18} />
                <input 
                  type="date" required
                  value={fecha} onChange={(e) => setFecha(e.target.value)}
                  className="w-full p-5 pl-14 bg-slate-950 border border-white/5 rounded-2xl outline-none text-white font-black focus:border-white/20 transition-all uppercase text-xs [color-scheme:dark]" 
                />
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button disabled={isSaving} className={`w-full py-6 font-black rounded-[2rem] uppercase text-[11px] tracking-[0.3em] shadow-xl active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50 group ${tipo === 'cargo' ? 'bg-sky-600 shadow-sky-900/20 hover:bg-sky-500' : 'bg-emerald-600 shadow-emerald-900/20 hover:bg-emerald-500'}`}>
              {isSaving ? <Loader2 className="animate-spin" size={20} /> : <>{initialData ? 'Guardar Cambios' : (tipo === 'cargo' ? 'Confirmar Asiento' : 'Impactar Cobranza')} <CheckCircle2 size={20} className="group-hover:scale-125 transition-transform duration-300" /></>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}