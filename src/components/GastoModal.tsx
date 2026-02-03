'use client'
import { X, DollarSign, FileText, CheckCircle2, Calendar } from 'lucide-react'

export function GastoModal({ isOpen, onClose, onSubmit, formData, setFormData, camionPatente }: any) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 backdrop-blur-md bg-black/80 animate-in fade-in duration-300">
      <div className="bg-[#020617] w-full max-w-md rounded-[2.5rem] border border-white/10 p-8 shadow-2xl relative">
        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.3)]" />
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <p className="text-[9px] font-black text-emerald-500 uppercase tracking-[0.2em]">Registrar Gasto</p>
            <h2 className="text-2xl font-black text-white italic uppercase tracking-tighter">{camionPatente}</h2>
          </div>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-5">
          {/* Descripción */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-2">Detalle de la reparación / compra</label>
            <div className="relative">
              <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16}/>
              <input 
                required 
                placeholder="EJ: CAMBIO DE CUBIERTAS DELANTERAS"
                className="w-full bg-slate-950 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-xs text-white font-bold outline-none focus:border-emerald-500 transition-all uppercase placeholder:text-slate-700" 
                value={formData.descripcion} 
                onChange={e => setFormData({...formData, descripcion: e.target.value.toUpperCase()})}
              />
            </div>
          </div>

          {/* Fila de Monto y Fecha */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-2">Monto ($)</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" size={16}/>
                <input 
                  required 
                  type="number" 
                  placeholder="0"
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-xs text-white font-bold outline-none focus:border-emerald-500 transition-all" 
                  value={formData.monto} 
                  onChange={e => setFormData({...formData, monto: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest pl-2">Fecha</label>
              <div className="relative">
                {/* Icono ahora en blanco para que resalte */}
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white" size={16}/>
                <input 
                  required 
                  type="date" 
                  /* [color-scheme:dark] arregla el icono nativo y el calendario en navegadores */
                  className="w-full bg-slate-950 border border-white/10 rounded-xl py-4 pl-12 pr-4 text-xs text-white font-bold outline-none focus:border-emerald-500 transition-all appearance-none [color-scheme:dark]" 
                  value={formData.fecha} 
                  onChange={e => setFormData({...formData, fecha: e.target.value})}
                />
              </div>
            </div>
          </div>

          <button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 italic mt-2">
            <CheckCircle2 size={18} /> Guardar Gasto
          </button>
        </form>
      </div>
    </div>
  )
}