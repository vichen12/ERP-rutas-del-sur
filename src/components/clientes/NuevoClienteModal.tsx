'use client'
import { X, Building2, Fingerprint, MapPin, Loader2, User, Phone, ShieldPlus } from 'lucide-react'

export function NuevoClienteModal({ isOpen, onClose, onSubmit, isSaving }: any) {
  if (!isOpen) return null

  const handleLocalSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const fd = new FormData(e.currentTarget)
    
    // Empaquetamos los datos siguiendo el esquema unificado de Clientes V2.0
    onSubmit({
      razon_social: fd.get('razon_social')?.toString().toUpperCase().trim(),
      cuit: fd.get('cuit')?.toString().trim(),
      direccion: fd.get('direccion')?.toString().toUpperCase().trim(),
      nombre_contacto: fd.get('nombre_contacto')?.toString().toUpperCase().trim(),
      telefono: fd.get('telefono')?.toString().trim()
    })
  }

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-black/95 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300 font-sans italic">
      <div className="bg-[#020617] border border-white/10 p-10 lg:p-14 rounded-[3.5rem] w-full max-w-2xl relative shadow-2xl overflow-hidden">
        
        {/* Efectos Ambientales */}
        <div className="absolute -left-10 -top-10 w-40 h-40 bg-emerald-500/10 blur-[80px] rounded-full pointer-events-none" />
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-emerald-500 via-sky-500 to-indigo-500 shadow-[0_5px_20px_rgba(16,185,129,0.3)]" />

        <button 
          onClick={onClose} 
          className="absolute top-10 right-10 p-2 bg-white/5 rounded-full text-slate-500 hover:text-white hover:rotate-90 transition-all duration-300 z-20"
        >
          <X size={24}/>
        </button>

        <header className="mb-10 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20">
              <ShieldPlus size={24} />
            </div>
            <div>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em]">Sistemas Rutas del Sur</p>
              <h3 className="text-4xl font-black uppercase tracking-tighter text-white leading-none">Alta de <span className="text-sky-500">Cliente</span></h3>
            </div>
          </div>
          <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest max-w-md">
            Ingrese los datos maestros para inicializar el perfil contable y operativo en el directorio central.
          </p>
        </header>

        <form onSubmit={handleLocalSubmit} className="space-y-6 relative z-10">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Razón Social */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-4 tracking-widest flex items-center gap-2">
                <Building2 size={12} className="text-sky-500"/> Razón Social
              </label>
              <input 
                name="razon_social" 
                placeholder="EJ: LOGÍSTICA GLOBAL S.A." 
                required 
                className="w-full p-5 bg-slate-950 border border-white/5 rounded-2xl outline-none text-white font-black focus:border-sky-500/50 transition-all uppercase text-xs placeholder:text-slate-800" 
              />
            </div>

            {/* CUIT */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-4 tracking-widest flex items-center gap-2">
                <Fingerprint size={12} className="text-sky-500"/> CUIT / ID Fiscal
              </label>
              <input 
                name="cuit" 
                placeholder="30-00000000-0" 
                required 
                className="w-full p-5 bg-slate-950 border border-white/5 rounded-2xl outline-none text-white font-black focus:border-sky-500/50 transition-all text-xs placeholder:text-slate-800" 
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Contacto */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-4 tracking-widest flex items-center gap-2">
                <User size={12} className="text-emerald-500"/> Responsable (Contacto)
              </label>
              <input 
                name="nombre_contacto" 
                placeholder="NOMBRE Y APELLIDO" 
                className="w-full p-5 bg-slate-950 border border-white/5 rounded-2xl outline-none text-white font-black focus:border-emerald-500/50 transition-all uppercase text-xs placeholder:text-slate-800" 
              />
            </div>

            {/* Teléfono */}
            <div className="space-y-2">
              <label className="text-[9px] font-black text-slate-500 uppercase ml-4 tracking-widest flex items-center gap-2">
                <Phone size={12} className="text-emerald-500"/> Línea Directa
              </label>
              <input 
                name="telefono" 
                placeholder="+54 9 261 ..." 
                className="w-full p-5 bg-slate-950 border border-white/5 rounded-2xl outline-none text-white font-black focus:border-emerald-500/50 transition-all text-xs placeholder:text-slate-800" 
              />
            </div>
          </div>

          {/* Dirección */}
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-4 tracking-widest flex items-center gap-2">
              <MapPin size={12} className="text-sky-500"/> Dirección Operativa
            </label>
            <input 
              name="direccion" 
              placeholder="CALLE, LOCALIDAD, PROVINCIA" 
              className="w-full p-5 bg-slate-950 border border-white/5 rounded-2xl outline-none text-white font-black focus:border-sky-500/50 transition-all uppercase text-xs placeholder:text-slate-800" 
            />
          </div>

          <div className="pt-6">
            <button 
              disabled={isSaving} 
              className="w-full py-6 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-[2rem] uppercase text-[11px] tracking-[0.3em] shadow-xl shadow-emerald-900/30 active:scale-95 transition-all flex items-center justify-center gap-4 disabled:opacity-50 border border-emerald-400/20 group"
            >
              {isSaving ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  Registrar en Directorio
                  <ShieldPlus size={20} className="group-hover:scale-125 transition-transform duration-300" />
                </>
              )}
            </button>
            
            <p className="text-[8px] text-center text-slate-700 font-black uppercase tracking-[0.5em] mt-6 opacity-50">
              Verificando integridad de datos en servidor maestro...
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}