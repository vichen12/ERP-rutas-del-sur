'use client'
import { useState, useEffect } from 'react'
import { X, Loader2, CheckCircle2, AlertTriangle, Info } from 'lucide-react'

interface PagarResumenModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (payload: any) => Promise<void>
  cargasSeleccionadas: any[]
}

export function PagarResumenModal({ isOpen, onClose, onConfirm, cargasSeleccionadas }: PagarResumenModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  
  // Totales teóricos según el ERP
  const ltsTeoricos = cargasSeleccionadas.reduce((acc, c) => acc + Number(c.litros), 0)
  const montoTeorico = cargasSeleccionadas.reduce((acc, c) => acc + Number(c.total), 0)

  const [formData, setFormData] = useState({
    metodo: 'BANCO', 
    fecha: new Date().toISOString().split('T')[0],
    ltsReales: '',
    montoReal: ''
  })

  // Sincronizamos cuando abre
  useEffect(() => {
    if (isOpen) {
      setFormData(prev => ({
        ...prev,
        ltsReales: ltsTeoricos.toString(),
        montoReal: montoTeorico.toString()
      }))
    }
  }, [isOpen, ltsTeoricos, montoTeorico])

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    await onConfirm(formData)
    setIsSubmitting(false)
  }

  // Calculamos la diferencia en vivo para mostrarle al usuario
  const montoIngresado = Number(formData.montoReal) || 0;
  const diferencia = montoTeorico - montoIngresado;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 font-sans italic">
      <div className="bg-[#020617] border border-emerald-500/20 rounded-[2.5rem] p-8 w-full max-w-lg shadow-2xl relative animate-in fade-in zoom-in-95 duration-300">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/5 rounded-full text-slate-400 hover:text-white hover:bg-rose-500 transition-all"><X size={18}/></button>
        
        <h3 className="text-2xl font-black text-white uppercase mb-2">Liquidar <span className="text-emerald-500">Resumen YPF</span></h3>
        <p className="text-xs text-slate-400 mb-6 font-bold tracking-wide">Estás por conciliar <strong>{cargasSeleccionadas.length} remitos</strong> seleccionados.</p>
        
        {/* Resumen Teórico (Lo que dice el ERP) */}
        <div className="bg-white/5 p-4 rounded-2xl mb-4 border border-white/5 flex justify-between items-center">
          <div>
            <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Cálculo Teórico ERP</p>
            <p className="text-lg font-black text-slate-300 tabular-nums">{ltsTeoricos.toLocaleString('es-AR')} Lts</p>
          </div>
          <div className="text-right">
            <p className="text-xl font-black text-slate-300 tabular-nums">${montoTeorico.toLocaleString('es-AR')}</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
           <div className="bg-emerald-950/20 border border-emerald-500/20 p-5 rounded-[2rem] space-y-4 shadow-inner">
             <div className="flex items-center gap-2 mb-2">
               <AlertTriangle size={14} className="text-amber-500" />
               <p className="text-[10px] font-black text-amber-500 uppercase tracking-widest">Ajuste Factura Real YPF</p>
             </div>
             
             <div className="grid grid-cols-2 gap-4">
               <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Lts Reales Facturados</label>
                  <input type="number" step="0.1" value={formData.ltsReales} onChange={e => setFormData({...formData, ltsReales: e.target.value})} required className="w-full bg-slate-900 border border-white/10 rounded-xl p-3 text-white font-bold outline-none tabular-nums" />
               </div>
               <div>
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Monto a Transferir ($)</label>
                  <input type="number" step="0.1" value={formData.montoReal} onChange={e => setFormData({...formData, montoReal: e.target.value})} required className="w-full bg-slate-900 border border-emerald-500/30 rounded-xl p-3 text-emerald-400 font-bold outline-none tabular-nums" />
               </div>
             </div>
           </div>

           {/* LÓGICA VISUAL DE SALDO DE ARRASTRE */}
           {diferencia > 10 && (
             <div className="bg-rose-500/10 border border-rose-500/30 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in">
                <Info size={16} className="text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-0.5">Atención: Saldo Pendiente</p>
                  <p className="text-xs text-rose-400/80 font-bold leading-tight">
                    Estás pagando menos del total. Se creará automáticamente un saldo deudor por <strong className="text-white">${diferencia.toLocaleString('es-AR')}</strong> para el próximo ciclo.
                  </p>
                </div>
             </div>
           )}
           {diferencia < -10 && (
             <div className="bg-cyan-500/10 border border-cyan-500/30 p-4 rounded-2xl flex items-start gap-3 animate-in fade-in">
                <Info size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-black text-cyan-400 uppercase tracking-widest mb-0.5">Atención: Saldo a Favor</p>
                  <p className="text-xs text-cyan-400/80 font-bold leading-tight">
                    Estás pagando de más. Se creará un registro de saldo a favor por <strong className="text-white">${Math.abs(diferencia).toLocaleString('es-AR')}</strong>.
                  </p>
                </div>
             </div>
           )}

           <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Fecha de Pago</label>
                <input type="date" value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} required className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-white font-bold outline-none uppercase text-xs" />
              </div>
              <div>
                <label className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1 block">Origen del dinero</label>
                <select value={formData.metodo} onChange={e => setFormData({...formData, metodo: e.target.value})} className="w-full bg-slate-900 border border-white/10 rounded-xl p-4 text-white font-bold outline-none uppercase text-xs">
                  <option value="BANCO">Banco</option>
                  <option value="EFECTIVO">Caja Efectivo</option>
                </select>
              </div>
           </div>

            <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-4 bg-slate-800 text-white rounded-xl font-black uppercase text-xs tracking-widest hover:bg-slate-700 transition-all">Cancelar</button>
            <button type="submit" disabled={isSubmitting} className="flex-[1.5] px-4 py-4 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 shadow-lg transition-all active:scale-95">
               {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <><CheckCircle2 size={18}/> Liquidar Selección</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}