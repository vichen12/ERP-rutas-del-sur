'use client'
import { X, Calendar, Truck, MapPin, TrendingUp, Clock } from 'lucide-react'

export function ChoferStatsModal({ isOpen, onClose, chofer, viajes }: any) {
  if (!isOpen || !chofer) return null

  // Lógica de filtrado por tiempo
  const ahora = new Date()
  const inicioSemana = new Date(ahora.setDate(ahora.getDate() - ahora.getDay()))
  const inicioMes = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  const inicioAnio = new Date(new Date().getFullYear(), 0, 1)

  const filtrar = (desde: Date) => {
    const filtrados = viajes.filter((v: any) => new Date(v.fecha) >= desde)
    return {
      km: filtrados.reduce((acc: number, curr: any) => acc + (Number(curr.km_recorridos) || 0), 0),
      cant: filtrados.length
    }
  }

  const statsSemana = filtrar(inicioSemana)
  const statsMes = filtrar(inicioMes)
  const statsAnio = filtrar(inicioAnio)

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-6 bg-black/90 backdrop-blur-md animate-in fade-in duration-300 italic">
      <div className="bg-[#020617] border border-white/10 w-full max-w-4xl rounded-[3.5rem] p-10 shadow-2xl relative overflow-hidden font-sans">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyan-500 to-indigo-500" />
        
        <div className="flex justify-between items-start mb-10">
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mb-2">Legajo de Rendimiento</p>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter leading-none">{chofer.nombre}</h2>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 rounded-full text-slate-500 hover:text-white transition-all"><X size={24}/></button>
        </div>

        {/* GRID DE ESTADÍSTICAS TEMPORALES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          {[
            { label: 'Esta Semana', data: statsSemana, color: 'text-cyan-400' },
            { label: 'Mes en Curso', data: statsMes, color: 'text-indigo-400' },
            { label: 'Total Anual', data: statsAnio, color: 'text-emerald-400' },
          ].map((s, i) => (
            <div key={i} className="bg-slate-900/40 p-8 rounded-[2.5rem] border border-white/5 relative overflow-hidden group">
              <TrendingUp className={`absolute -right-4 -top-4 w-24 h-24 opacity-[0.03] ${s.color}`} />
              <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2">{s.label}</p>
              <p className={`text-3xl font-black ${s.color} tracking-tighter mb-1`}>{s.data.km.toLocaleString()} KM</p>
              <p className="text-[11px] font-bold text-slate-400 uppercase">{s.data.cant} Viajes Realizados</p>
            </div>
          ))}
        </div>

        {/* LISTA DE ÚLTIMOS VIAJES DEL CHOFER */}
        <div className="space-y-4">
          <h3 className="text-xs font-black text-white uppercase tracking-widest flex items-center gap-2 mb-4">
            <Clock size={16} className="text-cyan-500" /> Historial Reciente de Ruta
          </h3>
          <div className="max-h-[300px] overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {viajes.length > 0 ? viajes.slice(0, 10).map((v: any) => (
              <div key={v.id} className="bg-white/5 p-5 rounded-3xl border border-white/5 flex justify-between items-center group hover:bg-white/10 transition-all">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-slate-950 rounded-2xl text-cyan-500"><MapPin size={18}/></div>
                  <div>
                    <p className="text-xs font-black text-white uppercase">{v.origen} → {v.destino}</p>
                    <p className="text-[10px] font-bold text-slate-500 uppercase">{new Date(v.fecha).toLocaleDateString('es-AR')}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-white">+{v.km_recorridos} KM</p>
                  <p className="text-[9px] font-bold text-emerald-500 uppercase italic">Flete Exitoso</p>
                </div>
              </div>
            )) : (
              <div className="text-center py-10 opacity-20">
                <Truck size={48} className="mx-auto mb-2" />
                <p className="text-xs font-black uppercase tracking-widest">Sin registros de viaje</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}