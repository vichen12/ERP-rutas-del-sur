'use client'
import { X, FileEdit, Hash, Loader2, ShieldCheck } from 'lucide-react'

export function CompletarRemitoModal({ isOpen, onClose, onSubmit, isSaving }: any) {
  if (!isOpen) return null;

  const handleLocalSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const numero = fd.get('remito')?.toString().trim().toUpperCase();
    
    if (numero) {
      onSubmit(numero);
    }
  };

  return (
    <div className="fixed inset-0 z-[600] flex items-center justify-center p-4 bg-black/95 backdrop-blur-md animate-in fade-in zoom-in-95 duration-300 font-sans italic">
      <div className="bg-[#020617] border border-orange-500/30 p-8 md:p-10 rounded-[3rem] w-full max-w-md relative shadow-2xl shadow-orange-900/20 overflow-hidden">
        
        {/* Efecto de resplandor naranja de fondo */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500 blur-[80px] opacity-10 pointer-events-none" />

        <button 
          onClick={onClose} 
          className="absolute top-6 right-6 text-slate-500 hover:text-white hover:rotate-90 transition-all z-10 p-2 bg-white/5 rounded-full"
        >
          <X size={20}/>
        </button>

        <header className="mb-8 relative z-10">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 rounded-2xl bg-orange-500/10 text-orange-500 border border-orange-500/20 shadow-inner">
              <FileEdit size={20} />
            </div>
            <div className="flex flex-col">
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500">
                Paso de Control
              </p>
              <span className="h-0.5 w-8 bg-orange-500/30 rounded-full" />
            </div>
          </div>
          <h3 className="text-3xl font-black uppercase tracking-tighter text-white leading-none">
            Oficializar <span className="text-orange-500">Remito</span>
          </h3>
          <p className="text-slate-500 text-[11px] font-bold mt-4 leading-relaxed uppercase">
            Ingrese el identificador del comprobante físico para validar la entrega y habilitar el cobro.
          </p>
        </header>

        <form onSubmit={handleLocalSubmit} className="space-y-8 relative z-10">
          
          <div className="space-y-2">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-4 tracking-[0.2em] flex items-center gap-2">
              <Hash size={12} /> Nro. Comprobante / Remito
            </label>
            <div className="relative group">
              <div className="absolute inset-0 bg-orange-500/5 blur-xl group-focus-within:opacity-100 opacity-0 transition-opacity" />
              <input 
                name="remito" 
                placeholder="EJ: 0001-00045628" 
                required 
                autoFocus
                autoComplete="off"
                className="relative w-full p-5 bg-slate-950 border border-white/5 rounded-2xl outline-none text-white font-black uppercase focus:border-orange-500/50 transition-all text-base tracking-widest placeholder:text-slate-800" 
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <button 
              type="submit"
              disabled={isSaving} 
              className="w-full py-5 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-2xl uppercase text-[11px] tracking-[0.3em] shadow-xl shadow-orange-900/30 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed group"
            >
              {isSaving ? (
                <Loader2 className="animate-spin" size={18} />
              ) : (
                <>
                  Confirmar y Liberar 
                  <ShieldCheck size={18} className="group-hover:scale-110 transition-transform" />
                </>
              )}
            </button>
            
            <p className="text-[8px] text-center text-slate-600 font-black uppercase tracking-widest">
              Esta acción moverá el cargo a la columna de "Deuda Activa"
            </p>
          </div>
        </form>
      </div>
    </div>
  )
}