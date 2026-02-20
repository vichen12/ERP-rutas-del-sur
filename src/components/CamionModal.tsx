'use client'
import { X, Loader2, Truck, User, Gauge, Droplets, ChevronRight } from 'lucide-react'

export function CamionModal({ 
  isOpen, onClose, onSubmit, isSubmitting, editingId, formData, setFormData, choferes 
}: any) {

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-center bg-black/90 backdrop-blur-sm p-4 overflow-y-auto italic">
      
      {/* CONTENEDOR PRINCIPAL: 
         - Quitamos el overflow del hijo para que el scroll sea natural del padre.
         - 'my-auto' permite que el modal se centre si es corto y scrollee si es largo.
      */}
      <div className="bg-[#020617] w-full max-w-lg rounded-[3rem] border border-white/10 p-8 md:p-10 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-300">
        
        {/* Decoración Superior */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-t-full" />

        <header className="flex justify-between items-start mb-8">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic">
              {editingId ? 'Editar' : 'Alta de'} <span className="text-cyan-500">Unidad</span>
            </h2>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1">Sincronización técnica de activos</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full text-slate-500 transition-colors">
            <X size={24} />
          </button>
        </header>

        {/* 🚀 FORMULARIO: Llamada directa al prop onSubmit para evitar pérdida de contexto */}
        <form onSubmit={onSubmit} className="space-y-6">
          
          {/* GRUPO 1: IDENTIDAD */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Patente</label>
              <input 
                required
                className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-6 text-white font-black focus:border-cyan-500 outline-none uppercase transition-all"
                value={formData.patente || ''}
                onChange={e => setFormData({...formData, patente: e.target.value.toUpperCase()})}
                placeholder="ABC-123"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Modelo</label>
              <input 
                className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-6 text-white font-black focus:border-cyan-500 outline-none uppercase transition-all"
                value={formData.modelo || ''}
                onChange={e => setFormData({...formData, modelo: e.target.value.toUpperCase()})}
                placeholder="SCANIA / VOLVO"
              />
            </div>
          </div>

          {/* GRUPO 2: KILOMETRAJE */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2 text-cyan-500">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest flex items-center gap-2">
                <Gauge size={10}/> KM Actual
              </label>
              <input 
                type="number"
                className="w-full bg-slate-900 border border-cyan-500/10 rounded-2xl py-4 px-6 text-white font-black focus:border-cyan-500 outline-none transition-all"
                value={formData.km_actual || ''}
                onChange={e => setFormData({...formData, km_actual: e.target.value})}
              />
            </div>
            <div className="space-y-2 text-amber-500">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest flex items-center gap-2">
                <Droplets size={10}/> Últ. Service
              </label>
              <input 
                type="number"
                className="w-full bg-slate-900 border border-amber-500/10 rounded-2xl py-4 px-6 text-white font-black focus:border-amber-500 outline-none transition-all"
                value={formData.km_ultimo_service || ''}
                onChange={e => setFormData({...formData, km_ultimo_service: e.target.value})}
              />
            </div>
          </div>

          {/* GRUPO 3: DOCUMENTACIÓN */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Vto RTO</label>
              <input 
                type="date"
                className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-6 text-white font-black focus:border-indigo-500 outline-none [color-scheme:dark]"
                value={formData.vto_rto || ''}
                onChange={e => setFormData({...formData, vto_rto: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest">Vto SENASA</label>
              <input 
                type="date"
                className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-6 text-white font-black focus:border-indigo-500 outline-none [color-scheme:dark]"
                value={formData.vto_senasa || ''}
                onChange={e => setFormData({...formData, vto_senasa: e.target.value})}
              />
            </div>
          </div>

          {/* GRUPO 4: RECURSOS HUMANOS */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-2 tracking-widest flex items-center gap-2">
              <User size={10}/> Operador Responsable
            </label>
            <select 
              className="w-full bg-slate-900 border border-white/5 rounded-2xl py-4 px-6 text-white font-black focus:border-cyan-500 outline-none appearance-none cursor-pointer"
              value={formData.chofer_id || ''}
              onChange={e => setFormData({...formData, chofer_id: e.target.value})}
            >
              <option value="">SIN OPERADOR ASIGNADO</option>
              {choferes.map((ch: any) => (
                <option key={ch.id} value={ch.id}>{ch.nombre}</option>
              ))}
            </select>
          </div>

          {/* BOTÓN DE ACCIÓN FINAL */}
          <div className="pt-6">
            <button 
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-500 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] transition-all shadow-xl shadow-cyan-900/20 active:scale-95 flex items-center justify-center gap-3 group"
            >
              {isSubmitting ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  {editingId ? 'Actualizar Flota' : 'Sincronizar Unidad'}
                  <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}