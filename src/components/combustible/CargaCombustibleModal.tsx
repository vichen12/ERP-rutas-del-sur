'use client'
import { useState, useEffect } from 'react'
import { X, Loader2, User, UserPlus } from 'lucide-react'

interface CargaCombustibleModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (payload: any) => Promise<void>
  camiones: any[]
  choferes: any[]
  precioGasoilReferencia: number
}

export function CargaCombustibleModal({ isOpen, onClose, onSave, camiones, choferes, precioGasoilReferencia }: CargaCombustibleModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [tipoResponsable, setTipoResponsable] = useState<'chofer' | 'otro'>('chofer')
  
  const [formData, setFormData] = useState({
    fecha: new Date().toISOString().split('T')[0],
    camion_id: '', chofer_id: '', responsable_externo: '', litros: '', precio_litro: '', remito_nro: '', estacion: 'YPF'
  })

  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({ ...prev, precio_litro: precioGasoilReferencia.toString() }))
    }
  }, [isOpen, precioGasoilReferencia])

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Armamos el objeto limpio
    const payload = { ...formData };
    if (tipoResponsable === 'chofer') payload.responsable_externo = '';
    if (tipoResponsable === 'otro') payload.chofer_id = ''; 

    await onSave(payload)
    setIsSubmitting(false)
    setFormData({ ...formData, litros: '', remito_nro: '' }) // Limpiamos parcial
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-sans italic">
      <div className="bg-[#020617] border border-amber-500/20 rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/5 rounded-full text-slate-400 hover:text-white hover:bg-rose-500 transition-all"><X size={18}/></button>
        
        <h3 className="text-2xl font-black text-white uppercase mb-6">Cargar <span className="text-amber-500">Remito Gasoil</span></h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Fecha</label>
              <input type="date" value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} required className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white outline-none" />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Nº Remito (Opcional)</label>
              <input type="text" value={formData.remito_nro} onChange={e => setFormData({...formData, remito_nro: e.target.value})} placeholder="Ej: 0001-1234" className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white outline-none placeholder:text-slate-700" />
            </div>
          </div>

          {/* SELECTOR DE TIPO DE RESPONSABLE */}
          <div className="flex bg-slate-900 p-1 rounded-xl border border-white/10">
            <button type="button" onClick={() => setTipoResponsable('chofer')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all ${tipoResponsable === 'chofer' ? 'bg-amber-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>
              <User size={14} /> Chofer Oficial
            </button>
            <button type="button" onClick={() => setTipoResponsable('otro')} className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg flex items-center justify-center gap-2 transition-all ${tipoResponsable === 'otro' ? 'bg-indigo-600 text-white shadow-md' : 'text-slate-500 hover:text-slate-300'}`}>
              <UserPlus size={14} /> Otra Persona
            </button>
          </div>

          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block">
              {tipoResponsable === 'chofer' ? 'Chofer Autorizado' : 'Nombre del Responsable'}
            </label>
            {tipoResponsable === 'chofer' ? (
              <select value={formData.chofer_id} onChange={e => setFormData({...formData, chofer_id: e.target.value})} required className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white outline-none">
                <option value="">Seleccione chofer...</option>
                {choferes.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
              </select>
            ) : (
              <input type="text" value={formData.responsable_externo} onChange={e => setFormData({...formData, responsable_externo: e.target.value})} required placeholder="Ej: Encargado Depósito / Camioneta" className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white outline-none placeholder:text-slate-700" />
            )}
          </div>

          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Unidad / Camión (Opcional)</label>
            <select value={formData.camion_id} onChange={e => setFormData({...formData, camion_id: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white outline-none">
              <option value="">Ninguno / Otro Vehículo...</option>
              {camiones.map(c => <option key={c.id} value={c.id}>{c.patente}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Litros Cargados</label>
              <input type="number" step="0.1" value={formData.litros} onChange={e => setFormData({...formData, litros: e.target.value})} required className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white outline-none font-bold text-lg tabular-nums" />
            </div>
            <div>
              <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Precio por Litro</label>
              <input type="number" step="0.1" value={formData.precio_litro} onChange={e => setFormData({...formData, precio_litro: e.target.value})} required className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-amber-500 outline-none font-bold text-lg tabular-nums" />
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-white/5 flex items-center justify-between bg-black/20 p-4 rounded-2xl">
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Total a Deuda:</p>
            <p className="text-3xl font-black text-rose-500 tabular-nums">
              ${(Number(formData.litros) * Number(formData.precio_litro)).toLocaleString('es-AR')}
            </p>
          </div>

          <div className="flex gap-3 mt-6">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 bg-slate-800 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-700 transition-all">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="flex-1 px-4 py-3 bg-amber-600 hover:bg-amber-500 text-white rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 transition-all">
              {isSubmitting ? <Loader2 className="animate-spin" size={16} /> : 'Guardar Remito'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}