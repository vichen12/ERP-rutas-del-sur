'use client'
import { X, Building2, Fingerprint, MapPin, Loader2 } from 'lucide-react'

export function NuevoClienteModal({ isOpen, onClose, onSubmit, isSaving }: any) {
  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#020617] border border-white/10 p-10 lg:p-14 rounded-[3.5rem] w-full max-w-lg relative italic shadow-2xl">
        
        <button onClick={onClose} className="absolute top-10 right-10 text-slate-500 hover:text-white transition-all">
          <X size={28}/>
        </button>

        <header className="mb-10">
          <p className="text-[10px] font-black text-sky-500 uppercase tracking-[0.4em] mb-2">Alta de Directorio</p>
          <h3 className="text-4xl font-black uppercase tracking-tighter text-white leading-none">Nuevo Cliente</h3>
        </header>

        <form onSubmit={(e) => {
          e.preventDefault()
          const fd = new FormData(e.currentTarget)
          onSubmit({
            razon_social: fd.get('razon_social')?.toString().toUpperCase(),
            cuit: fd.get('cuit'),
            direccion: fd.get('direccion')?.toString().toUpperCase()
          })
        }} className="space-y-5">
          
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-4 tracking-widest">Razón Social</label>
            <div className="relative">
              <Building2 className="absolute left-5 top-5 text-slate-600" size={20} />
              <input name="razon_social" placeholder="NOMBRE DE LA EMPRESA" required className="w-full p-5 pl-14 bg-slate-950 border border-white/5 rounded-2xl outline-none text-white font-bold focus:border-sky-500/50 transition-all uppercase" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-4 tracking-widest">CUIT / ID Fiscal</label>
            <div className="relative">
              <Fingerprint className="absolute left-5 top-5 text-slate-600" size={20} />
              <input name="cuit" placeholder="30-XXXXXXXX-X" required className="w-full p-5 pl-14 bg-slate-950 border border-white/5 rounded-2xl outline-none text-white font-bold focus:border-sky-500/50 transition-all" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-4 tracking-widest">Dirección Operativa</label>
            <div className="relative">
              <MapPin className="absolute left-5 top-5 text-slate-600" size={20} />
              <input name="direccion" placeholder="CALLE, LOCALIDAD, PROVINCIA" className="w-full p-5 pl-14 bg-slate-950 border border-white/5 rounded-2xl outline-none text-white font-bold focus:border-sky-500/50 transition-all uppercase" />
            </div>
          </div>

          <button disabled={isSaving} className="w-full py-6 bg-emerald-600 text-white font-black rounded-[2rem] uppercase text-[11px] tracking-[0.2em] mt-8 shadow-xl shadow-emerald-900/20 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 border border-emerald-400/20">
            {isSaving ? <Loader2 className="animate-spin" /> : 'Registrar Cliente en Sistema'}
          </button>
        </form>
      </div>
    </div>
  )
}