'use client'
import { FileDown, Users, TrendingUp, AlertCircle, ArrowRight, DollarSign } from 'lucide-react'

export function ClientesDashboardGeneral({ clientes, onExportAll, onSelectClient }: any) {
  // Calculamos métricas globales
  const totalDeuda = clientes.reduce((acc: number, c: any) => acc + (Number(c.saldo) || 0), 0)
  const clientesConDeuda = clientes.filter((c: any) => (Number(c.saldo) || 0) > 0).length

  const StatCard = ({ title, value, subValue, icon: Icon, color, bg }: any) => (
    <div className={`bg-[#020617] border border-white/5 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group italic font-sans`}>
      <div className="absolute -right-4 -bottom-4 opacity-5 group-hover:opacity-10 transition-opacity text-white">
        <Icon size={120} />
      </div>
      <div className={`mb-4 p-3 rounded-2xl w-fit ${bg} bg-opacity-10`}>
        <Icon className={color} size={24} />
      </div>
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{title}</p>
      <div className="flex items-baseline gap-2 mt-2">
        <p className="text-4xl font-black text-white italic tracking-tighter tabular-nums">{value}</p>
        {subValue && <span className="text-sm text-slate-700 font-bold">{subValue}</span>}
      </div>
    </div>
  )

  return (
    <div className="space-y-10 animate-in fade-in slide-in-from-top-4 duration-700 font-sans italic">
      
      {/* HEADER DEL DASHBOARD */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-white/5 pb-10">
        <div>
          <h2 className="text-4xl lg:text-6xl font-black text-white uppercase italic tracking-tighter leading-none">
            Panel <span className="text-sky-500">Global</span>
          </h2>
          <p className="text-[10px] text-slate-500 font-black uppercase tracking-[0.4em] mt-4">Estado consolidado de la cartera activa</p>
        </div>
        <button 
          onClick={onExportAll}
          className="px-8 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition-all shadow-xl shadow-emerald-900/20 active:scale-95 border border-emerald-400/20"
        >
          <FileDown size={18} /> Exportar Cartera Completa
        </button>
      </div>

      {/* TARJETAS DE INDICADORES (KPIs) */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Saldo Total en Calle"
          value={`$ ${totalDeuda.toLocaleString('es-AR')}`}
          icon={DollarSign}
          color="text-emerald-500"
          bg="bg-emerald-500"
        />
        <StatCard 
          title="Clientes Deudores"
          value={clientesConDeuda}
          subValue={`/ ${clientes.length}`}
          icon={AlertCircle}
          color="text-amber-500"
          bg="bg-amber-500"
        />
        <StatCard 
          title="Promedio de Deuda"
          value={`$ ${(totalDeuda / (clientes.length || 1)).toLocaleString('es-AR', { maximumFractionDigits: 0 })}`}
          icon={Users}
          color="text-sky-500"
          bg="bg-sky-500"
        />
      </div>

      {/* GRILLA MAESTRA DE CLIENTES */}
      <div className="bg-slate-900/20 border border-white/5 rounded-[3rem] overflow-hidden shadow-2xl backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-white/[0.02] text-[10px] font-black text-slate-600 uppercase tracking-widest italic border-b border-white/5">
                <th className="px-8 py-6">Razón Social / CUIT</th>
                <th className="px-8 py-6">Ruta Maestra Pactada</th>
                <th className="px-8 py-6 text-right">Saldo en CC</th>
                <th className="px-8 py-6 text-center">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {clientes.length > 0 ? (
                clientes.map((c: any) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-all group italic">
                    <td className="px-8 py-6">
                      <p className="font-black text-white text-sm uppercase tracking-tight group-hover:text-sky-400 transition-colors">
                        {c.razon_social}
                      </p>
                      <p className="text-[9px] text-slate-600 font-bold uppercase mt-1 tracking-widest">
                        {c.cuit || 'S/ CUIT'}
                      </p>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase">
                        {/* 🚀 CAMBIO V2.0: Datos directos del cliente */}
                        <span className="text-white/80">{c.ruta_origen || '-'}</span>
                        <ArrowRight size={12} className="text-sky-500" /> 
                        <span className="text-white/80">{c.ruta_destino || '-'}</span>
                      </div>
                      <p className="text-[8px] text-slate-600 font-bold uppercase mt-1 tracking-widest">
                        Tarifa: $ {Number(c.tarifa_flete || 0).toLocaleString()}
                      </p>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <p className={`font-black text-base tabular-nums ${(Number(c.saldo) || 0) > 0 ? 'text-emerald-500' : 'text-slate-800'}`}>
                        $ {(Number(c.saldo) || 0).toLocaleString('es-AR')}
                      </p>
                    </td>
                    <td className="px-8 py-6 text-center">
                       <button 
                         onClick={() => onSelectClient(c)}
                         className="p-3 bg-white/5 rounded-xl text-slate-500 hover:text-sky-500 hover:bg-sky-500/10 transition-all active:scale-90 border border-white/5"
                       >
                          <ArrowRight size={18} />
                       </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4} className="px-8 py-10 text-center text-slate-600 text-[10px] font-black uppercase tracking-[0.5em]">
                    No se encontraron clientes registrados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}