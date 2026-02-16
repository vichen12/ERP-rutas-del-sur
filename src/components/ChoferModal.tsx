'use client'
import { X, Loader2, CheckCircle2, ChevronRight, Calendar } from 'lucide-react'

interface ChoferModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  editingId: string | null;
  formData: any;
  setFormData: (data: any) => void;
  camiones: any[];
}

export function ChoferModal({ isOpen, onClose, onSubmit, isSubmitting, editingId, formData, setFormData, camiones }: ChoferModalProps) {
  if (!isOpen) return null;

  return (
    // CAMBIO CLAVE: items-start + pt-32 para bajarlo del navbar
    <div className="fixed inset-0 z-[200] flex items-start justify-center pt-28 md:pt-32 p-4 backdrop-blur-md bg-black/80 animate-in fade-in zoom-in-95 duration-200 overflow-y-auto">
      
      <div className="bg-[#020617] w-full max-w-lg rounded-[3rem] border border-white/10 p-10 shadow-2xl relative overflow-hidden mb-10">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-indigo-500 to-cyan-500" />
        
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black italic text-white uppercase tracking-tighter">
            {editingId ? 'Editar Legajo' : 'Alta de Chofer'}
          </h2>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors"><X /></button>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-6">
          {/* Nombre */}
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 uppercase pl-3 tracking-widest">Nombre Completo</label>
            <input 
              required 
              placeholder="EJ: JUAN PEREZ"
              className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:border-indigo-500 transition-colors uppercase italic placeholder:text-slate-700" 
              value={formData.nombre} 
              onChange={e => setFormData({...formData, nombre: e.target.value})} 
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Vencimiento Licencia */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase pl-3 tracking-widest">Vencimiento</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" size={18} />
                <input 
                  required 
                  type="date" 
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white font-bold outline-none focus:border-indigo-500 [color-scheme:dark] appearance-none uppercase" 
                  value={formData.vencimiento_licencia} 
                  onChange={e => setFormData({...formData, vencimiento_licencia: e.target.value})} 
                />
              </div>
            </div>

            {/* Unidad */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-indigo-500 uppercase pl-3 tracking-widest">Unidad</label>
              <div className="relative">
                <select 
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold outline-none appearance-none cursor-pointer uppercase focus:border-indigo-500 truncate pr-10" 
                  value={formData.camion_asignado} 
                  onChange={e => setFormData({...formData, camion_asignado: e.target.value})}
                >
                  <option value="" className="bg-[#020617] text-slate-500">SIN ASIGNAR</option>
                  {camiones.map(c => (
                      <option key={c.id} value={c.id} className="bg-[#020617] text-white">{c.patente} - {c.modelo}</option>
                  ))}
                </select>
                <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 rotate-90 pointer-events-none" size={16} />
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Nro Licencia */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase pl-3 tracking-widest">Nro Licencia</label>
              <input 
                required 
                placeholder="XXX-XXX"
                className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:border-indigo-500 uppercase placeholder:text-slate-700" 
                value={formData.licencia} 
                onChange={e => setFormData({...formData, licencia: e.target.value})} 
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-1">
              <label className="text-[9px] font-black text-slate-500 uppercase pl-3 tracking-widest">Teléfono</label>
              <input 
                required 
                type="tel"
                placeholder="261..."
                className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:border-indigo-500 placeholder:text-slate-700" 
                value={formData.telefono} 
                onChange={e => setFormData({...formData, telefono: e.target.value})} 
              />
            </div>
          </div>
          
          <button disabled={isSubmitting} className="w-full bg-indigo-600 hover:bg-indigo-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest mt-6 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 italic">
            {isSubmitting ? <Loader2 className="animate-spin" /> : <><CheckCircle2 /> {editingId ? 'Guardar Cambios' : 'Registrar Legajo'}</>}
          </button>
        </form>
      </div>
    </div>
  )
}