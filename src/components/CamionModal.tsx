'use client'
import { X, Loader2, CheckCircle2, ChevronRight, Gauge, Droplets, User, Calendar, ShieldCheck } from 'lucide-react'

interface CamionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => void;
  isSubmitting: boolean;
  editingId: string | null;
  formData: any;
  setFormData: (data: any) => void;
  choferes: any[];
}

export function CamionModal({ 
  isOpen, 
  onClose, 
  onSubmit, 
  isSubmitting, 
  editingId, 
  formData, 
  setFormData,
  choferes 
}: CamionModalProps) {
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 backdrop-blur-md bg-black/80 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-[#020617] w-full max-w-lg rounded-[3rem] border border-white/10 p-10 shadow-2xl relative overflow-hidden italic font-sans">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyan-500 to-indigo-500" />
        
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-black text-white uppercase tracking-tighter">
            {editingId ? 'Editar Unidad' : 'Alta de Camión'}
          </h2>
          <button onClick={onClose} className="p-2 bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>
        
        <form onSubmit={onSubmit} className="space-y-5 uppercase font-black">
          
          {/* PATENTE Y MODELO */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] text-slate-500 tracking-widest pl-2">Patente</label>
              <input 
                required 
                placeholder="ABC-123" 
                className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:border-cyan-500 transition-colors uppercase" 
                value={formData.patente || ''} 
                onChange={e => setFormData({...formData, patente: e.target.value.toUpperCase()})} 
              />
            </div>
            <div className="space-y-1">
              <label className="text-[9px] text-slate-500 tracking-widest pl-2">Modelo / Año</label>
              <input 
                required 
                placeholder="IVECO 450 - 2024" 
                className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold outline-none focus:border-cyan-500 transition-colors uppercase" 
                value={formData.modelo || ''} 
                onChange={e => setFormData({...formData, modelo: e.target.value.toUpperCase()})} 
              />
            </div>
          </div>
          
          {/* KILOMETRAJE ACTUAL */}
          <div className="space-y-1">
            <label className="text-[9px] text-slate-500 tracking-widest pl-2">Kilometraje Actual</label>
            <div className="relative">
              <Gauge className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
              <input 
                required 
                type="number" 
                placeholder="0" 
                className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white font-bold outline-none focus:border-cyan-500 transition-colors" 
                value={formData.km_actual || ''} 
                onChange={e => setFormData({...formData, km_actual: e.target.value})} 
              />
            </div>
          </div>

          {/* SERVICE Y RTO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-[9px] text-amber-500 tracking-widest pl-2">KM Último Aceite</label>
              <div className="relative">
                <Droplets className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-600" size={18} />
                <input 
                  required 
                  type="number" 
                  placeholder="KM Service" 
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white font-bold outline-none focus:border-amber-500 transition-colors" 
                  value={formData.ultimo_cambio_aceite || ''} 
                  onChange={e => setFormData({...formData, ultimo_cambio_aceite: e.target.value})} 
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[9px] text-rose-500 tracking-widest pl-2">Vencimiento RTO</label>
              <div className="relative">
                <Calendar className="absolute left-5 top-1/2 -translate-y-1/2 text-rose-600" size={18} />
                <input 
                  required 
                  type="date" 
                  /* AGREGAMOS [&::-webkit-calendar-picker-indicator]:invert PARA BLANQUEAR EL ICONO */
                  className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white font-bold outline-none focus:border-rose-500 transition-colors uppercase [&::-webkit-calendar-picker-indicator]:invert" 
                  value={formData.vencimiento_rto || ''} 
                  onChange={e => setFormData({...formData, vencimiento_rto: e.target.value})} 
                />
              </div>
            </div>
          </div>
          
          {/* VENCIMIENTO SENASA */}
          <div className="space-y-1">
            <label className="text-[9px] text-emerald-500 tracking-widest pl-2 uppercase">Vencimiento SENASA</label>
            <div className="relative">
              <ShieldCheck className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-600" size={18} />
              <input 
                required 
                type="date" 
                /* AGREGAMOS [&::-webkit-calendar-picker-indicator]:invert PARA BLANQUEAR EL ICONO */
                className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-14 pr-6 text-white font-bold outline-none focus:border-emerald-500 transition-colors uppercase [&::-webkit-calendar-picker-indicator]:invert" 
                value={formData.vencimiento_senasa || ''} 
                onChange={e => setFormData({...formData, vencimiento_senasa: e.target.value})} 
              />
            </div>
          </div>

          <p className="text-[8px] text-slate-600 -mt-2 pl-2 uppercase font-black">Service recomendado cada 20.000 KM</p>

          {/* ASIGNACIÓN DE CHOFER */}
          <div className="space-y-1">
            <label className="text-[9px] text-cyan-500 tracking-widest pl-2 uppercase">Chofer Asignado</label>
            <div className="relative">
              <User className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
              <select 
                className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-14 pr-10 text-white font-bold outline-none focus:border-cyan-500 appearance-none cursor-pointer"
                value={formData.chofer_id || ''} 
                onChange={e => setFormData({...formData, chofer_id: e.target.value})}
              >
                <option value="">DISPONIBLE / SIN CHOFER</option>
                {choferes?.map((ch: any) => (
                  <option key={ch.id} value={ch.id}>{ch.nombre}</option>
                ))}
              </select>
              <ChevronRight className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-600 rotate-90 pointer-events-none" size={16} />
            </div>
          </div>

          <button 
            disabled={isSubmitting} 
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-5 rounded-2xl font-black uppercase tracking-widest mt-4 transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-cyan-600/20 italic"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <>
                <CheckCircle2 size={20} />
                {editingId ? 'Guardar Cambios' : 'Registrar Unidad'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}