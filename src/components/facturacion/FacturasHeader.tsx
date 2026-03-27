'use client'
import { useState } from 'react'
import { Shield, HelpCircle, Settings, Plus, Calendar, ChevronRight } from 'lucide-react'
import { TutorialArcaModal } from './TutorialArcaModal'

export function FacturasHeader({ arcaConfigurado, entorno, dateStart, setDateStart, dateEnd, setDateEnd, onNuevaFactura, onOpenConfig }: any) {
  const [tutorialOpen, setTutorialOpen] = useState(false)

  return (
    <>
      <div className="space-y-6">
        <div className="flex flex-col xl:flex-row justify-between items-start xl:items-end gap-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
              <p className="text-[10px] font-black text-sky-500 uppercase tracking-[0.4em]">Facturacion Electronica</p>
            </div>
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black italic tracking-tighter text-white uppercase leading-[0.85]">
              ARCA<br /><span className="text-sky-500 font-thin">/ AFIP</span>
            </h1>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.3em] mt-3">Emision de comprobantes electronicos · DallapeSystems ERP</p>
          </div>

          <div className="flex gap-3 flex-wrap">
            <div className={`flex items-center gap-2 px-5 py-3 rounded-2xl border text-[9px] font-black uppercase tracking-widest ${entorno === 'produccion' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-amber-500/10 border-amber-500/20 text-amber-400'}`}>
              <Shield size={14} />
              {entorno === 'produccion' ? 'Produccion' : 'Modo Prueba'}
            </div>

            <button onClick={() => setTutorialOpen(true)}
              className="flex items-center gap-2 px-5 py-3 rounded-[1.8rem] border bg-violet-500/10 border-violet-500/20 text-violet-400 hover:bg-violet-500/20 font-black uppercase text-[9px] tracking-widest transition-all">
              <HelpCircle size={14} /> Ayuda
            </button>

            <button onClick={onOpenConfig}
              className={`flex items-center gap-3 px-5 py-3 rounded-[1.8rem] border font-black uppercase text-[9px] tracking-widest transition-all ${arcaConfigurado ? 'bg-white/5 border-white/10 text-slate-400 hover:text-white' : 'bg-rose-500/10 border-rose-500/20 text-rose-400 animate-pulse'}`}>
              <Settings size={15} />
              {arcaConfigurado ? 'Configuracion' : 'Configurar ARCA'}
            </button>

            <button onClick={onNuevaFactura} disabled={!arcaConfigurado}
              className="flex items-center gap-3 px-10 py-3 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 disabled:cursor-not-allowed text-white rounded-[1.8rem] font-black uppercase text-[9px] tracking-[0.2em] transition-all active:scale-95 shadow-xl group">
              <Plus size={18} strokeWidth={4} className="group-hover:rotate-90 transition-transform" /> Nueva Factura
            </button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-4 bg-[#141c28]/40 px-6 py-3 rounded-[2rem] border border-white/5 w-fit">
          <Calendar size={16} className="text-sky-500" />
          <div className="flex flex-col">
            <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Desde</span>
            <input type="date" value={dateStart} onChange={e => setDateStart(e.target.value)} className="bg-transparent text-white font-black text-sm outline-none [color-scheme:dark]" />
          </div>
          <ChevronRight size={14} className="text-slate-700" />
          <div className="flex flex-col">
            <span className="text-[7px] font-black text-slate-600 uppercase tracking-widest">Hasta</span>
            <input type="date" value={dateEnd} onChange={e => setDateEnd(e.target.value)} className="bg-transparent text-white font-black text-sm outline-none [color-scheme:dark]" />
          </div>
        </div>
      </div>

      <TutorialArcaModal isOpen={tutorialOpen} onClose={() => setTutorialOpen(false)} />
    </>
  )
}