'use client'
import { 
  ArrowUpRight, ArrowDownLeft, Wallet, Landmark, 
  Edit3, Trash2, Calendar, Tag, User, Truck, 
  Building2, Loader2, FilterX 
} from 'lucide-react'

const CATEGORIA_LABELS: Record<string, string> = {
  cobro_flete: 'Cobro de Flete',
  pago_chofer: 'Pago a Chofer',
  gasto_camion: 'Gasto Unidad',
  costo_fijo: 'Costo Fijo',
  multa: 'Multa',
  ingreso_otro: 'Ingreso Varios',
  egreso_otro: 'Egreso Varios',
}

const CATEGORIA_COLORS: Record<string, string> = {
  cobro_flete: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
  pago_chofer: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
  gasto_camion: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
  costo_fijo: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20',
  multa: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
  ingreso_otro: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
  egreso_otro: 'bg-slate-500/10 text-slate-400 border-slate-500/20',
}

interface CajaMovimientosTableProps {
  movimientos: any[]
  loading: boolean
  onEdit: (m: any) => void
  onDelete: (id: string) => void
}

export function CajaMovimientosTable({ movimientos, loading, onEdit, onDelete }: CajaMovimientosTableProps) {
  
  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-emerald-500" size={40} />
      </div>
    )
  }

  return (
    <div className="space-y-4 font-sans italic">
      <div className="flex justify-between items-center px-2">
        <h2 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.4em]">
          Registro de Movimientos
        </h2>
        <span className="text-[9px] font-black text-slate-600 uppercase bg-white/5 px-3 py-1 rounded-lg border border-white/5">
          {movimientos.length} registros
        </span>
      </div>

      <div className="bg-slate-900/40 rounded-[2rem] md:rounded-[3rem] border border-white/5 overflow-hidden shadow-2xl">

        {/* MOBILE VIEW */}
        <div className="md:hidden divide-y divide-white/5">
          {movimientos.length === 0 ? (
            <EmptyState />
          ) : movimientos.map(m => {
            const esIngreso = m.tipo === 'ingreso'
            return (
              <div key={m.id} className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-xl ${esIngreso ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                      {esIngreso ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                    </div>
                    <div>
                      <p className="text-xs font-black text-white uppercase">{m.descripcion}</p>
                      <p className="text-[9px] text-slate-500 font-bold mt-0.5">
                        {new Date(m.fecha).toLocaleDateString('es-AR')}
                      </p>
                    </div>
                  </div>
                  <p className={`text-xl font-black italic tabular-nums ${esIngreso ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {esIngreso ? '+' : '-'}$ {Number(m.monto).toLocaleString()}
                  </p>
                </div>
                <div className="flex gap-2 flex-wrap">
                  <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase border ${CATEGORIA_COLORS[m.categoria] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                    {CATEGORIA_LABELS[m.categoria] || m.categoria}
                  </span>
                  <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase border ${m.tipo_cuenta === 'caja' ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-sky-500/10 text-sky-400 border-sky-500/20'}`}>
                    {m.tipo_cuenta === 'caja' ? <Wallet size={10} className="inline mr-1" /> : <Landmark size={10} className="inline mr-1" />}
                    {m.tipo_cuenta}
                  </span>
                </div>
                <div className="flex gap-2 justify-end">
                  <button onClick={() => onEdit(m)} className="p-2 text-slate-600 hover:text-sky-400"><Edit3 size={16} /></button>
                  <button onClick={() => onDelete(m.id)} className="p-2 text-slate-600 hover:text-rose-500"><Trash2 size={16} /></button>
                </div>
              </div>
            )
          })}
        </div>

        {/* DESKTOP TABLE */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead className="bg-white/[0.02] text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] border-b border-white/5">
              <tr>
                <th className="p-7 pl-10">Fecha</th>
                <th className="p-7">Descripción & Categoría</th>
                <th className="p-7">Vinculado a</th>
                <th className="p-7 text-center">Cuenta</th>
                <th className="p-7 text-right">Monto</th>
                <th className="p-7 pr-10 text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.03]">
              {movimientos.length === 0 ? (
                <tr>
                  <td colSpan={6}>
                    <EmptyState />
                  </td>
                </tr>
              ) : movimientos.map(m => {
                const esIngreso = m.tipo === 'ingreso'
                return (
                  <tr key={m.id} className="hover:bg-white/[0.02] transition-all group">

                    {/* FECHA */}
                    <td className="p-7 pl-10">
                      <div className="flex items-center gap-2 text-slate-400">
                        <Calendar size={14} className="text-sky-500/40" />
                        <span className="text-sm font-bold">
                          {new Date(m.fecha).toLocaleDateString('es-AR')}
                        </span>
                      </div>
                    </td>

                    {/* DESCRIPCIÓN */}
                    <td className="p-7">
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-xl ${esIngreso ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          {esIngreso ? <ArrowUpRight size={16} /> : <ArrowDownLeft size={16} />}
                        </div>
                        <div>
                          <p className="text-sm font-black text-white uppercase tracking-tight">{m.descripcion}</p>
                          <span className={`mt-1 inline-block px-2 py-0.5 rounded-md text-[8px] font-black uppercase border ${CATEGORIA_COLORS[m.categoria] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                            <Tag size={8} className="inline mr-1" />
                            {CATEGORIA_LABELS[m.categoria] || m.categoria}
                          </span>
                          {m.referencia && (
                            <p className="text-[9px] text-slate-600 font-bold uppercase mt-0.5">Ref: {m.referencia}</p>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* VINCULADO A */}
                    <td className="p-7">
                      <div className="space-y-1.5">
                        {m.clientes && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                            <Building2 size={12} className="text-sky-500" />
                            {m.clientes.razon_social}
                          </div>
                        )}
                        {m.choferes && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                            <User size={12} className="text-indigo-400" />
                            {m.choferes.nombre}
                          </div>
                        )}
                        {m.camiones && (
                          <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase">
                            <Truck size={12} className="text-amber-400" />
                            {m.camiones.patente}
                          </div>
                        )}
                        {!m.clientes && !m.choferes && !m.camiones && (
                          <span className="text-[9px] text-slate-700 font-black uppercase">—</span>
                        )}
                      </div>
                    </td>

                    {/* CUENTA */}
                    <td className="p-7 text-center">
                      <span className={`px-3 py-1.5 rounded-xl text-[8px] font-black uppercase border flex items-center gap-1.5 w-fit mx-auto ${
                        m.tipo_cuenta === 'caja' 
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' 
                          : 'bg-sky-500/10 text-sky-400 border-sky-500/20'
                      }`}>
                        {m.tipo_cuenta === 'caja' ? <Wallet size={10} /> : <Landmark size={10} />}
                        {m.tipo_cuenta === 'caja' ? 'Efectivo' : 'Banco'}
                      </span>
                    </td>

                    {/* MONTO */}
                    <td className="p-7 text-right">
                      <p className={`text-2xl font-black italic tabular-nums tracking-tighter ${esIngreso ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {esIngreso ? '+' : '-'}$ {Number(m.monto).toLocaleString('es-AR')}
                      </p>
                    </td>

                    {/* ACCIONES */}
                    <td className="p-7 pr-10 text-center">
                      <div className="flex gap-2 justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => onEdit(m)} className="p-3 bg-white/5 hover:bg-sky-500/10 text-slate-500 hover:text-sky-400 rounded-xl transition-all border border-white/5">
                          <Edit3 size={16} />
                        </button>
                        <button onClick={() => onDelete(m.id)} className="p-3 bg-white/5 hover:bg-rose-500/10 text-slate-500 hover:text-rose-500 rounded-xl transition-all border border-white/5">
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-20 opacity-30">
      <FilterX size={40} className="mb-4 text-slate-500" />
      <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">
        Sin movimientos en el período seleccionado
      </p>
    </div>
  )
}
