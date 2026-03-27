'use client'
import { useState, useEffect } from 'react'
import { X, CheckCircle2, Loader2, DollarSign, Repeat, Zap, Calculator as CalcIcon } from 'lucide-react'

interface PagoCostoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
  costo: any; 
  isProcessing: boolean;
  variables?: { // Recibimos las variables para que la fórmula funcione acá adentro
    VENTAS: number;
    GASOIL: number;
    CHOFERES: number;
    NETO: number;
  };
}

export function PagoCostoModal({ isOpen, onClose, onConfirm, costo, isProcessing, variables }: PagoCostoModalProps) {
  const [montoInput, setMontoInput] = useState('')
  const [isFormulaMode, setIsFormulaMode] = useState(false)
  const [paymentData, setPaymentData] = useState({
    metodo: 'caja', 
    fecha: new Date().toISOString().split('T')[0],
    notas: '',
    tipoGasto: 'frecuente' 
  })

  // Sincronizar cuando se abre
  useEffect(() => {
    if (isOpen && costo) {
      const montoInicial = costo.es_anual ? Math.round(Number(costo.monto) / 12) : Number(costo.monto)
      setMontoInput(String(montoInicial || ''))
      setIsFormulaMode(false)
      setPaymentData({
        metodo: 'caja',
        fecha: new Date().toISOString().split('T')[0],
        notas: '',
        tipoGasto: costo.tipo || 'frecuente' // <--- YA NO ESTÁ HARDCODEADO, toma lo que viene del componente
      })
    }
  }, [isOpen, costo])

  // Lógica de cálculo de fórmula en caliente
  const montoFinal = (() => {
    if (!isFormulaMode) return Number(montoInput) || 0
    try {
      const f = montoInput
        .replace(/VENTAS/g, String(variables?.VENTAS || 0))
        .replace(/GASOIL/g, String(variables?.GASOIL || 0))
        .replace(/CHOFERES/g, String(variables?.CHOFERES || 0))
        .replace(/NETO/g, String(variables?.NETO || 0))
      return eval(f) || 0
    } catch { return 0 }
  })()

  if (!isOpen || !costo) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-start sm:items-center justify-center overflow-y-auto p-4 bg-[#141c28]/90 backdrop-blur-md animate-in fade-in duration-200 font-sans italic">
      <div className="bg-[#141c28] w-full max-w-lg rounded-[2.5rem] border border-white/10 p-8 shadow-2xl relative my-auto">
        
        <button onClick={onClose} className="absolute top-6 right-6 p-2 bg-white/5 rounded-full text-slate-500 hover:text-white transition-colors">
          <X size={20}/>
        </button>
        
        <div className="text-center mb-6">
          <h3 className="text-xl font-black text-white uppercase tracking-tighter">Confirmar Operación</h3>
          <p className="text-sm font-bold text-orange-400 uppercase mt-1">{costo.nombre}</p>
        </div>

        {/* SELECTOR DINÁMICO DE TIPO */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <button 
            onClick={() => setPaymentData({...paymentData, tipoGasto: 'frecuente'})}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-[9px] font-black uppercase transition-all ${
              paymentData.tipoGasto === 'frecuente' ? 'bg-indigo-600/20 border-indigo-500 text-indigo-400' : 'bg-white/5 border-white/5 text-slate-500'
            }`}
          >
            <Repeat size={12} /> Recurrente
          </button>
          <button 
            onClick={() => setPaymentData({...paymentData, tipoGasto: 'aislado'})}
            className={`flex items-center justify-center gap-2 py-3 rounded-xl border text-[9px] font-black uppercase transition-all ${
              paymentData.tipoGasto === 'aislado' ? 'bg-sky-600/20 border-sky-500 text-sky-400' : 'bg-white/5 border-white/5 text-slate-500'
            }`}
          >
            <Zap size={12} /> Gasto Aislado
          </button>
        </div>

        {/* INPUT DE MONTO CON MODO FÓRMULA */}
        <div className="bg-[#1a2537]/50 rounded-3xl p-6 mb-6 border border-white/5 relative">
          <div className="flex justify-between items-center mb-4">
             <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Importe a Liquidar</p>
             <button 
               onClick={() => setIsFormulaMode(!isFormulaMode)}
               className={`flex items-center gap-1.5 px-3 py-1 rounded-lg text-[8px] font-black uppercase transition-all ${isFormulaMode ? 'bg-orange-600 text-white' : 'bg-white/5 text-slate-500'}`}
             >
               <CalcIcon size={10}/> {isFormulaMode ? 'Modo Manual' : 'Usar Fórmula'}
             </button>
          </div>

          <div className="flex items-center justify-center gap-2">
            <span className="text-3xl font-black text-slate-600">$</span>
            <input 
              type={isFormulaMode ? "text" : "number"}
              value={montoInput} 
              onChange={e => setMontoInput(e.target.value)}
              className={`bg-transparent font-black italic tracking-tighter text-center outline-none w-full ${isFormulaMode ? 'text-orange-400 text-xl font-mono' : 'text-white text-5xl'}`}
              placeholder="0"
            />
          </div>

          {isFormulaMode && (
            <div className="mt-4 pt-4 border-t border-white/5 space-y-3">
               <div className="flex flex-wrap gap-1.5 justify-center">
                  {['VENTAS', 'GASOIL', 'CHOFERES', 'NETO', '*', '/', '+', '-'].map(b => (
                    <button 
                      key={b} 
                      onClick={() => setMontoInput(prev => prev + b)}
                      className="px-2 py-1 bg-white/5 hover:bg-white/10 rounded text-[9px] font-black text-slate-400"
                    >
                      {b}
                    </button>
                  ))}
               </div>
               <p className="text-center text-lg font-black text-emerald-400">Total: $ {montoFinal.toLocaleString()}</p>
            </div>
          )}
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase pl-2">Fecha</label>
              <input type="date" value={paymentData.fecha} onChange={e => setPaymentData({...paymentData, fecha: e.target.value})} className="w-full bg-[#141c28] border border-white/10 rounded-xl py-3 px-4 text-white font-bold outline-none focus:border-emerald-500 uppercase [color-scheme:dark]" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black text-slate-500 uppercase pl-2">Cuenta</label>
              <select 
                value={paymentData.metodo} 
                onChange={e => setPaymentData({...paymentData, metodo: e.target.value})}
                className="w-full bg-[#141c28] border border-white/10 rounded-xl py-3 px-4 text-white font-bold outline-none focus:border-emerald-500 uppercase appearance-none"
              >
                <option value="caja">Efectivo</option>
                <option value="banco">Banco / Transf.</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] font-black text-slate-500 uppercase pl-2">Notas / Comprobante</label>
            <input placeholder="DETALLE DEL GASTO..." value={paymentData.notas} onChange={e => setPaymentData({...paymentData, notas: e.target.value})} className="w-full bg-[#141c28] border border-white/10 rounded-xl py-3 px-4 text-white font-bold outline-none focus:border-indigo-500 uppercase placeholder:text-slate-800" />
          </div>
        </div>

        <button 
          onClick={() => onConfirm({ ...paymentData, montoReal: montoFinal })} 
          disabled={isProcessing || montoFinal <= 0} 
          className="w-full mt-8 py-5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-[#243248] text-white rounded-2xl font-black uppercase text-[11px] tracking-widest shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
        >
          {isProcessing ? <Loader2 size={18} className="animate-spin" /> : <>Ejecutar Movimiento <CheckCircle2 size={18}/></>}
        </button>
      </div>
    </div>
  )
}