'use client'
import { X, Loader2, Calendar, User, Truck, DollarSign, MapPin, Fuel, Wrench, Coins, TrendingUp, Percent } from 'lucide-react'
import { useState, useMemo } from 'react'

export function ViajeModal({ isOpen, onClose, onSubmit, isSubmitting, formData, setFormData, clientes, choferes, camiones }: any) {
  const [tab, setTab] = useState<'general' | 'financiero'>('general')

  // --- CÁLCULOS EN TIEMPO REAL CON MARGEN DE RENTABILIDAD ---
  const finanzas = useMemo(() => {
    const bruta = Number(formData.facturacion) || 0;
    const pagoChofer = Number(formData.pago_chofer) || 0;
    const otrosCostos = Number(formData.costos_operativos) || 0;
    const litros = Number(formData.lts_combustible) || 0;
    const precioGasoil = Number(formData.precio_gasoil) || 0;

    const costoGasoil = litros * precioGasoil;
    const gastosTotales = pagoChofer + otrosCostos + costoGasoil;
    const neta = bruta - gastosTotales;
    const sinIva = neta / 1.21;
    
    // Cálculo del margen: Qué % de la bruta es ganancia
    const margen = bruta > 0 ? (neta / bruta) * 100 : 0;

    return { bruta, costoGasoil, neta, sinIva, margen };
  }, [formData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-[#020617] border border-white/10 w-full max-w-2xl rounded-[3rem] p-8 md:p-10 shadow-2xl relative italic overflow-hidden font-sans">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-cyan-500 via-emerald-500 to-indigo-500" />
        
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter italic leading-none">
              Hoja de <span className="text-cyan-500">Ruta</span>
            </h2>
            <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mt-1">
              {formData.es_retorno ? 'Carga de Retorno' : 'Nuevo Viaje de Ida'}
            </p>
          </div>
          <button onClick={onClose} className="p-3 bg-white/5 rounded-full text-slate-500 hover:text-white transition-all hover:rotate-90 duration-300">
            <X size={20}/>
          </button>
        </div>

        {/* PESTAÑAS */}
        <div className="flex p-1 bg-white/5 rounded-2xl mb-6 border border-white/5">
          <button 
            type="button"
            onClick={() => setTab('general')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'general' ? 'bg-cyan-600 text-white shadow-lg shadow-cyan-600/20' : 'text-slate-500 hover:text-white'}`}
          >
            Datos de Ruta
          </button>
          <button 
            type="button"
            onClick={() => setTab('financiero')}
            className={`flex-1 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tab === 'financiero' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'text-slate-500 hover:text-white'}`}
          >
            Costos y Utilidad
          </button>
        </div>

        <form onSubmit={onSubmit} className="space-y-6">
          
          {/* --- TAB OPERATIVO --- */}
          {tab === 'general' && (
            <div className="space-y-5 animate-in slide-in-from-right-4 duration-300">
              <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Cliente / Dador de Carga</label>
                    <select className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 px-4 text-white font-bold focus:border-cyan-500 outline-none uppercase text-xs cursor-pointer" 
                      value={formData.cliente_id} onChange={e => setFormData({...formData, cliente_id: e.target.value})}>
                      <option value="">-- PARTICULAR / CONTADO --</option>
                      {clientes.map((cl: any) => <option key={cl.id} value={cl.id} className="bg-slate-900">{cl.razon_social}</option>)}
                    </select>
                 </div>
                 <div className="space-y-1">
                    <label className="text-[9px] font-black text-slate-500 uppercase ml-2">Fecha de Salida</label>
                    <div className="relative">
                      <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                      <input required type="date" className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white font-bold outline-none focus:border-cyan-500 text-xs uppercase [&::-webkit-calendar-picker-indicator]:invert" 
                        value={formData.fecha} onChange={e => setFormData({...formData, fecha: e.target.value})} />
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <div className="relative group">
                    <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-cyan-500" />
                    <input required placeholder="ORIGEN" className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white font-bold uppercase outline-none focus:border-cyan-500 text-xs placeholder:text-slate-700" 
                      value={formData.origen} onChange={e => setFormData({...formData, origen: e.target.value.toUpperCase()})} />
                 </div>
                 <div className="relative group">
                    <MapPin size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-500" />
                    <input required placeholder="DESTINO" className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white font-bold uppercase outline-none focus:border-indigo-500 text-xs placeholder:text-slate-700" 
                      value={formData.destino} onChange={e => setFormData({...formData, destino: e.target.value.toUpperCase()})} />
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                 <select required className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 px-4 text-xs text-white font-bold outline-none focus:border-cyan-500 uppercase cursor-pointer" 
                    value={formData.camion_id} onChange={e => setFormData({...formData, camion_id: e.target.value})}>
                    <option value="">SELECCIONAR CAMIÓN...</option>
                    {camiones.map((c: any) => <option key={c.id} value={c.id} className="bg-slate-900">{c.patente}</option>)}
                 </select>
                 <select required className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 px-4 text-xs text-white font-bold outline-none focus:border-cyan-500 uppercase cursor-pointer" 
                    value={formData.chofer_id} onChange={e => setFormData({...formData, chofer_id: e.target.value})}>
                    <option value="">SELECCIONAR CHOFER...</option>
                    {choferes.map((ch: any) => <option key={ch.id} value={ch.id} className="bg-slate-900">{ch.nombre}</option>)}
                 </select>
              </div>

              <div className="bg-white/5 p-5 rounded-[2rem] border border-white/5 space-y-4 shadow-inner">
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                       <label className="text-[8px] font-black text-slate-400 uppercase ml-2">KM Odómetro Salida</label>
                       <input required type="number" placeholder="0" className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-3 px-4 text-white font-bold outline-none focus:border-cyan-500 text-sm" 
                         value={formData.km_salida} onChange={e => setFormData({...formData, km_salida: e.target.value})} />
                    </div>
                    <div className="space-y-1">
                       <label className="text-[8px] font-black text-indigo-400 uppercase ml-2">KM Odómetro Retorno</label>
                       <input type="number" placeholder="0" className="w-full bg-slate-950/50 border border-white/10 rounded-2xl py-3 px-4 text-white font-bold outline-none focus:border-indigo-500 text-sm" 
                         value={formData.km_retorno} onChange={e => setFormData({...formData, km_retorno: e.target.value})} />
                    </div>
                 </div>
                 <div className="flex gap-6 pt-2">
                    <label className="flex items-center gap-2 cursor-pointer select-none group">
                      <input type="checkbox" className="accent-indigo-500 w-4 h-4 rounded border-white/10 bg-slate-950" 
                        checked={formData.es_retorno} onChange={e => setFormData({...formData, es_retorno: e.target.checked})} />
                      <span className="text-[9px] font-black text-indigo-300 uppercase italic group-hover:text-white transition-colors">¿Es Retorno?</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer select-none group">
                      <input type="checkbox" className="accent-amber-500 w-4 h-4 rounded border-white/10 bg-slate-950" 
                        checked={formData.engrase} onChange={e => setFormData({...formData, engrase: e.target.checked})} />
                      <span className="text-[9px] font-black text-amber-300 uppercase italic group-hover:text-white transition-colors">Service / Engrase</span>
                    </label>
                 </div>
              </div>
            </div>
          )}

          {/* --- TAB FINANZAS --- */}
          {tab === 'financiero' && (
            <div className="space-y-5 animate-in slide-in-from-left-4 duration-300">
               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-emerald-500 uppercase ml-2 tracking-widest">Facturación Bruta (Flete)</label>
                    <div className="relative">
                      <DollarSign size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-500" />
                      <input required type="number" placeholder="Monto total" className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white font-bold focus:border-emerald-500 outline-none text-base" 
                        value={formData.facturacion} onChange={e => setFormData({...formData, facturacion: e.target.value})} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-amber-500 uppercase ml-2 tracking-widest">Precio Gasoil Aplicado</label>
                    <div className="relative">
                      <Fuel size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" />
                      <input required type="number" placeholder="$$ / Litro" className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 pr-6 text-white font-bold focus:border-amber-500 outline-none text-base" 
                        value={formData.precio_gasoil} onChange={e => setFormData({...formData, precio_gasoil: e.target.value})} />
                    </div>
                  </div>
               </div>

               <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                     <label className="text-[9px] font-black text-rose-400 uppercase ml-2 tracking-widest">Viático / Pago Chofer</label>
                     <div className="relative">
                        <User size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500" />
                        <input type="number" placeholder="0.00" className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-10 pr-4 text-white font-bold focus:border-rose-500 outline-none text-sm" 
                            value={formData.pago_chofer} onChange={e => setFormData({...formData, pago_chofer: e.target.value})} />
                     </div>
                  </div>
                  <div className="space-y-1">
                     <label className="text-[9px] font-black text-amber-500 uppercase ml-2 tracking-widest">Gasoil (Litros Reales)</label>
                     <div className="relative">
                        <Fuel size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-amber-500" />
                        <input type="number" placeholder="Total lts" className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-10 pr-4 text-white font-bold focus:border-amber-500 outline-none text-sm" 
                            value={formData.lts_combustible} onChange={e => setFormData({...formData, lts_combustible: e.target.value})} />
                     </div>
                  </div>
               </div>

               <div className="space-y-1">
                  <label className="text-[9px] font-black text-rose-400 uppercase ml-2 tracking-widest">Gastos Adicionales (Peajes, Descargas, etc)</label>
                  <div className="relative">
                     <Wrench size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-rose-500" />
                     <input type="number" placeholder="Suma de otros costos" className="w-full bg-slate-950 border border-white/10 rounded-2xl py-4 pl-12 px-6 text-white font-bold focus:border-rose-500 outline-none" 
                        value={formData.costos_operativos} onChange={e => setFormData({...formData, costos_operativos: e.target.value})} />
                  </div>
               </div>

               {/* CALCULADORA PREVIEW EVOLUCIONADA */}
               <div className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-6 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-4">
                     <div className={`flex flex-col items-center justify-center w-20 h-20 rounded-full border-2 ${finanzas.margen > 30 ? 'border-emerald-500 text-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.2)]' : 'border-amber-500 text-amber-500'} transition-all`}>
                        <span className="text-[8px] font-black uppercase leading-none">Margen</span>
                        <span className="text-lg font-black">{Math.round(finanzas.margen)}%</span>
                     </div>
                  </div>

                  <div className="grid grid-cols-3 gap-4 pr-20">
                    <div className="space-y-1">
                        <p className="text-[8px] font-black text-slate-500 uppercase tracking-widest">G. Bruta</p>
                        <p className="text-lg font-black text-white">${finanzas.bruta.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1 border-x border-white/5 px-4">
                        <p className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">Ganancia Neta</p>
                        <p className="text-xl font-black text-emerald-400">${finanzas.neta.toLocaleString()}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-[8px] font-black text-cyan-500 uppercase tracking-widest">Neto s/IVA</p>
                        <p className="text-lg font-black text-cyan-400">${finanzas.sinIva.toLocaleString(undefined, { maximumFractionDigits: 0 })}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                     <div className={`w-1.5 h-1.5 rounded-full ${finanzas.neta > 0 ? 'bg-emerald-500' : 'bg-rose-500 animate-pulse'}`} />
                     <p className="text-[9px] font-bold text-slate-500 uppercase italic">
                        {finanzas.neta > 0 ? 'Rendimiento positivo para la empresa' : 'Cuidado: Gastos superan ingresos'}
                     </p>
                  </div>
               </div>
            </div>
          )}

          <button 
            type="submit" 
            disabled={isSubmitting} 
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white py-5 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.4em] transition-all shadow-xl shadow-cyan-900/20 active:scale-95 mt-4 italic flex items-center justify-center gap-3 group"
          >
            {isSubmitting ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                Confirmar Registro <TrendingUp size={16} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  )
}