'use client'
import { 
  Landmark, Mail, Trash2, ArrowRightLeft, ShieldCheck, 
  User, Phone, MapPin, Edit3, Loader2 
} from 'lucide-react'

export function ClienteHeader({ selected, onBackup, onDelete, onEdit, onNuevaOp, backupLoading }: any) {
  // 🚀 CAMBIO V2.0: Ahora el destino vive directo en el objeto cliente
  const destinoFinal = selected.ruta_destino || 'SIN DESTINO DEFINIDO'

  return (
    <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center bg-[#020617]/60 backdrop-blur-2xl p-8 lg:p-12 rounded-[3rem] border border-white/5 gap-8 relative overflow-hidden group italic shadow-2xl font-sans">
      
      {/* Decoración de fondo */}
      <div className="absolute -right-20 -top-20 w-80 h-80 bg-sky-500/5 blur-[120px] rounded-full group-hover:bg-sky-500/10 transition-all duration-1000 pointer-events-none" />

      <div className="flex flex-col md:flex-row items-start md:items-center gap-8 relative z-10 w-full">
        <div className="p-6 bg-gradient-to-br from-sky-500/20 to-sky-600/5 text-sky-500 rounded-[2rem] shrink-0 border border-sky-500/20 shadow-xl">
          <Landmark size={42} strokeWidth={2} />
        </div>

        <div className="space-y-4 w-full">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="px-3 py-1 bg-emerald-500/10 text-emerald-500 text-[8px] font-black uppercase tracking-[0.3em] rounded-lg border border-emerald-500/20 flex items-center gap-1.5">
                <ShieldCheck size={12} strokeWidth={3} /> Perfil Maestro V2.0
              </span>
            </div>
            <h2 className="text-4xl lg:text-7xl font-black text-white tracking-tighter uppercase leading-[0.85] py-2">
              {selected.razon_social}
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-y-3 gap-x-8 border-t border-white/5 pt-4">
             <div className="flex items-center gap-3">
                <User size={14} className="text-sky-500" />
                <p className="text-[11px] font-bold text-slate-300 uppercase truncate">
                  {selected.nombre_contacto || 'S/ CONTACTO'}
                </p>
             </div>
             <div className="flex items-center gap-3">
                <Phone size={14} className="text-emerald-500" />
                <p className="text-[11px] font-bold text-slate-300 tabular-nums">
                  {selected.telefono || 'S/ TELÉFONO'}
                </p>
             </div>
             
             {/* ADN Logístico - Destino directo del cliente */}
             <div className="flex items-center gap-3">
                <MapPin size={14} className="text-rose-500" />
                <div className="flex flex-col">
                  <span className="text-[8px] font-black text-slate-600 uppercase tracking-widest">Destino Frecuente</span>
                  <p className="text-[11px] font-black text-white uppercase truncate">
                    {destinoFinal}
                  </p>
                </div>
             </div>
          </div>
        </div>
      </div>

      {/* BOTONERA DE GESTIÓN */}
      <div className="flex flex-wrap md:flex-nowrap gap-3 w-full xl:w-auto relative z-10">
        <div className="flex gap-2 w-full md:w-auto">
          <button 
            onClick={onEdit}
            title="Editar datos del cliente"
            className="flex-1 md:flex-none p-5 bg-white/5 text-sky-500 rounded-2xl border border-white/5 hover:bg-sky-500 hover:text-white transition-all flex items-center justify-center active:scale-95"
          >
            <Edit3 size={22} />
          </button>

          <button 
            onClick={onBackup} 
            disabled={backupLoading}
            title="Exportar Informe PDF / Email"
            className="flex-1 md:flex-none p-5 bg-white/5 text-slate-400 rounded-2xl border border-white/5 hover:bg-white/10 hover:text-white transition-all flex items-center justify-center active:scale-95"
          >
            {backupLoading ? <Loader2 size={22} className="animate-spin" /> : <Mail size={22} />}
          </button>

          <button 
            onClick={onDelete} 
            title="Eliminar Cliente"
            className="flex-1 md:flex-none p-5 bg-rose-500/5 text-rose-500/50 rounded-2xl border border-rose-500/10 hover:bg-rose-600 hover:text-white transition-all flex items-center justify-center group active:scale-95"
          >
            <Trash2 size={22} className="group-hover:scale-110 transition-transform" />
          </button>
        </div>

        <button 
          onClick={onNuevaOp}
          className="w-full md:w-auto bg-sky-600 hover:bg-sky-500 text-white px-10 py-5 rounded-2xl font-black text-[11px] transition-all shadow-xl shadow-sky-900/40 uppercase tracking-[0.2em] flex items-center justify-center gap-3 active:scale-95 border border-sky-400/20"
        >
          <ArrowRightLeft size={18} strokeWidth={3} /> Registrar Movimiento 
        </button>
      </div>
    </div>
  )
}