"use client";
import {
  DollarSign, Fuel, User, Wrench, TrendingUp,
  Calculator, RefreshCw, Users, PieChart, Activity,
  ArrowUpCircle, ArrowDownCircle, Edit3, Info
} from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase"; 

export function ViajeModalFinanciero({ formData, setFormData, finanzas, clientes, actualizarReparto }: any) {
  const [precioCargando, setPrecioCargando] = useState(true);

  // ✅ FIX #5: Sync de precio global con validación robusta
  useEffect(() => {
    async function syncPrecioGlobal() {
      try {
        const { data, error } = await supabase.from('configuracion').select('precio_gasoil').eq('id', 1).single();
        if (data && !error) {
          setFormData((prev: any) => ({
            ...prev,
            precio_gasoil_sugerido: data.precio_gasoil,
            // Solo asignamos si el valor actual es nulo, undefined o un string realmente vacío
            precio_gasoil: (prev.precio_gasoil !== '' && prev.precio_gasoil != null) 
              ? prev.precio_gasoil 
              : data.precio_gasoil
          }));
        }
      } catch (err) {
        console.error("Error sincronizando gasoil global", err);
      } finally {
        setPrecioCargando(false);
      }
    }
    syncPrecioGlobal();
  }, [setFormData]);

  const porcEgresos = finanzas.bruta > 0 ? Math.min((finanzas.totalCostos / finanzas.bruta) * 100, 100) : 0;
  const porcUtilidad = finanzas.bruta > 0 ? Math.max((finanzas.neta / finanzas.bruta) * 100, 0) : 0;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-500 font-sans italic pb-4">
      
      {/* --- SECCIÓN 1: FLETES POR CLIENTE --- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* BLOQUE FLETES IDA */}
        <div className="bg-emerald-950/10 border border-emerald-500/20 rounded-[2.5rem] p-6 space-y-4 shadow-inner">
          <div className="flex items-center justify-between border-b border-emerald-500/10 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <ArrowUpCircle size={18} className="text-emerald-500" />
              <h3 className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Facturación Ida</h3>
            </div>
            <span className="text-[8px] font-bold text-slate-500 uppercase">Tarifas Pactadas</span>
          </div>
          
          {formData.repartos_ida.length === 0 ? (
            <p className="text-[10px] text-slate-600 font-bold uppercase text-center py-4">Sin clientes de ida</p>
          ) : (
            formData.repartos_ida.map((rep: any, idx: number) => {
              const dador = clientes.find((c: any) => c.id === rep.cliente_id);
              return (
                <div key={`f-ida-${idx}`} className="group relative bg-black/40 border border-white/5 p-4 rounded-2xl hover:border-emerald-500/30 transition-all shadow-md">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-2 flex items-center justify-between">
                    {dador?.razon_social || "Cliente no definido"}
                    <Edit3 size={10} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </p>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-emerald-500" />
                    <input 
                      required type="number" 
                      className="w-full bg-transparent pl-6 pr-4 text-xl font-black text-white outline-none tabular-nums"
                      value={rep.monto_flete || ""}
                      placeholder="0.00"
                      onChange={(e) => actualizarReparto('ida', idx, 'monto_flete', e.target.value)}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* BLOQUE FLETES VUELTA */}
        <div className="bg-indigo-950/10 border border-indigo-500/20 rounded-[2.5rem] p-6 space-y-4 shadow-inner">
          <div className="flex items-center justify-between border-b border-indigo-500/10 pb-3 mb-4">
            <div className="flex items-center gap-2">
              <ArrowDownCircle size={18} className="text-indigo-400" />
              <h3 className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">Facturación Vuelta</h3>
            </div>
            <span className="text-[8px] font-bold text-slate-500 uppercase">Tarifas Pactadas</span>
          </div>
          
          {formData.repartos_vuelta.length === 0 ? (
            <p className="text-[10px] text-slate-600 font-bold uppercase text-center py-4 italic">El camión regresa vacío</p>
          ) : (
            formData.repartos_vuelta.map((rep: any, idx: number) => {
              const dador = clientes.find((c: any) => c.id === rep.cliente_id);
              return (
                <div key={`f-vuelta-${idx}`} className="group relative bg-black/40 border border-white/5 p-4 rounded-2xl hover:border-indigo-500/30 transition-all shadow-md">
                  <p className="text-[9px] font-black text-slate-400 uppercase mb-2 flex items-center justify-between">
                    {dador?.razon_social || "Cliente no definido"}
                    <Edit3 size={10} className="text-slate-600 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </p>
                  <div className="relative">
                    <DollarSign size={16} className="absolute left-0 top-1/2 -translate-y-1/2 text-indigo-400" />
                    <input 
                      required type="number" 
                      className="w-full bg-transparent pl-6 pr-4 text-xl font-black text-white outline-none tabular-nums"
                      value={rep.monto_flete || ""}
                      placeholder="0.00"
                      onChange={(e) => actualizarReparto('vuelta', idx, 'monto_flete', e.target.value)}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* --- SECCIÓN 2: COSTOS OPERATIVOS --- */}
      <div className="bg-slate-900/40 border border-white/5 rounded-[2.5rem] p-6 shadow-xl">
        <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-3">
          <h3 className="text-xs font-black text-slate-500 uppercase tracking-widest flex items-center gap-2">
            <Calculator size={14} /> Costos de Operación
          </h3>
          {finanzas.factor > 1 && (
            <span className="bg-rose-500/10 text-rose-500 text-[8px] font-black px-2 py-1 rounded border border-rose-500/20 uppercase tracking-tighter shadow-sm animate-pulse">
              Cálculo Ida + Vuelta Detectado
            </span>
          )}
        </div>
        
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-[9px] font-black text-amber-500 uppercase ml-2 flex items-center justify-between">
              Gasoil $
              <RefreshCw 
                size={10} 
                className={`cursor-pointer ${precioCargando ? 'animate-spin' : 'hover:scale-110 active:rotate-180 transition-all'}`} 
                onClick={() => setFormData((prev:any) => ({...prev, precio_gasoil: prev.precio_gasoil_sugerido}))}
              />
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-amber-500/50 font-black">$</span>
              <input 
                type="number" step="0.01" 
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-7 pr-3 text-white font-bold outline-none focus:border-amber-500 text-sm tabular-nums" 
                value={formData.precio_gasoil || ""} 
                onChange={(e) => setFormData((prev:any) => ({...prev, precio_gasoil: e.target.value}))} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-amber-500 uppercase ml-2">Lts (Tramo)</label>
            <div className="relative">
              <input 
                type="number" 
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 px-4 pr-10 text-white font-bold outline-none focus:border-amber-500 text-sm tabular-nums" 
                value={formData.lts_gasoil || ""} 
                onChange={(e) => setFormData((prev:any) => ({...prev, lts_gasoil: e.target.value}))} 
              />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-amber-500/50 font-black text-[8px]">LTS</span>
            </div>
            {finanzas.factor > 1 && <p className="text-[7px] text-slate-500 font-bold uppercase text-center mt-1">Total: {finanzas.ltsTotal} lts</p>}
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-rose-400 uppercase ml-2">Viático Chofer</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500/50 font-black">$</span>
              <input 
                type="number" 
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-7 pr-3 text-white font-bold outline-none focus:border-rose-500 text-sm tabular-nums" 
                value={formData.pago_chofer || ""} 
                onChange={(e) => setFormData((prev:any) => ({...prev, pago_chofer: e.target.value}))} 
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[9px] font-black text-rose-400 uppercase ml-2">Descarga</label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-rose-500/50 font-black">$</span>
              <input 
                type="number" 
                className="w-full bg-black/40 border border-white/10 rounded-xl py-2.5 pl-7 pr-3 text-white font-bold outline-none focus:border-rose-500 text-sm tabular-nums" 
                value={formData.costo_descarga || ""} 
                onChange={(e) => setFormData((prev:any) => ({...prev, costo_descarga: e.target.value}))} 
              />
            </div>
          </div>
        </div>
      </div>

      {/* --- SECCIÓN 3: DESGASTE TÉCNICO --- */}
      <div className="bg-sky-950/10 border border-sky-500/10 rounded-[2rem] p-6 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-inner relative overflow-hidden">
        <div className="flex items-center gap-4 relative z-10">
          <div className="p-3 bg-sky-500/10 rounded-2xl text-sky-500"><Wrench size={20} /></div>
          <div>
            <h4 className="text-[10px] font-black text-sky-400 uppercase tracking-widest">Amortización Técnica</h4>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] text-slate-400">$</span>
              <input 
                type="number" step="0.01" 
                className="w-20 bg-black/40 border border-sky-500/20 rounded-lg py-1 px-2 text-white font-bold focus:border-sky-500 outline-none text-xs tabular-nums" 
                value={formData.desgaste_por_km || ""} 
                onChange={(e) => setFormData((prev: any) => ({ ...prev, desgaste_por_km: e.target.value }))} 
              />
              <span className="text-[9px] font-bold text-slate-500 uppercase tracking-widest">
                x {finanzas.kmTotal} KM Totales
              </span>
            </div>
          </div>
        </div>
        <div className="text-right relative z-10">
          <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Impacto en Mantenimiento</p>
          <p className="text-2xl font-black text-sky-400 italic tabular-nums tracking-tighter">
            ${Math.round(finanzas.totalDesgaste || 0).toLocaleString("es-AR")}
          </p>
        </div>
        <Wrench size={80} className="absolute -right-5 top-1/2 -translate-y-1/2 opacity-5 text-sky-500 pointer-events-none" />
      </div>

      {/* --- SECCIÓN 4: DASHBOARD FINAL --- */}
      <div className={`bg-black border-2 rounded-[3rem] p-8 md:p-10 relative overflow-hidden group shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-700 ${finanzas.neta >= 0 ? "border-emerald-500/30 shadow-emerald-500/10" : "border-rose-500/30 shadow-rose-500/10"}`}>
        
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6 relative z-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <PieChart size={18} className={finanzas.neta >= 0 ? "text-emerald-500" : "text-rose-500"} />
              <p className="text-[11px] font-black uppercase tracking-[0.3em] text-slate-400">Rentabilidad Neta del Viaje</p>
            </div>
            <h2 className={`text-6xl sm:text-7xl font-black italic tracking-tighter leading-none tabular-nums ${finanzas.neta >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
              ${Math.round(finanzas.neta).toLocaleString("es-AR")}
            </h2>
          </div>
          <div className={`px-5 py-3 rounded-2xl border flex flex-col items-center justify-center shrink-0 ${finanzas.neta >= 0 ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" : "bg-rose-500/10 border-rose-500/30 text-rose-400"}`}>
            <span className="text-3xl font-black leading-none">{Math.round(finanzas.margen)}%</span>
            <span className="text-[10px] uppercase tracking-widest font-bold text-slate-400 mt-1">Margen ROI</span>
          </div>
        </div>

        {/* 📊 Barra de Distribución Visual */}
        <div className="space-y-3 relative z-10 bg-slate-900/50 p-5 rounded-2xl border border-white/5 backdrop-blur-sm">
          <div className="flex justify-between text-[10px] font-black uppercase tracking-widest">
            <span className="text-rose-400 flex items-center gap-1.5"><Activity size={12}/> Operativo {Math.round(porcEgresos)}%</span>
            <span className="text-emerald-400 flex items-center gap-1.5">Neta {Math.round(porcUtilidad)}% <TrendingUp size={12}/></span>
          </div>
          <div className="h-4 w-full bg-slate-950 rounded-full overflow-hidden flex border border-white/5 shadow-inner">
            <div className="h-full bg-gradient-to-r from-rose-600 to-rose-400 transition-all duration-1000" style={{ width: `${porcEgresos}%` }} />
            <div className="h-full bg-gradient-to-r from-emerald-400 to-emerald-600 transition-all duration-1000" style={{ width: `${porcUtilidad}%` }} />
          </div>
          <div className="flex justify-between text-[11px] font-bold text-slate-400 tabular-nums pt-1">
            <span>Egresos Totales: -${Math.round(finanzas.totalCostos).toLocaleString()}</span>
            <span>Bruto Total: ${Math.round(finanzas.bruta).toLocaleString()}</span>
          </div>
        </div>

        <div className={`absolute -bottom-20 left-1/2 -translate-x-1/2 w-[150%] h-40 blur-[100px] pointer-events-none opacity-20 transition-colors duration-1000 ${finanzas.neta >= 0 ? "bg-emerald-500" : "bg-rose-500"}`} />
      </div>

    </div>
  );
}