'use client'
import { 
  X, Loader2, TrendingUp, 
  ArrowRight, CheckCircle2, 
  ArrowUpCircle, ArrowDownCircle, ShieldCheck, 
  Gauge, Fuel, DollarSign 
} from 'lucide-react'
import { useState, useMemo, useEffect } from 'react'

import { ViajeModalOperativo } from './ViajeModalOperativo'
import { ViajeModalFinanciero } from './ViajeModalFinanciero'

export function ViajeModal({ 
  isOpen, 
  onClose, 
  onWizardSubmit, 
  isSubmitting, 
  formData, 
  setFormData, 
  clientes = [], 
  choferes = [], 
  camiones = [] 
}: any) {
  
  const [step, setStep] = useState<1 | 2 | 3>(1);

  useEffect(() => {
    if (isOpen) setStep(1);
  }, [isOpen]);

  const handleCamionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const camionId = e.target.value;
    const camion = camiones?.find((c: any) => c.id === camionId);
    setFormData((prev: any) => ({ 
      ...prev, 
      camion_id: camionId, 
      chofer_id: camion?.operador_id || prev.chofer_id 
    }));
  };

  const agregarCliente = (tipo: 'ida' | 'vuelta') => {
    const campo = tipo === 'ida' ? 'repartos_ida' : 'repartos_vuelta';
    setFormData((prev: any) => ({ 
      ...prev, 
      [campo]: [...(prev[campo] || []), { cliente_id: '', monto_flete: '' }] 
    }));
  };

  const actualizarReparto = (tipo: 'ida' | 'vuelta', index: number, campo: string, valor: string) => {
    const listaCampo = tipo === 'ida' ? 'repartos_ida' : 'repartos_vuelta';

    setFormData((prev: any) => {
      const nuevosRepartos = [...(prev[listaCampo] || [])];
      nuevosRepartos[index] = { ...nuevosRepartos[index], [campo]: valor };

      if (campo === 'cliente_id' && valor) {
        const cliente = clientes?.find((c: any) => c.id === valor);
        if (cliente) {
          nuevosRepartos[index].monto_flete = cliente.tarifa_flete || "";
          
          // 🎯 PRIMER CLIENTE DE IDA
          // Guarda km e lts propios en km_ida / lts_ida y recalcula totales
          if (tipo === 'ida' && index === 0) {
            const kmIda  = cliente.ruta_km_estimados || "";
            const ltsIda = cliente.lts_gasoil_estimado || "";
            const tieneVuelta = (prev.repartos_vuelta || []).length > 0;

            const kmVueltaActual  = Number(prev.km_vuelta) || 0;
            const ltsVueltaActual = Number(prev.lts_vuelta) || 0;

            const kmTotal  = tieneVuelta ? (Number(kmIda) || 0) + kmVueltaActual  : (Number(kmIda) || 0);
            const ltsTotal = tieneVuelta ? (Number(ltsIda) || 0) + ltsVueltaActual : (Number(ltsIda) || 0);

            return {
              ...prev,
              origen:        cliente.ruta_origen?.toUpperCase() || "MENDOZA",
              destino:       cliente.ruta_destino?.toUpperCase() || "",
              km_ida:        kmIda,
              lts_ida:       ltsIda,
              km_recorridos: kmTotal  > 0 ? String(kmTotal)  : kmIda,
              lts_gasoil:    ltsTotal > 0 ? String(ltsTotal) : ltsIda,
              pago_chofer:   cliente.pago_chofer    || "",
              costo_descarga: cliente.costo_descarga || "0",
              desgaste_por_km: cliente.desgaste_por_km || "180",
              [listaCampo]:  nuevosRepartos
            };
          }

          // 🎯 PRIMER CLIENTE DE VUELTA
          // Guarda km e lts propios en km_vuelta / lts_vuelta y recalcula totales
          if (tipo === 'vuelta' && index === 0) {
            const kmVuelta  = cliente.ruta_km_estimados   || "";
            const ltsVuelta = cliente.lts_gasoil_estimado || "";

            const kmIdaActual  = Number(prev.km_ida)  || 0;
            const ltsIdaActual = Number(prev.lts_ida) || 0;

            const kmTotal  = kmIdaActual  + (Number(kmVuelta)  || 0);
            const ltsTotal = ltsIdaActual + (Number(ltsVuelta) || 0);

            return {
              ...prev,
              km_vuelta:     kmVuelta,
              lts_vuelta:    ltsVuelta,
              km_recorridos: kmTotal  > 0 ? String(kmTotal)  : prev.km_recorridos,
              lts_gasoil:    ltsTotal > 0 ? String(ltsTotal) : prev.lts_gasoil,
              [listaCampo]:  nuevosRepartos
            };
          }
        }
      }
      
      return { ...prev, [listaCampo]: nuevosRepartos };
    });
  };

  const eliminarReparto = (tipo: 'ida' | 'vuelta', index: number) => {
    const campo = tipo === 'ida' ? 'repartos_ida' : 'repartos_vuelta';
    setFormData((prev: any) => {
      const nuevosRepartos = [...prev[campo]];
      nuevosRepartos.splice(index, 1);
      
      // Si se elimina el primer cliente de vuelta → limpiar km_vuelta/lts_vuelta y recalcular
      if (tipo === 'vuelta' && index === 0) {
        const kmIdaActual  = Number(prev.km_ida)  || 0;
        const ltsIdaActual = Number(prev.lts_ida) || 0;
        return { 
          ...prev, 
          [campo]:       nuevosRepartos,
          km_vuelta:     "",
          lts_vuelta:    "",
          km_recorridos: kmIdaActual  > 0 ? String(kmIdaActual)  : prev.km_recorridos,
          lts_gasoil:    ltsIdaActual > 0 ? String(ltsIdaActual) : prev.lts_gasoil,
        };
      }

      return { ...prev, [campo]: nuevosRepartos };
    });
  };

  // --- 📈 MOTOR FINANCIERO ---
  const finanzas = useMemo(() => {
    const tieneVuelta = (formData.repartos_vuelta || []).length > 0;
    const multiplicadorFijos = tieneVuelta ? 2 : 1;

    const sumIda    = (formData.repartos_ida    || []).reduce((acc: number, r: any) => acc + (Number(r.monto_flete) || 0), 0);
    const sumVuelta = (formData.repartos_vuelta || []).reduce((acc: number, r: any) => acc + (Number(r.monto_flete) || 0), 0);
    const bruta = sumIda + sumVuelta;

    // km_recorridos y lts_gasoil ya son los TOTALES calculados automáticamente
    const kmTotal  = Number(formData.km_recorridos) || 0;
    const ltsTotal = Number(formData.lts_gasoil)    || 0;

    const gasoilTotal    = ltsTotal * (Number(formData.precio_gasoil) || 0);
    const pagoChoferTotal = (Number(formData.pago_chofer)   || 0) * multiplicadorFijos;
    const descargaTotal  = (Number(formData.costo_descarga) || 0) * multiplicadorFijos;
    const desgasteTotal  = kmTotal * (Number(formData.desgaste_por_km) || 0);

    const totalCostos = pagoChoferTotal + descargaTotal + gasoilTotal + desgasteTotal;
    const neta   = bruta - totalCostos;
    const margen = bruta > 0 ? (neta / bruta) * 100 : 0;

    return { 
      bruta, neta, margen, 
      sumIda, sumVuelta, 
      kmTotal,
      kmIda:    Number(formData.km_ida)   || 0,
      kmVuelta: Number(formData.km_vuelta) || 0,
      ltsTotal,
      ltsIda:    Number(formData.lts_ida)   || 0,
      ltsVuelta: Number(formData.lts_vuelta) || 0,
      gasoilTotal,
      totalDesgaste: desgasteTotal,
      totalCostos,
      factor: multiplicadorFijos
    };
  }, [formData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-start justify-center overflow-y-auto bg-black/90 backdrop-blur-xl pt-10 md:pt-20 p-4 font-sans italic">
      <div className="bg-[#020617] border border-white/10 w-full max-w-4xl rounded-[3rem] p-6 md:p-12 shadow-[0_0_80px_rgba(0,0,0,0.8)] relative mb-20 animate-in fade-in zoom-in-95 duration-300">
        
        <div className={`absolute top-0 left-0 w-full h-2 rounded-t-full transition-all duration-500 ${
          step === 1 ? 'bg-cyan-500' : step === 2 ? 'bg-emerald-500' : 'bg-sky-500'
        }`} />
        
        <button onClick={onClose} className="absolute top-8 right-8 p-3 bg-white/5 rounded-full text-slate-400 hover:text-white hover:bg-rose-500 transition-all z-20"><X size={20}/></button>

        <div className="mb-10 text-center md:text-left">
          <div className="inline-flex items-center gap-2 mb-3 px-3 py-1 rounded-full border border-white/10 bg-white/5">
            <div className={`w-2 h-2 rounded-full animate-pulse ${step === 1 ? 'bg-cyan-500' : step === 2 ? 'bg-emerald-500' : 'bg-sky-500'}`} />
            <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">
              {step === 1 ? 'PASO 1: LOGÍSTICA OPERATIVA' : step === 2 ? 'PASO 2: ANÁLISIS DE COSTOS' : 'PASO 3: MANIFIESTO FINAL'}
            </p>
          </div>
          <h2 className="text-4xl md:text-5xl font-black text-white uppercase tracking-tighter leading-none">
            {step === 3 ? 'Finalizar' : 'Carga'} <span className={step === 1 ? 'text-cyan-500' : 'text-emerald-500'}>Viaje</span>
          </h2>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-6 relative">
          
          {step === 1 && <ViajeModalOperativo formData={formData} setFormData={setFormData} clientes={clientes} camiones={camiones} choferes={choferes} onCamionChange={handleCamionChange} agregarCliente={agregarCliente} actualizarReparto={actualizarReparto} eliminarReparto={eliminarReparto} />}
          {step === 2 && <ViajeModalFinanciero formData={formData} setFormData={setFormData} finanzas={finanzas} clientes={clientes} actualizarReparto={actualizarReparto} />}

          {step === 3 && (
            <div className="animate-in fade-in zoom-in-95 space-y-6">
              
              {/* KM — desglose ida + vuelta + total */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-emerald-900/10 border border-emerald-500/20 p-6 rounded-3xl flex flex-col items-center gap-1">
                  <ArrowUpCircle className="text-emerald-400 mb-1" size={22} />
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tramo Ida</p>
                  <p className="text-2xl font-black text-emerald-400 tabular-nums">{finanzas.kmIda} KM</p>
                  <p className="text-[8px] text-emerald-500/50 font-bold">{finanzas.ltsIda} lts</p>
                </div>
                {finanzas.kmVuelta > 0 ? (
                  <div className="bg-indigo-900/10 border border-indigo-500/20 p-6 rounded-3xl flex flex-col items-center gap-1">
                    <ArrowDownCircle className="text-indigo-400 mb-1" size={22} />
                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Tramo Vuelta</p>
                    <p className="text-2xl font-black text-indigo-400 tabular-nums">{finanzas.kmVuelta} KM</p>
                    <p className="text-[8px] text-indigo-500/50 font-bold">{finanzas.ltsVuelta} lts</p>
                  </div>
                ) : (
                  <div className="bg-slate-900/40 border border-white/5 p-6 rounded-3xl flex flex-col items-center opacity-25">
                    <ArrowDownCircle className="text-slate-600 mb-1" size={22} />
                    <p className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Sin Vuelta</p>
                    <p className="text-2xl font-black text-slate-600 tabular-nums">— KM</p>
                  </div>
                )}
                <div className="bg-slate-900/60 p-6 rounded-3xl border border-white/10 flex flex-col items-center gap-1">
                  <Gauge className="text-cyan-400 mb-1" size={22} />
                  <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Total Circuito</p>
                  <p className="text-2xl font-black text-white tabular-nums">{finanzas.kmTotal} KM</p>
                  <p className="text-[8px] text-amber-500/70 font-bold">{finanzas.ltsTotal} lts totales</p>
                </div>
              </div>

              {/* UTILIDAD / KM */}
              <div className="bg-cyan-500/10 p-6 rounded-3xl border border-cyan-500/20 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-4">
                  <TrendingUp className="text-cyan-500" size={28} />
                  <div>
                    <p className="text-[10px] font-black text-cyan-500 uppercase tracking-widest">Utilidad Proyectada / KM</p>
                    <p className="text-[8px] text-slate-500 uppercase font-bold">Basado en {finanzas.kmTotal} KM totales</p>
                  </div>
                </div>
                <p className="text-3xl font-black text-white tabular-nums">
                  ${finanzas.kmTotal > 0 ? (finanzas.neta / finanzas.kmTotal).toFixed(2) : '0'}
                </p>
              </div>

              {/* GASOIL */}
              <div className="bg-amber-500/5 border border-amber-500/20 p-6 rounded-[2rem] flex justify-between items-center group transition-all hover:bg-amber-500/10">
                <div className="flex items-center gap-5">
                  <div className="p-4 bg-amber-500/10 rounded-2xl text-amber-500 group-hover:scale-110 transition-transform"><Fuel size={28}/></div>
                  <div>
                    <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em]">Costo Total Gasoil</p>
                    <p className="text-[8px] text-slate-500 font-bold uppercase mt-1">
                      {finanzas.ltsIda > 0 && (
                        <span className="text-emerald-500/70">↑ {finanzas.ltsIda} lts ida</span>
                      )}
                      {finanzas.ltsVuelta > 0 && (
                        <span className="text-indigo-400/70 ml-2">↓ {finanzas.ltsVuelta} lts vuelta</span>
                      )}
                      {finanzas.ltsIda === 0 && finanzas.ltsVuelta === 0 && `Basado en ${finanzas.ltsTotal} lts`}
                    </p>
                  </div>
                </div>
                <p className="text-4xl font-black text-amber-500 tabular-nums">${Math.round(finanzas.gasoilTotal).toLocaleString()}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-emerald-950/10 border border-emerald-500/20 p-6 rounded-[2.5rem] shadow-lg">
                  <div className="flex items-center gap-2 border-b border-emerald-500/10 pb-3 mb-4">
                    <ArrowUpCircle size={16} className="text-emerald-500" />
                    <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Tramo Ida (${finanzas.sumIda.toLocaleString()})</h4>
                  </div>
                  <div className="space-y-2">
                    {formData.repartos_ida.map((r: any, i: number) => {
                      const cl = clientes.find((c:any)=>c.id===r.cliente_id);
                      return (
                        <div key={i} className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400 bg-black/20 p-2.5 rounded-xl border border-white/5">
                          <span className="truncate pr-4">• {cl?.razon_social}</span>
                          <span className="text-emerald-400 tabular-nums">${Number(r.monto_flete).toLocaleString()}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="bg-indigo-950/10 border border-indigo-500/20 p-6 rounded-[2.5rem] shadow-lg">
                  <div className="flex items-center gap-2 border-b border-indigo-500/10 pb-3 mb-4">
                    <ArrowDownCircle size={16} className="text-indigo-400" />
                    <h4 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Tramo Vuelta (${finanzas.sumVuelta.toLocaleString()})</h4>
                  </div>
                  {formData.repartos_vuelta.length > 0 ? (
                    <div className="space-y-2">
                      {formData.repartos_vuelta.map((r: any, i: number) => {
                        const cl = clientes.find((c:any)=>c.id===r.cliente_id);
                        return (
                          <div key={i} className="flex justify-between items-center text-[10px] uppercase font-bold text-slate-400 bg-black/20 p-2.5 rounded-xl border border-white/5">
                            <span className="truncate pr-4">• {cl?.razon_social}</span>
                            <span className="text-indigo-400 tabular-nums">${Number(r.monto_flete).toLocaleString()}</span>
                          </div>
                        );
                      })}
                    </div>
                  ) : <div className="h-full flex flex-col items-center justify-center py-4 text-[9px] font-black text-slate-600 uppercase tracking-widest italic opacity-50">Regreso sin carga</div>}
                </div>
              </div>

              {/* RESULTADO FINAL */}
              <div className="bg-white/5 p-8 rounded-[3.5rem] border border-white/10 relative overflow-hidden shadow-2xl group transition-all hover:bg-white/[0.07]">
                <div className="flex justify-between items-center mb-4 relative z-10">
                  <p className="text-xs font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">Rentabilidad Neta Proyectada <ShieldCheck size={14} className="text-emerald-500" /></p>
                  <div className="bg-emerald-500 text-black text-[11px] font-black px-5 py-2 rounded-full shadow-lg flex items-center gap-2">{Math.round(finanzas.margen)}% ROI</div>
                </div>
                <p className="text-7xl sm:text-8xl font-black text-white italic tracking-tighter relative z-10 tabular-nums leading-none">
                   ${Math.round(finanzas.neta).toLocaleString("es-AR")}
                </p>
                <div className="absolute top-0 right-0 p-8 opacity-5 text-white pointer-events-none group-hover:scale-110 transition-transform duration-700"><ShieldCheck size={180} /></div>
              </div>
            </div>
          )}

          {/* BOTONERA */}
          <div className="pt-8 border-t border-white/5 mt-8 flex gap-4">
            {step > 1 && (
              <button type="button" onClick={() => setStep(s => (s - 1) as 1 | 2 | 3)} 
                className="px-10 py-5 bg-slate-800 text-white rounded-2xl font-black uppercase text-xs tracking-widest transition-all hover:bg-slate-700 active:scale-95 border border-white/5">
                Volver
              </button>
            )}
            {step < 3 ? (
              <button type="button" onClick={() => setStep(s => (s + 1) as 1 | 2 | 3)} 
                disabled={formData.repartos_ida.length === 0 && formData.repartos_vuelta.length === 0} 
                className="flex-1 bg-cyan-600 text-white py-5 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed">
                Siguiente Paso <ArrowRight size={18} />
              </button>
            ) : (
              <button type="button" onClick={() => onWizardSubmit(formData)} disabled={isSubmitting} 
                className="flex-1 bg-white text-black py-5 rounded-2xl font-black uppercase text-xs tracking-[0.3em] flex items-center justify-center gap-3 shadow-xl active:scale-95 transition-all">
                {isSubmitting ? <Loader2 className="animate-spin" /> : <>Finalizar y Guardar <CheckCircle2 size={18} /></>}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  )
}
