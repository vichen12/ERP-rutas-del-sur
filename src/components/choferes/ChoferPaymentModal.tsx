'use client'
import { useState, useEffect } from 'react'
import { X, CheckCircle2 } from 'lucide-react'

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
  totalSeleccionado: number;
  count: number;
  isProcessing: boolean;
}

export function ChoferPaymentModal({ isOpen, onClose, onConfirm, totalSeleccionado, count, isProcessing }: PaymentModalProps) {
  const [paymentData, setPaymentData] = useState({
    metodo: 'TRANSFERENCIA',
    fecha: new Date().toISOString().split('T')[0],
    notas: '',
    montoReal: 0
  })

  // Sincronizar el monto sugerido cuando se abre el modal
  useEffect(() => {
    if (isOpen) {
      setPaymentData(prev => ({ ...prev, montoReal: totalSeleccionado }))
    }
  }, [isOpen, totalSeleccionado])

  if (!isOpen) return null

  const diferencia = paymentData.montoReal - totalSeleccionado
  const esDiferente = diferencia !== 0

  return (
    // CONTENEDOR PRINCIPAL RESPONSIVE
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-24 md:pt-32 p-4 bg-black/95 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-200 font-sans italic overflow-y-auto">
      
      <div className="bg-[#020617] w-full max-w-md rounded-[2.5rem] border border-white/10 p-8 shadow-2xl relative mb-10">
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors">
            <X size={20}/>
        </button>
        
        <div className="text-center mb-6">
          <h3 className="text-2xl font-black text-white uppercase tracking-tighter">Liquidar {count} Viajes</h3>
          <p className="text-[10px] font-bold text-slate-500 uppercase mt-2">Ajustá el monto si es necesario</p>
        </div>

        {/* INPUT GIGANTE DE MONTO */}
        <div className={`rounded-2xl p-6 mb-6 border text-center transition-colors ${esDiferente ? 'bg-amber-500/10 border-amber-500/20' : 'bg-emerald-500/10 border-emerald-500/20'}`}>
          <p className={`text-[10px] font-black uppercase tracking-widest mb-2 ${esDiferente ? 'text-amber-500' : 'text-emerald-500'}`}>
              {esDiferente ? 'Monto Personalizado' : 'Monto Exacto a Pagar'}
          </p>
          <div className="flex items-center justify-center gap-2">
              <span className="text-3xl font-black text-slate-500">$</span>
              <input 
                  type="number" 
                  value={paymentData.montoReal} 
                  onChange={e => setPaymentData({...paymentData, montoReal: Number(e.target.value)})}
                  className="bg-transparent text-4xl font-black text-white italic tracking-tighter w-48 text-center outline-none border-b border-white/10 focus:border-white transition-all"
              />
          </div>
          
          {esDiferente && (
              <div className="mt-3 text-[10px] font-bold uppercase p-2 bg-black/20 rounded-lg inline-block">
                  {diferencia < 0 ? <span className="text-rose-400">Pago Parcial (Faltan ${Math.abs(diferencia).toLocaleString()})</span> : <span className="text-emerald-400">Adelanto (Sobran ${diferencia.toLocaleString()})</span>}
              </div>
          )}
          <p className="text-[9px] font-bold text-slate-500 mt-2 uppercase">Total Original: ${totalSeleccionado.toLocaleString()}</p>
        </div>

        <div className="space-y-4">
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 uppercase pl-3 tracking-widest">Fecha Pago</label>
            <input type="date" value={paymentData.fecha} onChange={e => setPaymentData({...paymentData, fecha: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-2xl py-3 px-4 text-white font-bold outline-none focus:border-emerald-500 appearance-none uppercase" />
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 uppercase pl-3 tracking-widest">Método</label>
            <div className="grid grid-cols-3 gap-2">
              {['EFECTIVO', 'TRANSFERENCIA', 'CHEQUE'].map((m) => (
                <button key={m} onClick={() => setPaymentData({...paymentData, metodo: m})} className={`py-3 rounded-xl text-[9px] font-black uppercase border transition-all ${paymentData.metodo === m ? 'bg-indigo-600 border-indigo-500 text-white' : 'bg-slate-950 border-white/10 text-slate-500'}`}>{m.slice(0,4)}.</button>
              ))}
            </div>
          </div>
          <div className="space-y-1">
            <label className="text-[9px] font-black text-slate-500 uppercase pl-3 tracking-widest">Notas / Comprobante</label>
            <input placeholder="EJ: RECIBO X" value={paymentData.notas} onChange={e => setPaymentData({...paymentData, notas: e.target.value})} className="w-full bg-slate-950 border border-white/10 rounded-2xl py-3 px-4 text-white font-bold outline-none focus:border-indigo-500 uppercase italic placeholder:text-slate-700" />
          </div>
        </div>

        <button onClick={() => onConfirm(paymentData)} disabled={isProcessing} className="w-full mt-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2">
          {isProcessing ? 'Procesando...' : <>Confirmar Pago <CheckCircle2 size={18}/></>}
        </button>
      </div>
    </div>
  )
}