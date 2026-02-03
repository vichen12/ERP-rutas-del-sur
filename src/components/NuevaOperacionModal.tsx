'use client'
import { useState } from 'react'
import { X, ArrowUpRight, ArrowDownLeft, Calendar, FileText, DollarSign, CheckCircle2, Loader2 } from 'lucide-react'

export function NuevaOperacionModal({ isOpen, onClose, onSubmit, isSaving, clienteNombre }: any) {
  const [tipo, setTipo] = useState<'debe' | 'haber'>('debe')
  const [monto, setMonto] = useState('')
  const [descripcion, setDescripcion] = useState('')
  const [fecha, setFecha] = useState(new Date().toISOString().split('T')[0])

  if (!isOpen) return null

  const handleLocalSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onSubmit({
      tipo,
      monto: Number(monto),
      descripcion: descripcion.toUpperCase(),
      fecha
    })
    setMonto('')
    setDescripcion('')
  }

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md italic">
      <div className="bg-[#020617] border border-white/10 w-full max-w-lg rounded-[3.5rem] shadow-2xl relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-full h-1.5 ${tipo === 'debe' ? 'bg-rose-500' : 'bg-emerald-500'}`} />
        
        <div className="p-10 pb-0 flex justify-between items-start">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">Cargar movimiento para</p>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none">{clienteNombre}</h2>
          </div>
          <button onClick={onClose} className="p-2 text-slate-500 hover:text-white"><X size={28}/></button>
        </div>

        <div className="p-10 pt-8 space-y-8">
          <div className="grid grid-cols-2 gap-4">
            <button 
              type="button"
              onClick={() => setTipo('debe')}
              className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-2 ${tipo === 'debe' ? 'border-rose-500 bg-rose-500/10 text-white' : 'border-white/5 bg-white/5 text-slate-500'}`}
            >
              <ArrowUpRight size={20} />
              <span className="text-[10px] font-black uppercase">Flete (Debe)</span>
            </button>
            <button 
              type="button"
              onClick={() => setTipo('haber')}
              className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col items-center gap-2 ${tipo === 'haber' ? 'border-emerald-500 bg-emerald-500/10 text-white' : 'border-white/5 bg-white/5 text-slate-500'}`}
            >
              <ArrowDownLeft size={20} />
              <span className="text-[10px] font-black uppercase">Pago (Haber)</span>
            </button>
          </div>

          <form onSubmit={handleLocalSubmit} className="space-y-4">
            <input 
              required 
              placeholder="CONCEPTO (EJ: FLETE BS AS)"
              className="w-full bg-slate-950 border border-white/10 rounded-2xl p-5 text-white font-bold uppercase outline-none focus:border-sky-500"
              value={descripcion}
              onChange={e => setDescripcion(e.target.value)}
            />
            <div className="grid grid-cols-2 gap-4">
              <input 
                required 
                type="number"
                placeholder="MONTO $"
                className="w-full bg-slate-950 border border-white/10 rounded-2xl p-5 text-white font-bold outline-none focus:border-sky-500"
                value={monto}
                onChange={e => setMonto(e.target.value)}
              />
              <input 
                required 
                type="date"
                className="w-full bg-slate-950 border border-white/10 rounded-2xl p-5 text-white font-bold outline-none focus:border-sky-500 [color-scheme:dark]"
                value={fecha}
                onChange={e => setFecha(e.target.value)}
              />
            </div>
            <button 
              disabled={isSaving}
              className={`w-full py-6 rounded-3xl font-black uppercase text-[11px] tracking-widest flex items-center justify-center gap-3 ${
                tipo === 'debe' ? 'bg-rose-600' : 'bg-emerald-600'
              }`}
            >
              {isSaving ? <Loader2 className="animate-spin" /> : 'Registrar Movimiento'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}