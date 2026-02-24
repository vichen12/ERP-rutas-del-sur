'use client'
import { useState, useEffect } from 'react'
import { DollarSign, Save, TrendingUp, Zap } from 'lucide-react'

interface CajaDolarPanelProps {
  tipoCambio: number
  onSaveTipoCambio: (valor: number) => void
  totalCorriente: number
  totalGeneral: number
  totalEnDolar: number
  totalEnDolarTotal: number
}

export function CajaDolarPanel({
  tipoCambio,
  onSaveTipoCambio,
  totalCorriente,
  totalGeneral,
  totalEnDolar,
  totalEnDolarTotal,
}: CajaDolarPanelProps) {
  const [localTipoCambio, setLocalTipoCambio] = useState(tipoCambio)
  const [guardando, setGuardando] = useState(false)
  
  // 1. Estado para saber si el componente ya se montó en el cliente
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  const handleSave = async () => {
    setGuardando(true)
    onSaveTipoCambio(localTipoCambio)
    setTimeout(() => setGuardando(false), 800)
  }

  // 2. Función segura contra errores de hidratación
  const formatCurrency = (val: number, maxFrac = 0) => {
    if (!mounted) return val; // Renderizado inicial seguro para el servidor
    return val.toLocaleString('es-AR', { maximumFractionDigits: maxFrac });
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 font-sans italic">

      {/* TIPO DE CAMBIO */}
      <div className="bg-[#020617] border border-yellow-500/20 rounded-[2.5rem] p-7 relative overflow-hidden group shadow-2xl">
        <div className="absolute -right-6 -bottom-6 text-yellow-500/5 pointer-events-none">
          <DollarSign size={120} />
        </div>
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-yellow-500/10 rounded-xl">
              <DollarSign size={16} className="text-yellow-400" />
            </div>
            <p className="text-[9px] font-black text-yellow-500/80 uppercase tracking-[0.3em]">Tipo de Cambio Referencia</p>
          </div>

          <div className="flex items-center gap-3 mb-4">
            <span className="text-3xl font-black text-yellow-400">$</span>
            <input
              type="number"
              value={localTipoCambio}
              onChange={e => setLocalTipoCambio(Number(e.target.value))}
              onBlur={handleSave}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              className="bg-transparent text-white font-black text-4xl w-36 outline-none border-b-2 border-white/10 focus:border-yellow-500 transition-all tabular-nums"
            />
            {guardando && <Save size={18} className="text-emerald-500 animate-bounce" />}
          </div>

          <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest">
            USD · Dólar Blue / Referencia
          </p>
          <p className="text-[8px] font-bold text-slate-600 uppercase tracking-widest mt-1">
            Editá el valor y presioná Enter o hacé click afuera para guardar
          </p>
        </div>
      </div>

      {/* TOTAL CORRIENTE EN DÓLAR */}
      <div className="bg-[#020617] border border-white/5 rounded-[2.5rem] p-7 relative overflow-hidden group hover:border-yellow-500/20 transition-all shadow-2xl">
        <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
          <TrendingUp size={80} className="text-yellow-500" />
        </div>
        <div className="relative z-10">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-[0.3em] mb-1">Total Corriente</p>
          <p className="text-[8px] font-black text-yellow-500/60 uppercase tracking-widest mb-4">
            A Dólar {formatCurrency(localTipoCambio)}
          </p>
          <p className="text-3xl md:text-4xl font-black text-yellow-400 italic tabular-nums tracking-tighter">
            U$D {formatCurrency(totalEnDolar, 2)}
          </p>
          <div className="mt-4 pt-4 border-t border-white/5">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">En pesos:</p>
            <p className="text-lg font-black text-slate-400 tabular-nums">$ {formatCurrency(totalCorriente)}</p>
          </div>
        </div>
      </div>

      {/* TOTAL GENERAL EN DÓLAR */}
      <div className="bg-gradient-to-br from-yellow-500/10 to-transparent border border-yellow-500/30 rounded-[2.5rem] p-7 relative overflow-hidden shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-br from-yellow-500/5 to-transparent pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-4">
            <Zap size={16} className="text-yellow-400" />
            <p className="text-[9px] font-black text-yellow-500 uppercase tracking-[0.3em]">Total General</p>
            <span className="ml-auto px-2 py-1 bg-yellow-500/20 text-yellow-400 text-[7px] font-black uppercase rounded-lg border border-yellow-500/20">
              USD {formatCurrency(localTipoCambio)}
            </span>
          </div>
          <p className="text-[8px] font-black text-yellow-500/60 uppercase tracking-widest mb-2">
            Patrimonio total convertido
          </p>
          <p className="text-4xl md:text-5xl font-black text-yellow-300 italic tabular-nums tracking-tighter leading-none">
            U$D {formatCurrency(totalEnDolarTotal, 2)}
          </p>
          <div className="mt-4 pt-4 border-t border-yellow-500/10">
            <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Patrimonio en ARS:</p>
            <p className="text-xl font-black text-slate-300 tabular-nums">$ {formatCurrency(totalGeneral)}</p>
          </div>
        </div>
      </div>
    </div>
  )
}