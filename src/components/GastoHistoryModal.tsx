'use client'
import { useState } from 'react'
import { X, Calendar, Search, FileText, Trash2 } from 'lucide-react'
import { getSupabase } from '@/lib/supabase'

export function GastoHistoryModal({ isOpen, onClose, gastos, camionPatente, onRefresh }: any) {
  const [fromDate, setFromDate] = useState('')
  const [toDate, setToDate] = useState('')
  const supabase = getSupabase()

  if (!isOpen) return null

  const handleDeleteGasto = async (id: string, desc: string) => {
    if (!confirm(`¿Borrar el gasto "${desc}"?`)) return
    const { error } = await supabase.from('gastos_camion').delete().eq('id', id)
    if (error) alert("Error al borrar")
    else onRefresh() // Esto recarga los datos en la página principal
  }

  const filteredGastos = gastos.filter((g: any) => {
    if (!fromDate && !toDate) return true
    const fechaGasto = new Date(g.fecha).toISOString().split('T')[0]
    const desde = fromDate || '1900-01-01'
    const hasta = toDate || '2100-12-31'
    return fechaGasto >= desde && fechaGasto <= hasta
  })

  const totalFiltrado = filteredGastos.reduce((acc: number, curr: any) => acc + Number(curr.monto), 0)

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-[#020617]/95 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#020617] border border-white/10 w-full max-w-2xl rounded-[3rem] shadow-2xl flex flex-col max-h-[90vh] relative italic">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-cyan-500" />

        {/* Header */}
        <div className="p-10 border-b border-white/5 flex justify-between items-center">
          <div>
            <p className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.3em]">Auditoría de Gastos</p>
            <h2 className="text-4xl font-black text-white uppercase tracking-tighter">UNIDAD: {camionPatente}</h2>
          </div>
          <button onClick={onClose} className="p-3 text-slate-500 hover:text-white"><X size={24} /></button>
        </div>

        {/* Filtros con iconos blancos/brillantes */}
        <div className="p-8 border-b border-white/5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Desde</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white" size={16} />
              <input 
                type="date" 
                value={fromDate} 
                onChange={e => setFromDate(e.target.value)} 
                className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs text-white font-bold outline-none focus:border-emerald-500/50 [color-scheme:dark]" 
              />
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Hasta</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-white" size={16} />
              <input 
                type="date" 
                value={toDate} 
                onChange={e => setToDate(e.target.value)} 
                className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs text-white font-bold outline-none focus:border-emerald-500/50 [color-scheme:dark]" 
              />
            </div>
          </div>
        </div>

        {/* Lista con Botón de Eliminar */}
        <div className="flex-1 overflow-y-auto p-8 space-y-4 no-scrollbar">
          {filteredGastos.map((g: any) => (
            <div key={g.id} className="flex justify-between items-center p-5 bg-white/[0.03] rounded-3xl border border-white/5 group">
              <div className="flex gap-5 items-center">
                <FileText className="text-slate-600 group-hover:text-emerald-500 transition-colors" size={20} />
                <div>
                  <p className="text-sm font-black text-white uppercase leading-none mb-1">{g.descripcion}</p>
                  <p className="text-[10px] text-slate-500 font-bold uppercase">{new Date(g.fecha).toLocaleDateString('es-AR')}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                <p className="text-lg font-black text-emerald-500 italic">$ {Number(g.monto).toLocaleString()}</p>
                <button 
                  onClick={() => handleDeleteGasto(g.id, g.descripcion)}
                  className="p-2 text-slate-600 hover:text-rose-500 transition-colors"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="p-10 bg-white/[0.02] border-t border-white/5 flex justify-between items-center">
          <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest italic">Total Periodo</span>
          <span className="text-4xl font-black text-emerald-500 italic">$ {totalFiltrado.toLocaleString()}</span>
        </div>
      </div>
    </div>
  )
}