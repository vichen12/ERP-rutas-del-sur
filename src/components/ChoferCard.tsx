import { UserCircle, Phone, Truck, Trash2, Edit3, Map, Milestone, Calendar } from 'lucide-react'

interface ChoferCardProps {
  chofer: any;
  camion: any;
  totalKm: number;
  totalViajes: number;
  onEdit: (chofer: any) => void;
  onDelete: (id: string, nombre: string) => void;
}

export function ChoferCard({ chofer, camion, totalKm, totalViajes, onEdit, onDelete }: ChoferCardProps) {
  const vencimiento = new Date(chofer.vencimiento_licencia)
  const hoy = new Date()
  const vencido = vencimiento < hoy
  const alerta = !vencido && (vencimiento.getTime() - hoy.getTime()) / (1000 * 3600 * 24) <= 30

  return (
    <div className="group bg-slate-900/40 border border-white/5 rounded-[3rem] p-2 hover:bg-slate-800/40 transition-all duration-300">
      <div className="bg-[#020617] rounded-[2.5rem] p-8 h-full flex flex-col justify-between relative overflow-hidden shadow-2xl">
        
        {/* Etiqueta de Estado */}
        <div className={`absolute top-0 right-0 px-8 py-3 rounded-bl-3xl text-[9px] font-black uppercase tracking-widest ${vencido ? 'bg-rose-600 text-white animate-pulse' : alerta ? 'bg-amber-500 text-black' : 'bg-emerald-500/10 text-emerald-500'}`}>
          {vencido ? 'Inhabilitado' : alerta ? 'Vence Pronto' : 'Activo'}
        </div>

        <div className="space-y-6 pt-2">
          {/* Info Principal */}
          <div className="flex gap-4 items-start">
            <div className={`p-4 rounded-2xl bg-slate-950 border border-white/10 ${vencido ? 'text-rose-500' : 'text-indigo-500'}`}>
              <UserCircle size={32} />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Lic. {chofer.licencia}</p>
              <h2 className="text-3xl font-black text-white italic uppercase leading-none">{chofer.nombre}</h2>
            </div>
          </div>

          {/* Dashboard de Rendimiento */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-950/50 border border-white/5 p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Milestone size={12} className="text-emerald-500"/> <span className="text-[9px] font-black uppercase">KM (Mes)</span>
              </div>
              <p className="text-xl font-black text-white italic">{totalKm.toLocaleString()}</p>
            </div>
            <div className="bg-slate-950/50 border border-white/5 p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Map size={12} className="text-amber-500"/> <span className="text-[9px] font-black uppercase">Viajes</span>
              </div>
              <p className="text-xl font-black text-white italic">{totalViajes}</p>
            </div>
          </div>

          {/* Unidad Asignada y Vencimiento */}
          <div className="space-y-2">
            <div className="flex justify-between items-center p-4 bg-white/5 rounded-2xl border border-white/5">
              <span className="text-[10px] font-black text-slate-500 uppercase flex gap-2 items-center"><Truck size={14} className="text-indigo-400"/> Unidad</span>
              <span className="text-xs font-black text-slate-200 uppercase italic">{camion ? `${camion.patente} - ${camion.modelo}` : 'SIN ASIGNAR'}</span>
            </div>
             <div className="flex items-center justify-between p-4 bg-white/[0.03] rounded-2xl border border-white/5">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
                  <Calendar size={14} className={vencido ? 'text-rose-500' : 'text-slate-500'} /> Vencimiento
                </span>
                <span className={`text-xs font-bold ${vencido ? 'text-rose-500' : 'text-slate-200'}`}>
                    {new Date(chofer.vencimiento_licencia).toLocaleDateString('es-AR')}
                </span>
            </div>
          </div>
        </div>

        {/* Footer (Acciones) */}
        <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3 text-slate-400">
            <Phone size={18} className="text-cyan-500"/> <span className="text-xs font-bold">{chofer.telefono || '--'}</span>
          </div>
          <div className="flex gap-2">
            <button onClick={() => onEdit(chofer)} className="p-3 bg-white/5 hover:bg-indigo-600 hover:text-white rounded-xl text-slate-400 transition-all border border-white/5" title="Editar">
              <Edit3 size={18} />
            </button>
            <button onClick={() => onDelete(chofer.id, chofer.nombre)} className="p-3 bg-rose-500/10 hover:bg-rose-600 hover:text-white rounded-xl text-rose-500 transition-all border border-rose-500/20" title="Eliminar">
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}