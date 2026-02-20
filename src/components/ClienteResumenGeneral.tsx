'use client'
import { 
  TrendingUp, Map, Fuel, CreditCard, 
  Activity, FileDown, Ruler, DollarSign, MapPin // 👈 ¡Acá está el MapPin agregado!
} from 'lucide-react'

export function ClienteResumenGeneral({ selected, gestion, onExportPDF }: any) {
  // 🚀 CAMBIO V2.0: Ya no usamos 'config'. Los datos viven directo en 'selected'
  
  const StatCard = ({ title, value, icon: Icon, color }: any) => (
    <div className="bg-[#020617] border border-white/5 p-6 rounded-[2rem] hover:bg-white/[0.04] transition-all group shadow-xl italic font-sans">
      <div className="flex justify-between items-start mb-4">
        <div className={`p-3 rounded-2xl ${color} bg-opacity-10 shadow-inner`}>
          <Icon size={22} className={color.replace('bg-', 'text-')} />
        </div>
      </div>
      <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{title}</p>
      <p className="text-2xl font-black text-white italic mt-1 tracking-tighter">{value}</p>
    </div>
  )

  return (
    <div className="space-y-8 animate-in fade-in duration-700 font-sans italic">
      
      {/* HEADER DE SECCIÓN */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-white uppercase italic tracking-tighter">Resumen Ejecutivo</h3>
          <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.3em]">Radiografía de Operaciones y ADN Logístico</p>
        </div>
        <button 
          onClick={onExportPDF}
          className="flex items-center gap-3 px-6 py-3 bg-sky-600/10 hover:bg-sky-600 hover:text-white border border-sky-500/20 rounded-2xl text-[10px] font-black uppercase tracking-widest text-sky-500 transition-all active:scale-95 shadow-lg"
        >
          <FileDown size={16} /> Exportar Legajo Técnico
        </button>
      </div>

      {/* GRILLA DE KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Saldo Pendiente" 
          value={`$ ${Number(gestion.saldoPendiente || 0).toLocaleString('es-AR')}`} 
          icon={CreditCard} color="bg-rose-500" 
        />
        <StatCard 
          title="Viajes x Cobrar" 
          value={gestion.porCobrar?.length || 0} 
          icon={Activity} color="bg-sky-500" 
        />
        <StatCard 
          title="Tarifa Pactada" 
          value={`$ ${Number(selected.tarifa_flete || 0).toLocaleString('es-AR')}`} 
          icon={TrendingUp} color="bg-emerald-500" 
        />
        <StatCard 
          title="Consumo Estimado" 
          value={`${selected.lts_gasoil_estimado || 0} Lts`} 
          icon={Fuel} color="bg-amber-500" 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* ADN DE RUTA */}
        <div className="bg-[#020617] border border-white/5 rounded-[3rem] p-8 relative overflow-hidden group shadow-2xl">
          <Map className="absolute -right-10 -bottom-10 text-white/5 rotate-12 transition-transform group-hover:scale-110" size={180} />
          <h4 className="text-[10px] font-black text-sky-500 uppercase tracking-[0.4em] mb-6 italic">ADN de Ruta</h4>
          
          <div className="space-y-6 relative z-10">
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-2">
                <MapPin size={12}/> Trayecto Maestro
              </span>
              <span className="text-sm font-black text-white uppercase italic">
                {selected.ruta_origen || 'S/O'} <span className="text-sky-500 mx-2">→</span> {selected.ruta_destino || 'S/D'}
              </span>
            </div>
            <div className="flex items-center justify-between border-b border-white/5 pb-4">
              <span className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-2">
                <Ruler size={12}/> Distancia Estimada
              </span>
              <span className="text-sm font-black text-white italic">{selected.ruta_km_estimados || 0} KM</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold text-slate-600 uppercase flex items-center gap-2">
                <DollarSign size={12}/> Desgaste por KM
              </span>
              <span className="text-sm font-black text-sky-400 italic">$ {selected.desgaste_por_km || 0}</span>
            </div>
          </div>
        </div>

        {/* INFO DE CONTACTO */}
        <div className="bg-[#020617] border border-white/5 rounded-[3rem] p-8 shadow-2xl">
          <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.4em] mb-6 italic">Terminal de Contacto</h4>
          <div className="grid grid-cols-2 gap-8">
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-600 uppercase">Responsable Operativo</p>
              <p className="text-sm font-bold text-white uppercase">{selected.nombre_contacto || 'SIN ASIGNAR'}</p>
            </div>
            <div className="space-y-1">
              <p className="text-[9px] font-black text-slate-600 uppercase">Línea Directa</p>
              <p className="text-sm font-bold text-white tabular-nums">{selected.telefono || 'SIN REGISTRO'}</p>
            </div>
            <div className="space-y-1 col-span-2 pt-4 border-t border-white/5">
              <p className="text-[9px] font-black text-slate-600 uppercase">Última Operación</p>
              <p className="text-sm font-bold text-slate-400 uppercase italic">
                {gestion.maestro?.[0] ? new Date(gestion.maestro[0].fecha).toLocaleDateString('es-AR') : 'NO HAY REGISTROS'}
              </p>
            </div>
          </div>
        </div>

      </div>
    </div>
  )
}