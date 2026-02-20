'use client'
import { useState } from 'react'
import { X, Calendar, Search, FileText, Trash2, FilterX, Calculator } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

export function GastoHistoryModal({ isOpen, onClose, gastos, camionPatente, onRefresh }: any) {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const supabase = getSupabase()

  if (!isOpen) return null

  const handleDeleteGasto = async (id: string, desc: string) => {
    if (!confirm(`⚠️ ¿Desea eliminar permanentemente el gasto: "${desc}"?`)) return
    
    const { error } = await supabase.from('gastos_camion').delete().eq('id', id)
    if (error) {
      alert("Error al intentar borrar el registro")
    } else {
      onRefresh() 
    }
  }

  // Lógica de filtrado eficiente
  const filteredGastos = gastos.filter((g: any) => {
    if (!fromDate && !toDate) return true
    const fechaGasto = new Date(g.fecha).toISOString().split('T')[0]
    const desde = fromDate || '1900-01-01'
    const hasta = toDate || '2100-12-31'
    return fechaGasto >= desde && fechaGasto <= hasta
  })

  const totalFiltrado = filteredGastos.reduce((acc: number, curr: any) => acc + Number(curr.monto), 0)

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-[#020617]/95 backdrop-blur-md animate-in fade-in duration-300 font-sans italic">
      <div className="bg-[#020617] border border-white/10 w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col max-h-[85vh] relative overflow-hidden">
        
        {/* Indicador de Línea Superior */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-600 via-cyan-500 to-sky-500" />

        {/* --- HEADER TÁCTICO --- */}
        <div className="p-8 md:p-10 border-b border-white/5 flex justify-between items-center bg-white/[0.01]">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Auditoría de Mantenimiento</p>
            </div>
            <h2 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tighter">
              UNIDAD <span className="text-sky-500">/</span> {camionPatente}
            </h2>
          </div>
          <button 
            onClick={onClose} 
            className="p-3 text-slate-500 hover:text-white hover:bg-white/5 rounded-full transition-all"
          >
            <X size={24} />
          </button>
        </div>

        {/* --- FILTROS DE RANGO --- */}
        <div className="p-6 md:p-8 border-b border-white/5 bg-slate-900/20 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-4 tracking-widest">Desde</label>
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-500" size={16} />
              <input 
                type="date" 
                value={fromDate} 
                onChange={e => setFromDate(e.target.value)} 
                className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs text-white font-bold outline-none focus:border-sky-500/50 [color-scheme:dark] transition-all" 
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-4 tracking-widest">Hasta</label>
            <div className="relative group">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-sky-500" size={16} />
              <input 
                type="date" 
                value={toDate} 
                onChange={e => setToDate(e.target.value)} 
                className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs text-white font-bold outline-none focus:border-sky-500/50 [color-scheme:dark] transition-all" 
              />
            </div>
          </div>
        </div>

        {/* --- LISTADO DE REGISTROS --- */}
        <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-3 custom-scrollbar">
          {filteredGastos.length > 0 ? (
            filteredGastos.map((g: any) => (
              <div key={g.id} className="flex justify-between items-center p-5 bg-white/[0.02] rounded-[2rem] border border-white/5 group hover:bg-white/[0.04] hover:border-white/10 transition-all">
                <div className="flex gap-5 items-center">
                  <div className="p-3 bg-slate-900 rounded-2xl text-slate-600 group-hover:text-sky-500 transition-colors border border-white/5">
                    <FileText size={20} />
                  </div>
                  <div>
                    <p className="text-sm font-black text-white uppercase leading-none mb-2 tracking-tight">{g.descripcion}</p>
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">{new Date(g.fecha).toLocaleDateString('es-AR')}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <p className="text-xl font-black text-emerald-400 italic tabular-nums">$ {Number(g.monto).toLocaleString()}</p>
                  <button 
                    onClick={() => handleDeleteGasto(g.id, g.descripcion)}
                    className="p-3 text-slate-700 hover:text-rose-500 hover:bg-rose-500/10 rounded-xl transition-all"
                    title="Eliminar registro"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="flex flex-col items-center justify-center py-20 opacity-30">
              <FilterX size={48} className="mb-4" />
              <p className="text-xs font-black uppercase tracking-[0.4em]">Sin registros para este periodo</p>
            </div>
          )}
        </div>

        {/* --- FOOTER DE TOTALES --- */}
        <div className="p-8 md:p-10 bg-white/[0.03] border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 rounded-lg">
              <Calculator size={16} className="text-emerald-500" />
            </div>
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Balance acumulado del periodo</span>
          </div>
          <span className="text-4xl md:text-5xl font-black text-emerald-500 italic tracking-tighter drop-shadow-[0_0_15px_rgba(16,185,129,0.2)]">
            $ {totalFiltrado.toLocaleString()}
          </span>
        </div>
      </div>
    </div>
  )
}