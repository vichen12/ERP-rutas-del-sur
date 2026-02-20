'use client'
import { X, Loader2, Building2, MapPin, DollarSign, TrendingUp, Fuel, Wrench, ShieldCheck, ArrowRight, User, Phone } from 'lucide-react'

export function ClienteModal({ isOpen, onClose, onSubmit, isSubmitting, formData, setFormData }: any) {
  
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[300] flex items-start md:items-center justify-center pt-20 p-4 bg-black/90 backdrop-blur-md overflow-y-auto font-sans italic">
      <div className="bg-[#020617] border border-white/10 w-full max-w-4xl rounded-[3rem] p-6 md:p-10 shadow-2xl relative mb-10 selection:bg-emerald-500/30">
        
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-cyan-500 to-indigo-500" />

        {/* HEADER */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter leading-none">
              Perfil de <span className="text-emerald-500">Cliente</span>
            </h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">Gestión de contacto y ADN logístico</p>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 rounded-full text-slate-500 hover:text-white transition-all hover:rotate-90">
            <X size={20}/>
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-8">
          
          {/* SECCIÓN 1: IDENTIDAD Y CONTACTO */}
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase ml-3 tracking-widest flex items-center gap-2">
                  <Building2 size={12} className="text-cyan-500"/> Razón Social
                </label>
                <input 
                  required placeholder="NOMBRE DE LA EMPRESA" 
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold text-xs uppercase outline-none focus:border-cyan-500 transition-all"
                  value={formData.razon_social || ''} 
                  onChange={e => setFormData({...formData, razon_social: e.target.value.toUpperCase()})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase ml-3 tracking-widest flex items-center gap-2">
                  <ShieldCheck size={12} className="text-cyan-500"/> CUIT
                </label>
                <input 
                  placeholder="00-00000000-0" 
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold text-xs outline-none focus:border-cyan-500 transition-all"
                  value={formData.cuit || ''} 
                  onChange={e => setFormData({...formData, cuit: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase ml-3 tracking-widest flex items-center gap-2">
                  <User size={12} className="text-emerald-500"/> Persona que Atiende (Contacto)
                </label>
                <input 
                  placeholder="NOMBRE DEL CONTACTO" 
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold text-xs uppercase outline-none focus:border-emerald-500 transition-all"
                  value={formData.nombre_contacto || ''} 
                  onChange={e => setFormData({...formData, nombre_contacto: e.target.value.toUpperCase()})}
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase ml-3 tracking-widest flex items-center gap-2">
                  <Phone size={12} className="text-emerald-500"/> Teléfono / WhatsApp
                </label>
                <input 
                  placeholder="+54 9 261 ..." 
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold text-xs outline-none focus:border-emerald-500 transition-all"
                  value={formData.telefono || ''} 
                  onChange={e => setFormData({...formData, telefono: e.target.value})}
                />
              </div>
            </div>

            <div className="space-y-1">
                <label className="text-[9px] font-black text-slate-500 uppercase ml-3 tracking-widest flex items-center gap-2">
                  <MapPin size={12} className="text-emerald-500"/> Dirección Fiscal / Física
                </label>
                <input 
                  placeholder="CALLE, CIUDAD, PROVINCIA" 
                  className="w-full bg-slate-900 border border-white/10 rounded-2xl py-4 px-6 text-white font-bold text-xs uppercase outline-none focus:border-emerald-500 transition-all"
                  value={formData.direccion || ''} 
                  onChange={e => setFormData({...formData, direccion: e.target.value.toUpperCase()})}
                />
            </div>
          </div>

          {/* SECCIÓN 2: ADN LOGÍSTICO (CONFIGURACIÓN PREDICTIVA) */}
          <div className="bg-white/[0.02] border border-white/5 p-6 md:p-8 rounded-[2.5rem] space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                <MapPin size={120} className="text-emerald-500" />
            </div>

            <h3 className="text-[11px] font-black text-white uppercase tracking-[0.2em] flex items-center gap-2 border-b border-white/5 pb-4">
              <TrendingUp size={16} className="text-emerald-500" /> Configuración de Ruta y Costos Maestros
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <input placeholder="ORIGEN DEFAULT" className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 px-4 text-white text-xs uppercase outline-none focus:border-emerald-500" 
                value={formData.ruta_origen || ''} onChange={e => setFormData({...formData, ruta_origen: e.target.value.toUpperCase()})} />
              <input placeholder="DESTINO DEFAULT" className="bg-slate-950 border border-white/10 rounded-xl py-3 px-4 text-white text-xs uppercase w-full outline-none focus:border-emerald-500" 
                value={formData.ruta_destino || ''} onChange={e => setFormData({...formData, ruta_destino: e.target.value.toUpperCase()})} />
              <input type="number" placeholder="KM ESTIMADOS" className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 px-4 text-white font-black text-sm outline-none focus:border-emerald-500" 
                value={formData.ruta_km_estimados || ''} onChange={e => setFormData({...formData, ruta_km_estimados: e.target.value})} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-white/5">
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-500 uppercase ml-2 flex items-center gap-1"><DollarSign size={10}/> Tarifa Flete ($)</label>
                <input type="number" placeholder="0.00" className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 px-4 text-emerald-400 font-bold text-sm outline-none" 
                  value={formData.tarifa_flete || ''} onChange={e => setFormData({...formData, tarifa_flete: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-500 uppercase ml-2 flex items-center gap-1"><User size={10}/> Pago Chofer ($)</label>
                <input type="number" placeholder="0.00" className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 px-4 text-rose-400 font-bold text-sm outline-none" 
                  value={formData.pago_chofer || ''} onChange={e => setFormData({...formData, pago_chofer: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[8px] font-black text-slate-500 uppercase ml-2 flex items-center gap-1"><Fuel size={10}/> Gasoil (Lts)</label>
                <input type="number" placeholder="0" className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 px-4 text-amber-500 font-bold text-sm outline-none" 
                  value={formData.lts_gasoil_estimado || ''} onChange={e => setFormData({...formData, lts_gasoil_estimado: e.target.value})} />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                 <label className="text-[8px] font-black text-slate-500 uppercase ml-2 flex items-center gap-1"><DollarSign size={10}/> Gasto Descarga ($)</label>
                 <input type="number" placeholder="0.00" className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 px-4 text-white text-sm outline-none" 
                   value={formData.costo_descarga || ''} onChange={e => setFormData({...formData, costo_descarga: e.target.value})} />
              </div>
              <div className="space-y-1">
                 <label className="text-[8px] font-black text-slate-500 uppercase ml-2 flex items-center gap-1"><Wrench size={10}/> Desgaste ($/KM)</label>
                 <input type="number" step="0.01" placeholder="Ej: 150.00" className="w-full bg-slate-950 border border-white/10 rounded-xl py-3 px-4 text-cyan-400 font-bold text-sm outline-none" 
                   value={formData.desgaste_por_km || ''} onChange={e => setFormData({...formData, desgaste_por_km: e.target.value})} />
              </div>
            </div>
          </div>

          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-5 rounded-[2rem] font-black uppercase text-xs tracking-[0.3em] transition-all shadow-xl shadow-emerald-900/20 active:scale-95 flex items-center justify-center gap-3 group"
          >
            {isSubmitting ? <Loader2 className="animate-spin" /> : <>Finalizar Registro de Cliente <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform"/></>}
          </button>
        </form>
      </div>
    </div>
  )
}